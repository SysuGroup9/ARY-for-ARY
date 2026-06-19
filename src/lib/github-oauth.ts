import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import {
  getDefaultActiveRole,
  parseRolesJson,
  serializeRoles,
  type AppRole,
} from "@/lib/user-roles";

const GITHUB_STATE_COOKIE = "ary_github_oauth_state";
const STATE_TTL_SECONDS = 60 * 10;
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const defaultRoles: AppRole[] = ["RIDER"];

type GitHubUserProfile = {
  id: number;
  login: string;
  avatar_url: string;
  email: null | string;
  name: null | string;
};

type EnvMap = Record<string, string | undefined>;

function getEnv(): EnvMap {
  const scope = globalThis as typeof globalThis & {
    process?: {
      env?: EnvMap;
    };
  };

  return scope.process?.env ?? {};
}

function getRequiredEnv(name: string): string {
  const value = getEnv()[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

function getGitHubCallbackUrl(): string {
  const configured = getEnv().GITHUB_CALLBACK_URL?.trim();
  if (configured) {
    return configured;
  }

  const baseUrl = getRequiredEnv("ARY_BASE_URL");
  return `${baseUrl.replace(/\/$/, "")}/api/auth/github/callback`;
}

function getRandomHex(bytes: number): string {
  const source = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(source);
  return Array.from(source, (value) => value.toString(16).padStart(2, "0")).join("");
}

function normalizeReturnTo(value: null | string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function encodeState(returnTo: string): string {
  return encodeURIComponent(
    JSON.stringify({
      nonce: getRandomHex(16),
      returnTo,
    }),
  );
}

function decodeState(raw: string): { nonce: string; returnTo: string } {
  const parsed = JSON.parse(decodeURIComponent(raw)) as {
    nonce?: unknown;
    returnTo?: unknown;
  };

  if (typeof parsed.nonce !== "string" || typeof parsed.returnTo !== "string") {
    throw new Error("Invalid GitHub OAuth state payload");
  }

  return {
    nonce: parsed.nonce,
    returnTo: parsed.returnTo,
  };
}

function buildUsernameCandidates(login: string): string[] {
  const slug = login
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = (slug.length >= 3 ? slug : `gh_${slug || "user"}`).slice(0, 24);

  return [
    base,
    `${base}_gh`.slice(0, 32),
    `${base}_${globalThis.crypto.randomUUID().slice(0, 8)}`.slice(0, 32),
  ];
}

async function exchangeCodeForAccessToken(code: string): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "ARY-for-ARY",
    },
    body: JSON.stringify({
      client_id: getRequiredEnv("GITHUB_CLIENT_ID"),
      client_secret: getRequiredEnv("GITHUB_CLIENT_SECRET"),
      code,
      redirect_uri: getGitHubCallbackUrl(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "GitHub token missing");
  }

  return payload.access_token;
}

async function fetchGitHubProfile(accessToken: string): Promise<GitHubUserProfile> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "ARY-for-ARY",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub user request failed: ${response.status}`);
  }

  return (await response.json()) as GitHubUserProfile;
}

async function createUserFromGitHubProfile(profile: GitHubUserProfile) {
  for (const username of buildUsernameCandidates(profile.login)) {
    try {
      return await prisma.user.create({
        data: {
          githubAccount: profile.login,
          passwordHash: await hashPassword(globalThis.crypto.randomUUID()),
          profileCompleted: false,
          profileName: profile.name?.trim() || profile.login,
          profileOrgLabel: "GitHub",
          rolesJson: serializeRoles(defaultRoles),
          username,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Unable to allocate username for GitHub account ${profile.login}`);
}

async function findOrCreateUserForGitHubProfile(profile: GitHubUserProfile) {
  const existing = await prisma.user.findFirst({
    where: {
      githubAccount: profile.login,
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        profileName: profile.name?.trim() || existing.profileName,
      },
    });
  }

  return createUserFromGitHubProfile(profile);
}

export async function startGitHubOAuth(returnTo: string): Promise<void> {
  const normalizedReturnTo = normalizeReturnTo(returnTo);
  const state = encodeState(normalizedReturnTo);
  const store = await cookies();

  store.set(GITHUB_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: STATE_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: getEnv().NODE_ENV === "production",
  });

  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", getRequiredEnv("GITHUB_CLIENT_ID"));
  authorizeUrl.searchParams.set("redirect_uri", getGitHubCallbackUrl());
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);

  redirect(authorizeUrl.toString());
}

export async function finishGitHubOAuth(input: {
  code: string;
  state: string;
}): Promise<string> {
  const store = await cookies();
  const storedState = store.get(GITHUB_STATE_COOKIE)?.value;
  store.delete(GITHUB_STATE_COOKIE);

  if (!storedState || storedState !== input.state) {
    throw new Error("GitHub OAuth state mismatch");
  }

  const decodedState = decodeState(input.state);
  const accessToken = await exchangeCodeForAccessToken(input.code);
  const profile = await fetchGitHubProfile(accessToken);
  const user = await findOrCreateUserForGitHubProfile(profile);
  const roles = parseRolesJson(user.rolesJson);

  await createSession({
    id: user.id,
    role: getDefaultActiveRole(roles),
    roles,
    username: user.username,
  });

  return normalizeReturnTo(decodedState.returnTo);
}
