import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { isLocalAuthFallbackEnabled } from "@/lib/auth-entry";
import { EntryFeedbackError } from "@/lib/entry-feedback";
import type { AppRole } from "@/lib/user-roles";
import {
  hasRole,
  parseRolesJson,
  serializeRoles,
} from "@/lib/user-roles";
import {
  loginSchema,
  profileCompletionSchema,
  registerSchema,
} from "@/lib/validation";

export async function registerUser(formData: FormData) {
  if (!isLocalAuthFallbackEnabled()) {
    throw new EntryFeedbackError("local_auth_disabled");
  }

  const parsed = registerSchema.parse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  const existing = await prisma.user.findUnique({
    where: {
      username: parsed.username,
    },
  });

  if (existing) {
    throw new EntryFeedbackError("username_taken");
  }

  const roles: AppRole[] = ["RIDER"];

  const user = await prisma.user.create({
    data: {
      passwordHash: await hashPassword(parsed.password),
      rolesJson: serializeRoles(roles),
      username: parsed.username,
    },
  });

  await createSession({
    id: user.id,
    roles,
    username: user.username,
  });

  return user;
}

export async function loginUser(formData: FormData) {
  if (!isLocalAuthFallbackEnabled()) {
    throw new EntryFeedbackError("local_auth_disabled");
  }

  const parsed = loginSchema.parse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  const user = await prisma.user.findUnique({
    where: {
      username: parsed.username,
    },
  });

  if (!user) {
    throw new EntryFeedbackError("invalid_credentials");
  }

  const valid = await verifyPassword(parsed.password, user.passwordHash);
  if (!valid) {
    throw new EntryFeedbackError("invalid_credentials");
  }

  const roles = parseRolesJson(user.rolesJson);

  await createSession({
    id: user.id,
    roles,
    username: user.username,
  });

  return user;
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  return users.map((user) => ({
    ...user,
    roles: parseRolesJson(user.rolesJson),
  }));
}

export async function listUsersByRole(role: AppRole) {
  const users = await listUsers();
  return users.filter((user) => hasRole(user.roles, role));
}

export async function updateUserRoles(input: {
  roles: AppRole[];
  userId: string;
}) {
  const roles: AppRole[] = input.roles.length === 0 ? ["RIDER"] : input.roles;

  return prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      rolesJson: serializeRoles(roles),
    },
  });
}

export async function completeUserProfile(input: {
  profileName: string;
  profileOrgLabel: string;
  userId: string;
}) {
  const parsed = profileCompletionSchema.parse({
    profileName: input.profileName,
    profileOrgLabel: input.profileOrgLabel,
  });

  return prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      profileCompleted: true,
      profileName: parsed.profileName,
      profileOrgLabel: parsed.profileOrgLabel || "独立骑手",
    },
  });
}
