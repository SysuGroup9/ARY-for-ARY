# GRS004 / P1-G 提交代码材料展示/投影读取校验 + 审计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `completeRunnerTask()` 的成功投影前再次校验 `SubmissionArtifact`，阻断被篡改 artifact 继续进入 `TeamArchive` 与 `RidingHighlight`。  
**Architecture:** 复用现有 `verifySubmissionArtifactIntegrity()`；在 Runner complete 成功路径前增加第二道校验与审计；失败时仅阻断当前任务继续投影。  
**Tech Stack:** TypeScript service verification, Prisma transaction updates, node:test + tsx, focused runner-material integrity verification + production build

---

## 文件结构

- Modify: `src/lib/services/runner.ts`
  - 在 `completeRunnerTask()` 成功投影前接入 artifact integrity verification
- Modify: `src/lib/services/material-integrity-submissions.test.ts`
  - 补 `progress eval` / `harness eval` complete 阶段 tamper 覆盖
- Modify: `docs/superpowers/status.md`
  - 记录 `P1-G` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1g-submission-artifact-showcase-verification-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力与测试命令

### Task 1: Add Failing Complete-Stage Verification Coverage

**Files:**
- Modify: `src/lib/services/material-integrity-submissions.test.ts`

- [ ] **Step 1: Add failing progress-eval tamper test**

Cover:

- artifact 在 `pullRunnerTask()` 后、`completeRunnerTask()` 前被篡改
- `completeRunnerTask()` 不再把内容写入 `TeamArchive`
- 任务失败并写 `submission_artifact.verify`

- [ ] **Step 2: Add failing harness-eval tamper test**

Cover:

- artifact 在 `pullRunnerTask()` 后、`completeRunnerTask()` 前被篡改
- `completeRunnerTask()` 不再生成新的 `RidingHighlight`
- 任务失败并写 `submission_artifact.verify`

- [ ] **Step 3: Run focused test and confirm failure**

Run:

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Complete-Stage Verification

**Files:**
- Modify: `src/lib/services/runner.ts`

- [ ] **Step 1: Reuse artifact integrity helper in `completeRunnerTask()`**

Add:

- registration-aware verification before success projection
- shared failure handling for `runner_complete`

- [ ] **Step 2: Block downstream projection on verification failure**

When verification fails:

- mark current `RunnerTask` failed
- do not continue to `Submission / TeamArchive / Leaderboard / HarnessEntry / RidingHighlight`
- write `SecurityAudit(action=submission_artifact.verify)`

- [ ] **Step 3: Write success audit for complete stage**

Use:

- `result = accepted`
- `verificationStage = runner_complete`

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
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1g-submission-artifact-showcase-verification-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P1-G` design and implementation
- Runner complete 阶段会重新校验 artifact
- failure path blocks `TeamArchive / RidingHighlight`

- [ ] **Step 2: Update the P1-G design doc**

Append:

- exact landed runner behavior
- fresh verification commands

- [ ] **Step 3: Add a new recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
