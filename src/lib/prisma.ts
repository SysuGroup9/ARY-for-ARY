import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { getRuntimeDatabaseDir, getRuntimeDatabasePath } from "@/lib/prisma-runtime-paths";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function resolveDatabaseUrl(): string {
  const runtimeDir = getRuntimeDatabaseDir({
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    vercel: process.env.VERCEL === "1",
  });
  const runtimeDb = getRuntimeDatabasePath({
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    vercel: process.env.VERCEL === "1",
  });

  if (runtimeDir && runtimeDb) {
    const seedDb = path.join(process.cwd(), "dev.db");

    if (!fs.existsSync(runtimeDir)) {
      fs.mkdirSync(runtimeDir, { recursive: true });
    }

    if (!fs.existsSync(runtimeDb) && fs.existsSync(seedDb)) {
      fs.copyFileSync(seedDb, runtimeDb);
    }

    return `file:${runtimeDb}`;
  }

  return process.env.DATABASE_URL ?? "file:./prisma/dev.db";
}

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
