# GRS004 / DEV-7 Award Draft Edit Baseline Design

## Purpose

This slice directly closes the remaining gap described in:

- `docs/grs004/ary-permission-matrix.md`
  - `3.8 Award / Leaderboard`
    - `edit_draft`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Award Name`
  - `Award Rank`
  - `decisionReason`
  - `Award.rank` uniqueness constraints

Current code already landed:

- Organizer can generate award drafts
- Organizer can publish formal awards
- Organizer can withdraw published awards back to draft state
- Public routes only read published awards

Current code still does not match `grs004` in one remaining place:

- Organizer cannot edit draft awards at all

This slice closes only that minimum gap.

## Scope

### In scope

- Add minimal draft editing on current award records
- Allow Organizer to edit draft-only:
  - `awardName`
  - `rank`
  - `decisionReason`
- Keep `registrationId / workId / sourceRefJson / sourceDigest` frozen
- Update Organizer Console `awards` section to expose inline draft edit controls

### Out of scope

- No new schema
- No standalone award editor page
- No manual reassignment of winner registration
- No manual reassignment of work
- No per-award withdraw
- No award history / diff view

## Constraints

### Existing code reality

- `Award` already stores:
  - `awardName`
  - `rank`
  - `decisionReason`
  - `registrationId`
  - `workId`
  - `sourceRefJson`
  - `sourceDigest`
  - `publishedAt`
- Current draft generation is still derived from submitted `JudgingRecord`
- Current published/public gating is already correct

Therefore this slice should:

1. Reuse the current award records
2. Only allow editing draft-safe metadata
3. Preserve current frozen source references and current public visibility behavior

## Design Choice

### Option A: Edit only draft metadata on current awards

Approach:

- add `updateAwardDraftForRace()`
- allow changing:
  - `awardName`
  - `rank`
  - `decisionReason`
- reject edits on published awards

Pros:

- minimal change
- directly uses fields already defined in `grs004`
- keeps winner identity and traceability stable

Cons:

- does not support manual winner reassignment

### Option B: Full manual award editing including winner reassignment

Pros:

- more powerful draft editing

Cons:

- exceeds current minimum
- requires more UI and more domain policy than the docs specify

### Recommended option

Use **Option A**.

Reason:

- it satisfies `edit_draft` using explicit existing Award fields
- it avoids inventing a manual override policy for winner identity

## Behavior Rules

### 1. Editable fields

Only draft awards (`publishedAt = null`) are editable.

Editable:

- `awardName`
- `rank`
- `decisionReason`

Not editable in this slice:

- `registrationId`
- `workId`
- `sourceRefJson`
- `sourceDigest`

### 2. Published awards

Published awards remain read-only.

If Organizer needs to modify a published award:

- withdraw first
- then edit the draft

### 3. Rank uniqueness

Draft editing must continue to respect:

- `Award.rank` is unique within `(raceId, awardName)`

On conflict:

- reject the update with a clear error

## UI Closure

### Organizer Console / `awards`

Inside `奖项草稿`:

- show current draft award card
- add inline draft edit form:
  - `awardName`
  - `rank`
  - `decisionReason`
- add button:
  - `保存 Award 草稿`

Published awards remain read-only in `已发布奖项`.

## Test Alignment

Need focused coverage in:

- `src/lib/services/awards-draft-withdraw.test.ts`
  - draft edit updates `awardName / rank / decisionReason`
  - published award cannot be edited
  - duplicate `(awardName, rank)` is rejected
- `src/app/_components/console/organizer-award-controls.test.tsx`
  - `奖项草稿` shows edit inputs
  - `保存 Award 草稿` is visible
  - `已发布奖项` remains display-only

## Acceptance

This slice is complete when current evidence shows:

1. Organizer can edit draft awards
2. only draft awards are editable
3. editable fields are `awardName / rank / decisionReason`
4. published awards remain read-only
5. uniqueness of `(raceId, awardName, rank)` is still enforced
6. public routes remain unchanged and still expose only published awards

## Landed implementation notes (2026-07-11)

- `src/lib/services/awards.ts`
  - added:
    - `updateAwardDraftForRace()`
  - draft edit currently allows:
    - `awardName`
    - `rank`
    - `decisionReason`
  - preserved as frozen:
    - `registrationId`
    - `workId`
    - `sourceRefJson`
    - `sourceDigest`
- `src/app/actions.ts`
  - added:
    - `updateAwardDraftAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `奖项草稿` panel now renders:
    - `awardName` input
    - `rank` input
    - `decisionReason` textarea
    - `保存 Award 草稿`
- focused verification passed:
  - `node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx`
  - `node --import tsx --test src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts`
  - `npm run build`
