import path from "node:path";

export function getRuntimeDatabaseDir(input: {
  cwd: string;
  nodeEnv: string | undefined;
  platform: NodeJS.Platform;
  vercel: boolean;
}): null | string {
  if (input.nodeEnv !== "production" || !input.vercel) {
    return null;
  }

  if (input.platform === "win32") {
    return path.join(input.cwd, ".tmp", "ary-runtime");
  }

  return "/tmp/ary-runtime";
}

export function getRuntimeDatabasePath(input: {
  cwd: string;
  nodeEnv: string | undefined;
  platform: NodeJS.Platform;
  vercel: boolean;
}): null | string {
  const runtimeDir = getRuntimeDatabaseDir(input);
  if (!runtimeDir) {
    return null;
  }

  if (input.platform !== "win32") {
    return `${runtimeDir}/runtime.db`;
  }

  return path.join(runtimeDir, "runtime.db");
}
