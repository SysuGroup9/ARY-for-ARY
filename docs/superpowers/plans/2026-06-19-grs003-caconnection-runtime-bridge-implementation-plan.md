# GRS003 CAConnection Runtime Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal runtime ingestion bridge for `RidingSignalMessage`-style CA push events so `CAConnection / Session / Evidence / Projection` can be updated by real process messages instead of only seed/setup data.

**Architecture:** Introduce a small ingestion event store for idempotency and audit, add helper-driven signal mapping, expose a minimal authenticated push route, and rebuild evidence/projection after accepted events.

**Tech Stack:** Prisma + SQLite, Next.js route handlers, current CA/evidence/projection bridge services, node:test + tsx, Prisma migrate, Next build verification

---

### Task 1: Add Pure Runtime Helper Tests

**Files:**
- Create: `src/lib/ca-runtime-helpers.ts`
- Create: `src/lib/ca-runtime-helpers.test.ts`
- Test: `src/lib/ca-runtime-helpers.test.ts`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run the focused test file and confirm failure**
- [ ] **Step 3: Implement helper rules for signal -> session/connection updates**
- [ ] **Step 4: Re-run the focused test file**

### Task 2: Add Ingestion Event Model and Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `prisma/migrations/*`

- [ ] **Step 1: Add `CAIngestionEvent` model**
- [ ] **Step 2: Generate Prisma client**
- [ ] **Step 3: Create and apply migration**

### Task 3: Add Ingestion Service and Route

**Files:**
- Create: `src/lib/services/ca-ingestion.ts`
- Create: `src/app/api/ca/signals/route.ts`

- [ ] **Step 1: Validate auth + connection ownership**
- [ ] **Step 2: Deduplicate by `idempotencyKey`**
- [ ] **Step 3: Update session + connection + aggregate status**
- [ ] **Step 4: Trigger evidence/projection rebuilds**

### Task 4: Seed Minimal Connector Auth State

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Ensure seeded connections have secrets/tokens if needed by the bridge**
- [ ] **Step 2: Re-run seed**

### Task 5: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused tests**

Run: `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/ca-helpers.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS
