import assert from "node:assert/strict";
import test from "node:test";
import {
  isGitHubOAuthConfigured,
  isLocalAuthFallbackEnabled,
} from "@/lib/auth-entry";

function withEnv(
  overrides: Record<string, string | undefined>,
  run: () => void,
): void {
  const originalEnv = {
    ARY_ENABLE_LOCAL_AUTH_FALLBACK: process.env.ARY_ENABLE_LOCAL_AUTH_FALLBACK,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  Object.assign(process.env, overrides);

  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("isGitHubOAuthConfigured requires both client id and secret", () => {
  withEnv(
    {
      GITHUB_CLIENT_ID: "client-id",
      GITHUB_CLIENT_SECRET: "client-secret",
    },
    () => {
      assert.equal(isGitHubOAuthConfigured(), true);
    },
  );

  withEnv(
    {
      GITHUB_CLIENT_ID: "client-id",
      GITHUB_CLIENT_SECRET: "",
    },
    () => {
      assert.equal(isGitHubOAuthConfigured(), false);
    },
  );

  withEnv(
    {
      GITHUB_CLIENT_ID: "replace-with-github-oauth-app-client-id",
      GITHUB_CLIENT_SECRET: "replace-with-github-oauth-app-client-secret",
    },
    () => {
      assert.equal(isGitHubOAuthConfigured(), false);
    },
  );
});

test("isLocalAuthFallbackEnabled defaults to non-production environments and honors explicit override", () => {
  withEnv(
    {
      ARY_ENABLE_LOCAL_AUTH_FALLBACK: "",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(isLocalAuthFallbackEnabled(), true);
    },
  );

  withEnv(
    {
      ARY_ENABLE_LOCAL_AUTH_FALLBACK: "",
      NODE_ENV: "production",
    },
    () => {
      assert.equal(isLocalAuthFallbackEnabled(), false);
    },
  );

  withEnv(
    {
      ARY_ENABLE_LOCAL_AUTH_FALLBACK: "true",
      NODE_ENV: "production",
    },
    () => {
      assert.equal(isLocalAuthFallbackEnabled(), true);
    },
  );

  withEnv(
    {
      ARY_ENABLE_LOCAL_AUTH_FALLBACK: "false",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(isLocalAuthFallbackEnabled(), false);
    },
  );
});
