# GRS004 / P1-B 结果引用冻结层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `JudgingRecord / Award / Report` 补齐结果引用冻结字段与写入逻辑，让评审和发布结果能追溯到当时依赖的 Work / Evidence / Projection 上下文。

**Architecture:** 复用 `P1-A` 的元数据风格，在结果对象上直接增加 `sourceRefJson + sourceDigest`。运行时只改动 `upsertJudgingRecord()` 这条真实评审写入链路；`Award / Report` 先在 `result-chain-helpers + prisma/seed.ts` 上落地，避免发明新的发布服务。

**Tech Stack:** Prisma + SQLite, Next.js server actions/services, Node `crypto`, node:test + tsx, Prisma migrate/generate, local seed verification

---

## 文件结构

- `prisma/schema.prisma`
  - 为 `JudgingRecord / Award / Report` 增加 `sourceRefJson / sourceDigest`
- `src/lib/result-reference-freeze-helpers.ts`
  - 纯函数：构建结果冻结引用结构与聚合 digest
- `src/lib/result-reference-freeze-helpers.test.ts`
  - 校验 Judging/Award/Report 引用结构与稳定 digest
- `src/lib/services/judging.ts`
  - `upsertJudgingRecord()` 写入冻结引用
- `src/lib/services/result-reference-freeze-judging.test.ts`
  - 运行时验证 `JudgingRecord` 持久化冻结引用
- `src/lib/result-chain-helpers.ts`
  - Award / Report seed builder 写入冻结引用字段
- `src/lib/result-chain-helpers.test.ts`
  - 对齐新的 Award / Report helper 输出
- `prisma/seed.ts`
  - 组装 seed 用的 Work / Evidence / Projection / Award 引用
- `src/lib/services/result-reference-freeze-seed.test.ts`
  - 验证 seed 生成的 `Award / Report` 已带冻结引用
- `docs/superpowers/status.md`
  - 记录 `P1-B` 的实现、验证和剩余缺口
- `docs/superpowers/specs/2026-07-10-grs004-p1b-result-reference-freeze-design.md`
  - 设计说明回写 implementation notes

### Task 1: Add Pure Result Reference Freeze Helper Tests

**Files:**
- Create: `src/lib/result-reference-freeze-helpers.ts`
- Create: `src/lib/result-reference-freeze-helpers.test.ts`
- Test: `src/lib/result-reference-freeze-helpers.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAwardSourceRef,
  buildJudgingRecordSourceRef,
  buildReportSourceRef,
} from "./result-reference-freeze-helpers";

test("buildJudgingRecordSourceRef captures work and evidence digests", () => {
  const ref = buildJudgingRecordSourceRef({
    evidences: [
      {
        id: "ev_1",
        integrityStatus: "OK",
        sourceDigest: "digest_ev_1",
        title: "Work evidence",
        type: "WORK",
      },
    ],
    registration: {
      id: "reg_1",
      userId: "user_1",
    },
    work: {
      contentHash: "work_hash",
      id: "work_1",
      sourceRefJson: "{\"repoUrl\":\"https://github.com/demo/work-1\"}",
      title: "Work 1",
    },
  });

  assert.equal(ref.work.contentHash, "work_hash");
  assert.equal(ref.evidences[0]?.sourceDigest, "digest_ev_1");
});

test("buildAwardSourceRef keeps registration and work linkage", () => {
  const ref = buildAwardSourceRef({
    evidences: [{ id: "ev_1", sourceDigest: "digest_ev_1", type: "WORK" }],
    registration: { id: "reg_1", userId: "user_1" },
    work: { contentHash: "work_hash", id: "work_1", title: "Work 1" },
  });

  assert.equal(ref.registration.id, "reg_1");
  assert.equal(ref.work?.contentHash, "work_hash");
});

test("buildReportSourceRef carries work, evidence, projection, and award refs", () => {
  const ref = buildReportSourceRef({
    awards: [{ awardName: "Best Overall", id: "award_1", rank: 1 }],
    evidences: [{ id: "ev_1", registrationId: "reg_1", sourceDigest: "digest_ev_1", type: "WORK" }],
    projections: [{ asOfAt: "2026-07-10T00:00:00.000Z", payloadDigest: "projection_digest", type: "CURRENT_LEADERBOARD" }],
    raceId: "race_1",
    reportType: "RACE_REPORT",
    subjectRegistrationId: null,
    works: [{ contentHash: "work_hash", id: "work_1", registrationId: "reg_1" }],
  });

  assert.equal(ref.reportType, "RACE_REPORT");
  assert.equal(ref.works[0]?.contentHash, "work_hash");
  assert.equal(ref.projections[0]?.payloadDigest, "projection_digest");
});
```

- [ ] **Step 2: Run the focused helper test and confirm failure**

Run: `node --import tsx --test src/lib/result-reference-freeze-helpers.test.ts`

Expected: FAIL with missing module / function errors.

- [ ] **Step 3: Implement the helper module**

```ts
export function buildJudgingRecordSourceRef(...) {
  return {
    registration: ...,
    work: ...,
    evidences: ...,
  };
}

export function buildAwardSourceRef(...) {
  return {
    registration: ...,
    work: ...,
    evidences: ...,
  };
}

export function buildReportSourceRef(...) {
  return {
    reportType: ...,
    raceId: ...,
    subjectRegistrationId: ...,
    works: ...,
    evidences: ...,
    awards: ...,
    projections: ...,
  };
}
```

- [ ] **Step 4: Re-run the helper test**

Run: `node --import tsx --test src/lib/result-reference-freeze-helpers.test.ts`

Expected: PASS

### Task 2: Extend Prisma Schema for Result Freeze Fields

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `src/generated/prisma/*`

