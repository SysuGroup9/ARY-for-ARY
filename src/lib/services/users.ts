import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.parse({
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const existing = await prisma.user.findUnique({
    where: {
      username: parsed.username,
    },
  });

  if (existing) {
    throw new Error("用户名已存在");
  }

  const user = await prisma.user.create({
    data: {
      username: parsed.username,
      passwordHash: await hashPassword(parsed.password),
      role: parsed.role,
    },
  });

  await createSession({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  return user;
}

export async function loginUser(formData: FormData) {
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
    throw new Error("用户名或密码错误");
  }

  const valid = await verifyPassword(parsed.password, user.passwordHash);
  if (!valid) {
    throw new Error("用户名或密码错误");
  }

  await createSession({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  return user;
}

export async function listUsersByRole(role: UserRole) {
  return prisma.user.findMany({
    where: {
      role,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
