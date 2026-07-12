# GRS004 / DEV-7 Report Edit and Reviewed Publication Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`✅`) syntax for tracking.

**Goal:** 补齐 `grs004` 已定义但当前代码还没用上的 `Report` 编辑与 `REVIEWED` 发布门禁，让 Organizer 能编辑未发布报告，并且只有 reviewed 的公开报告才能发布。

**Architecture:** 复用当前 `Report` 表与 `ReportStatus` 枚举，不新增 schema；在 `reports.ts` 增加最小 draft/edit/review 服务，在 Organizer Console 的 `reports` 区域补内联表单；保留现有 `generateReportsForRace()` 作为 regenerate 路径，并明确 regenerate 会覆盖未发布草稿。

**Tech Stack:** Prisma service updates, Next.js server actions, server-rendered React UI, node:test + tsx, focused report tests, production build verification

---

### Task 1: Add failing report workflow tests

**Files:**
- Modify: `src/lib/services/reports-generation.test.ts`
- Modify: `src/app/_components/console/organizer-console-page.test.tsx`

✅ **Step 1: Add a failing service test for draft edit, reviewed gate, and regenerate**

Cover:

- generated `race_report` can be edited
- edit changes status to `DRAFT`
- publish before reviewed throws
- mark reviewed changes status to `REVIEWED`
- publish after reviewed succeeds
- regenerate overwrites unpublished draft content and resets status to `GENERATED`

✅ **Step 2: Add a failing organizer UI test**

Cover:

- `Report Controls` renders `保存报告草稿`
- generated reports render `标记为 reviewed`
- generated reports do not expose publish buttons yet
- reviewed reports do expose publish buttons
- regenerate warning text is visible

✅ **Step 3: Run focused tests and confirm failure**

Run:

```bash
node --import tsx --test src/lib/services/reports-generation.test.ts src/app/_components/console/organizer-console-page.test.tsx
```

Expected:

- FAIL because edit/review gate behavior does not exist yet

### Task 2: Implement report draft editing and reviewed gate

**Files:**
- Modify: `src/lib/services/reports.ts`

✅ **Step 1: Add minimal Organizer draft update service**

Add:

- `updateReportDraftForRace({ organizerId, reportId, title, summary, body })`

Rules:

- organizer must own the race
- published reports cannot be edited
- save new content
- set `status = DRAFT`
- keep `publishedAt = null`

✅ **Step 2: Add reviewed transition service**

Add:

- `markReportReviewedForRace({ organizerId, reportId })`

Rules:

- organizer must own the race
- published reports cannot be reviewed again
- set `status = REVIEWED`

✅ **Step 3: Tighten publish gate**

Update:

- `publishReportForRace()`

Rules:

- `rider_report` still cannot be publicly published
- only `REVIEWED` non-rider reports can be published

✅ **Step 4: Preserve regenerate semantics**

Keep:

- `generateReportsForRace()` rewriting unpublished drafts
- rewritten drafts reset to `GENERATED`

### Task 3: Wire Organizer actions and UI

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/app/_components/console/organizer-console-page.tsx`

✅ **Step 1: Add new server actions**

Add:

- `updateReportDraftAction()`
- `markReportReviewedAction()`

Both should:

- require organizer role
- call the new report services
- revalidate `/` and `/console/races`

✅ **Step 2: Extend Organizer Console report controls**

For each non-published report:

- render editable title input
- render summary textarea
- render body textarea
- render `保存报告草稿`
- render `标记为 reviewed`

For non-published non-rider reports:

- only show publish button when `status === "REVIEWED"`

✅ **Step 3: Add regenerate warning copy**

Show a short note that:

- `生成报告草稿` will overwrite unpublished drafts and reset them to generated state

### Task 4: Verify the slice

**Files:**
- Test: `src/lib/services/reports-generation.test.ts`
- Test: `src/app/_components/console/organizer-console-page.test.tsx`

✅ **Step 1: Re-run focused tests**

Run:

```bash
node --import tsx --test src/lib/services/reports-generation.test.ts src/app/_components/console/organizer-console-page.test.tsx
```

Expected:

- PASS

✅ **Step 2: Run broader report regression checks**

Run:

```bash
node --import tsx --test src/lib/services/rider-console.test.ts src/lib/services/public-routes.test.ts src/app/_components/public/rider-profile-page.test.tsx
```

Expected:

- PASS

✅ **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected:

- PASS

### Task 5: Update docs and recovery snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-11-grs004-dev7-report-edit-review-gate-design.md`
- Modify: `grs004readme.md`

✅ **Step 1: Update `status.md`**

Record:

- report draft editing landed
- reviewed publication gate landed
- regenerate remains destructive for unpublished drafts

✅ **Step 2: Update the design doc with implementation notes**

Append:

- exact services and actions added
- exact verification commands used

✅ **Step 3: Update `grs004readme.md`**

Add:

- user-visible report editor/review gate changes
- the new focused verification command
- remaining gaps outside this slice