- [ ] **Step 1: Add schema fields**

```prisma
model JudgingRecord {
  sourceRefJson String @default("{}")
  sourceDigest  String @default("")
}

model Award {
  sourceRefJson String @default("{}")
  sourceDigest  String @default("")
}

model Report {
  sourceRefJson String @default("{}")
  sourceDigest  String @default("")
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`

Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name grs004_p1b_result_reference_freeze`

Expected: PASS and local SQLite schema updated.

### Task 3: Persist Frozen Refs in JudgingRecord Runtime Flow

**Files:**
- Modify: `src/lib/services/judging.ts`
- Create: `src/lib/services/result-reference-freeze-judging.test.ts`
- Test: `src/lib/services/result-reference-freeze-judging.test.ts`

- [ ] **Step 1: Write the failing judging freeze test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { upsertJudgingRecord } from "@/lib/services/judging";

test("upsertJudgingRecord stores frozen work and evidence refs", async () => {
  const assignment = await prisma.judgeAssignment.findFirstOrThrow({
    where: {
      work: {
        registration: {
          raceId: "race_finished",
        },
      },
    },
    include: {
      judge: true,
    },
  });

  await upsertJudgingRecord({
    assignmentId: assignment.id,
    comments: "freeze reference check",
    judgeUserId: assignment.judgeId,
    scoreResultTotal: 88,
    scoreRidingTotal: 91,
    submit: true,
  });

  const stored = await prisma.judgingRecord.findUniqueOrThrow({
    where: {
      judgeAssignmentId: assignment.id,
    },
  });

  assert.match(stored.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(stored.sourceRefJson, /work/);
  assert.match(stored.sourceRefJson, /evidences/);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --import tsx --test src/lib/services/result-reference-freeze-judging.test.ts`

Expected: FAIL because `sourceRefJson / sourceDigest` do not exist yet.

- [ ] **Step 3: Load assignment context and persist the frozen refs**

```ts
const assignment = await prisma.judgeAssignment.findUnique({
  where: { id: input.assignmentId },
  include: {
    work: {
      include: {
        registration: {
          include: {
            evidences: true,
            user: true,
          },
        },
      },
    },
  },
});

const sourceRef = buildJudgingRecordSourceRef(...);
const sourceDigest = buildPayloadDigest(sourceRef);
```

- [ ] **Step 4: Write `sourceRefJson / sourceDigest` in both create and update branches**

```ts
update: {
  ...,
  sourceDigest,
  sourceRefJson: JSON.stringify(sourceRef),
}
```

- [ ] **Step 5: Re-run the focused test**

Run: `node --import tsx --test src/lib/services/result-reference-freeze-judging.test.ts`

Expected: PASS

### Task 4: Freeze Award and Report Refs in Seed / Result Chain Helpers

**Files:**
- Modify: `src/lib/result-chain-helpers.ts`
- Modify: `prisma/seed.ts`
- Modify: `src/lib/result-chain-helpers.test.ts`
- Create: `src/lib/services/result-reference-freeze-seed.test.ts`
- Test: `src/lib/result-chain-helpers.test.ts`
- Test: `src/lib/services/result-reference-freeze-seed.test.ts`

- [ ] **Step 1: Extend helper tests with frozen ref expectations**

```ts
assert.match(awards[0]?.sourceDigest ?? "", /^[a-f0-9]{64}$/);
assert.match(awards[0]?.sourceRefJson ?? "", /work/);
assert.match(report.sourceDigest, /^[a-f0-9]{64}$/);
assert.match(report.sourceRefJson, /projections/);
```

- [ ] **Step 2: Add a failing seed verification test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";

test("seeded awards, reports, and judging records carry frozen source refs", async () => {
  const award = await prisma.award.findFirstOrThrow({
    where: { raceId: "race_finished" },
  });
  const report = await prisma.report.findFirstOrThrow({
    where: { raceId: "race_finished", status: "PUBLISHED" },
  });
  const judgingRecord = await prisma.judgingRecord.findFirstOrThrow({
    where: {
      judgeAssignment: {
        work: {
          registration: {
            raceId: "race_finished",
          },
        },
      },
    },
  });

  assert.match(award.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(report.sourceRefJson, /projections/);
  assert.match(judgingRecord.sourceRefJson, /work/);
});
```

- [ ] **Step 3: Update `result-chain-helpers.ts` to build frozen Award / Report refs**

```ts
const sourceRef = buildAwardSourceRef(...);
return {
  ...,
  sourceDigest: buildPayloadDigest(sourceRef),
  sourceRefJson: JSON.stringify(sourceRef),
};
```

- [ ] **Step 4: Update `prisma/seed.ts` to pass Work / Evidence / Projection / Award context**

```ts
const raceProjections = await prisma.projection.findMany({ ... });
const publicEvidence = await prisma.evidence.findMany({ ... });
const sourceRef = buildReportSourceRef({ ... });
```

- [ ] **Step 5: Re-run helper and seed tests**

Run: `node --import tsx --test src/lib/result-chain-helpers.test.ts src/lib/services/result-reference-freeze-seed.test.ts`

Expected: PASS

### Task 5: Update Status and Verify the Slice

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1b-result-reference-freeze-design.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `JudgingRecord` now freezes `Work / Evidence` refs
- `Award / Report` seed path now freezes `Work / Evidence / Projection / Award` refs
- `SecurityAudit / IntegrityEvent` remains out of scope

- [ ] **Step 2: Run focused P1-B tests**

Run: `node --import tsx --test src/lib/result-reference-freeze-helpers.test.ts src/lib/services/result-reference-freeze-judging.test.ts src/lib/result-chain-helpers.test.ts src/lib/services/result-reference-freeze-seed.test.ts`

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
