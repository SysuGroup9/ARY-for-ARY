# GRS004 / P2-C Organizer Console Trust / Risk 展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`✅`) syntax for tracking.

**Goal:** 在 `Organizer Console / ca-status` 中新增最小只读 `Trust / Risk Summary`，让 organizer 能直接看到 registration 级别的接入可信度与风险摘要。

**Architecture:** 保持当前 `RISK` projection payload 不变，不新增表、不新增认证策略。实现只发生在 organizer `ca-status` 读取层：基于当前已加载的 `aggregateIngestionStatus + connection.sessions + registration.evidences + connector readiness` 做最小聚合，并把结果渲染到每个 registration 卡片中。

**Tech Stack:** Next.js server-rendered React components, TypeScript, node:test + tsx, current Prisma read model from `listRaces()`, focused UI test + production build verification

---

## 文件结构

- Modify: `src/app/_components/console/organizer-console-page.tsx`
  - 增加最小 trust/risk 聚合 helper 与 `ca-status` 摘要展示
- Modify: `src/app/_components/console/organizer-console-page.test.tsx`
  - 先写失败测试，再验证三种状态和原因展示
- Modify: `docs/superpowers/status.md`
  - 记录 `P2-C` 的实现、验证与 recovery snapshot 更新
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`
  - 回写 implementation notes

### Task 1: Add Failing UI Coverage for Trust / Risk Summary

**Files:**
- Modify: `src/app/_components/console/organizer-console-page.test.tsx`
- Test: `src/app/_components/console/organizer-console-page.test.tsx`

✅ **Step 1: Add a failing organizer ca-status summary test**

Cover:

- `failed` badge when `aggregateIngestionStatus === FAILED`
- `review_needed` badge when evidence integrity is not OK
- `review_needed` badge when latest session risk is `medium` or `high`
- `review_needed` badge when connector is disabled or needs re-handshake
- `trusted` badge when none of the above apply
- detail rows:
  - `CA Ingestion`
  - `Evidence Integrity`
  - `Latest Session Risk`
  - `Connector Readiness`
  - review flag / risk reason summary

✅ **Step 2: Run the focused organizer console test and confirm failure**

Run: `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`

Expected: FAIL because `Trust / Risk Summary` does not exist yet.

### Task 2: Implement the Minimal Trust / Risk Summary

**Files:**
- Modify: `src/app/_components/console/organizer-console-page.tsx`

✅ **Step 1: Add small helper functions inside organizer console page**

Add helpers for:

- parsing `reviewFlagJson`
- choosing the latest session across all connections
- computing:
  - `failed`
  - `review_needed`
  - `trusted`
- building summary details from:
  - `aggregateIngestionStatus`
  - `Evidence.integrityStatus / confidenceLevel / reviewFlagJson`
  - `Session.riskLevel / riskReason`
  - `disabledAt / handshakeCompletedAt`

✅ **Step 2: Render `Trust / Risk Summary` inside each registration card in `ca-status`**

Add:

- top badge:
  - `failed`
  - `review_needed`
  - `trusted`
- detail rows:
  - `CA Ingestion`
  - `Evidence Integrity`
  - `Latest Session Risk`
  - `Connector Readiness`
- reason list when review flags or session risk reason exist

✅ **Step 3: Keep scope strict**

Do not:

- change projection payloads
- add service mutations
- add new DB fields
- modify rider/public/jumbotron views

### Task 3: Verify the UI Slice

**Files:**
- Test: `src/app/_components/console/organizer-console-page.test.tsx`

✅ **Step 1: Re-run the focused organizer console test**

Run: `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`

Expected: PASS

✅ **Step 2: Run a production build**

Run: `npm run build`

Expected: PASS

### Task 4: Update Status and Spec Notes

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`

✅ **Step 1: Update `status.md`**

Record:

- `P2-C` is implemented
- organizer `ca-status` now exposes registration-level trust / risk summary
- implementation stays on current fields and does not expand `RISK` projection payload

✅ **Step 2: Update the P2-C design doc**

Append implementation notes:

- helper stays local to organizer console page
- no projection schema change
- fresh verification commands used

✅ **Step 3: Add a new recovery snapshot section if this turn completes the slice**

Include:

- authoritative files
- what was implemented
- what remains outside this slice
- exact verification commands
