# GRS004 / DEV-5 CA Snapshot Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 `ary-ca-integration-spec.md` 对齐 snapshot fetch 契约字段：补 `ca.caType`、`task.taskId`，并用 `session.tokens` 取代外部 `tokenCost` 口径。  
**Architecture:** 只改 snapshot schema、snapshot patch helper 和相关测试；内部 Session 模型继续使用 `tokenCost`。  
**Tech Stack:** TypeScript zod schema alignment, runtime snapshot patch mapping, node:test + tsx, focused CA fetch/signature verification + production build

---

## 文件结构

- Modify: `src/lib/services/ca-fetch.ts`
  - 对齐 snapshot schema 字段
- Modify: `src/lib/ca-runtime-helpers.ts`
  - 用 `tokens -> tokenCost` 映射
- Modify: `src/lib/ca-runtime-helpers.test.ts`
  - 补 snapshot patch 对齐覆盖
- Modify: `src/lib/services/ca-fetch-integrity.test.ts`
  - 补 spec 对齐后的 snapshot payload
- Modify: `src/lib/services/ca-signature-verification.test.ts`
  - 补 signed snapshot 对齐后的字段
- Modify: `docs/superpowers/status.md`
  - 记录本轮设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-dev5-snapshot-contract-alignment-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力

### Task 1: Add Failing Snapshot Contract Coverage

**Files:**
- Modify: `src/lib/ca-runtime-helpers.test.ts`
- Modify: `src/lib/services/ca-fetch-integrity.test.ts`
- Modify: `src/lib/services/ca-signature-verification.test.ts`

- [ ] **Step 1: Add failing snapshot-field coverage**

Cover:

- `session.tokens` 映射到 `tokenCost`
- `ca.caType`
- `task.taskId`

- [ ] **Step 2: Add failing required-field coverage**

Cover:

- 缺少 `task.taskId` 的 snapshot 会被拒绝

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

- `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-signature-verification.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Snapshot Contract Alignment

**Files:**
- Modify: `src/lib/services/ca-fetch.ts`
- Modify: `src/lib/ca-runtime-helpers.ts`

- [ ] **Step 1: Align snapshot schema**

Add / change:

- `ca.caType`
- `task.taskId`
- `session.tokens`

- [ ] **Step 2: Keep internal mapping stable**

Map:

- `session.tokens` -> `tokenCost`

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/ca-runtime-helpers.test.ts`
- Test: `src/lib/services/ca-fetch-integrity.test.ts`
- Test: `src/lib/services/ca-signature-verification.test.ts`

- [ ] **Step 1: Run focused verification**

Run:

- `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-signature-verification.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 4: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-dev5-snapshot-contract-alignment-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- snapshot contract alignment landed
- field mapping and required-field changes

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
