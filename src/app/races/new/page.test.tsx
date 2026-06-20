import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("legacy public create-race route sends anonymous users through login returnTo and forwards signed-in users to console", () => {
  const source = readFileSync("src/app/races/new/page.tsx", "utf8");

  assert.match(source, /loadDatabaseUser/);
  assert.match(source, /redirect\("\/login\?returnTo=%2Fconsole%2Fraces%2Fnew"\)/);
  assert.match(source, /redirect\("\/console\/races\/new"\)/);
});
