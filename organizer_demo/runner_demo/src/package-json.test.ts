import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

test("start script loads .env before launching the runner", async () => {
  const packageJsonPath = join(import.meta.dirname, "..", "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.start,
    "node --env-file=.env --import tsx src/index.ts",
  );
});
