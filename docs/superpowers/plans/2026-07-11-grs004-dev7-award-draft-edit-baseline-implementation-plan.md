# GRS004 / DEV-7 Award Draft Edit Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 `grs004` 中 Award draft 的最小 `edit_draft` 能力，让 Organizer 可以编辑草稿 Award 的 `awardName / rank / decisionReason`，同时保持 published awards 只读。

**Architecture:** 复用当前 `Award` 表；在 `awards.ts` 增加 draft-only 更新服务；在 Organizer Console 的 `奖项草稿` 面板补内联编辑表单；不改 winner identity，不改 public gating。

**Tech Stack:** Prisma service updates, Next.js server actions, server-rendered React UI, node:test + tsx, focused award draft tests, production build verification

---

### Task 1: Add failing award draft edit tests

**Files:**
- Modify: `src/lib/services/awards-draft-withdraw.test.ts`
- Modify: `src/app/_components/console/organizer-award-controls.test.tsx`

- [ ] **Step 1: Add a failing service test**

Cover:

- draft award edit updates `awardName / rank / decisionReason`
- editing a published award is rejected
- duplicate `(awardName, rank)` is rejected

- [ ] **Step 2: Add a failing organizer UI test**

Cover:

- `奖项草稿` renders editable fields
- `保存 Award 草稿` is visible

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx
```

Expected:

- FAIL because draft edit behavior does not exist yet

### Task 2: Implement draft-only award editing

**Files:**
- Modify: `src/lib/services/awards.ts`

- [ ] **Step 1: Add `updateAwardDraftForRace()`**

Rules:

- organizer must own the race
- award must not be published
- update:
  - `awardName`
  - `rank`
  - `decisionReason`

- [ ] **Step 2: Preserve frozen fields**

Do not modify:

- `registrationId`
- `workId`
- `sourceRefJson`
- `sourceDigest`

- [ ] **Step 3: Preserve uniqueness**

Let duplicate `(raceId, awardName, rank)` fail with a clear draft-edit error

### Task 3: Wire Organizer action and UI

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/app/_components/console/organizer-console-page.tsx`

- [ ] **Step 1: Add `updateAwardDraftAction()`**

Rules:

- require organizer role
- call `updateAwardDraftForRace()`
- revalidate `/` and `/console/races`

- [ ] **Step 2: Extend `奖项草稿` UI**

For each draft award:

- render inputs for:
  - `awardName`
  - `rank`
  - `decisionReason`
- render button:
  - `保存 Award 草稿`

Published awards stay display-only.

### Task 4: Verify the slice

**Files:**
- Test: `src/lib/services/awards-publication.test.ts`
- Test: `src/lib/services/awards-draft-withdraw.test.ts`
- Test: `src/app/_components/console/organizer-award-controls.test.tsx`

- [ ] **Step 1: Re-run focused tests**

Run:

```bash
node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx
```

Expected:

- PASS

- [ ] **Step 2: Run public regression checks**

Run:

```bash
node --import tsx --test src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts
```

Expected:

- PASS

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected:

- PASS

### Task 5: Update docs and recovery snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-11-grs004-dev7-award-draft-edit-baseline-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- award draft edit landed
- published awards still read-only
- winner identity still frozen in this slice

- [ ] **Step 2: Update the design doc with landed notes**

Append:

- exact service and action added
- exact verification commands used

- [ ] **Step 3: Update `grs004readme.md`**

Add:

- user-visible award draft edit changes
- new focused verification command
- remaining award gaps outside this slice
