# GRS003 Result Chain Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the `grs003` final-result chain (`Work / JudgeAssignment / JudgingRecord / Award / Report`) so results and review pages can start reading structurally correct entities instead of only legacy leaderboard/highlight/comment tables.

**Architecture:** Add the new Prisma entities first, then bridge current finished-race data into them from existing `Submission / TeamArchive / LeaderboardEntry / HarnessEntry / RidingHighlight / TeamComment` sources. Public routes and pages should prefer the new entities where they exist, while keeping legacy fallback reads during transition.

**Tech Stack:** Prisma + SQLite, Next.js App Router, current registration/CA/evidence foundation, node:test + tsx, Prisma migrate, seed rebuild, Next build verification

---

### Task 1: Add Pure Result-Chain Helper Tests

**Files:**
- Create: `src/lib/result-chain-helpers.ts`
- Create: `src/lib/result-chain-helpers.test.ts`
- Test: `src/lib/result-chain-helpers.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:

- submission/archive -> work asset mapping
- leaderboard/harness/highlight -> award backfill decisions
- organizer comment -> review summary report seed shape
- rider report subject registration invariant

- [ ] **Step 2: Run the focused test file and confirm failure**

Run: `node --import tsx --test src/lib/result-chain-helpers.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the helper module**

- [ ] **Step 4: Re-run the focused test file**

Run: `node --import tsx --test src/lib/result-chain-helpers.test.ts`
Expected: PASS

### Task 2: Add Prisma Models and Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `prisma/migrations/*`
- Test: Prisma generate / migrate

- [ ] **Step 1: Add enums and models**

Add:

- `WorkStatus`
- `ReportStatus`
- `ReportType`
- `Work`
- `JudgeAssignment`
- `JudgingRecord`
- `Award`
- `Report`

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`
Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name result_chain_bridge`
Expected: PASS

### Task 3: Add Result-Chain Services

**Files:**
- Create: `src/lib/services/works.ts`
- Create: `src/lib/services/judging.ts`
- Create: `src/lib/services/awards.ts`
- Create: `src/lib/services/reports.ts`
- Test: build/runtime verification

- [ ] **Step 1: Add work read helpers**
- [ ] **Step 2: Add award read helpers**
- [ ] **Step 3: Add report read helpers**
- [ ] **Step 4: Add minimal judge-assignment and judging-record helpers**

### Task 4: Backfill Demo Result Data

**Files:**
- Modify: `prisma/seed.ts`
- Test: seed run

- [ ] **Step 1: Backfill Work for finished-race registrations**
- [ ] **Step 2: Backfill Award rows from finished-race leaderboard/harness/highlight data**
- [ ] **Step 3: Backfill review_summary and rider/race reports**
- [ ] **Step 4: Re-run seed**

Run: `npm run db:seed`
Expected: PASS

### Task 5: Switch Public Routes and Pages to Prefer the New Entities

**Files:**
- Modify: `src/lib/services/public-routes.ts`
- Modify: `src/app/_components/public/work-page.tsx`
- Modify: `src/app/_components/public/results-page.tsx`
- Modify: `src/app/_components/public/review-page.tsx`
- Modify: `src/app/_components/public/rider-profile-page.tsx`
- Test: build/browser verification

- [ ] **Step 1: Work Page prefers `Work` asset fields**
- [ ] **Step 2: Results prefers `Award`-backed reads**
- [ ] **Step 3: Review prefers published `review_summary` report**
- [ ] **Step 4: Rider Profile prefers `Work / Award / Report / Evidence` aggregation**

### Task 6: Sync Superpowers Docs

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-19-grs003-result-chain-bridge-design.md`

- [ ] **Step 1: Record which result-chain entities are now real**
- [ ] **Step 2: Explicitly note which legacy result tables remain compatibility-only**

### Task 7: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused tests**

Run: `node --import tsx --test src/lib/result-chain-helpers.test.ts src/lib/evidence-projection-helpers.test.ts src/lib/ca-helpers.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS
