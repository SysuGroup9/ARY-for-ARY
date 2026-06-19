# GRS003 CAConnection and Session Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `CAConnection` and `Session` as real entities and expose them through Rider / Organizer Console so `RaceProject` becomes a real participation workspace instead of a placeholder shell.

**Architecture:** Add the CA entities and minimal lifecycle semantics first, then layer small read/write services on top of them. Keep the current runner-backed submission and jumbotron flows intact as transitional compatibility while Console begins to read the new CA-side facts directly.

**Tech Stack:** Prisma + SQLite, Next.js App Router, existing auth/session layer, current Console routing, node:test + tsx, Prisma migrate, Next build verification

---

### Task 1: Add Pure CA Helper Tests

**Files:**
- Create: `src/lib/ca-helpers.ts`
- Create: `src/lib/ca-helpers.test.ts`
- Test: `src/lib/ca-helpers.test.ts`

- [ ] **Step 1: Write failing tests for connection and session lifecycle helpers**
- [ ] **Step 2: Run the focused test file and confirm failure**
- [ ] **Step 3: Implement helper rules for connection lifecycle, aggregate status hints, and session defaults**
- [ ] **Step 4: Re-run the focused test file**

### Task 2: Add Prisma Models and Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `prisma/migrations/*`
- Test: Prisma generate / migrate

- [ ] **Step 1: Add enums and models**

Add:

- `CAType`
- `IngestionSource`
- `CAConnection`
- `Session`

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`
Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name caconnection_session_foundation`
Expected: PASS

### Task 3: Add CA Services

**Files:**
- Create: `src/lib/services/ca-connections.ts`
- Modify: `src/app/actions.ts`
- Test: build/runtime verification

- [ ] **Step 1: Add read helpers**

Support:

- list CA connections for race project
- list sessions for CA connection
- list all race-project CA state for organizer view

- [ ] **Step 2: Add rider-side create connection action**

Support transitional manual creation from Console.

- [ ] **Step 3: Keep all data scoped through race project ownership**

### Task 4: Switch Console CA Pages

**Files:**
- Modify: `src/app/_components/console/rider-console-page.tsx`
- Modify: `src/app/_components/console/organizer-console-page.tsx`
- Modify: `src/app/console/races/[raceSlug]/rider/[section]/page.tsx`
- Test: build/browser verification

- [ ] **Step 1: Rider `ca-setup` reads real CAConnection list**
- [ ] **Step 2: Organizer `ca-status` reads real RaceProject / CAConnection state**
- [ ] **Step 3: Keep explicit copy that push/fetch ingestion is still pending**

### Task 5: Seed Demo CA State

**Files:**
- Modify: `prisma/seed.ts`
- Test: seed run

- [ ] **Step 1: Add demo CA connections to active and finished race projects**
- [ ] **Step 2: Add demo sessions to a subset of connections**
- [ ] **Step 3: Re-run seed**

Run: `npm run db:seed`
Expected: PASS

### Task 6: Sync Superpowers Docs

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-19-grs003-caconnection-session-foundation-design.md`

- [ ] **Step 1: Record what entity-level CA support is now real**
- [ ] **Step 2: Explicitly call out that push/fetch ingestion is still pending**

### Task 7: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused tests**

Run: `node --import tsx --test src/lib/ca-helpers.test.ts src/lib/registration-helpers.test.ts src/lib/user-roles.test.ts src/lib/viewer-access.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS
