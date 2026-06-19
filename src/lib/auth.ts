import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/user-roles";
import {
  getDefaultActiveRole,
  hasRole,
  normalizeRoles,
  parseRolesJson,
} from "@/lib/user-roles";

const SESSION_COOKIE = "ary_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "ary-dev-secret-change-me";
const encoder = new TextEncoder();

export interface SessionUser {
  id: string;
  role: AppRole;
  roles: AppRole[];
  username: string;
}

interface SessionPayload {
  role: AppRole;
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
    role: user.role,
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
    const roles = normalizeRoles(payload.roles ?? [payload.role]);
    return {
      id: payload.sub,
      role: payload.role ?? getDefaultActiveRole(roles),
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

export async function requireRole(role: AppRole): Promise<SessionUser> {
  const user = await requireSession();
  if (!hasRole(user.roles, role)) {
    redirect("/");
  }
  return user;
}

export async function loadDatabaseUser(): Promise<SessionUser | null> {
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
    id: user.id,
    role: hasRole(roles, user.role)
      ? user.role
      : getDefaultActiveRole(roles),
    roles,
    username: user.username,
  };
}
