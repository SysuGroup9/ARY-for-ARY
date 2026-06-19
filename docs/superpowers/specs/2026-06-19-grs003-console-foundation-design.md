# GRS003 Console Foundation Design

## Purpose

This spec defines the next alignment slice after the public IA split: moving ARY toward the `grs003` Console architecture.

The immediate goal is not to finish the full `User.roles` / `Registration` / `RaceProject` refactor in one pass. The goal is to stop treating management workflows as homepage panels and to establish the route, shell, and access structure required by:

- `docs/grs003/ary-mvp.ia.md`
- `docs/grs003/ary-mvp.prd.md`
- `docs/grs003/ary-permission-matrix.md`
- `docs/grs003/grs003-gap-analysis.md`

## Scope

### In Scope

- Independent `/console/*` route tree
- Console Home
- Race Console entry list
- Race Workspace route structure for:
  - Organizer View
  - Rider View
  - Judge View
- Admin Console route structure
- Screen Console route structure
- Shared Console shell, sidebar, breadcrumb, and race-context framing
- Capability helpers that separate public routing from console routing
- Moving the create-race flow under Console while preserving compatibility entry behavior

### Out Of Scope

- GitHub OAuth migration
- Prisma model rewrite from `User.role` to `User.roles`
- Removing `Team` and replacing it with `Registration`
- `RaceProject`, `CAConnection`, `Session`, `Evidence`, `Award`, `Report`, `JudgingRecord` data-model implementation
- Full Screen Display mode system beyond route and control skeleton

## Current Gap

The codebase now has a public route skeleton, but Console remains structurally incomplete:

- `/console` is only a placeholder entry page
- organizer and rider operations still depend on legacy single-role assumptions
- there is no `/console/races` workspace structure
- there are no Organizer / Rider / Judge / Admin / Screen workspace routes
- the current auth and helper layer only expresses `ORGANIZER` vs `RIDER`

This means the public IA and the management IA are still only half-separated.

## Design Decisions

### 1. Console becomes a real route tree, not a single entry page

The route tree should align with `grs003` even before the deeper domain-model refactor is complete.

Target structure for this slice:

```text
/console
/console/races
/console/races/new
/console/races/{raceSlug}
/console/races/{raceSlug}/organizer/{section}
/console/races/{raceSlug}/rider/{section}
/console/races/{raceSlug}/judge/{section}
/console/admin/{section}
/console/screen
/console/screen/{raceSlug}/{mode}
```

### 2. Build a shared Console shell first

All Console pages should render inside a shared shell that provides:

- Console identity
- role-appropriate navigation
- race context when inside a race workspace
- secondary navigation by section

This keeps the route tree stable while the underlying data model is still transitional.

### 3. Use a future-friendly capability layer, even if the database still uses single role

`grs003` requires `User.roles`, but the current schema still has `User.role`.

For this slice, we should:

- centralize console access decisions in `viewer-access.ts`
- expose role capability helpers that can later evolve from single-role to multi-role
- avoid scattering `user.role === "ORGANIZER"` checks directly across new Console pages

This does not solve the schema mismatch, but it reduces future rewrite cost.

### 4. Race Workspace pages must keep race context visible

`grs003` explicitly requires Race Console to stay inside single-race context to avoid cross-race mistakes.

So every race-console page in this slice should show:

- current race title
- current race phase
- current view name
- adjacent sections for the same role

### 5. Judge / Admin / Screen routes should exist now, even if parts are still placeholder-backed

The route structure itself is part of the information architecture requirement.

This slice should therefore provide:

- real routes for Judge / Admin / Screen Console pages
- explicit placeholder states where the current domain model cannot yet supply full data
- no false claim that the deeper `grs003` role and entity model already exists

## Data Reuse Strategy

This slice should continue to reuse current read models where possible:

- `listRaces()` for race list and organizer-owned race context
- `getTeamForCaptain()` for rider-in-race context
- current `leaderboardEntries`, `highlights`, `teamComments`, `feedbackThreads`, `runnerTasks`, and `notifications` for transitional panels

The Console UI should present these as transitional workspace data, not as final `grs003` domain fidelity.

## File Strategy

Recommended additions:

```text
src/app/_components/console/
  console-shell.tsx
  console-home.tsx
  console-races-page.tsx
  organizer-console-page.tsx
  rider-console-page.tsx
  judge-console-page.tsx
  admin-console-page.tsx
  screen-console-page.tsx

src/app/console/
  layout.tsx
  page.tsx
  races/page.tsx
  races/new/page.tsx
  races/[raceSlug]/page.tsx
  races/[raceSlug]/organizer/[section]/page.tsx
  races/[raceSlug]/rider/[section]/page.tsx
  races/[raceSlug]/judge/[section]/page.tsx
  admin/[section]/page.tsx
  screen/page.tsx
  screen/[raceSlug]/[mode]/page.tsx

src/lib/services/
  console-routes.ts
```

## Acceptance Criteria

This slice is complete when:

1. `/console` is a real Console entry page, not just a holding panel
2. `/console/races` exists and lists race workspaces
3. `/console/races/{raceSlug}/organizer/*` exists and is organizer-gated
4. `/console/races/{raceSlug}/rider/*` exists and is rider-gated to the rider's own race participation
5. `/console/races/{raceSlug}/judge/*` exists as a real route branch
6. `/console/admin/*` exists as a real route branch
7. `/console/screen/*` exists as a real route branch
8. public homepage is no longer the primary place to reach organizer or rider workflow panels
9. `docs/superpowers/status.md` records the actual state of the Console slice and any remaining schema mismatch

## Known Constraint

This slice intentionally leaves one major `grs003` mismatch unresolved:

- the application still stores a single `User.role`

That mismatch should be called out in status and treated as the next deeper foundation item after Console routing and shell separation land.

## Implementation Note

The current implementation of this slice also keeps several route branches explicitly placeholder-backed:

- `Judge View` route branch exists before `JudgeAssignment` and `JudgingRecord`
- `Admin Console` route branch exists before `User.roles` migration and profile-completion fields
- `Screen Console` route branch exists before a dedicated `screen_feed_projection` pipeline

This is intentional. In this pass, route and workspace separation is treated as the required foundation; domain fidelity for those branches remains a later slice.
