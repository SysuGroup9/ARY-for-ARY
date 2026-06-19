import type {
  ConnectorConfig,
  HandshakePayload,
  RidingSignalPayload,
  SnapshotPayload,
} from "./types";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function readErrorBody(response: Response): Promise<string> {
  const text = await response.text();
  return text.trim() || "unknown error";
}

export function createAryCAClient(config: ConnectorConfig) {
  const aryBaseUrl = trimTrailingSlash(config.aryBaseUrl);

  async function postJson(path: string, body: HandshakePayload | RidingSignalPayload) {
    const response = await fetch(`${aryBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.caConnectorSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `ARY request failed (${response.status}): ${await readErrorBody(response)}`,
      );
    }

    return response.json();
  }

  return {
    async completeHandshake(payload: HandshakePayload): Promise<unknown> {
      return postJson("/api/ca/handshake", payload);
    },

    async pushSignal(payload: RidingSignalPayload): Promise<unknown> {
      return postJson("/api/ca/signals", payload);
    },

    buildSnapshotUrl(sessionId: string): string {
      return `${trimTrailingSlash(config.caConnectorBaseUrl)}/ary/ca/connections/${config.caConnectionId}/sessions/${sessionId}/snapshot`;
    },

    buildSnapshotPayload(snapshot: SnapshotPayload): SnapshotPayload {
      return snapshot;
    },
  };
}
