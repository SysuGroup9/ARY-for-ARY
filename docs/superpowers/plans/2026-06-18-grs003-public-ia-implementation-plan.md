# GRS003 Public IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the current public-facing ARY experience into the `grs003` multi-page public IA so the home page, race pages, live pages, works, results, review, rider profile, and cooperation pages exist as distinct routes instead of a single mixed dashboard.

**Architecture:** Keep the current service/data layer as the temporary read-model source, but split the public UI into route-scoped pages and reusable public components. The first phase focuses on route skeleton, information separation, and public navigation, while leaving Console, CA/Projection model redesign, and deeper backend semantics for later phases.

**Tech Stack:** Next.js App Router, TypeScript, existing Prisma-backed services, existing public race/read models, node:test + tsx verification

---

### Task 1: Add Public Route Access Helpers

**Files:**
- Modify: `src/lib/viewer-access.ts`
- Modify: `src/lib/viewer-access.test.ts`
- Test: `src/lib/viewer-access.test.ts`

- [ ] **Step 1: Add failing tests for the new public route decisions**

Expected checks:

- public routes stay public
- create-race route keeps organizer-only access
- race-derived public pages do not redirect anonymous users

- [ ] **Step 2: Run the focused test file and confirm the new expectations fail first**

Run: `node --import tsx --test src/lib/viewer-access.test.ts`
Expected: failure mentioning missing access helpers or mismatched route behavior

- [ ] **Step 3: Implement the smallest helper additions needed**

Add helper functions for:

- create-race page access
- back target
- future public route guard decisions

- [ ] **Step 4: Re-run the focused test file**

Run: `node --import tsx --test src/lib/viewer-access.test.ts`
Expected: PASS

### Task 2: Split Home Into Public Race Gallery

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/_components/public/home-gallery.tsx`
- Modify: `src/app/_components/ary-shared.tsx`
- Test: browser/manual verification

- [ ] **Step 1: Move public-home responsibility into a dedicated public component**

Home should become:

- Featured/live race entry
- latest results
- featured works
- featured riders
- cooperation entry

It should no longer embed the full public/organizer/rider mixed content blocks.

- [ ] **Step 2: Keep organizer/console entry as a secondary entry, not a main content structure**

Organizer/Rider/Console entry should remain accessible but should not dominate the public homepage.

- [ ] **Step 3: Re-run the app and verify `/` reads like a race gallery instead of a mixed dashboard**

Run: `npm run dev`
Expected: `/` renders public-facing homepage sections and no longer looks like one giant mixed control page

### Task 3: Create Race Page Route

**Files:**
- Create: `src/app/races/[raceSlug]/page.tsx`
- Create: `src/app/_components/public/race-page.tsx`
- Modify: `src/lib/services/races.ts`
- Test: browser/manual verification

- [ ] **Step 1: Define how a route slug maps to an existing race**

Use the current race data as the temporary source. If a stable slug field does not exist, derive a temporary slug mapping strategy from existing race ids/titles.

- [ ] **Step 2: Implement the race page component**

The page must show:

- race title / summary / status
- overview / rules / schedule
- links into Live / Works / Results / Review

- [ ] **Step 3: Link homepage race cards into the race page**

Users should be able to leave home and enter a single race context.

- [ ] **Step 4: Verify in browser**

Expected: from `/`, clicking a race enters `/races/[raceSlug]`

### Task 4: Add Live / Works / Results / Review Route Skeletons

**Files:**
- Create: `src/app/races/[raceSlug]/live/page.tsx`
- Create: `src/app/races/[raceSlug]/works/page.tsx`
- Create: `src/app/races/[raceSlug]/results/page.tsx`
- Create: `src/app/races/[raceSlug]/review/page.tsx`
- Create: `src/app/_components/public/live-hall.tsx`
- Create: `src/app/_components/public/works-page.tsx`
- Create: `src/app/_components/public/results-page.tsx`
- Create: `src/app/_components/public/review-page.tsx`
- Test: browser/manual verification

- [ ] **Step 1: Build route skeleton pages using the existing race context**

Each route must load its race context and render only the information type described by `grs003`, not copy the entire single-page panel stack.

- [ ] **Step 2: Separate process display from final results**

`Live Hall` should prefer process/projection-like data.
`Results` should read final ranking/showcase-style data.

- [ ] **Step 3: Keep review hidden or empty-state safe when no review content exists**

The route must exist, but it should state clearly when public review content is not yet available.

- [ ] **Step 4: Verify all subroutes are reachable from Race Page**

Expected: Race Page can reach `Live`, `Works`, `Results`, and `Review`

### Task 5: Add Work Page, Rider Profile, and Cooperation Pages

**Files:**
- Create: `src/app/works/[workSlug]/page.tsx`
- Create: `src/app/riders/[riderSlug]/page.tsx`
- Create: `src/app/cooperation/page.tsx`
- Create: `src/app/_components/public/work-page.tsx`
- Create: `src/app/_components/public/rider-profile-page.tsx`
- Create: `src/app/_components/public/cooperation-page.tsx`
- Test: browser/manual verification

- [ ] **Step 1: Build a temporary work detail route from current public data**

It may initially derive from highlights / archives / leaderboard-adjacent public data, but it must behave like a distinct Work page.

- [ ] **Step 2: Build a temporary rider profile route from current public rider/team data**

The page should expose rider identity, public race participation, and public proof/award summary to the degree the current code can support.

- [ ] **Step 3: Add a dedicated cooperation page**

This page should explain participation / hosting / sponsorship / contact paths rather than burying those links inside the home page.

- [ ] **Step 4: Verify route discoverability**

Expected:

- Home links toward cooperation
- Works can enter a detail page
- Rider-related public references can enter a rider profile page

### Task 6: Remove Public/Console Mixing From Home

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/_components/ary-shared.tsx`
- Test: browser/manual verification

- [ ] **Step 1: Eliminate remaining large public-page sections that belong to distinct routes**

The home page should not keep full inlined public results/review/work-style sections once dedicated routes exist.

- [ ] **Step 2: Keep only the minimum public homepage composition**

Home should behave like a gallery/entry page, not a long-form multi-panel race dossier.

- [ ] **Step 3: Verify the homepage is visibly simpler and route-driven**

Expected: users navigate out of home into race-context pages instead of scrolling one mega-page

### Task 7: Sync Superpowers Docs With Actual State

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-18-grs003-public-ia-design.md`
- Test: read-back verification

- [ ] **Step 1: Update status with what has actually been split out**

State exactly which public routes now exist and which remain temporary or placeholder-backed.

- [ ] **Step 2: Update the spec if route or scope decisions changed during implementation**

If the actual implementation shape differs from the design, correct the design doc instead of letting drift accumulate.

- [ ] **Step 3: Re-read both docs for consistency**

Run: `Get-Content -LiteralPath 'D:\\Desktop\\ARY-for-ARY\\docs\\superpowers\\status.md'; Get-Content -LiteralPath 'D:\\Desktop\\ARY-for-ARY\\docs\\superpowers\\specs\\2026-06-18-grs003-public-ia-design.md'`
Expected: no contradiction between intended scope and actual current state
