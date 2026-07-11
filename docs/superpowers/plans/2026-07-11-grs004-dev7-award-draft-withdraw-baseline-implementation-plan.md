# GRS004 / DEV-7 Award Draft and Withdraw Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 `grs004` 要求里的 Award draft / withdraw 基线，让 Organizer 能先生成未发布 Award 草稿、正式发布，再把已发布榜单撤回回草稿态。

**Architecture:** 复用当前 `Award` 表和 `publishedAt` 作为发布门禁；把现有 `publishAwardsForRace()` 背后的计算抽成 draft-generation 入口，再增加 withdraw 服务与最小 Organizer UI。

**Tech Stack:** Prisma service updates, Next.js server actions, server-rendered React UI, node:test + tsx, focused award workflow tests, production build verification

---

### Task 1: Add failing award draft / withdraw tests

**Files:**
- Add: `src/lib/services/awards-draft-withdraw.test.ts`
- Add: `src/app/_components/console/organizer-award-controls.test.tsx`

- [ ] **Step 1: Add a failing service test**

Cover:

- `generateAwardDraftsForRace()` creates unpublished awards
- `publishAwardsForRace()` publishes them
- `withdrawPublishedAwardsForRace()` returns them to draft state
- `listPublishedAwardsForRace()` becomes empty after withdraw

- [ ] **Step 2: Add a failing organizer award UI test**

Cover:

- `生成 Award 草稿`
- `撤回已发布榜单`
- separate draft vs published areas

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx
```

Expected:

- FAIL because draft / withdraw behavior does not exist yet

### Task 2: Implement award draft and withdraw services

**Files:**
- Modify: `src/lib/services/awards.ts`

- [ ] **Step 1: Extract the current award computation into draft generation**

Add:

- `generateAwardDraftsForRace({ organizerId, raceId })`

Rules:

- organizer must own the race
- use submitted `JudgingRecord`
- freeze `sourceRefJson / sourceDigest`
- create or update awards with `publishedAt = null`

- [ ] **Step 2: Keep formal publish entry**

Update:

- `publishAwardsForRace()`

Rules:

- preserve existing published behavior
- publish the latest computed award set

- [ ] **Step 3: Add withdraw entry**

Add:

- `withdrawPublishedAwardsForRace({ organizerId, raceId })`

Rules:

- organizer must own the race
- set `publishedAt = null` on the race’s published awards

### Task 3: Wire Organizer actions and UI

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/app/_components/console/organizer-console-page.tsx`

- [ ] **Step 1: Add new server actions**

Add:

- `generateAwardDraftsAction()`
- `withdrawPublishedAwardsAction()`

Both should:

- require organizer role
- revalidate `/` and `/console/races`

- [ ] **Step 2: Extend Organizer Console awards section**

Add controls:

- `生成 Award 草稿`
- `按 JudgingRecord 发布正式榜单`
- `撤回已发布榜单`

Add display:

- `奖项草稿`
- `已发布奖项`

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
- Modify: `docs/superpowers/specs/2026-07-11-grs004-dev7-award-draft-withdraw-baseline-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- award draft generation landed
- award publication withdraw landed
- public gating still depends on `publishedAt`

- [ ] **Step 2: Update the design doc with landed notes**

Append:

- exact services and actions added
- exact verification commands used

- [ ] **Step 3: Update `grs004readme.md`**

Add:

- user-visible award draft / withdraw changes
- new focused verification command
- remaining award gaps outside this slice
