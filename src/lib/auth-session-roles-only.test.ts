import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("session auth model uses roles collection instead of a single role field", () => {
  const authSource = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");

  assert.match(authSource, /roles: AppRole\[\];/);
  assert.doesNotMatch(authSource, /role:\s*AppRole;/);
  assert.doesNotMatch(authSource, /role:\s*getDefaultActiveRole\(roles\)/);
});

test("session creation call sites pass roles without legacy role residue", () => {
  const usersSource = readFileSync(new URL("./services/users.ts", import.meta.url), "utf8");
  const githubOAuthSource = readFileSync(new URL("./github-oauth.ts", import.meta.url), "utf8");

  const userSessionCalls = [...usersSource.matchAll(/createSession\(\{[\s\S]*?\}\);/g)].map(
    (match) => match[0],
  );
  const githubOAuthSessionCalls = [
    ...githubOAuthSource.matchAll(/createSession\(\{[\s\S]*?\}\);/g),
  ].map((match) => match[0]);

  assert.equal(userSessionCalls.length, 2);
  assert.equal(githubOAuthSessionCalls.length, 1);

  for (const source of [...userSessionCalls, ...githubOAuthSessionCalls]) {
    assert.match(source, /roles,/);
    assert.doesNotMatch(source, /\brole:/);
  }
});
