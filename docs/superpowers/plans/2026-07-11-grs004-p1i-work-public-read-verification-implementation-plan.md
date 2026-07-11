# GRS004 / P1-I Work 公开读取校验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在公开读取服务层校验 `Work.contentHash / sourceRefJson`，阻断被篡改 Work 继续进入公开详情、公开列表和公开赛果链路。  
**Architecture:** 复用现有 `contentHash / sourceRefJson`，新增 `verifyWorkIntegrity()`，在公开服务层把无效 work 过滤掉或返回 `null`。  
**Tech Stack:** TypeScript service verification, existing Prisma read-model shaping, node:test + tsx, focused public-route/results verification + production build

---

## 文件结构

- Modify: `src/lib/material-integrity-helpers.ts`
  - 增加 `verifyWorkIntegrity()`
- Modify: `src/lib/material-integrity-helpers.test.ts`
  - 增加 work integrity helper 覆盖
- Modify: `src/lib/services/races.ts`
  - 在公开 read model 里过滤无效 `registration.work / awards[].work`
- Modify: `src/lib/services/works.ts`
  - 公开 work slug 读取前校验
- Modify: `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 里的 work 直查结果过滤
- Modify: `src/lib/services/awards.ts`
  - 公开赛果 work 读取过滤
- Modify: `src/lib/services/public-routes.test.ts`
  - 增加篡改后详情页返回 null / rider link 过滤
- Modify: `src/lib/services/results.test.ts`
  - 增加篡改后赛果 work link 不再存在
- Modify: `docs/superpowers/status.md`
  - 记录本轮设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-11-grs004-p1i-work-public-read-verification-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力

### Task 1: Add Failing Work Read-Verification Coverage

**Files:**
- Modify: `src/lib/material-integrity-helpers.test.ts`
- Modify: `src/lib/services/public-routes.test.ts`
- Modify: `src/lib/services/results.test.ts`

- [ ] **Step 1: Add helper coverage**

Cover:

- 正常 work 通过
- 篡改字段后失败

- [ ] **Step 2: Add public route coverage**

Cover:

- 篡改后的 work 不再能通过 `getWorkBySlug()`

- [ ] **Step 3: Add results coverage**

Cover:

- 篡改后的 award.work 不再生成公开 slug

- [ ] **Step 4: Run focused tests and confirm failure**

Run:

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Public Work Read Verification

**Files:**
- Modify: `src/lib/material-integrity-helpers.ts`
- Modify: `src/lib/services/races.ts`
- Modify: `src/lib/services/works.ts`
- Modify: `src/lib/services/public-routes.ts`
- Modify: `src/lib/services/awards.ts`

- [ ] **Step 1: Add `verifyWorkIntegrity()`**

Check:

- content hash
- source ref consistency

- [ ] **Step 2: Apply verification in public read paths**

Ensure:

- invalid work returns `null`
- list/read models no longer surface invalid work publicly

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/material-integrity-helpers.test.ts`
- Test: `src/lib/services/public-routes.test.ts`
- Test: `src/lib/services/results.test.ts`

- [ ] **Step 1: Run focused verification**

Run:

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 4: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-11-grs004-p1i-work-public-read-verification-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- Work public read verification landed
- invalid work now filtered from public paths

- [ ] **Step 2: Update design doc**

Append:

- exact landed helper/service behavior
- fresh verification commands

- [ ] **Step 3: Add recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
