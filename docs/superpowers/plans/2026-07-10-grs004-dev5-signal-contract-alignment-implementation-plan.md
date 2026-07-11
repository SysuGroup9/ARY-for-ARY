# GRS004 / DEV-5 CA Signal Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 `ary-ca-integration-spec.md` 扩容 CA push signal 契约，让 `signal.type`、`race.taskId`、`noteReason`、`technicalActions` 与当前 spec 对齐。  
**Architecture:** 只改 push schema、runtime helper union 和相关测试；不新增 domain 表，不改 Projection 粒度。  
**Tech Stack:** TypeScript zod schema alignment, runtime helper updates, node:test + tsx, focused CA contract verification + production build

---

## 文件结构

- Modify: `src/lib/services/ca-ingestion.ts`
  - 扩容 push schema
- Modify: `src/lib/ca-runtime-helpers.ts`
  - 扩容 `RidingSignalInput.type` 与 active 语义
- Modify: `src/lib/ca-runtime-helpers.test.ts`
  - 补 helper 覆盖
- Modify: `src/lib/services/ca-signature-verification.test.ts`
  - 补 schema + signature 覆盖
- Modify: `docs/superpowers/status.md`
  - 记录本轮设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-dev5-signal-contract-alignment-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力

### Task 1: Add Failing Contract-Alignment Coverage

**Files:**
- Modify: `src/lib/ca-runtime-helpers.test.ts`
- Modify: `src/lib/services/ca-signature-verification.test.ts`

- [ ] **Step 1: Add failing signal-type expansion coverage**

Cover:

- `milestone_reached` / `validation_run` 之类的新 signal.type 能进入 helper 与 runtime

- [ ] **Step 2: Add failing required-field coverage**

Cover:

- 缺少 `race.taskId` 会被 schema 拒绝

- [ ] **Step 3: Add failing payload-retention coverage**

Cover:

- `signal.noteReason`
- `technicalActions`
  不再被静默丢弃

- [ ] **Step 4: Run focused tests and confirm failure**

Run:

- `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Contract Alignment

**Files:**
- Modify: `src/lib/services/ca-ingestion.ts`
- Modify: `src/lib/ca-runtime-helpers.ts`

- [ ] **Step 1: Expand signal schema**

Add:

- full `signal.type` candidate set
- required `race.taskId`
- optional `signal.noteReason`
- optional `technicalActions`

- [ ] **Step 2: Expand runtime helper support**

Ensure:

- new signal types can keep / move connection to `ACTIVE`
- `session_started / session_completed` existing semantics stay stable

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/ca-runtime-helpers.test.ts`
- Test: `src/lib/services/ca-signature-verification.test.ts`

- [ ] **Step 1: Run focused verification**

Run:

- `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 4: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-dev5-signal-contract-alignment-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- signal contract alignment landed
- required / optional field changes

- [ ] **Step 2: Update design doc**

Append:

- exact landed schema/helper behavior
- fresh verification commands

- [ ] **Step 3: Add recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
