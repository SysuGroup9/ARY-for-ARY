# GRS003 Evidence and Projection Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `Evidence` and `Projection` as real process-layer entities so session data and race process state can be consumed through grs003-style read models instead of only legacy team/leaderboard paths.

**Architecture:** Add minimal Prisma models first, then derive session-summary evidence and race-level process projections from existing `Registration / RaceProject / CAConnection / Session` data. Keep final-result concepts such as Award/Report outside this pass.

**Tech Stack:** Prisma + SQLite, Next.js App Router, current registration/CA foundation, node:test + tsx, Prisma migrate, Next build verification

---

### Task 1: Add Pure Evidence/Projection Helper Tests

**Files:**
- Create: `src/lib/evidence-projection-helpers.ts`
- Create: `src/lib/evidence-projection-helpers.test.ts`
- Test: `src/lib/evidence-projection-helpers.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:

- session -> session_summary evidence mapping
- registration status projection row shape
- race progress projection summary
- screen feed items preserving explicit feed type

- [ ] **Step 2: Run the focused test file and confirm failure**

Run: `node --import tsx --test src/lib/evidence-projection-helpers.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the helper module**

- [ ] **Step 4: Re-run the focused test file**

Run: `node --import tsx --test src/lib/evidence-projection-helpers.test.ts`
Expected: PASS

### Task 2: Add Prisma Models and Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `prisma/migrations/*`
- Test: Prisma generate / migrate

- [ ] **Step 1: Add enums and models**

Add:

- `EvidenceType`
- `Visibility`
- `ProjectionType`
- `Evidence`
- `Projection`

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`
Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name evidence_projection_bridge`
Expected: PASS

### Task 3: Add Rebuild Services

**Files:**
- Create: `src/lib/services/evidence.ts`
- Create: `src/lib/services/projections.ts`
- Modify: `src/app/actions.ts`
- Test: build/runtime verification

- [ ] **Step 1: Add session-summary evidence rebuild service**
- [ ] **Step 2: Add race projection rebuild service**
- [ ] **Step 3: Add organizer-triggered rebuild action**

### Task 4: Wire Console and Live Hall Reads

**Files:**
- Modify: `src/app/_components/console/rider-console-page.tsx`
- Modify: `src/app/_components/console/organizer-console-page.tsx`
- Modify: `src/app/_components/public/live-hall.tsx`
- Modify: `src/lib/services/public-routes.ts` only if a helper is needed
- Test: build/runtime verification

- [ ] **Step 1: Rider Console shows session-summary evidence**
- [ ] **Step 2: Organizer Console shows process/evidence summaries**
- [ ] **Step 3: Live Hall prefers projection-backed process data**

### Task 5: Seed Demo Evidence and Projection State

**Files:**
- Modify: `prisma/seed.ts`
- Test: seed run

- [ ] **Step 1: Add session-summary evidence for demo sessions**
- [ ] **Step 2: Add rebuilt process projections for demo races**
- [ ] **Step 3: Re-run seed**

Run: `npm run db:seed`
Expected: PASS

### Task 6: Sync Superpowers Docs

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-19-grs003-evidence-projection-bridge-design.md`

- [ ] **Step 1: Record that Evidence and Projection now exist**
- [ ] **Step 2: Explicitly note that final-result truth is still not moved to Award/Report**

### Task 7: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused tests**

Run: `node --import tsx --test src/lib/evidence-projection-helpers.test.ts src/lib/ca-helpers.test.ts src/lib/registration-helpers.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS
