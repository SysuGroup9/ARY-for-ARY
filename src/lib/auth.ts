import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildProfileCompletionHref } from "@/lib/profile-completion";
import type { AppRole } from "@/lib/user-roles";
import {
  hasRole,
  normalizeRoles,
  parseRolesJson,
} from "@/lib/user-roles";

const SESSION_COOKIE = "ary_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "ary-dev-secret-change-me";
const encoder = new TextEncoder();

export interface SessionUser {
  id: string;
  profileCompleted?: boolean;
  profileName?: string;
  profileOrgLabel?: string;
  roles: AppRole[];
  username: string;
}

export interface DatabaseSessionUser extends SessionUser {
  githubAccount: null | string;
  profileCompleted: boolean;
  profileName: string;
  profileOrgLabel: string;
}

interface SessionPayload {
  roles: AppRole[];
  sub: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const normalizedRoles = normalizeRoles(user.roles);
  const token = await new SignJWT({
    roles: normalizedRoles,
    username: user.username,
  } satisfies Omit<SessionPayload, "sub">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(SESSION_SECRET));

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, encoder.encode(SESSION_SECRET));
    const payload = verified.payload as unknown as SessionPayload;
    const roles = normalizeRoles(payload.roles);
    return {
      id: payload.sub,
      roles,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(role: AppRole): Promise<DatabaseSessionUser> {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.profileCompleted) {
    redirect("/profile");
  }

  if (!hasRole(user.roles, role)) {
    redirect("/");
  }
  return user;
}

export async function requireConsoleUser(
  returnTo: string,
): Promise<DatabaseSessionUser> {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.profileCompleted) {
    redirect(buildProfileCompletionHref(returnTo));
  }

  return user;
}

export async function loadDatabaseUser(): Promise<DatabaseSessionUser | null> {
  const session = await getSessionUser();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.id,
    },
  });

  if (!user) {
    return null;
  }

  const roles = parseRolesJson(user.rolesJson);

  return {
    githubAccount: user.githubAccount,
    id: user.id,
    profileCompleted: user.profileCompleted,
    profileName: user.profileName,
    profileOrgLabel: user.profileOrgLabel,
    roles,
    username: user.username,
  };
}
