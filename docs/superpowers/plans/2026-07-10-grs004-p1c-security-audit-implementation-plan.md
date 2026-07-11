# GRS004 / P1-C 统一 SecurityAudit 层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前 `CA` 主链路引入统一 `SecurityAudit` 模型，并把 connector registration / handshake / signal / snapshot 四类安全边界动作写入可查询的审计事实。

**Architecture:** 在 Prisma 中新增单表 `SecurityAudit`，通过 `detailsJson` 承载动作特有上下文。运行时不改变现有 API 语义，只在 `ca-connections.ts / ca-fetch.ts / ca-ingestion.ts` 的真实边界路径补审计写入。

**Tech Stack:** Prisma + SQLite, Next.js server services, Node `crypto`, node:test + tsx, Prisma migrate/generate, local seed/build verification

---

## 文件结构

- `prisma/schema.prisma`
  - 新增 `SecurityAudit` 模型
- `src/lib/security-audit-helpers.ts`
  - 纯函数：构建标准化审计 payload
- `src/lib/security-audit-helpers.test.ts`
  - 校验 payload、detailsJson 和默认值
- `src/lib/services/security-audit.ts`
  - 统一写入 helper：`recordSecurityAudit()`
- `src/lib/services/ca-connection-audit.test.ts`
  - 覆盖 `createCAConnectionForRaceProject()` 的审计写入
- `src/lib/services/ca-fetch-audit.test.ts`
  - 覆盖 `completeCAConnectionHandshake()` 与 `fetchCASessionSnapshotForConnection()` 的审计写入
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 扩展现有 signal integrity 测试，校验 `SecurityAudit`
- `src/lib/services/ca-connections.ts`
  - connector registration 成功后写审计
- `src/lib/services/ca-fetch.ts`
  - handshake / snapshot 成功和失败路径写审计
- `src/lib/services/ca-ingestion.ts`
  - signal 成功 / dedupe / integrity gap / 拒绝分支写审计
- `docs/superpowers/status.md`
  - 记录 `P1-C` 的落地、验证与剩余缺口
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`
  - 回写 implementation notes

### Task 1: Add Pure Security Audit Helper Tests

**Files:**
- Create: `src/lib/security-audit-helpers.ts`
- Create: `src/lib/security-audit-helpers.test.ts`
- Test: `src/lib/security-audit-helpers.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildSecurityAuditRecord } from "./security-audit-helpers";

test("buildSecurityAuditRecord normalizes detailsJson and reason", () => {
  const record = buildSecurityAuditRecord({
    action: "ca_signal.ingest",
    actorKind: "CONNECTOR",
    caConnectionId: "conn_1",
    details: {
      idempotencyKey: "idem_1",
      sequence: 7,
    },
    payloadDigest: "digest_1",
    raceId: "race_1",
    reason: "",
    registrationId: "reg_1",
    result: "accepted",
    targetId: "session_1",
    targetType: "Session",
    userId: "user_1",
  });

  assert.equal(record.action, "ca_signal.ingest");
  assert.equal(record.reason, "");
  assert.equal(record.detailsJson, JSON.stringify({ idempotencyKey: "idem_1", sequence: 7 }));
});
```

- [ ] **Step 2: Run the focused helper test and confirm failure**

Run: `node --import tsx --test src/lib/security-audit-helpers.test.ts`

Expected: FAIL with missing module / function errors.

- [ ] **Step 3: Implement the helper module**

```ts
export function buildSecurityAuditRecord(input: {...}) {
  return {
    ...,
    detailsJson: JSON.stringify(input.details ?? {}),
    reason: input.reason ?? "",
  };
}
```

- [ ] **Step 4: Re-run the helper test**

Run: `node --import tsx --test src/lib/security-audit-helpers.test.ts`

Expected: PASS

### Task 2: Extend Prisma Schema for SecurityAudit

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `src/generated/prisma/*`

- [ ] **Step 1: Add the SecurityAudit model**

```prisma
model SecurityAudit {
  id             String   @id @default(cuid())
  raceId         String?
  raceProjectId  String?
  registrationId String?
  userId         String?
  caConnectionId String?
  actorKind      String
  action         String
  targetType     String
  targetId       String
  result         String
  reason         String   @default("")
  payloadDigest  String   @default("")
  detailsJson    String   @default("{}")
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`

Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name grs004_p1c_security_audit`

Expected: PASS

### Task 3: Add the Shared Audit Writer

**Files:**
- Create: `src/lib/services/security-audit.ts`

- [ ] **Step 1: Add a small shared write helper**

```ts
export async function recordSecurityAudit(db, input) {
  return db.securityAudit.create({
    data: buildSecurityAuditRecord(input),
  });
}
```

### Task 4: Audit CA Connection Registration

**Files:**
- Modify: `src/lib/services/ca-connections.ts`
- Create: `src/lib/services/ca-connection-audit.test.ts`
- Test: `src/lib/services/ca-connection-audit.test.ts`

- [ ] **Step 1: Write the failing registration audit test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { createCAConnectionForRaceProject } from "@/lib/services/ca-connections";

test("createCAConnectionForRaceProject writes a security audit record", async () => {
  const registration = await prisma.registration.findFirstOrThrow({
    where: { raceId: "race_active" },
    include: { raceProject: true, user: true },
  });

  const connection = await createCAConnectionForRaceProject({
    caProjectId: `audit_project_${Date.now()}`,
    caType: "CODEX",
    connectorBaseUrl: "https://connector.example/audit",
    connectorId: `audit_connector_${Date.now()}`,
    connectorVersion: "0.1.0",
    raceProjectId: registration.raceProject!.id,
    userId: registration.userId,
  });

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.register",
      targetId: connection.id,
    },
  });

  assert.equal(audit.actorKind, "USER");
  assert.equal(audit.result, "accepted");
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-connection-audit.test.ts`

Expected: FAIL because no audit is written yet.

- [ ] **Step 3: Write the audit in `createCAConnectionForRaceProject()`**

- [ ] **Step 4: Re-run the focused test**

Run: `node --import tsx --test src/lib/services/ca-connection-audit.test.ts`

Expected: PASS

### Task 5: Audit Handshake and Snapshot Fetch

**Files:**
- Modify: `src/lib/services/ca-fetch.ts`
- Create: `src/lib/services/ca-fetch-audit.test.ts`
- Test: `src/lib/services/ca-fetch-audit.test.ts`

- [ ] **Step 1: Write the failing fetch audit tests**

Cover:

- handshake success writes `ca_connection.handshake`
- handshake unauthorized writes rejected audit
- snapshot success writes `ca_snapshot.fetch`
- stale snapshot writes `ca_snapshot.fetch` with `result = stale`

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-fetch-audit.test.ts`

Expected: FAIL because no audit is written yet.

- [ ] **Step 3: Add audit writes to handshake paths**

- [ ] **Step 4: Add audit writes to snapshot success / stale / reject paths**

- [ ] **Step 5: Re-run the focused tests**

Run: `node --import tsx --test src/lib/services/ca-fetch-audit.test.ts`

Expected: PASS

### Task 6: Audit Signal Ingestion

**Files:**
- Modify: `src/lib/services/ca-ingestion.ts`
- Modify: `src/lib/services/ca-ingestion-integrity.test.ts`
- Test: `src/lib/services/ca-ingestion-integrity.test.ts`

- [ ] **Step 1: Extend existing integrity tests with audit assertions**

Cover:

- same-payload duplicate → `result = deduped`
- payload digest conflict → `result = integrity_gap`

- [ ] **Step 2: Run the focused signal test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-ingestion-integrity.test.ts`

Expected: FAIL because no audit rows exist yet.

- [ ] **Step 3: Add audit writes to all early-return and success branches**

- [ ] **Step 4: Re-run the focused signal test**

Run: `node --import tsx --test src/lib/services/ca-ingestion-integrity.test.ts`

Expected: PASS

### Task 7: Update Status and Verify the Slice

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `SecurityAudit` model exists
- CA registration / handshake / signal / snapshot write audit rows
- ip/userAgent and audit UI remain out of scope

- [ ] **Step 2: Run focused P1-C tests**

Run: `node --import tsx --test src/lib/security-audit-helpers.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-ingestion-integrity.test.ts`

Expected: PASS

- [ ] **Step 3: Regenerate Prisma client**

Run: `npm run db:generate`

Expected: PASS

- [ ] **Step 4: Re-run seed**

Run: `npm run db:seed`

Expected: PASS

- [ ] **Step 5: Run full build**

Run: `npm run build`

Expected: PASS
