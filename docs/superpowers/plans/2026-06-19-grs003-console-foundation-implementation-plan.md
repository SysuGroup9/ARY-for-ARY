# GRS003 Console Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the `grs003` Console route tree and shared workspace shell so organizer, rider, judge, admin, and screen workflows no longer live on the public homepage.

**Architecture:** Reuse the current Prisma-backed race/team/read-model services as transitional workspace data sources, but move management UI into `/console/*` routes with centralized access helpers and a shared shell. Keep the deeper `User.roles` and domain-model refactor explicitly out of this pass.

**Tech Stack:** Next.js App Router, TypeScript, current Prisma services, existing session auth helpers, node:test + tsx, Next build verification

---

### Task 1: Extend Console Access Helpers

**Files:**
- Modify: `src/lib/viewer-access.ts`
- Modify: `src/lib/viewer-access.test.ts`
- Test: `src/lib/viewer-access.test.ts`

- [ ] **Step 1: Add failing tests for console capability and route decisions**

Cover:

- console home entry target
- organizer workspace access
- rider workspace access
- admin and judge placeholders remaining explicit but centralized

- [ ] **Step 2: Run the focused test file and confirm failures**

Run: `node --import tsx --test src/lib/viewer-access.test.ts`
Expected: FAIL on missing helpers or mismatched decisions

- [ ] **Step 3: Implement the smallest helper layer for Console routing**

Add helpers for:

- console sections by role
- race workspace access
- default console landing route

- [ ] **Step 4: Re-run the focused test file**

Run: `node --import tsx --test src/lib/viewer-access.test.ts`
Expected: PASS

### Task 2: Add Console Data Route Helpers

**Files:**
- Create: `src/lib/services/console-routes.ts`
- Modify: `src/lib/services/races.ts` (only if a narrower lookup is needed)
- Test: route-level usage via build

- [ ] **Step 1: Create transitional console lookup helpers**

Support:

- list races for console entry
- get race workspace by slug
- get rider team context for a race

- [ ] **Step 2: Keep helpers read-model oriented**

Do not introduce new `grs003` entities in this pass.

- [ ] **Step 3: Verify imports compile through route usage**

Run later with build; no extra test file required for this task

### Task 3: Create Shared Console Shell

**Files:**
- Create: `src/app/_components/console/console-shell.tsx`
- Create: `src/app/_components/console/console-home.tsx`
- Create: `src/app/console/layout.tsx`
- Modify: `src/app/console/page.tsx`
- Test: browser/build verification

- [ ] **Step 1: Build a shared console shell component**

Include:

- console heading
- sidebar navigation
- optional race context header
- content slot

- [ ] **Step 2: Replace the placeholder `/console` page with real console home**

Console home should link toward:

- Race Console
- Admin Console
- Screen Console

- [ ] **Step 3: Verify `/console` compiles and renders under the new shell**

Run later with build and browser/manual check

### Task 4: Add Race Console Route Tree

**Files:**
- Create: `src/app/_components/console/console-races-page.tsx`
- Create: `src/app/_components/console/organizer-console-page.tsx`
- Create: `src/app/_components/console/rider-console-page.tsx`
- Create: `src/app/_components/console/judge-console-page.tsx`
- Create: `src/app/console/races/page.tsx`
- Create: `src/app/console/races/new/page.tsx`
- Create: `src/app/console/races/[raceSlug]/page.tsx`
- Create: `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx`
- Create: `src/app/console/races/[raceSlug]/rider/[section]/page.tsx`
- Create: `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`
- Modify: `src/app/races/new/page.tsx`
- Test: browser/build verification

- [ ] **Step 1: Add `/console/races` and list accessible race workspaces**

Organizer should see managed races.
Rider should see joined races.

- [ ] **Step 2: Add `/console/races/new` and move create-race entry there**

Keep `/races/new` as compatibility entry or redirect.

- [ ] **Step 3: Add race workspace branch pages for organizer sections**

Target sections:

- overview
- settings
- registrations
- riders
- ca-status
- works
- judges
- judging
- awards
- reports
- maintenance

- [ ] **Step 4: Add race workspace branch pages for rider sections**

Target sections:

- registration
- ca-setup
- riding
- submission
- review
- report

- [ ] **Step 5: Add judge route branch with explicit transitional placeholder**

Target sections:

- assigned
- reviewing
- submitted

- [ ] **Step 6: Verify organizer and rider routes are guarded by current session and race scope**

Expected:

- anonymous users redirect to `/login`
- unrelated riders do not enter another race workspace
- unrelated organizers do not enter unmanaged races

### Task 5: Add Admin and Screen Console Branches

**Files:**
- Create: `src/app/_components/console/admin-console-page.tsx`
- Create: `src/app/_components/console/screen-console-page.tsx`
- Create: `src/app/console/admin/[section]/page.tsx`
- Create: `src/app/console/screen/page.tsx`
- Create: `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
- Test: browser/build verification

- [ ] **Step 1: Add admin console branch**

Sections:

- users
- profile-completion
- roles

Use explicit placeholder-backed pages if current role model cannot fully satisfy them.

- [ ] **Step 2: Add screen console branch**

Sections should support:

- race selection
- mode selection
- fullscreen output entry

- [ ] **Step 3: Reuse current Jumbotron and Calibrator entry points where useful**

Do not reimplement display engines in this pass.

### Task 6: Sync Superpowers Docs With Actual State

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-19-grs003-console-foundation-design.md`
- Test: read-back verification

- [ ] **Step 1: Record the console slice state in status**

State exactly which `/console/*` branches now exist and what remains blocked by the single-role model.

- [ ] **Step 2: Update the design doc if implementation shape changed**

Keep the spec aligned with the actual route tree.

- [ ] **Step 3: Re-read docs for consistency**

Run: `Get-Content docs/superpowers/status.md; Get-Content docs/superpowers/specs/2026-06-19-grs003-console-foundation-design.md`
Expected: no contradiction between implemented console slice and recorded scope

### Task 7: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused helper tests**

Run: `node --import tsx --test src/lib/viewer-access.test.ts`
Expected: PASS

- [ ] **Step 2: Run public-site and helper regression tests**

Run: `node --import tsx --test src/lib/public-site.test.ts src/lib/viewer-access.test.ts`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS
