# GRS004 / P2-D Connector Audit Overview 可视化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`✅`) syntax for tracking.

**Goal:** 在 `Organizer Console / ca-status` 中新增最小 `Connector Audit Overview`，让 organizer 能直接看到当前 registration 相关的 recent `SecurityAudit` 摘要与事件列表。  
**Architecture:** 保持当前认证与 projection 结构不变；只在 race 读模型追加 `SecurityAudit` 读取，并在 organizer `ca-status` 页面内按 `registrationId / caConnectionId` 过滤和渲染。  
**Tech Stack:** Prisma read model extension, Next.js server-rendered React components, TypeScript, node:test + tsx, focused UI test + production build verification

---

## 文件结构

- Modify: `src/lib/services/races.ts`
  - 追加 race 级 `SecurityAudit` 读取并挂回 `RaceListItem`
- Modify: `src/app/_components/console/organizer-console-page.tsx`
  - 新增 `Connector Audit Overview` 聚合与展示
- Modify: `src/app/_components/console/organizer-console-page.test.tsx`
  - 先写失败测试，再验证 audit summary 与事件过滤
- Modify: `docs/superpowers/status.md`
  - 记录 `P2-D` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2d-connector-audit-overview-design.md`
  - 回写 implementation notes

### Task 1: Add Failing Organizer Audit Coverage

**Files:**
- Modify: `src/app/_components/console/organizer-console-page.test.tsx`
- Test: `src/app/_components/console/organizer-console-page.test.tsx`

✅ **Step 1: Add a failing organizer audit overview test**

Cover:

- `Connector Audit Overview` exists in `ca-status`
- shows current registration's recent audit counts
- shows `action / result / reason / connectorId`
- hides unrelated registration audit entries
- shows empty-state text when registration has no audit entries

✅ **Step 2: Run the focused organizer console test and confirm failure**

Run: `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`

Expected: FAIL because organizer `ca-status` does not yet consume `SecurityAudit`.

### Task 2: Extend the Race Read Model

**Files:**
- Modify: `src/lib/services/races.ts`

✅ **Step 1: Load `SecurityAudit` for listed races**

Add:

- follow-up `securityAudit.findMany()` scoped by current race ids
- order by `createdAt desc`
- group by `raceId`

✅ **Step 2: Attach grouped audits to each race item**

Keep scope strict:

- no schema change
- no new route
- no service write-path change

### Task 3: Render Connector Audit Overview

**Files:**
- Modify: `src/app/_components/console/organizer-console-page.tsx`

✅ **Step 1: Add small helper logic inside organizer console page**

Add helpers for:

- parsing `detailsJson`
- filtering current registration-relevant audit entries
- deriving:
  - `Recent Audit Events`
  - `Rejected Events`
  - `Review Events`

✅ **Step 2: Render `Connector Audit Overview` inside each registration card**

Add:

- summary rows
- recent event list
- empty-state text when no events exist

✅ **Step 3: Keep scope strict**

Do not:

- add a standalone audit page
- add organizer-wide filtering UI
- change `SecurityAudit` write behavior
- expand projection payloads

### Task 4: Verify the Slice

**Files:**
- Test: `src/app/_components/console/organizer-console-page.test.tsx`

✅ **Step 1: Re-run the focused organizer console test**

Run: `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`

Expected: PASS

✅ **Step 2: Run a production build**

Run: `npm run build`

Expected: PASS

### Task 5: Update Status and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2d-connector-audit-overview-design.md`

✅ **Step 1: Update `status.md`**

Record:

- `P2-D` design and implementation
- organizer `ca-status` now exposes connector audit overview
- scope stays on existing `SecurityAudit`

✅ **Step 2: Update the P2-D design doc**

Append implementation notes:

- where `SecurityAudit` is loaded
- where filtering/rendering happens
- fresh verification commands

✅ **Step 3: Add a new recovery snapshot section**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
