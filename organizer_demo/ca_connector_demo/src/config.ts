import type { ConnectorConfig, CAType } from "./types";

function requireEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }
  return port;
}

function parseCAType(raw: string): CAType {
  if (raw === "CLAUDE_CODE" || raw === "CODEX" || raw === "OTHER") {
    return raw;
  }
  throw new Error("CA_TYPE must be one of CLAUDE_CODE, CODEX, OTHER.");
}

export function loadConnectorConfig(env: NodeJS.ProcessEnv): ConnectorConfig {
  return {
    aryBaseUrl: requireEnv(env, "ARY_BASE_URL"),
    caConnectorBaseUrl: requireEnv(env, "CA_CONNECTOR_BASE_URL"),
    caConnectionId: requireEnv(env, "CA_CONNECTION_ID"),
    caConnectorId: requireEnv(env, "CA_CONNECTOR_ID"),
    caConnectorSecret: requireEnv(env, "CA_CONNECTOR_SECRET"),
    caConnectorVersion: requireEnv(env, "CA_CONNECTOR_VERSION"),
    caProjectId: requireEnv(env, "CA_PROJECT_ID"),
    caRaceId: requireEnv(env, "CA_RACE_ID"),
    caRaceProjectId: requireEnv(env, "CA_RACE_PROJECT_ID"),
    caRegistrationId: requireEnv(env, "CA_REGISTRATION_ID"),
    caSessionId: requireEnv(env, "CA_SESSION_ID"),
    caType: parseCAType(requireEnv(env, "CA_TYPE")),
    port: parsePort(requireEnv(env, "PORT")),
  };
}
