# GRS004 / Console Root Friendly Error Fallback Surface Design

## Goal

Close the remaining route-level friendly-error gap for console fallback destinations so that server actions that redirect to console root pages do not drop users onto a page with no inline error surface.

## Source Constraints

- `docs/grs004/ary-mvp.prd.md`
  - Console flows should keep operators inside the console workspace instead of exposing raw failures.
- `docs/grs004/ary.plan.md`
  - Core workflow progress is still centered on race console and judging flows.
- Existing repo conventions
  - Friendly action failures use `buildActionFeedbackHref(...)`.
  - Route pages consume `feedbackMessage` and `feedbackScope`.
  - UI renders the existing `ErrorNotice` component.

## Current Gap

Most race, admin, rider, judge, organizer, cooperation, login, profile, and screen pages already consume route-level feedback. Two root console pages still did not:

- `src/app/console/page.tsx`
- `src/app/console/races/page.tsx`

This left a real fallback hole for default redirects such as:

- `submitJudgingRecordAction()`
  - default `returnTo = "/console/races"`

If a form omitted a more specific `returnTo`, or if a future action reused a root console destination, the server action could already generate `feedbackMessage` and `feedbackScope` but the landing page would not display them.

## Design

### 1. Keep the existing feedback contract

Do not invent a new error transport. Reuse the existing route-level contract:

- `feedbackMessage`
- `feedbackScope`
- `getActionFeedbackContent(...)`
- `ErrorNotice`

This keeps console root behavior aligned with organizer, judge, rider, admin, and public register pages.

### 2. Add route-level feedback parsing to console root pages

Add `searchParams` handling to:

- `src/app/console/page.tsx`
- `src/app/console/races/page.tsx`

Both pages should:

- accept `feedbackMessage?: string`
- accept `feedbackScope?: string`
- resolve them through `getActionFeedbackContent(...)`
- render `ErrorNotice` above the existing page content

### 3. Preserve existing navigation and access behavior

This slice must not change:

- session gating
- profile-completion redirects
- race-root access rules
- console navigation structure

Only the inline feedback surface changes.

## User-Visible Result

- Judge workflow failures that fall back to `/console/races` now show the same inline error card style already used in other console sections.
- Console root pages can now safely serve as fallback destinations for action redirects without silently losing the error message.
- The visual style stays consistent because the change reuses `ErrorNotice` inside `ConsoleShell`.

## Verification

```bash
node --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx
npm run build
```

## One-Line Summary

This slice closes the last missing root-console error-display gap by making `/console` and `/console/races` consume the existing route feedback contract instead of dropping users onto a feedback-blind landing page.
