# GRS004 / GitHub OAuth Friendly Error Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stable, friendly failure handling for GitHub OAuth start and callback paths without changing the successful login flow.

**Architecture:** Keep the existing OAuth flow and login UI, but add a small typed error-code layer in `src/lib/github-oauth.ts`, route-level redirects for known failure cases, and login-page messaging for those codes.

**Tech Stack:** Next.js App Router, TypeScript, existing login page `ErrorNotice`, source-regex tests plus a small helper unit test.

---

### Task 1: Lock the missing OAuth failure contract with tests

**Files:**
- Create: `src/lib/github-oauth-feedback.test.ts`
- Create: `src/app/api/auth/github/callback/route.test.ts`
- Modify: `src/app/_components/public/public-auth-entry-regression.test.tsx`
- Modify: `src/app/actions.return-to.test.ts`

✅ Add a helper unit test for `resolveGitHubOAuthErrorCode(...)`.
✅ Add a callback-route source test that forbids `detail=` leakage and requires stable error-code mapping.
✅ Add login-page source assertions for the new OAuth error codes.
✅ Add an action source assertion for `loginWithGitHubAction()` redirecting back to `/login`.
✅ Run the focused test command and confirm red before implementation.

### Task 2: Add typed OAuth error-code mapping

**Files:**
- Modify: `src/lib/github-oauth.ts`

✅ Add `GitHubOAuthErrorCode`.
✅ Add `GitHubOAuthError`.
✅ Add `resolveGitHubOAuthErrorCode(error, phase)`.
✅ Mark known failure sources with stable OAuth codes:
  - state mismatch
  - invalid state payload
  - token exchange failure
  - profile fetch failure
  - not configured

### Task 3: Close the start and callback error surfaces

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/app/api/auth/github/callback/route.ts`
- Modify: `src/app/login/page.tsx`

✅ Wrap `loginWithGitHubAction()` with a non-redirect friendly fallback back to `/login`.
✅ Keep redirect errors rethrown.
✅ Update the callback route to use stable `oauthError=` codes only.
✅ Remove raw `detail=` URL propagation.
✅ Add login-page messages for:
  - `github_start_failed`
  - `github_state_mismatch`
  - `github_exchange_failed`
  - `github_profile_failed`

### Task 4: Verify and document the slice

**Files:**
- Create: `docs/superpowers/specs/2026-07-11-grs004-github-oauth-friendly-error-closure-design.md`
- Create: `docs/superpowers/plans/2026-07-11-grs004-github-oauth-friendly-error-closure-implementation-plan.md`
- Modify: `docs/superpowers/status.md`

✅ Re-run:

```bash
node --import tsx --test src/lib/github-oauth-feedback.test.ts src/app/api/auth/github/callback/route.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx src/app/actions.return-to.test.ts
```

✅ Confirm all focused tests pass.
✅ Record the slice in `docs/superpowers`.
✅ Run:

```bash
npm run build
```

✅ Confirm the app still builds after the OAuth failure-handling changes.
