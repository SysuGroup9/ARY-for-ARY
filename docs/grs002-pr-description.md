# PR: GRS-002 Jumbotron Submission Pack

## Summary

This PR completes the GRS-002 Jumbotron subsystem submission pack on branch `xiaoyi24/jumbotron-subsystem`.

It adds a profile-driven Race Live View, a more complete Track Profile Calibrator workflow, semi-real DCR seed data, rubric-aligned documentation, rehearsal materials, and a committed no-audio captioned demo video.

## Demo Entrypoints

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

- `/jumbotron`
- `/jumbotron?debug=1`
- `/jumbotron?track=city-hairpin&debug=1`
- `/jumbotron/calibrator`

## GRS-002 Rubric Evidence

| Rubric Area | Evidence |
|---|---|
| Problem understanding and boundaries | `docs/jumbotron-mvp.md`, `docs/grs002-final-submission.md`, `plan/2026-06-13-01-jumbotron-as-sprint.md` |
| Jumbotron / Race Live View | `/jumbotron`, TOP3, KPI strip, Race Live track, ticker, risk items, Entry Inspect panel |
| Calibrator and track assets | `/jumbotron/calibrator`, `assets/tracks/*/track.profile.json`, `assets/tracks/*/preview.png`, `assets/tracks/*/notes.md` |
| Runtime/data contracts | `src/lib/jumbotron/contracts.ts`, `track-profile.ts`, `track-runtime.ts`, `adapter.ts`, `mock-racing-data.ts` |
| Demo/video expression | `docs/jumbotron-demo-video-script.md`, `docs/grs002-demo-storyboard.md`, `docs/grs002-captioned-demo.zh.srt`, `scripts/record-grs002-captioned-demo.mjs`, `outputs/grs002-jumbotron-captioned-demo.webm` |
| Agent Riding Skill | `riding_record/agent_riding_jumbotron_grs002.md`, `ROADMAP.md` |
| Engineering deliverability | `docs/grs002-submission-checklist.md`, `docs/grs002-rehearsal-report.md` |

## Key Changes

- Added in-page Entry Inspect drill-down for race entries.
- Expanded Calibrator controls for start/finish, lanes, checkpoints, message zones, no-bubble zones and risk zones.
- Added semi-real `race_sort_demo` seed story with multiple teams, submissions, Runner tasks, feedback threads, notifications, harness entries and highlights.
- Preserved terminal horse states so finished/blocked/pit-stop entries do not become stale during demos.
- Added GRS-002 submission checklist, final submission guide, storyboard, voiceover/subtitle material and rehearsal report.
- Added scripts for local rehearsal checks, short smoke recording and primary no-audio captioned browser recording.

## Verification

```bash
node --import tsx --test src/lib/jumbotron/*.test.ts
node --import tsx --test src/lib/*.test.ts
node --import tsx --test organizer_demo/runner_demo/src/*.test.ts
npm run lint
npm run build
```

Additional local rehearsal:

```bash
node scripts/grs002-rehearsal-check.mjs
```

Optional short smoke recording:

```bash
node scripts/record-grs002-demo.mjs
```

Primary captioned recording:

```bash
node scripts/record-grs002-captioned-demo.mjs
```

The primary generated video is committed at `outputs/grs002-jumbotron-captioned-demo.webm`; the subtitle timing is committed at `docs/grs002-captioned-demo.zh.srt`.

## Known Boundaries

- External upload URL is not committed yet; the Git repository already contains the no-audio captioned `.webm` required by the team.
- Calibrator exports local JSON/SVG only; it does not persist profile edits to the database.
- Remote Racing Cockpit authorization remains outside this PoC.
- The runtime is a 2D SVG race renderer, not a full physics engine.
