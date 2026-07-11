type EnvMap = Record<string, string | undefined>;

function getEnv(): EnvMap {
  const scope = globalThis as typeof globalThis & {
    process?: {
      env?: EnvMap;
    };
  };

  return scope.process?.env ?? {};
}

function normalizeEnvValue(value: string | undefined): string {
  return String(value ?? "").trim();
}

function isPlaceholderValue(value: string): boolean {
  return /^replace-with-/i.test(value);
}

function hasUsableEnvValue(value: string | undefined): boolean {
  const normalized = normalizeEnvValue(value);
  return Boolean(normalized) && !isPlaceholderValue(normalized);
}

function isTruthyFlag(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

export function getGitHubOAuthCredentials():
  | null
  | { clientId: string; clientSecret: string } {
  const env = getEnv();
  const clientId = normalizeEnvValue(env.GITHUB_CLIENT_ID);
  const clientSecret = normalizeEnvValue(env.GITHUB_CLIENT_SECRET);

  if (!hasUsableEnvValue(clientId) || !hasUsableEnvValue(clientSecret)) {
    return null;
  }

  return {
    clientId,
    clientSecret,
  };
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(getGitHubOAuthCredentials());
}

export function isLocalAuthFallbackEnabled(): boolean {
  const env = getEnv();
  if ((env.ARY_ENABLE_LOCAL_AUTH_FALLBACK ?? "").trim()) {
    return isTruthyFlag(env.ARY_ENABLE_LOCAL_AUTH_FALLBACK);
  }

  return (env.NODE_ENV ?? "").trim().toLowerCase() !== "production";
}
