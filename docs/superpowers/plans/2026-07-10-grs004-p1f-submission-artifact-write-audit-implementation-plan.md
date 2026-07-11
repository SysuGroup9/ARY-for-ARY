# GRS004 / P1-F 提交代码材料写入审计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `createSubmission()` / `createFinalSubmission()` 写入 `SubmissionArtifact` 时补上统一 `SecurityAudit`。  
**Architecture:** 保持提交流程与 schema 不变；仅在 artifact create 成功后写入单条 `submission_artifact.create` 审计。  
**Tech Stack:** TypeScript service-layer audit write, Prisma transaction, node:test + tsx, focused submissions integrity verification + production build

---

## 文件结构

- Modify: `src/lib/services/submissions.ts`
  - 在 artifact create 成功后写 `SecurityAudit`
- Modify: `src/lib/services/material-integrity-submissions.test.ts`
  - 先写失败测试，再验证 active / final submission audit
- Modify: `docs/superpowers/status.md`
  - 记录 `P1-F` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1f-submission-artifact-write-audit-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力和测试命令

### Task 1: Add Failing Audit Coverage

**Files:**
- Modify: `src/lib/services/material-integrity-submissions.test.ts`

- [ ] **Step 1: Add failing write-audit tests**

Cover:

- `createSubmission()` writes `submission_artifact.create`
- `createFinalSubmission()` writes `submission_artifact.create`
- details include:
  - `submissionPhase`
  - `codeContentHash`
  - `ridingRecordHash`
  - `submitterBindingJson`

- [ ] **Step 2: Run focused test and confirm failure**

Run:

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Submission Artifact Write Audit

**Files:**
- Modify: `src/lib/services/submissions.ts`

- [ ] **Step 1: Add artifact create audit for active submissions**

Write:

- `action = submission_artifact.create`
- `submissionPhase = active`

- [ ] **Step 2: Add artifact create audit for final submissions**

Write:

- `action = submission_artifact.create`
- `submissionPhase = final`

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/services/material-integrity-submissions.test.ts`

- [ ] **Step 1: Run focused verification**

Run:

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 4: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1f-submission-artifact-write-audit-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P1-F` design and implementation
- sanctioned submission writes now audit `SubmissionArtifact`

- [ ] **Step 2: Update the P1-F design doc**

Append:

- exact landed audit behavior
- fresh verification commands

- [ ] **Step 3: Add a new recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
