import assert from "node:assert/strict";
import test from "node:test";
import {
  GitHubOAuthError,
  resolveGitHubOAuthErrorCode,
} from "@/lib/github-oauth";

test("resolveGitHubOAuthErrorCode preserves known oauth error codes", () => {
  assert.equal(
    resolveGitHubOAuthErrorCode(
      new GitHubOAuthError("github_state_mismatch"),
      "callback",
    ),
    "github_state_mismatch",
  );
  assert.equal(
    resolveGitHubOAuthErrorCode(
      new GitHubOAuthError("github_exchange_failed"),
      "callback",
    ),
    "github_exchange_failed",
  );
  assert.equal(
    resolveGitHubOAuthErrorCode(
      new GitHubOAuthError("github_profile_failed"),
      "callback",
    ),
    "github_profile_failed",
  );
});

test("resolveGitHubOAuthErrorCode falls back by oauth phase for unknown errors", () => {
  assert.equal(
    resolveGitHubOAuthErrorCode(new Error("unexpected"), "start"),
    "github_start_failed",
  );
  assert.equal(
    resolveGitHubOAuthErrorCode(new Error("unexpected"), "callback"),
    "github_callback_failed",
  );
});
