# GRS004 / P1-D 合作办赛材料读取校验 + 审计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `approveCooperationRequest()` 中对已上传的合作办赛材料做读取前 hash 校验，并把结果写入 `SecurityAudit`。  
**Architecture:** 保持上传逻辑不变；在审批前增加本地文件读取、hash 比对和最小审计；失败时拒绝创建 Race。  
**Tech Stack:** TypeScript service logic, Node filesystem reads, Prisma transaction + audit helper, node:test + tsx, focused service verification + production build

---

## 文件结构

- Modify: `src/lib/material-integrity-helpers.ts`
  - 增加 upload path 解析 / 文件 hash 校验 helper
- Modify: `src/lib/services/cooperation.ts`
  - 在审批前执行材料读取校验，并写 `SecurityAudit`
- Modify: `src/lib/services/material-integrity-cooperation.test.ts`
  - 先写失败测试，再验证 tamper / missing / accepted
- Modify: `docs/superpowers/status.md`
  - 记录 `P1-D` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1d-cooperation-material-read-verification-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力和测试命令

### Task 1: Add Failing Cooperation Integrity Coverage

**Files:**
- Modify: `src/lib/services/material-integrity-cooperation.test.ts`

- [ ] **Step 1: Add failing tamper and missing-file tests**

Cover:

- approve rejects when task package file content no longer matches stored hash
- approve rejects when proposal file is missing
- rejected path writes `SecurityAudit`

- [ ] **Step 2: Run focused cooperation integrity test and confirm failure**

Run:

- `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Read Verification and Audit

**Files:**
- Modify: `src/lib/material-integrity-helpers.ts`
- Modify: `src/lib/services/cooperation.ts`

- [ ] **Step 1: Add helper utilities**

Add helpers for:

- resolving `/uploads/...` public path to safe absolute path
- re-reading file
- recomputing digest
- returning verification result

- [ ] **Step 2: Enforce verification in `approveCooperationRequest()`**

Before creating race:

- verify proposal file if recorded
- verify task package file if recorded
- reject on missing or hash mismatch

- [ ] **Step 3: Write `SecurityAudit`**

Use:

- `action = cooperation_request.materials_verify`
- accepted on success
- rejected on mismatch / missing / invalid path

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/services/material-integrity-cooperation.test.ts`

- [ ] **Step 1: Run focused service verification**

Run:

- `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 4: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1d-cooperation-material-read-verification-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P1-D` design and implementation
- approval path now re-verifies stored materials
- failure path now audits and blocks Race creation

- [ ] **Step 2: Update the P1-D design doc**

Append:

- exact landed helper and service behavior
- fresh verification commands

- [ ] **Step 3: Add a new recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
