# GRS003 Registration and RaceProject Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `Registration` and `RaceProject` as real entities and route current rider registration through them, while keeping `Team` only as a compatibility layer for legacy submission and leaderboard flows.

**Architecture:** Add the new Prisma models and transitional services first, then dual-write registration and workspace creation through a new registration service. Console pages move to read the new entities first, while existing team-backed code remains temporarily intact underneath.

**Tech Stack:** Prisma + SQLite, Next.js App Router, existing auth/session layer, existing race/team services, node:test + tsx, Prisma migrate, Next build verification

---

### Task 1: Add Pure Registration Helper Tests

**Files:**
- Create: `src/lib/registration-helpers.ts`
- Create: `src/lib/registration-helpers.test.ts`
- Test: `src/lib/registration-helpers.test.ts`

- [ ] **Step 1: Write failing tests for bridge invariants**

Cover:

- one registration per race/user
- one race project per registration
- approved registration implies race-project creation eligibility
- compatibility team is secondary, not primary

- [ ] **Step 2: Run the focused test file and confirm failure**

Run: `node --import tsx --test src/lib/registration-helpers.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the helper module**

- [ ] **Step 4: Re-run the focused test file**

Run: `node --import tsx --test src/lib/registration-helpers.test.ts`
Expected: PASS

### Task 2: Add Prisma Models and Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `prisma/migrations/*`
- Test: Prisma generate / migrate

- [ ] **Step 1: Add enums and models**

Add:

- `RegistrationStatus`
- `IngestionStatus`
- `Registration`
- `RaceProject`

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`
Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name registration_raceproject_bridge`
Expected: PASS

### Task 3: Add Registration Service and Dual-Write Flow

**Files:**
- Create: `src/lib/services/registrations.ts`
- Modify: `src/app/actions.ts`
- Modify: `src/lib/services/teams.ts` only if compatibility extraction is needed
- Test: build/runtime verification

- [ ] **Step 1: Add read helpers**

Support:

- list registrations for race
- get registration for race/user
- get race project for registration

- [ ] **Step 2: Add idempotent registration write flow**

Flow:

- create registration if missing
- approve it in transitional flow
- ensure race project exists
- ensure compatibility team exists if needed

- [ ] **Step 3: Add a dedicated registration action**

Do not keep team-creation form as the primary rider registration path.

### Task 4: Switch Console Registration Views

**Files:**
- Modify: `src/app/_components/console/rider-console-page.tsx`
- Modify: `src/app/_components/console/organizer-console-page.tsx`
- Modify: `src/lib/services/console-routes.ts`
- Test: build/browser verification

- [ ] **Step 1: Rider registration page uses Registration first**

Show:

- registration status
- race project state
- compatibility team information only if present

- [ ] **Step 2: Organizer registrations page uses Registration list**

Show:

- rider
- registration status
- race-project generated state

- [ ] **Step 3: Keep legacy submission flow reachable after registration**

Do not strand the rider after switching the registration model.

### Task 5: Seed Demo Data

**Files:**
- Modify: `prisma/seed.ts`
- Test: seed run

- [ ] **Step 1: Add registrations for demo riders**
- [ ] **Step 2: Add race projects for approved registrations**
- [ ] **Step 3: Keep compatibility teams for current submission and leaderboard data**
- [ ] **Step 4: Run seed**

Run: `npm run db:seed`
Expected: PASS

### Task 6: Sync Superpowers Docs

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-19-grs003-registration-raceproject-bridge-design.md`

- [ ] **Step 1: Record that Registration / RaceProject are now real entities**
- [ ] **Step 2: Explicitly state that Team remains compatibility-only**

### Task 7: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused tests**

Run: `node --import tsx --test src/lib/registration-helpers.test.ts src/lib/user-roles.test.ts src/lib/validation.test.ts src/lib/viewer-access.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS
