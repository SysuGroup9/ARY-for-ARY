# GRS004 / DEV-5 / P0 可信链缺口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`✅`) syntax for tracking.

**Goal:** 为现有 `CAConnection -> Session -> Evidence -> Projection` 主链路补上最小完整性判断、payload 冲突检测和 review 风险语义，并保持 `grs004` 文档要求的“不自动 DQ”边界。

**Architecture:** 先用纯函数 helper 固化 `payloadDigest`、时间窗风险和 Evidence 可信度规则，再扩展 Prisma schema，随后把规则接入 `ca-ingestion`、`ca-fetch` 和 `evidence` 重建链路。Projection 继续保留现有 race 级全量 rebuild，不在本轮引入局部更新或签名体系。

**Tech Stack:** Prisma + SQLite, Next.js App Router server actions / API routes, Node `crypto`, node:test + tsx, seeded `dev.db`, Prisma migrate/generate, Next build

---

## 文件结构

- `prisma/schema.prisma`
  - 新增完整性相关 enum 与 `CAIngestionEvent` / `Evidence` 字段。
- `src/lib/ca-integrity-helpers.ts`
  - 纯函数：稳定序列化、payload digest、时间窗判断、事件/证据完整性归并。
- `src/lib/ca-integrity-helpers.test.ts`
  - 验证 digest、风险判定、Evidence 可信度归并。
- `src/lib/services/ca-ingestion.ts`
  - 接入 `schemaVersion / sequence` 解析、digest 冲突检测、`integrityStatus` 入库。
- `src/lib/services/ca-fetch.ts`
  - 为 snapshot fetch 事件写入 digest、receivedAt、integrity 状态。
- `src/lib/evidence-projection-helpers.ts`
  - 扩展 `SESSION_SUMMARY` Evidence builder，支持完整性元数据。
- `src/lib/evidence-projection-helpers.test.ts`
  - 断言 `SESSION_SUMMARY` Evidence 包含 `sourceDigest / generatedFromEventIdsJson / reviewFlagJson`。
- `src/lib/services/evidence.ts`
  - 读取关联 ingestion event，生成带可信度的 `SESSION_SUMMARY` Evidence。
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 用 seed 数据验证 `idempotencyKey` 冲突、时间窗风险、业务状态不重复推进。
- `src/lib/services/ca-fetch-integrity.test.ts`
  - 用 mocked fetch 验证 snapshot fetch 事件元数据与 Evidence 重建前置。
- `docs/superpowers/status.md`
  - 回写已关闭缺口、未关闭缺口与下一步入口。

---

### Task 1: Add Pure Integrity Helper Tests

**Files:**
- Create: `src/lib/ca-integrity-helpers.ts`
- Create: `src/lib/ca-integrity-helpers.test.ts`
- Modify: `src/lib/evidence-projection-helpers.test.ts`
- Test: `src/lib/ca-integrity-helpers.test.ts`
- Test: `src/lib/evidence-projection-helpers.test.ts`

✅ **Step 1: Write the failing integrity helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPayloadDigest,
  classifyDuplicatePayload,
  evaluateObservedAtWindow,
  summarizeEvidenceIntegrity,
} from "./ca-integrity-helpers";

test("buildPayloadDigest returns the same digest for the same normalized payload", () => {
  const left = buildPayloadDigest({
    schemaVersion: "ary.ca.riding_signal.v0.1",
    idempotencyKey: "k1",
    sequence: 7,
  });
  const right = buildPayloadDigest({
    schemaVersion: "ary.ca.riding_signal.v0.1",
    idempotencyKey: "k1",
    sequence: 7,
  });

  assert.equal(left, right);
  assert.match(left, /^[a-f0-9]{64}$/);
});

test("classifyDuplicatePayload marks different digests as integrity_gap", () => {
  assert.deepEqual(
    classifyDuplicatePayload({
      existingDigest: "aaa",
      incomingDigest: "bbb",
    }),
    {
      deduped: false,
      integrityStatus: "integrity_gap",
      shouldCreateConflictEvent: true,
    },
  );
});

