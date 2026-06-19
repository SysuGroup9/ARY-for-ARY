# GRS003 GitHub OAuth + CA Connector Demo

## Scope

This iteration delivers the minimum viable path for the part of GRS003 I am responsible for:

- GitHub OAuth as the formal login entry.
- A real CA connector demo loop based on existing handshake, signal, and snapshot runtime services.
- The legacy runner pull path remains available as a compatibility path and is not removed in this iteration.

## What Changed

### GitHub OAuth

The login page now exposes a GitHub login action first, while keeping the local username/password forms as a development fallback.

Implemented flow:

1. User clicks `使用 GitHub 登录`.
2. ARY creates an OAuth state cookie and redirects to GitHub.
3. GitHub redirects back to `/api/auth/github/callback`.
4. ARY exchanges the code for an access token.
5. ARY fetches the GitHub user profile.
6. ARY finds or creates a local `User` record.
7. ARY writes the existing JWT cookie session and redirects back to `returnTo`.

Current callback errors surfaced on `/login`:

- `github_denied`
- `github_missing_code`
- `github_callback_failed`

### CA Connector Runtime Bridge

The Rider console now reflects the intended runtime sequence more clearly:

1. Rider registers a `CAConnection`.
2. Registration no longer marks the connection as handshaked immediately.
3. A real connector must call the handshake API first.
4. After the connector starts a session and exposes snapshot data, the rider can manually trigger snapshot fetch from the Rider console.

This iteration adds:

- `fetchCASnapshotAction` server action.
- Rider-side `CA Session ID` input and `抓取快照` button.
- Updated console copy explaining that handshake must happen before snapshot fetch.

## Environment Variables

Add the following variables into `.env`:

```env
DATABASE_URL="file:./dev.db"
ARY_BASE_URL=http://localhost:3000
GITHUB_CLIENT_ID=replace-with-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=replace-with-github-oauth-app-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

Notes:

- `ARY_BASE_URL` is used as the default base URL.
- `GITHUB_CALLBACK_URL` is optional if you want to override the derived callback URL explicitly.
- The GitHub OAuth App callback URL should match the deployed or local callback route exactly.

## Local GitHub OAuth Setup

1. Open GitHub Developer Settings.
2. Create an OAuth App.
3. Set the homepage URL to your ARY deployment or local address.
4. Set the callback URL to `http://localhost:3000/api/auth/github/callback` for local development.
5. Copy the client ID and client secret into `.env`.

## Demo Path

### Demo 1: GitHub Login

1. Start ARY locally.
2. Open `/login`.
3. Click `使用 GitHub 登录`.
4. Complete authorization on GitHub.
5. Confirm that ARY redirects back into the target page and creates a valid session.

### Demo 2: CA Connector Snapshot Loop

1. Log in as a Rider and register for a race.
2. Open the Rider `CA 接入` section.
3. Register a CA connection with a reachable `Connector Base URL`.
4. Use the generated `connectorSecret` to call the handshake API from your connector.
5. Push riding signals through the CA signals API if needed.
6. After the connector exposes a session snapshot, enter the `CA Session ID` in the Rider console.
7. Click `抓取快照`.
8. Confirm that session data and evidence are rebuilt in ARY.

## Known Limitations

- GitHub OAuth users are still backed by the existing local `User` schema, including a generated password hash for compatibility.
- The Rider console still exposes `connectorSecret` for local demo convenience; this is not a production-safe presentation.
- Snapshot fetch is manually triggered in this iteration to keep the demo loop deterministic.
- This iteration does not remove the legacy runner pull APIs.

## Suggested Verification

```bash
npm run build
npm run lint
```

`npm run lint` may still report pre-existing repository issues unrelated to this iteration, so build verification is the more important signal for this task.
