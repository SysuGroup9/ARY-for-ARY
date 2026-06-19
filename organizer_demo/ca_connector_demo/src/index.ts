import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { createAryCAClient } from "./ary-client";
import { loadConnectorConfig } from "./config";
import type { HandshakePayload, RidingSignalPayload, SnapshotPayload } from "./types";

function json(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body, null, 2));
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildHandshakePayload(config: ReturnType<typeof loadConnectorConfig>): HandshakePayload {
  return {
    caConnectionId: config.caConnectionId,
    caProjectId: config.caProjectId,
    connectorId: config.caConnectorId,
    connectorVersion: config.caConnectorVersion,
    timestamp: nowIso(),
  };
}

function buildSignalPayload(
  config: ReturnType<typeof loadConnectorConfig>,
  signal: RidingSignalPayload["signal"],
  summary: RidingSignalPayload["summary"],
): RidingSignalPayload {
  return {
    ca: {
      caConnectionId: config.caConnectionId,
      caProjectId: config.caProjectId,
      caSessionId: config.caSessionId,
      caType: config.caType,
      connectorId: config.caConnectorId,
      connectorVersion: config.caConnectorVersion,
    },
    counters: {
      allRidingMessageLength: 512,
      messageCount: signal.type === "session_started" ? 1 : signal.type === "task_progress" ? 6 : 9,
      sessionCount: 1,
      tokens: signal.type === "task_progress" ? 1280 : 2048,
      toolCallCount: signal.type === "task_progress" ? 3 : 5,
    },
    idempotencyKey: `${signal.type}:${config.caConnectionId}:${config.caSessionId}:${randomUUID()}`,
    ingestion: {
      scope: "connector-demo",
      status: signal.type === "risk_detected" ? "FAILED" : "ACTIVE",
      statusReason:
        signal.type === "risk_detected"
          ? "connector demo emitted a risk event"
          : "connector demo runtime active",
    },
    messageId: `${signal.type}:${Date.now()}`,
    race: {
      raceId: config.caRaceId,
    },
    rider: {
      raceProjectId: config.caRaceProjectId,
      registrationId: config.caRegistrationId,
    },
    signal,
    summary,
    timestamp: nowIso(),
  };
}

function buildSnapshotPayload(config: ReturnType<typeof loadConnectorConfig>): SnapshotPayload {
  const fetchedAt = nowIso();
  return {
    ca: {
      caConnectionId: config.caConnectionId,
      caProjectId: config.caProjectId,
      caSessionId: config.caSessionId,
    },
    fetchedAt,
    schemaVersion: "ca-connector-demo@0.1.0",
    session: {
      allRidingMessageLength: 1024,
      endedAt: null,
      lastActiveAt: fetchedAt,
      messageCount: 9,
      startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      tokenCost: 2048,
      toolCallCount: 5,
    },
    summary: {
      currentGoal: "Finish the sorting task and stabilize the final answer.",
      latestActivity: "Validated the latest candidate output and prepared final response.",
      riskLevel: "low",
      riskReason: "No blocking risk detected in connector demo state.",
    },
    task: {
      progressPercent: 82,
      taskStatus: "running",
    },
  };
}

async function main(): Promise<void> {
  const config = loadConnectorConfig(process.env);
  const client = createAryCAClient(config);
  const snapshotPayload = buildSnapshotPayload(config);

  const server = createServer(async (request, response) => {
    if (!request.url || request.method !== "GET") {
      json(response, 404, { error: "not_found" });
      return;
    }

    const url = new URL(request.url, `http://127.0.0.1:${config.port}`);
    const expectedPath = `/ary/ca/connections/${config.caConnectionId}/sessions/${config.caSessionId}/snapshot`;

    if (url.pathname === "/healthz") {
      json(response, 200, { ok: true, sessionId: config.caSessionId });
      return;
    }

    if (url.pathname !== expectedPath) {
      json(response, 404, { error: "snapshot_not_found", expectedPath });
      return;
    }

    const authHeader = request.headers.authorization ?? "";
    if (authHeader !== `Bearer ${config.caConnectorSecret}`) {
      json(response, 401, { error: "unauthorized" });
      return;
    }

    json(response, 200, client.buildSnapshotPayload(snapshotPayload));
  });

  await new Promise<void>((resolve) => {
    server.listen(config.port, () => {
      console.info(`[ca_connector_demo] snapshot server listening on ${config.caConnectorBaseUrl}`);
      resolve();
    });
  });

  const handshake = buildHandshakePayload(config);
  const sessionStarted = buildSignalPayload(
    config,
    {
      kind: "event",
      phase: "active",
      progressPercent: 5,
      taskStatus: "booting",
      type: "session_started",
    },
    {
      currentGoal: "Initialize the connector demo session.",
      latestActivity: "Handshake completed and session started.",
      riskLevel: "low",
      riskReason: "Connector demo just started.",
    },
  );
  const taskProgress = buildSignalPayload(
    config,
    {
      kind: "event",
      phase: "active",
      progressPercent: 82,
      taskStatus: "running",
      type: "task_progress",
    },
    {
      currentGoal: "Finish the sorting task and stabilize the final answer.",
      latestActivity: "Generated a candidate answer and checked the intermediate output.",
      riskLevel: "low",
      riskReason: "No blocking error so far.",
    },
  );

  console.info("[ca_connector_demo] sending handshake to ARY...");
  await client.completeHandshake(handshake);
  console.info("[ca_connector_demo] handshake accepted.");

  console.info("[ca_connector_demo] sending session_started signal...");
  await client.pushSignal(sessionStarted);
  console.info("[ca_connector_demo] session_started accepted.");

  console.info("[ca_connector_demo] sending task_progress signal...");
  await client.pushSignal(taskProgress);
  console.info("[ca_connector_demo] task_progress accepted.");

  console.info(
    `[ca_connector_demo] connector ready. Use session ${config.caSessionId} in the Rider console to fetch snapshot.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ca_connector_demo] fatal error: ${message}`);
  process.exit(1);
});
