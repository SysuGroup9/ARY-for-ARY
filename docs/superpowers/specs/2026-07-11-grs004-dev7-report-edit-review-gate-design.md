# GRS004 / DEV-7 Report Edit and Reviewed Publication Gate Design

## Purpose

This slice directly closes the gap described in:

- `docs/grs004/ary-permission-matrix.md`
  - `3.10 Report`
    - `view_private`
    - `generate`
    - `edit`
    - `publish`
    - `regenerate`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Report Status`
    - `draft`
    - `generated`
    - `reviewed`
    - `published`

Current code already landed:

- Organizer can `generate` report drafts
- Organizer can publish `race_report / review_summary`
- Rider can privately read own `rider_report`
- Public no longer reads `rider_report`

Current code still does not match `grs004` in one important place:

- `ReportStatus.REVIEWED` exists in schema but is unused
- Organizer has no way to edit a generated report draft
- publish does not require a reviewed report

This slice closes only that gap.

## Scope

### In scope

- Add minimal Organizer-side report draft editing
- Add a minimal reviewed gate before public report publication
- Keep `generateReportsForRace()` as the sanctioned regenerate path
- Clarify regenerate behavior for unpublished reports
- Update Organizer Console `reports` section to expose:
  - draft editing
  - mark reviewed
  - publish only after reviewed

### Out of scope

- No new schema
- No standalone report editor page
- No report withdraw flow
- No report version history or diff view
- No rider_report public release rule
- No rich text editing
- No review comments / approval workflow beyond a single `REVIEWED` state gate

## Constraints

### Existing code reality

- `prisma/schema.prisma`
  - `ReportStatus` already has:
    - `DRAFT`
    - `GENERATED`
    - `REVIEWED`
    - `PUBLISHED`
- `src/lib/services/reports.ts`
  - `generateReportsForRace()` creates or rewrites non-published reports as `GENERATED`
  - `publishReportForRace()` currently publishes non-rider reports without a reviewed gate
- `src/app/_components/console/organizer-console-page.tsx`
  - already has `Report Controls`
  - currently only exposes `generate` and `publish`

Therefore this slice should:

1. Reuse the current schema and current report records
2. Keep generate/regenerate semantics on the existing `generateReportsForRace()` path
3. Add the smallest possible reviewed gate before publication

## Design Choice

### Option A: Inline draft editing + reviewed gate on the existing report records

Approach:

- keep reports in the current table
- add service methods:
  - `updateReportDraftForRace()`
  - `markReportReviewedForRace()`
- make `publishReportForRace()` require:
  - report is not `rider_report`
  - report status is `REVIEWED`
- expose the controls inline in Organizer Console

Pros:

- minimal change
- directly matches `grs004` report states
- preserves current generate/regenerate path

Cons:

- regenerate remains destructive for unpublished drafts
- no multi-step reviewer workflow

### Option B: Add a separate report review object or reviewer queue

Pros:

- more explicit review workflow

Cons:

- exceeds current `grs004` minimum
- adds new scope and more UI than required

### Recommended option

Use **Option A**.

Reason:

- it is the smallest slice that makes current code consistent with `grs004`
- it uses the already-defined `REVIEWED` status instead of inventing new structures

## Behavior Rules

### 1. Generate / Regenerate

`generateReportsForRace()` remains the sanctioned generate/regenerate entry.

Behavior:

- it rewrites any non-published report of the same `(raceId, type, subjectRegistrationId)`
- rewritten unpublished reports are reset to:
  - generated content
  - `status = GENERATED`
  - `publishedAt = null`

This means:

- manual edits on unpublished drafts are intentionally overwritten when Organizer clicks regenerate

### 2. Draft editing

Organizer can update report draft fields:

- `title`
- `summary`
- `body`

When a non-published report is edited:

- report content is saved
- report status becomes `DRAFT`
- `publishedAt` remains `null`

### 3. Review gate

Organizer can mark a non-published report as reviewed.

When marked reviewed:

- report status becomes `REVIEWED`
- content remains unchanged

### 4. Publish gate

`publishReportForRace()` must enforce:

- `rider_report` is still not publicly publishable
- only `REVIEWED` `race_report / review_summary` can be published

On publish:

- `status = PUBLISHED`
- `publishedAt = now`

## UI Closure

### Organizer Console / `reports`

Keep the existing `Report Controls` panel and extend it.

For each non-published report:

- show current `type`
- show current `status`
- show editable:
  - title input
  - summary textarea
  - body textarea
- show actions:
  - `保存报告草稿`
  - `标记为 reviewed`

For each non-published non-rider report:

- if `status === REVIEWED`, show:
  - `发布 race_report`
  - or `发布 review_summary`

Also show a small note that regenerate overwrites unpublished drafts.

## Test Alignment

Need focused coverage in:

- `src/lib/services/reports-generation.test.ts`
  - editing a generated report sets `DRAFT`
  - reviewed gate is required before publish
  - regenerate rewrites unpublished draft and resets status to `GENERATED`
- `src/app/_components/console/organizer-console-page.test.tsx`
  - report section shows edit controls
  - reviewed reports expose publish buttons
  - generated-only reports do not expose publish buttons yet

## Acceptance

This slice is complete when current evidence shows:

1. Organizer can edit unpublished reports
2. editing moves report to `DRAFT`
3. Organizer can mark report `REVIEWED`
4. non-reviewed `race_report / review_summary` cannot be published
5. reviewed `race_report / review_summary` can be published
6. regenerate overwrites unpublished drafts and resets them to `GENERATED`
7. Rider private `rider_report` and Public report visibility rules remain unchanged

## Landed implementation notes (2026-07-11)

- `src/lib/services/reports.ts`
  - added:
    - `updateReportDraftForRace()`
    - `markReportReviewedForRace()`
  - `publishReportForRace()` now rejects non-reviewed public reports
- `src/app/actions.ts`
  - added:
    - `updateReportDraftAction()`
    - `markReportReviewedAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `reports` section now renders:
    - inline draft edit form
    - `淇濆瓨鎶ュ憡鑽夌`
    - `鏍囪涓?reviewed`
    - regenerate warning copy
    - disabled publish button until reviewed
- focused verification passed:
  - `node --import tsx --test src/lib/services/reports-generation.test.ts src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/organizer-report-controls.test.tsx`
  - `node --import tsx --test src/lib/services/rider-console.test.ts src/lib/services/public-routes.test.ts src/app/_components/public/rider-profile-page.test.tsx src/app/_components/console/organizer-report-controls.test.tsx`
  - `npm run build`
