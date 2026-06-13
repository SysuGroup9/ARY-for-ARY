# GRS-002 Final Submission Guide

## Submission Status

| Item | Status | Owner | Evidence |
|---|---|---|---|
| Code branch | Done | Agent + Owen | `xiaoyi24/jumbotron-subsystem` |
| Pull request | Prepared | Agent; create/update requires GitHub auth | `docs/grs002-pr-description.md` |
| Runtime demo | Done | Agent | `/jumbotron`, `/jumbotron?debug=1` |
| Calibrator demo | Done | Agent | `/jumbotron/calibrator` |
| Seed data story | Done | Agent | `prisma/seed.ts`, `race_sort_demo` |
| Riding Record | Done; final human notes pending | Owen + Agent | `riding_record/agent_riding_jumbotron_grs002.md` |
| Short video | Pending upload | Owen | `VIDEO_URL_PLACEHOLDER` |
| Silent browser recording | Generated locally | Agent | `outputs/grs002-jumbotron-silent-demo.webm` |

## Final Runbook

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open these routes in order:

1. `/jumbotron?debug=1`
2. `/jumbotron?track=city-hairpin&debug=1`
3. `/jumbotron/calibrator`

Optional automated rehearsal:

```bash
node scripts/grs002-rehearsal-check.mjs
```

Optional silent recording:

```bash
node scripts/record-grs002-demo.mjs
```

Latest local recording artifact:

```text
outputs/grs002-jumbotron-silent-demo.webm
```

## Video Link Placeholder

Replace this before final submission:

```text
GRS-002 Video URL: VIDEO_URL_PLACEHOLDER
```

Recommended upload targets:

- Course submission platform, if required.
- GitHub PR comment, if the reviewer watches from GitHub.
- Team documentation page, if the course expects a single evidence hub.

## Scoring Evidence Map

| GRS-002 Criterion | How To Show It |
|---|---|
| 1. Problem understanding and boundaries | Start video with `/jumbotron?debug=1`; explain Jumbotron is public race summary, not full session replay. |
| 2. Race Live View | Show TOP3, KPI strip, moving horses, Entry Inspect, ticker and risk/obstacle/violation count. |
| 3. Calibrator and asset production | Show background/profile import, centerline editing, start/finish, lanes, checkpoints, zones, validation, diff and export. |
| 4. Runtime/data correctness | In debug mode show centerline, sampled points, lane paths, risk zones and collision boxes; mention shared `track-runtime`. |
| 5. Demo/video expression | Follow `docs/jumbotron-demo-video-script.md` and `docs/grs002-demo-storyboard.md`. |
| 6. Agent Riding Skill | Show `riding_record/agent_riding_jumbotron_grs002.md`, intervention points, mistakes and verification. |
| 7. Documentation/deliverability | Point to this file, checklist, PR body and MVP document. |

## Final Human Checklist

- [ ] Record 3-5 minute voiceover or screen narration.
- [ ] Upload video and replace `VIDEO_URL_PLACEHOLDER`.
- [ ] Add final human rehearsal notes to Riding Record.
- [ ] Open or update the PR using `docs/grs002-pr-description.md`.
- [ ] Submit branch/PR/video links to the course platform.

## PR Link Placeholder

```text
PR creation URL: https://github.com/SysuGroup9/ARY-for-ARY/compare/main...xiaoyi24%2Fjumbotron-subsystem?expand=1
```

The local GitHub CLI is not authenticated in this workspace. Use the URL above, or run `gh auth login` and then:

```bash
gh pr create --base main --head xiaoyi24/jumbotron-subsystem --title "GRS-002 Jumbotron Submission Pack" --body-file docs/grs002-pr-description.md
```
