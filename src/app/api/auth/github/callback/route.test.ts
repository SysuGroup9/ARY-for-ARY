import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("github oauth callback route maps failures to stable oauthError codes without leaking detail", () => {
  const source = readFileSync("src/app/api/auth/github/callback/route.ts", "utf8");

  assert.match(source, /resolveGitHubOAuthErrorCode\(err, "callback"\)/);
  assert.doesNotMatch(source, /detail=/);
  assert.match(source, /oauthError=github_denied/);
  assert.match(source, /oauthError=github_missing_code/);
});