test("evaluateObservedAtWindow marks stale signals as review_needed", () => {
  const result = evaluateObservedAtWindow({
    maxSkewMs: 5 * 60 * 1000,
    observedAt: new Date("2026-06-19T10:00:00Z"),
    receivedAt: new Date("2026-06-19T10:12:00Z"),
  });

  assert.equal(result.integrityStatus, "review_needed");
  assert.match(result.reviewFlags[0] ?? "", /timestamp/i);
});

test("summarizeEvidenceIntegrity downgrades evidence confidence when source events need review", () => {
  const summary = summarizeEvidenceIntegrity([
    { id: "evt_ok", integrityStatus: "ok" },
    { id: "evt_review", integrityStatus: "review_needed" },
  ]);

  assert.deepEqual(summary, {
    confidenceLevel: "medium",
    generatedFromEventIdsJson: JSON.stringify(["evt_ok", "evt_review"]),
    integrityStatus: "review_needed",
    reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
  });
});
```

✅ **Step 2: Extend the session-summary evidence test so it fails on the new metadata fields**

```ts
test("builds session summary evidence with integrity metadata", () => {
  const evidence = buildSessionSummaryEvidenceRecord({
    caConnectionId: "conn_01",
    caProjectId: "codex_project_demo",
    caSessionId: "session_01",
    caType: "CODEX",
    confidenceLevel: "high",
    generatedFromEventIdsJson: JSON.stringify(["evt_01"]),
    integrityStatus: "ok",
    messageCount: 42,
    registrationId: "reg_01",
    reviewFlagJson: JSON.stringify([]),
    sourceDigest: "digest_01",
    startedAt: new Date("2026-06-19T09:00:00Z"),
    tokenCost: 1200,
    toolCallCount: 8,
  });

  assert.equal(evidence.integrityStatus, "ok");
  assert.equal(evidence.confidenceLevel, "high");
  assert.equal(evidence.sourceDigest, "digest_01");
  assert.equal(evidence.generatedFromEventIdsJson, JSON.stringify(["evt_01"]));
  assert.equal(evidence.reviewFlagJson, JSON.stringify([]));
});
```

✅ **Step 3: Run the focused helper tests and confirm failure**

Run: `node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/evidence-projection-helpers.test.ts`

Expected: FAIL with import errors or missing `integrityStatus` / `confidenceLevel` fields.

✅ **Step 4: Implement the minimal pure helper module**

```ts
import { createHash } from "node:crypto";

export function buildPayloadDigest(payload: unknown): string {
  return createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}

export function classifyDuplicatePayload(input: {
  existingDigest: string;
  incomingDigest: string;
}) {
  if (input.existingDigest === input.incomingDigest) {
    return {
      deduped: true,
      integrityStatus: "ok" as const,
      shouldCreateConflictEvent: false,
    };
  }

  return {
    deduped: false,
    integrityStatus: "integrity_gap" as const,
    shouldCreateConflictEvent: true,
  };
}

export function evaluateObservedAtWindow(input: {
  maxSkewMs: number;
  observedAt: Date;
  receivedAt: Date;
}) {
  const skewMs = Math.abs(input.receivedAt.getTime() - input.observedAt.getTime());
  if (skewMs <= input.maxSkewMs) {
    return { integrityStatus: "ok" as const, reviewFlags: [] as string[] };
  }

  return {
    integrityStatus: "review_needed" as const,
    reviewFlags: ["timestamp_window_exceeded"],
  };
}

