# GRS004 / Console Root Friendly Error Fallback Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add route-level friendly error rendering to `/console` and `/console/races` so root console fallback redirects do not lose error feedback.

**Architecture:** Reuse the existing route feedback contract (`feedbackMessage`, `feedbackScope`, `getActionFeedbackContent`, `ErrorNotice`) rather than introducing any new error transport. The change is limited to two page components plus source-level tests.

**Tech Stack:** Next.js App Router, TypeScript, existing server actions, source-regex page tests.

---

### Task 1: Lock the missing feedback contract with tests

**Files:**
- Modify: `src/app/console/page.test.tsx`
- Modify: `src/app/console/races/page.test.tsx`

- [x] Add source assertions for `feedbackMessage`, `feedbackScope`, `getActionFeedbackContent`, and `ErrorNotice`.
- [x] Run:

```bash
node --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx
```

- [x] Confirm both new assertions fail before implementation.

### Task 2: Add route-level feedback handling to console root pages

**Files:**
- Modify: `src/app/console/page.tsx`
- Modify: `src/app/console/races/page.tsx`

- [x] Import `ErrorNotice` and `getActionFeedbackContent`.
- [x] Add `searchParams` support for:
  - `feedbackMessage?: string`
  - `feedbackScope?: string`
- [x] Resolve the feedback object via `getActionFeedbackContent(...)`.
- [x] Render `ErrorNotice` above the existing page view while preserving current access and redirect logic.

### Task 3: Re-run focused verification

**Files:**
- Test: `src/app/console/page.test.tsx`
- Test: `src/app/console/races/page.test.tsx`

- [x] Run:

```bash
node --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx
```

- [x] Confirm the focused tests pass.

### Task 4: Update documentation and run build verification

**Files:**
- Create: `docs/superpowers/specs/2026-07-11-grs004-console-root-friendly-error-fallback-surface-design.md`
- Create: `docs/superpowers/plans/2026-07-11-grs004-console-root-friendly-error-fallback-surface-implementation-plan.md`
- Modify: `docs/superpowers/status.md`

- [x] Record the slice in `docs/superpowers`.
- [x] Run:

```bash
npm run build
```

- [x] Confirm the app still builds with the new route-level feedback handling.
