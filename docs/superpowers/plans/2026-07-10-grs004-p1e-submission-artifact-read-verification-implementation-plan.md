# GRS004 / P1-E 提交代码材料读取校验 + 审计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `pullRunnerTask()` 前校验 `SubmissionArtifact` 的代码 hash、记录 hash 和 submitter binding，并把结果写入 `SecurityAudit`。  
**Architecture:** 保持提交写入逻辑不变；只在 Runner 读取入口增加 artifact integrity verification；失败时阻断任务继续交给 Runner。  
**Tech Stack:** TypeScript service verification, Prisma transaction updates, node:test + tsx, focused runner-material integrity verification + production build

---

## 文件结构

- Modify: `src/lib/material-integrity-helpers.ts`
  - 增加 submitter binding 解析 / artifact 完整性 helper
- Modify: `src/lib/services/runner.ts`
  - 在 `pullRunnerTask()` 中接入 artifact 读校验和审计
- Modify: `src/lib/services/material-integrity-submissions.test.ts`
  - 先写失败测试，再验证 tamper / binding mismatch / success
- Modify: `docs/superpowers/status.md`
  - 记录 `P1-E` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1e-submission-artifact-read-verification-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力和测试命令

### Task 1: Add Failing Runner Read-Verification Coverage

**Files:**
- Modify: `src/lib/services/material-integrity-submissions.test.ts`

- [ ] **Step 1: Add failing tamper tests**

Cover:

- tampered `codeContent` causes `pullRunnerTask()` to reject delivery
- tampered `submitterBindingJson` causes `pullRunnerTask()` to reject delivery
- failure path writes `SecurityAudit`

- [ ] **Step 2: Run focused submission integrity test and confirm failure**

Run:

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Artifact Read Verification

**Files:**
- Modify: `src/lib/material-integrity-helpers.ts`
- Modify: `src/lib/services/runner.ts`

- [ ] **Step 1: Add helper utilities**

Add helpers for:

- parsing `submitterBindingJson`
- verifying code hash
- verifying riding record hash
- verifying binding against `raceId / registrationId / userId`

- [ ] **Step 2: Enforce verification inside `pullRunnerTask()`**

When artifact verification fails:

- do not return the runner payload
- mark the task failed
- mark `SUBMISSION_TEST` submission failed
- write `SecurityAudit(action=submission_artifact.verify)`

- [ ] **Step 3: Write success audit on accepted verification**

Use:

- `result = accepted`
- `targetType = SubmissionArtifact`

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
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1e-submission-artifact-read-verification-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P1-E` design and implementation
- runner now re-verifies submission artifacts before delivery
- failure path audits and blocks Runner consumption

- [ ] **Step 2: Update the P1-E design doc**

Append:

- exact landed helper and runner behavior
- fresh verification commands

- [ ] **Step 3: Add a new recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
