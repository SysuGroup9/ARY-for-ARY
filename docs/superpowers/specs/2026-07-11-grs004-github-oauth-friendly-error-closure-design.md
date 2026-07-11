# GRS004 / GitHub OAuth Friendly Error Closure Design

## Goal

Close the remaining user-visible error-surface gap in the formal GitHub login path so that OAuth start and callback failures resolve to stable, friendly login-page messages instead of raw error details or generic exception pages.

## Source Alignment

- `docs/grs004/ary.plan.md`
  - `DEV-3 Login / Role / Race Console`
- `docs/grs004/ary-mvp.prd.md`
  - GitHub is the formal account entry
- `docs/grs004/github-oauth-ca-demo.md`
  - formal GitHub login entry
  - callback failures currently surfaced on `/login`
- Existing repo patterns
  - login and profile entry errors already use in-page `ErrorNotice`
  - user-facing failures should redirect back into the same experience instead of exposing raw exceptions

## Current Problem

The GitHub OAuth flow already had a working happy path, but failure handling still had two rough edges:

1. `src/app/api/auth/github/callback/route.ts`
   - collapsed all callback failures to `github_callback_failed`
   - appended raw `detail=` error text into the login URL
2. `src/app/actions.ts`
   - `loginWithGitHubAction()` had no friendly catch path
   - unexpected start-time failures could fall through to a framework error surface

This contradicts the thread requirement that user-visible failures should show consistent in-page feedback instead of raw exceptions.

## Design

### 1. Introduce stable OAuth error codes

Extend `src/lib/github-oauth.ts` with a small typed error contract:

- `GitHubOAuthError`
- `GitHubOAuthErrorCode`
- `resolveGitHubOAuthErrorCode(error, phase)`

Known codes for this slice:

- `github_start_failed`
- `github_state_mismatch`
- `github_exchange_failed`
- `github_profile_failed`
- `github_callback_failed`
- `github_not_configured`

### 2. Mark known callback failure sources precisely

Wrap known OAuth failure sources with explicit codes:

- invalid / mismatched state
- token exchange failure
- GitHub profile fetch failure
- not-configured credential path

Unknown failures still fall back to a phase-based generic code.

### 3. Remove raw error-detail leakage from callback redirects

`src/app/api/auth/github/callback/route.ts` should redirect only with `oauthError=<stable-code>`.

It should no longer append raw exception text such as:

- `detail=GitHub token exchange failed: 500`
- `detail=GitHub OAuth state mismatch`

Debug details remain in server logs via `console.error(...)`.

### 4. Add a friendly catch path for OAuth start failures

`loginWithGitHubAction()` should:

- keep rethrowing redirect errors
- catch unexpected non-redirect failures
- redirect back to `/login`
- preserve `returnTo`
- surface `oauthError=github_start_failed` or another resolved code

### 5. Teach the login page about the new OAuth codes

`src/app/login/page.tsx` should continue rendering `ErrorNotice`, but map the new OAuth codes to stable login-page messages:

- start failed
- state mismatch
- exchange failed
- profile failed

This keeps GitHub login aligned with the existing local login and profile-completion error UX.

## User-Visible Result

- GitHub login start failures now return to `/login` with a friendly inline message.
- GitHub callback failures no longer leak raw exception details in the URL.
- State mismatch, exchange failure, and profile-fetch failure now have stable user-facing messages instead of being flattened into one opaque path.
- The visual style stays unchanged because the login page still uses the existing `ErrorNotice` surface.

## Verification

```bash
node --import tsx --test src/lib/github-oauth-feedback.test.ts src/app/api/auth/github/callback/route.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx src/app/actions.return-to.test.ts
npm run build
```

## One-Line Summary

This slice keeps the GitHub OAuth happy path intact while turning OAuth start and callback failures into the same kind of stable, page-level feedback loop already used elsewhere in the app.
