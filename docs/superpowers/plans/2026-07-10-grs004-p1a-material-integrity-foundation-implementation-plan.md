# GRS004 / P1-A 材料引用与 Hash 基础层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`✅`) syntax for tracking.

**Goal:** 为企业题目材料、Work 资产、选手代码材料补齐 `sourceRef + hash + 最小身份绑定`，让这些材料从“只有内容”推进到“内容可追溯、hash 可比较”的状态，并保持 `P1-B` 的结果冻结工作不提前混入。

**Architecture:** 先补一个共享的材料 hash helper，再扩展 Prisma schema，随后分别接入 `cooperation -> race`、`work/seed`、`submission/archive` 三条写入链路。公开页和工作台读取结构保持不变，只在底层持久化材料来源与 digest。

**Tech Stack:** Prisma + SQLite, Next.js App Router server actions, Node `crypto`, node:test + tsx, local file uploads under `public/uploads`, Prisma migrate/generate, Next build, seed validation

---

## 文件结构

- `prisma/schema.prisma`
  - 为 `CooperationRequest / Race / Work / Submission / SubmissionArtifact / TeamArchive` 增加材料完整性字段。
- `src/lib/material-integrity-helpers.ts`
  - 纯函数：文件 hash、文本 hash、结构化 `sourceRefJson`、提交者绑定 JSON。
- `src/lib/material-integrity-helpers.test.ts`
  - 验证稳定 hash、sourceRef 结构和 binding 结构。
- `src/lib/services/cooperation.ts`
  - 上传时计算 `taskPackage / proposal` hash；审批时把 challenge sourceRef 和 digest 带入 `Race`。
- `src/lib/services/submissions.ts`
  - 创建 `Submission / SubmissionArtifact` 时计算 `codeContentHash / ridingRecordHash / submitterBindingJson`。
- `src/lib/evidence-projection-helpers.ts` only if a small helper is useful for sourceRef reuse
- `prisma/seed.ts`
  - 为 seed 的 `Work / Submission / TeamArchive / CooperationRequest -> Race` 材料补 hash 与 sourceRef。
- `src/lib/services/works.ts`
  - 如需的话，只读逻辑维持不变；若引入 helper，确保返回的 Work 带新字段。
- `src/lib/services/material-integrity-cooperation.test.ts`
  - 覆盖企业题目材料 hash、Race challenge sourceRef/digest。
- `src/lib/services/material-integrity-submissions.test.ts`
  - 覆盖代码材料 hash 与 submitterBinding。
- `src/lib/services/material-integrity-work.test.ts`
  - 覆盖 Work 的 `sourceRefJson / contentHash`。
- `docs/superpowers/status.md`
  - 回写哪些材料对象已补 hash / sourceRef，哪些仍留给 `P1-B`。

---

### Task 1: Add Pure Material Integrity Helper Tests

**Files:**
- Create: `src/lib/material-integrity-helpers.ts`
- Create: `src/lib/material-integrity-helpers.test.ts`
- Test: `src/lib/material-integrity-helpers.test.ts`

✅ **Step 1: Write the failing helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChallengeMaterialSourceRef,
  buildFileBufferDigest,
  buildSubmissionBindingJson,
  buildWorkSourceRef,
} from "./material-integrity-helpers";

test("buildFileBufferDigest returns a stable sha256 digest", () => {
  const digest = buildFileBufferDigest(Buffer.from("hello world", "utf8"));

  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(digest, buildFileBufferDigest(Buffer.from("hello world", "utf8")));
});

test("buildChallengeMaterialSourceRef captures task package and proposal hashes", () => {
  const ref = buildChallengeMaterialSourceRef({
    proposal: {
      fileHash: "proposal_hash",
      fileName: "brief.pdf",
      filePath: "/uploads/cooperation/proposals/brief.pdf",
    },
    taskPackage: {
      fileHash: "task_hash",
      fileName: "task.zip",
      filePath: "/uploads/cooperation/taskpackages/task.zip",
    },
  });

  assert.equal(ref.taskPackage?.fileHash, "task_hash");
  assert.equal(ref.proposal?.fileHash, "proposal_hash");
});

test("buildWorkSourceRef tracks current public asset references", () => {
  const ref = buildWorkSourceRef({
    demoUrl: "https://demo.example/work-1",
    repoUrl: "https://github.com/demo/work-1",
    techNotes: "notes",
    videoUrl: "https://video.example/work-1",
  });

  assert.deepEqual(ref, {
    demoUrl: "https://demo.example/work-1",
    repoUrl: "https://github.com/demo/work-1",
    techNotesIncluded: true,
    videoUrl: "https://video.example/work-1",
  });
});

test("buildSubmissionBindingJson ties material to race, registration, and user", () => {
  const binding = buildSubmissionBindingJson({
    raceId: "race_1",
    registrationId: "reg_1",
    submittedAt: new Date("2026-07-10T10:00:00.000Z"),
    userId: "user_1",
  });

  assert.equal(
    binding,
    JSON.stringify({
      raceId: "race_1",
      registrationId: "reg_1",
      submittedAt: "2026-07-10T10:00:00.000Z",
      userId: "user_1",
    }),
  );
});
```

✅ **Step 2: Run the focused helper test and confirm failure**

Run: `node --import tsx --test src/lib/material-integrity-helpers.test.ts`

Expected: FAIL with missing module / function errors.

✅ **Step 3: Implement the helper module**

```ts
import { createHash } from "node:crypto";

export function buildFileBufferDigest(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function buildChallengeMaterialSourceRef(input: {
  proposal?: {
    fileHash: string;
    fileName: string;
    filePath: string;
  } | null;
  taskPackage?: {
    fileHash: string;
    fileName: string;
    filePath: string;
  } | null;
}) {
  return {
    proposal: input.proposal ?? null,
    taskPackage: input.taskPackage ?? null,
  };
}

export function buildWorkSourceRef(input: {
  demoUrl: string;
  repoUrl: string;
  techNotes: string;
  videoUrl: string;
}) {
  return {
    demoUrl: input.demoUrl,
    repoUrl: input.repoUrl,
    techNotesIncluded: input.techNotes.trim().length > 0,
    videoUrl: input.videoUrl,
  };
}

export function buildSubmissionBindingJson(input: {
  raceId: string;
  registrationId: string;
  submittedAt: Date;
  userId: string;
}) {
  return JSON.stringify({
    raceId: input.raceId,
    registrationId: input.registrationId,
    submittedAt: input.submittedAt.toISOString(),
    userId: input.userId,
  });
}
```

✅ **Step 4: Re-run the helper test**

Run: `node --import tsx --test src/lib/material-integrity-helpers.test.ts`

Expected: PASS

✅ **Step 5: Commit**

```bash
git add src/lib/material-integrity-helpers.ts src/lib/material-integrity-helpers.test.ts
git commit -m "test: add p1a material integrity helpers"
```

---

### Task 2: Extend Prisma Schema for Material Integrity Fields

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `src/generated/prisma/*`
- Test: Prisma generate / migrate

✅ **Step 1: Add failing expectations in later tests for the new fields**

Target future assertions:

```ts
assert.match(request.taskPackageFileHash, /^[a-f0-9]{64}$/);
assert.match(race.challengeContentHash, /^[a-f0-9]{64}$/);
assert.match(work.contentHash, /^[a-f0-9]{64}$/);
assert.match(submission.codeContentHash, /^[a-f0-9]{64}$/);
assert.match(artifact.ridingRecordHash, /^[a-f0-9]{64}$/);
assert.match(archive.submitterBindingJson, /registrationId/);
```

✅ **Step 2: Add schema fields**

```prisma
model Race {
  challengeSourceRefJson String @default("{}")
  challengeContentHash   String @default("")
}

model Work {
  sourceRefJson String @default("{}")
  contentHash   String @default("")
}

model Submission {
  codeContentHash     String @default("")
  ridingRecordHash    String @default("")
  submitterBindingJson String @default("{}")
}

model SubmissionArtifact {
  codeContentHash     String @default("")
  ridingRecordHash    String @default("")
  submitterBindingJson String @default("{}")
}

model TeamArchive {
  codeContentHash     String @default("")
  ridingRecordHash    String @default("")
  submitterBindingJson String @default("{}")
}

model CooperationRequest {
  taskPackageFileHash String @default("")
  proposalFileHash    String @default("")
}
```

✅ **Step 3: Generate Prisma client**

Run: `npm run db:generate`

Expected: PASS

✅ **Step 4: Create and apply migration**

Run: `npx prisma migrate dev --name grs004_p1a_material_integrity`

Expected: PASS and local SQLite schema updated.

✅ **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/generated/prisma
git commit -m "feat: extend schema for p1a material integrity"
```

---

### Task 3: Persist Hashes for Cooperation Uploads and Race Challenge Materials

**Files:**
- Modify: `src/lib/services/cooperation.ts`
- Create: `src/lib/services/material-integrity-cooperation.test.ts`
- Test: `src/lib/services/material-integrity-cooperation.test.ts`

✅ **Step 1: Write the failing cooperation material test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  approveCooperationRequest,
  submitCooperationRequest,
} from "@/lib/services/cooperation";

test("submitCooperationRequest stores task package and proposal hashes", async () => {
  const request = await submitCooperationRequest({
    companyName: `Company ${randomUUID()}`,
    contactEmail: "hash@example.com",
    contactName: "Hash Owner",
    contactPhone: "",
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    enableFreeze: false,
    evaluationNotes: "notes",
    freezeMinutesBeforeEnd: 0,
    hasTrainingData: true,
    keywordsText: "hash,package",
    maxTeamSize: 5,
    notes: "",
    proposalFile: new File(["proposal-content"], "proposal.txt"),
    raceEnd: "2026-08-10T10:00:00.000Z",
    raceStart: "2026-08-09T10:00:00.000Z",
    raceSummary: "summary",
    raceTitle: `Race ${randomUUID()}`,
    signupEnd: "2026-08-08T10:00:00.000Z",
    signupStart: "2026-08-07T10:00:00.000Z",
    submissionIntervalHours: 24,
    taskDescription: "desc",
    taskPackageFile: new File(["task-content"], "task.zip"),
    tokenLimit: 4000,
    trainingDataSummary: "training",
  });

  assert.match(request.taskPackageFileHash, /^[a-f0-9]{64}$/);
  assert.match(request.proposalFileHash, /^[a-f0-9]{64}$/);
});

test("approveCooperationRequest carries challenge sourceRef and digest into Race", async () => {
  const admin = await prisma.user.findFirstOrThrow({
    where: { username: "admin_demo" },
  });

  const request = await submitCooperationRequest({
    companyName: `Company ${randomUUID()}`,
    contactEmail: "race@example.com",
    contactName: "Race Owner",
    contactPhone: "",
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    enableFreeze: false,
    evaluationNotes: "notes",
    freezeMinutesBeforeEnd: 0,
    hasTrainingData: true,
    keywordsText: "hash,package",
    maxTeamSize: 5,
    notes: "",
    proposalFile: new File(["proposal-content"], "proposal.txt"),
    raceEnd: "2026-08-10T10:00:00.000Z",
    raceStart: "2026-08-09T10:00:00.000Z",
    raceSummary: "summary",
    raceTitle: `Race ${randomUUID()}`,
    signupEnd: "2026-08-08T10:00:00.000Z",
    signupStart: "2026-08-07T10:00:00.000Z",
    submissionIntervalHours: 24,
    taskDescription: "desc",
    taskPackageFile: new File(["task-content"], "task.zip"),
    tokenLimit: 4000,
    trainingDataSummary: "training",
  });

  const race = await approveCooperationRequest(request.id, admin.id);

  assert.match(race.challengeContentHash, /^[a-f0-9]{64}$/);
  assert.match(race.challengeSourceRefJson, /taskPackage/);
  assert.match(race.challengeSourceRefJson, /proposal/);
});
```

✅ **Step 2: Run the focused test and confirm failure**

Run: `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`

Expected: FAIL because `taskPackageFileHash / proposalFileHash / challengeContentHash` do not exist yet.

✅ **Step 3: Hash upload buffers when saving files**

```ts
async function saveFile(file: File, subDir: string): Promise<{
  fileHash: string;
  name: string;
  path: string;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileHash = buildFileBufferDigest(buffer);
  // existing write logic...
  return { fileHash, name: file.name, path: `/uploads/${subDir}/${safeName}` };
}
```

✅ **Step 4: Persist request hashes and carry challenge material refs into Race**

```ts
const challengeSourceRef = buildChallengeMaterialSourceRef({
  proposal: proposalFilePath
    ? {
        fileHash: proposalFileHash,
        fileName: proposalFileName,
        filePath: proposalFilePath,
      }
    : null,
  taskPackage: taskPackageFilePath
    ? {
        fileHash: taskPackageFileHash,
        fileName: taskPackageFileName,
        filePath: taskPackageFilePath,
      }
    : null,
});

const challengeContentHash = buildPayloadDigest(challengeSourceRef);

const race = await tx.race.create({
  data: {
    challengeContentHash,
    challengeSourceRefJson: JSON.stringify(challengeSourceRef),
  },
});
```

✅ **Step 5: Re-run the focused test**

Run: `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`

Expected: PASS

✅ **Step 6: Commit**

```bash
git add src/lib/services/cooperation.ts src/lib/services/material-integrity-cooperation.test.ts
git commit -m "feat: persist p1a cooperation material hashes"
```

---

### Task 4: Persist Hashes for Rider Code Materials and Archives

**Files:**
- Modify: `src/lib/services/submissions.ts`
- Create: `src/lib/services/material-integrity-submissions.test.ts`
- Test: `src/lib/services/material-integrity-submissions.test.ts`

✅ **Step 1: Write the failing submission material test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import {
  createFinalSubmission,
  createSubmission,
} from "@/lib/services/submissions";

function buildSubmissionFormData(raceId: string) {
  const fd = new FormData();
  fd.set("raceId", raceId);
  fd.set("codeLabel", "solution.ts");
  fd.set("codeContent", "export const solve = () => 1;");
  fd.set("tokenUsed", "100");
  fd.set("agentType", "CLAUDE");
  return fd;
}

function buildFinalSubmissionFormData(raceId: string) {
  const fd = buildSubmissionFormData(raceId);
  fd.set("recordLabel", "riding-record.txt");
  fd.set("ridingRecord", "Investigated constraints and wrote final summary.");
  return fd;
}

test("createSubmission stores code hash and submitter binding on submission and artifact", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });

  const submission = await createSubmission(rider.id, buildSubmissionFormData("race_active"));
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });

  assert.match(stored.codeContentHash, /^[a-f0-9]{64}$/);
  assert.equal(stored.ridingRecordHash.length > 0, true);
  assert.match(stored.submitterBindingJson, /registrationId/);
  assert.ok(stored.artifact);
  assert.match(stored.artifact!.codeContentHash, /^[a-f0-9]{64}$/);
});

test("createFinalSubmission stores riding record hash for post-race materials", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });

  const submission = await createFinalSubmission(
    rider.id,
    buildFinalSubmissionFormData("race_finished"),
  );
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });

  assert.match(stored.ridingRecordHash, /^[a-f0-9]{64}$/);
  assert.ok(stored.artifact);
  assert.match(stored.artifact!.ridingRecordHash, /^[a-f0-9]{64}$/);
});
```

✅ **Step 2: Run the focused test and confirm failure**

Run: `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`

Expected: FAIL because `codeContentHash / ridingRecordHash / submitterBindingJson` do not exist yet.

✅ **Step 3: Add a helper-backed integrity payload for `Submission` and `SubmissionArtifact`**

```ts
const submittedAt = new Date();
const submitterBindingJson = buildSubmissionBindingJson({
  raceId: parsed.raceId,
  registrationId,
  submittedAt,
  userId: riderId,
});
const codeContentHash = buildPayloadDigest(parsed.codeContent);
const ridingRecordHash = buildPayloadDigest(parsed.ridingRecord ?? "");
```

✅ **Step 4: Persist the new fields in `createSubmission()` and `createFinalSubmission()`**

```ts
const submission = await tx.submission.create({
  data: {
    codeContentHash,
    ridingRecordHash,
    submitterBindingJson,
  },
});

const artifact = await tx.submissionArtifact.create({
  data: {
    codeContentHash,
    ridingRecordHash,
    submitterBindingJson,
  },
});
```

✅ **Step 5: Re-run the focused submission material test**

Run: `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`

Expected: PASS

✅ **Step 6: Commit**

```bash
git add src/lib/services/submissions.ts src/lib/services/material-integrity-submissions.test.ts
git commit -m "feat: persist p1a submission material hashes"
```

---

### Task 5: Persist Work Source References and Hashes

**Files:**
- Modify: `prisma/seed.ts`
- Create: `src/lib/services/material-integrity-work.test.ts`
- Modify: any helper used to build seeded `Work` rows if needed
- Test: `src/lib/services/material-integrity-work.test.ts`

✅ **Step 1: Write the failing work material test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";

test("seeded Work rows carry sourceRefJson and contentHash", async () => {
  const work = await prisma.work.findFirstOrThrow({
    where: {
      repoUrl: {
        contains: "github.com/demo/",
      },
    },
  });

  assert.match(work.sourceRefJson, /repoUrl/);
  assert.match(work.sourceRefJson, /demoUrl/);
  assert.match(work.contentHash, /^[a-f0-9]{64}$/);
});
```

✅ **Step 2: Run the focused work test and confirm failure**

Run: `node --import tsx --test src/lib/services/material-integrity-work.test.ts`

Expected: FAIL because `Work` does not yet populate `sourceRefJson / contentHash`.

✅ **Step 3: Compute `sourceRefJson` and `contentHash` when building seeded Work rows**

```ts
const workSourceRef = buildWorkSourceRef({
  demoUrl,
  repoUrl,
  techNotes,
  videoUrl,
});

return {
  // existing fields...
  sourceRefJson: JSON.stringify(workSourceRef),
  contentHash: buildPayloadDigest({
    demoUrl,
    repoUrl,
    summary,
    techNotes,
    title,
    videoUrl,
  }),
};
```

✅ **Step 4: Re-run the seed flow before re-testing**

Run: `npm run db:seed`

Expected: PASS and new Work rows include integrity fields.

✅ **Step 5: Re-run the focused work test**

Run: `node --import tsx --test src/lib/services/material-integrity-work.test.ts`

Expected: PASS

✅ **Step 6: Commit**

```bash
git add prisma/seed.ts src/lib/services/material-integrity-work.test.ts
git commit -m "feat: seed work source refs for p1a"
```

---

### Task 6: Propagate Hashes into TeamArchive and Sync Documentation

**Files:**
- Modify: `src/lib/services/submissions.ts`
- Modify: `prisma/seed.ts`
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`

✅ **Step 1: Ensure archive rows also carry integrity fields**

```ts
await tx.teamArchive.create({
  data: {
    codeContentHash,
    ridingRecordHash,
    submitterBindingJson,
  },
});
```

✅ **Step 2: Update the spec with implementation notes discovered during execution**

```md
## Implementation Notes

- `Work` 目前主要通过 seed / helper 进入数据库，本轮先在这些创建点补 `sourceRefJson / contentHash`。
- `Award / JudgingRecord / Report` 的材料版本冻结仍留给 `P1-B`。
```

✅ **Step 3: Update `status.md` with closed gaps and remaining gaps**

```md
- `CooperationRequest` 已补 `taskPackageFileHash / proposalFileHash`。
- `Race` 已补 `challengeSourceRefJson / challengeContentHash`。
- `Work` 已补 `sourceRefJson / contentHash`。
- `Submission / SubmissionArtifact / TeamArchive` 已补 `codeContentHash / ridingRecordHash / submitterBindingJson`。
- `Award / JudgingRecord / Report` 的结果冻结仍未开始，继续留在 `P1-B`。
```

✅ **Step 4: Commit**

```bash
git add src/lib/services/submissions.ts prisma/seed.ts docs/superpowers/status.md docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md
git commit -m "docs: record p1a material integrity status"
```

---

### Task 7: Verify the Slice

**Files:**
- Test only

✅ **Step 1: Run the focused material-integrity tests**

Run: `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts src/lib/services/material-integrity-work.test.ts`

Expected: PASS

✅ **Step 2: Regenerate Prisma client**

Run: `npm run db:generate`

Expected: PASS

✅ **Step 3: Re-run seed**

Run: `npm run db:seed`

Expected: PASS

✅ **Step 4: Run full build**

Run: `npm run build`

Expected: PASS

✅ **Step 5: Commit the verified slice**

```bash
git add .
git commit -m "feat: complete grs004 p1a material integrity foundation"
```
