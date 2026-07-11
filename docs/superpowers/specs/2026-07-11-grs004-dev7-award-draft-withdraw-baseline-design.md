# GRS004 / DEV-7 Award Draft and Withdraw Baseline Design

## Purpose

This slice directly closes the gap described in:

- `docs/grs004/ary-permission-matrix.md`
  - `3.8 Award / Leaderboard`
    - `view_draft`
    - `create_draft`
    - `edit_draft`
    - `publish`
    - `withdraw_publication`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Award / Leaderboard`
  - `Award.rank`
  - published result visibility

Current code already landed:

- Organizer can publish formal `Award / Leaderboard` from submitted `JudgingRecord`
- Public routes only read published awards

Current code still does not match `grs004` in one important place:

- no explicit award draft generation entry
- no withdraw publication entry
- Organizer UI still only exposes direct publish

This slice closes only that minimum gap.

## Scope

### In scope

- Add explicit award draft generation from submitted `JudgingRecord`
- Keep current published/public gating behavior
- Add award publication withdraw back to draft
- Update Organizer Console `awards` section to expose:
  - generate draft
  - publish formal leaderboard
  - withdraw published leaderboard
  - separate draft vs published display

### Out of scope

- No new schema
- No standalone award editor page
- No manual award rank editing UI
- No per-award withdraw
- No award history / diff view
- No change to public routing semantics beyond existing `publishedAt` gating

## Constraints

### Existing code reality

- `prisma/schema.prisma`
  - `Award` has:
    - `awardName`
    - `rank`
    - `decisionReason`
    - `sourceRefJson`
    - `sourceDigest`
    - `publishedAt`
- `src/lib/services/awards.ts`
  - current `publishAwardsForRace()` computes winners and writes directly as published awards
- `src/lib/services/results.ts`, `review.ts`, `public-routes.ts`, `works.ts`
  - already consume only published awards

Therefore this slice should:

1. Reuse the current `Award` table
2. Continue using `publishedAt` as the publish gate
3. Add the smallest possible draft / withdraw layer around the current award computation

## Design Choice

### Option A: Add award draft generation and withdraw on the current `Award` records

Approach:

- extract current award computation into a reusable draft-generation path
- add:
  - `generateAwardDraftsForRace()`
  - `withdrawPublishedAwardsForRace()`
- keep `publishAwardsForRace()` as the formal publish entry
- treat `publishedAt = null` as draft awards

Pros:

- minimal change
- matches current schema
- preserves public gating already in place

Cons:

- still no manual award edit UI
- publish path remains auto-derived from judging records

### Option B: Add a full manual award editor

Pros:

- more complete `edit_draft`

Cons:

- too large for this slice
- exceeds current “minimize your own ideas” requirement

### Recommended option

Use **Option A**.

Reason:

- it closes the missing draft / withdraw baseline with the least scope
- it stays faithful to the current JudgingRecord-derived award model

## Behavior Rules

### 1. Award draft generation

Organizer can explicitly generate draft awards from submitted `JudgingRecord`.

Behavior:

- compute the same formal award set as current publish logic
- write or update awards with:
  - frozen `sourceRefJson`
  - frozen `sourceDigest`
  - `publishedAt = null`

This makes the awards internal-only drafts.

### 2. Formal publish

`publishAwardsForRace()` remains the sanctioned formal publish entry.

Behavior:

- ensure current draft values are computed from latest submitted `JudgingRecord`
- set `publishedAt = now`

### 3. Withdraw publication

Organizer can withdraw the current published leaderboard.

Behavior:

- existing awards remain in place
- `publishedAt` becomes `null`
- awards return to internal draft visibility

### 4. Public visibility

No public routing change is needed beyond current `publishedAt != null` filtering.

After withdraw:

- `results / review / work / rider / race` stop exposing these awards

## UI Closure

### Organizer Console / `awards`

Keep the current award area and extend it.

Add controls:

- `生成 Award 草稿`
- `按 JudgingRecord 发布正式榜单`
- `撤回已发布榜单`

Display:

- one draft panel for `publishedAt == null`
- one published panel for `publishedAt != null`

If there are no draft awards:

- show draft empty state

If there are no published awards:

- keep current published empty state / compatibility fallback

## Test Alignment

Need focused coverage in:

- `src/lib/services/awards-draft-withdraw.test.ts`
  - draft generation creates unpublished awards
  - formal publish still publishes them
  - withdraw returns them to draft visibility
- `src/app/_components/console/organizer-award-controls.test.tsx`
  - award section shows draft generation control
  - withdraw control is visible when there are published awards
  - draft and published areas render separately

## Acceptance

This slice is complete when current evidence shows:

1. Organizer can explicitly generate award drafts
2. award drafts are stored with `publishedAt = null`
3. Organizer can still publish formal awards from submitted `JudgingRecord`
4. Organizer can withdraw published awards back to draft state
5. public routes continue to expose only `publishedAt != null` awards
6. Organizer Console clearly distinguishes draft vs published awards

## Landed implementation notes (2026-07-11)

- `src/lib/services/awards.ts`
  - added:
    - `generateAwardDraftsForRace()`
    - `withdrawPublishedAwardsForRace()`
  - `publishAwardsForRace()` now reuses the draft-generation path before publishing
- `src/app/actions.ts`
  - added:
    - `generateAwardDraftsAction()`
    - `withdrawPublishedAwardsAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `awards` section now renders:
    - `生成 Award 草稿`
    - `按 JudgingRecord 发布正式榜单`
    - `撤回已发布榜单`
    - separate `奖项草稿` and `已发布奖项` panels
- focused verification passed:
  - `node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx`
  - `node --import tsx --test src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts`
  - `npm run build`
