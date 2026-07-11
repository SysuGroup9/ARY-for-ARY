# GRS004 / P1-H 合作办赛材料写入审计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `submitCooperationRequest()` 成功保存合作办赛材料后写统一审计，记录当前上传事实。  
**Architecture:** 保持当前文件保存与 request create 流程不变；只在成功创建 `CooperationRequest` 后写 `SecurityAudit`。  
**Tech Stack:** TypeScript service audit logging, Prisma create + security audit, node:test + tsx, focused cooperation-material integrity verification + production build

---

## 文件结构

- Modify: `src/lib/services/cooperation.ts`
  - 在 `submitCooperationRequest()` 成功创建 request 后写入 `SecurityAudit`
- Modify: `src/lib/services/material-integrity-cooperation.test.ts`
  - 补写路径审计覆盖
- Modify: `docs/superpowers/status.md`
  - 记录 `P1-H` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1h-cooperation-material-write-audit-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力与测试命令

### Task 1: Add Failing Cooperation Write-Audit Coverage

**Files:**
- Modify: `src/lib/services/material-integrity-cooperation.test.ts`

- [ ] **Step 1: Add failing create-audit test**

Cover:

- `submitCooperationRequest()` 成功后会写：
  - `action = cooperation_request.materials_create`
- details 含：
  - `taskPackageFileHash`
  - `proposalFileHash`
  - `taskPackageFilePath`
  - `proposalFilePath`

- [ ] **Step 2: Run focused test and confirm failure**

Run:

- `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Cooperation Material Write Audit

**Files:**
- Modify: `src/lib/services/cooperation.ts`

- [ ] **Step 1: Write audit after request create**

Add:

- `SecurityAudit(action=cooperation_request.materials_create)`
- `targetType = CooperationRequest`
- material hash/path details

- [ ] **Step 2: Keep current read verification unchanged**

Do not change:

- `approveCooperationRequest()` verification rules
- upload storage layout

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/services/material-integrity-cooperation.test.ts`

- [ ] **Step 1: Run focused verification**

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
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p1h-cooperation-material-write-audit-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P1-H` design and implementation
- upload write path now writes unified audit

- [ ] **Step 2: Update the P1-H design doc**

Append:

- exact landed action/details
- fresh verification commands

- [ ] **Step 3: Add a new recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
