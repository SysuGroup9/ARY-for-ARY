import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  getRuntimeDatabaseDir,
  getRuntimeDatabasePath,
} from "./prisma-runtime-paths";

test("uses the workspace tmp directory on Windows instead of a root drive tmp path", () => {
  const cwd = "D:\\Desktop\\ARY-for-ARY";
  const dir = getRuntimeDatabaseDir({
    cwd,
    nodeEnv: "production",
    platform: "win32",
    vercel: true,
  });

  assert.equal(dir, path.join(cwd, ".tmp", "ary-runtime"));
  assert.equal(
    getRuntimeDatabasePath({
      cwd,
      nodeEnv: "production",
      platform: "win32",
      vercel: true,
    }),
    path.join(cwd, ".tmp", "ary-runtime", "runtime.db"),
  );
});

test("keeps the tmp-root runtime directory behavior on non-Windows production platforms", () => {
  assert.equal(
    getRuntimeDatabaseDir({
      cwd: "/workspace/ary",
      nodeEnv: "production",
      platform: "linux",
      vercel: true,
    }),
    "/tmp/ary-runtime",
  );
  assert.equal(
    getRuntimeDatabasePath({
      cwd: "/workspace/ary",
      nodeEnv: "production",
      platform: "linux",
      vercel: true,
    }),
    "/tmp/ary-runtime/runtime.db",
  );
});

test("does not use a runtime shadow copy outside production", () => {
  assert.equal(
    getRuntimeDatabaseDir({
      cwd: "D:\\Desktop\\ARY-for-ARY",
      nodeEnv: "development",
      platform: "win32",
      vercel: false,
    }),
    null,
  );
});

test("does not enable the runtime shadow copy for a local production build outside vercel", () => {
  assert.equal(
    getRuntimeDatabaseDir({
      cwd: "D:\\Desktop\\ARY-for-ARY",
      nodeEnv: "production",
      platform: "win32",
      vercel: false,
    }),
    null,
  );
});