export function summarizeEvidenceIntegrity(
  events: Array<{ id: string; integrityStatus: "ok" | "review_needed" | "integrity_gap" }>,
) {
  const eventIds = events.map((event) => event.id);
  if (events.some((event) => event.integrityStatus === "integrity_gap")) {
    return {
      confidenceLevel: "medium" as const,
      generatedFromEventIdsJson: JSON.stringify(eventIds),
      integrityStatus: "review_needed" as const,
      reviewFlagJson: JSON.stringify(["source_event_integrity_gap"]),
    };
  }

  if (events.some((event) => event.integrityStatus === "review_needed")) {
    return {
      confidenceLevel: "medium" as const,
      generatedFromEventIdsJson: JSON.stringify(eventIds),
      integrityStatus: "review_needed" as const,
      reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
    };
  }

  return {
    confidenceLevel: "high" as const,
    generatedFromEventIdsJson: JSON.stringify(eventIds),
    integrityStatus: "ok" as const,
    reviewFlagJson: JSON.stringify([]),
  };
}
```

✅ **Step 5: Re-run the focused helper tests**

Run: `node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/evidence-projection-helpers.test.ts`

Expected: PASS

✅ **Step 6: Commit**

```bash
git add src/lib/ca-integrity-helpers.ts src/lib/ca-integrity-helpers.test.ts src/lib/evidence-projection-helpers.test.ts
git commit -m "test: add grs004 p0 integrity helper coverage"
```

---

### Task 2: Extend Prisma Schema for Integrity Metadata

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `src/generated/prisma/*`
- Test: Prisma generate / migrate

✅ **Step 1: Add failing schema-aware assertions in the helper tests for enum-backed values**

```ts
assert.equal(evidence.integrityStatus, "ok");
assert.equal(evidence.confidenceLevel, "high");
```

Expected failure before schema change: service compile still lacks these fields on `Evidence`.

✅ **Step 2: Add schema enums and fields**

```prisma
enum IntegrityStatus {
  OK
  REVIEW_NEEDED
  INTEGRITY_GAP
}

enum ConfidenceLevel {
  HIGH
  MEDIUM
}

model CAIngestionEvent {
  id              String          @id @default(cuid())
  caConnectionId  String
  messageId       String
  idempotencyKey  String          @unique
  observedAt      DateTime
  receivedAt      DateTime        @default(now())
  sequence        Int?
  payloadDigest   String          @default("")
  integrityStatus IntegrityStatus @default(OK)
  signalType      String
  signalKind      String
  payloadJson     String
  createdAt       DateTime        @default(now())
}

model Evidence {
  id                      String          @id @default(cuid())
  registrationId          String
  type                    EvidenceType
  title                   String
  summary                 String
  sourceRefJson           String
  sourceDigest            String          @default("")
  generatedFromEventIdsJson String        @default("[]")
  reviewFlagJson          String          @default("[]")
  integrityStatus         IntegrityStatus @default(OK)
  confidenceLevel         ConfidenceLevel @default(HIGH)
  visibility              Visibility      @default(INTERNAL)
  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt
}
```

✅ **Step 3: Generate Prisma client**

Run: `npm run db:generate`

Expected: PASS and `src/generated/prisma/enums.ts` contains `IntegrityStatus` and `ConfidenceLevel`.

✅ **Step 4: Create and apply the migration**

Run: `npx prisma migrate dev --name grs004_p0_trusted_ingestion`

Expected: PASS and local SQLite schema updated with new columns/defaults.

✅ **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/generated/prisma
git commit -m "feat: extend ingestion and evidence integrity schema"
```

---

### Task 3: Implement Runtime Integrity Handling for Signal and Snapshot Ingestion

**Files:**
- Modify: `src/lib/services/ca-ingestion.ts`
- Modify: `src/lib/services/ca-fetch.ts`
- Modify: `src/lib/ca-runtime-helpers.ts`
- Create: `src/lib/services/ca-ingestion-integrity.test.ts`
- Create: `src/lib/services/ca-fetch-integrity.test.ts`
- Test: `src/lib/services/ca-ingestion-integrity.test.ts`
- Test: `src/lib/services/ca-fetch-integrity.test.ts`

✅ **Step 1: Write the failing signal-ingestion service tests against seeded data**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { ingestRidingSignalMessage } from "@/lib/services/ca-ingestion";

test("duplicate idempotencyKey with the same payload is deduped without a second business write", async () => {
  const connection = await prisma.cAConnection.findFirstOrThrow({
    where: { connectorId: "codex_connector_active_0" },
    include: { raceProject: { include: { registration: true } } },
  });

  const payload = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: "msg_same_digest",
    idempotencyKey: "same-digest-key",
    sequence: 7,
    timestamp: "2026-06-19T10:00:00.000Z",
    ca: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      caSessionId: "session_same_digest",
      caType: connection.caType,
      connectorId: connection.connectorId,
    },
    race: { raceId: connection.raceProject.registration.raceId },
    rider: {
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
    },
    signal: { kind: "event", type: "task_progress", progressPercent: 33 },
    counters: { messageCount: 9, toolCallCount: 2, tokens: 300 },
  };

  const first = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: payload,
  });
  const second = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: payload,
  });

  assert.equal(first.accepted, true);
  assert.equal(second.deduped, true);
});

test("duplicate idempotencyKey with a different payload becomes integrity_gap", async () => {
  const connection = await prisma.cAConnection.findFirstOrThrow({
    where: { connectorId: "codex_connector_active_0" },
    include: { raceProject: { include: { registration: true } } },
  });

  const base = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: "msg_conflict_a",
    idempotencyKey: "digest-conflict-key",
    sequence: 8,
    timestamp: "2026-06-19T10:00:00.000Z",
    ca: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      caSessionId: "session_conflict",
      caType: connection.caType,
      connectorId: connection.connectorId,
    },
    race: { raceId: connection.raceProject.registration.raceId },
    rider: {
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
    },
    signal: { kind: "event", type: "task_progress", progressPercent: 40 },
    counters: { messageCount: 10, toolCallCount: 3, tokens: 320 },
  };

  await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: base,
  });
  const conflict = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      ...base,
      counters: { ...base.counters, messageCount: 99 },
      messageId: "msg_conflict_b",
    },
  });

  assert.equal(conflict.accepted, true);
  assert.equal(conflict.integrityStatus, "integrity_gap");
});
```

✅ **Step 2: Write the failing snapshot-ingestion service test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { fetchCASessionSnapshotForConnection } from "@/lib/services/ca-fetch";

test("snapshot fetch writes payloadDigest and integrity metadata to CAIngestionEvent", async () => {
  const connection = await prisma.cAConnection.findFirstOrThrow({
    where: { connectorId: "codex_connector_active_0" },
  });

  await fetchCASessionSnapshotForConnection({
    caConnectionId: connection.id,
    caSessionId: "snapshot_integrity_session",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          schemaVersion: "ary.ca.session_snapshot.v0.1",
          fetchedAt: "2026-06-19T10:18:36.000Z",
          ca: {
            caConnectionId: connection.id,
            caProjectId: connection.caProjectId,
            caSessionId: "snapshot_integrity_session",
          },
          summary: {
            currentGoal: "Implement DEV-5",
            latestActivity: "Fetched snapshot for integrity coverage",
            riskLevel: "low",
            riskReason: "none",
          },
          task: {
            progressPercent: 50,
            taskStatus: "in_progress",
          },
          session: {
            allRidingMessageLength: 123,
            endedAt: null,
            lastActiveAt: "2026-06-19T10:17:58.000Z",
            messageCount: 14,
            startedAt: "2026-06-19T09:02:11.000Z",
            tokenCost: 880,
            toolCallCount: 5,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const event = await prisma.cAIngestionEvent.findFirstOrThrow({
    where: {
      idempotencyKey: `fetch:${connection.id}:snapshot_integrity_session:2026-06-19T10:18:36.000Z`,
    },
  });

  assert.match(event.payloadDigest, /^[a-f0-9]{64}$/);
  assert.equal(event.integrityStatus, "OK");
});
```

✅ **Step 3: Run the focused service tests and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts`

Expected: FAIL because `schemaVersion / sequence / payloadDigest / integrityStatus` are not yet wired.

✅ **Step 4: Wire digest, sequence, receivedAt, and conflict detection into `ca-ingestion.ts`**

```ts
const ridingSignalSchema = z.object({
  schemaVersion: z.string().min(1),
  sequence: z.number().int().nonnegative().optional(),
  ca: z.object({
    caConnectionId: z.string().min(1),
    caProjectId: z.string().min(1),
    caSessionId: z.string().min(1),
    caType: z.enum(["CLAUDE_CODE", "CODEX", "OTHER"]),
    connectorId: z.string().min(1),
    connectorVersion: z.string().optional(),
  }),
  counters: z
    .object({
      allRidingMessageLength: z.number().int().nonnegative().optional(),
      messageCount: z.number().int().nonnegative().optional(),
      sessionCount: z.number().int().nonnegative().optional(),
      tokens: z.number().int().nonnegative().optional(),
      toolCallCount: z.number().int().nonnegative().optional(),
    })
    .default({}),
  idempotencyKey: z.string().min(1),
  ingestion: z
    .object({
      scope: z.string().optional(),
      status: z.nativeEnum(IngestionStatus),
      statusReason: z.string().default(""),
    })
    .nullable()
    .optional(),
  summary: z
    .object({
      currentGoal: z.string().optional(),
      latestActivity: z.string().optional(),
      riskLevel: z.string().optional(),
      riskReason: z.string().optional(),
    })
    .optional(),
  messageId: z.string().min(1),
  race: z.object({
    raceId: z.string().min(1),
    taskId: z.string().optional(),
  }),
  rider: z.object({
    raceProjectId: z.string().min(1),
    registrationId: z.string().min(1),
  }),
  signal: z.object({
    kind: z.enum(["event", "note"]),
    phase: z.string().optional(),
    progressPercent: z.number().min(0).max(100).optional(),
    taskStatus: z.string().optional(),
    type: z.enum([
      "risk_detected",
      "session_completed",
      "session_started",
      "task_progress",
    ]),
  }),
  timestamp: z.string().datetime(),
});

const receivedAt = new Date();
const payloadDigest = buildPayloadDigest(parsed);
const windowResult = evaluateObservedAtWindow({
  maxSkewMs: 5 * 60 * 1000,
  observedAt,
  receivedAt,
});

const existingEvent = await prisma.cAIngestionEvent.findUnique({
  where: { idempotencyKey: parsed.idempotencyKey },
});

if (existingEvent) {
  const duplicateResult = classifyDuplicatePayload({
    existingDigest: existingEvent.payloadDigest,
    incomingDigest: payloadDigest,
  });

  if (duplicateResult.deduped) {
    return { accepted: true as const, deduped: true as const };
  }

  await prisma.cAIngestionEvent.create({
    data: {
      caConnectionId: event.id,
      idempotencyKey: `${parsed.idempotencyKey}:integrity_gap:${receivedAt.toISOString()}`,
      messageId: parsed.messageId,
      observedAt,
      receivedAt,
      sequence: parsed.sequence,
      payloadDigest,
      integrityStatus: "INTEGRITY_GAP",
      payloadJson: JSON.stringify(parsed),
      signalKind: parsed.signal.kind,
      signalType: parsed.signal.type,
    },
  });

  return {
    accepted: true as const,
    deduped: false as const,
    integrityStatus: "integrity_gap" as const,
  };
}
```

✅ **Step 5: Wire digest and metadata into `ca-fetch.ts`**

```ts
const receivedAt = new Date();
const payloadDigest = buildPayloadDigest(parsed);

await tx.cAIngestionEvent.create({
  data: {
    caConnectionId: connection.id,
    idempotencyKey: `fetch:${connection.id}:${input.caSessionId}:${parsed.fetchedAt}`,
    messageId: `fetch:${connection.id}:${input.caSessionId}:${parsed.fetchedAt}`,
    observedAt: fetchedAt,
    receivedAt,
    sequence: null,
    payloadDigest,
    integrityStatus: "OK",
    payloadJson: JSON.stringify(parsed),
    signalKind: "snapshot",
    signalType: "snapshot_fetch",
  },
});
```

✅ **Step 6: Re-run the focused service tests**

Run: `node --import tsx --test src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts`

Expected: PASS

✅ **Step 7: Commit**

```bash
git add src/lib/services/ca-ingestion.ts src/lib/services/ca-fetch.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/ca-runtime-helpers.ts
git commit -m "feat: add grs004 p0 ingestion integrity handling"
```

---

### Task 4: Rebuild Session Summary Evidence with Integrity Metadata

**Files:**
- Modify: `src/lib/evidence-projection-helpers.ts`
- Modify: `src/lib/services/evidence.ts`
- Modify: `src/lib/evidence-projection-helpers.test.ts`
- Create: `src/lib/services/evidence-integrity.test.ts`
- Test: `src/lib/services/evidence-integrity.test.ts`

✅ **Step 1: Write the failing evidence rebuild test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";

test("rebuildSessionSummaryEvidenceForRace writes confidence and review flags from source ingestion events", async () => {
  await rebuildSessionSummaryEvidenceForRace("race_active");

  const evidence = await prisma.evidence.findFirstOrThrow({
    where: {
      registration: { raceId: "race_active" },
      type: "SESSION_SUMMARY",
    },
  });

  assert.ok(evidence.generatedFromEventIdsJson.startsWith("["));
  assert.ok(evidence.reviewFlagJson.startsWith("["));
  assert.ok(["OK", "REVIEW_NEEDED"].includes(evidence.integrityStatus));
  assert.ok(["HIGH", "MEDIUM"].includes(evidence.confidenceLevel));
});
```

✅ **Step 2: Run the focused evidence tests and confirm failure**

Run: `node --import tsx --test src/lib/evidence-projection-helpers.test.ts src/lib/services/evidence-integrity.test.ts`

Expected: FAIL because the builder and rebuild service do not yet populate the new fields.

✅ **Step 3: Extend the session-summary builder to accept integrity metadata**

```ts
export function buildSessionSummaryEvidenceRecord(input: {
  caConnectionId: string;
  caProjectId: string;
  caSessionId: string;
  caType: "CLAUDE_CODE" | "CODEX" | "OTHER";
  confidenceLevel: "high" | "medium";
  generatedFromEventIdsJson: string;
  integrityStatus: "ok" | "review_needed";
  messageCount: number;
  registrationId: string;
  reviewFlagJson: string;
  sourceDigest: string;
  startedAt: Date;
  tokenCost: number;
  toolCallCount: number;
}) {
  return {
    confidenceLevel: input.confidenceLevel,
    generatedFromEventIdsJson: input.generatedFromEventIdsJson,
    integrityStatus: input.integrityStatus,
    registrationId: input.registrationId,
    reviewFlagJson: input.reviewFlagJson,
    sourceDigest: input.sourceDigest,
    sourceRefJson: JSON.stringify({
      caConnectionId: input.caConnectionId,
      caProjectId: input.caProjectId,
      caSessionId: input.caSessionId,
    }),
    summary: `${input.caType} session ${input.caSessionId} produced ${input.messageCount} messages, ${input.toolCallCount} tool calls, and ${input.tokenCost} tokens.`,
    title: `Session ${input.caSessionId}`,
    type: "SESSION_SUMMARY" as const,
    visibility: "INTERNAL" as const,
  };
}
```

✅ **Step 4: Rebuild evidence from matching ingestion events, not just session rows**

```ts
const relatedEvents = connection.ingestionEvents.filter((event) => {
  const payload = JSON.parse(event.payloadJson) as {
    ca?: { caSessionId?: string };
  };
  return payload.ca?.caSessionId === session.caSessionId;
});

const integritySummary = summarizeEvidenceIntegrity(
  relatedEvents.map((event) => ({
    id: event.id,
    integrityStatus:
      event.integrityStatus === "INTEGRITY_GAP"
        ? "integrity_gap"
        : event.integrityStatus === "REVIEW_NEEDED"
        ? "review_needed"
        : "ok",
  })),
);

const evidence = buildSessionSummaryEvidenceRecord({
  caConnectionId: connection.id,
  caProjectId: connection.caProjectId,
  caSessionId: session.caSessionId,
  caType: connection.caType,
  confidenceLevel: integritySummary.confidenceLevel,
  generatedFromEventIdsJson: integritySummary.generatedFromEventIdsJson,
  integrityStatus: integritySummary.integrityStatus,
  messageCount: session.messageCount,
  registrationId: registration.id,
  reviewFlagJson: integritySummary.reviewFlagJson,
  sourceDigest: buildPayloadDigest(
    relatedEvents.map((event) => ({
      id: event.id,
      payloadDigest: event.payloadDigest,
    })),
  ),
  startedAt: session.startedAt,
  tokenCost: session.tokenCost,
  toolCallCount: session.toolCallCount,
});
```

✅ **Step 5: Re-run the evidence tests**

Run: `node --import tsx --test src/lib/evidence-projection-helpers.test.ts src/lib/services/evidence-integrity.test.ts`

Expected: PASS

✅ **Step 6: Commit**

```bash
git add src/lib/evidence-projection-helpers.ts src/lib/evidence-projection-helpers.test.ts src/lib/services/evidence.ts src/lib/services/evidence-integrity.test.ts
git commit -m "feat: add grs004 p0 evidence integrity metadata"
```

---

### Task 5: Sync Documentation and Runtime Status

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-dev5-p0-trusted-ingestion-design.md`

✅ **Step 1: Update the status document to reflect the closed P0 gaps**

```md
- `CAIngestionEvent` 已补 `payloadDigest / sequence / receivedAt / integrityStatus`。
- 重复 `idempotencyKey` 且 payload 不一致时，ARY 不再静默 dedupe，而是形成 `integrity_gap` 风险记录。
- `SESSION_SUMMARY` Evidence 已补 `integrityStatus / confidenceLevel / sourceDigest / generatedFromEventIdsJson / reviewFlagJson`。
- 风险默认进入 review 语义，不自动 DQ。
```

✅ **Step 2: Update the design spec with any implementation-level clarifications discovered during execution**

```md
## Implementation Notes

- `CAIngestionEvent` 未新增 `caSessionId` 字段；本轮通过解析 `payloadJson.ca.caSessionId` 与 Session 关联。
- Projection 仍保持 race 级全量 rebuild；本轮没有引入 `sourceVersion / inputDigest`。
```

✅ **Step 3: Commit**

```bash
git add docs/superpowers/status.md docs/superpowers/specs/2026-07-10-grs004-dev5-p0-trusted-ingestion-design.md
git commit -m "docs: record grs004 p0 integrity status"
```

---

### Task 6: Verify the Slice

**Files:**
- Test only

✅ **Step 1: Run the focused integrity and evidence tests**

Run: `node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/evidence-projection-helpers.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/evidence-integrity.test.ts src/lib/ca-runtime-helpers.test.ts`

Expected: PASS

✅ **Step 2: Regenerate Prisma client to ensure generated types match the plan**

Run: `npm run db:generate`

Expected: PASS

✅ **Step 3: Run the project build**

Run: `npm run build`

Expected: PASS

✅ **Step 4: Re-seed if the migration reset local SQLite state**

Run: `npm run db:seed`

Expected: PASS and `race_active / race_signup / race_finished` are re-created.

✅ **Step 5: Commit the verified end state**

```bash
git add .
git commit -m "feat: complete grs004 dev5 p0 trusted ingestion slice"
```
