# Agent Riding Record: GRS-002 Jumbotron

## Goal

Build a Jumbotron subsystem PoC that can score well under ARY GRS-002:

- Race Live View must be executable and understandable.
- Calibrator must prove a background can become a semantic `track.profile.json`.
- Runtime must be profile-driven, not hard-coded x/y animation.
- The submission must include process evidence and demo script.

## Riding Plan

1. Read subsystem definition, IA documents and GRS-002 rubric.
2. Split work into contracts, runtime, adapter, Race Live View, Calibrator, assets, tests and docs.
3. Implement a thin MVP first to make the route runnable.
4. Compare MVP against rubric and identify missing high-score evidence.
5. Sprint on the current branch to add dynamic demo, zone editing, debug evidence and process documentation.
6. Run tests, lint and build before pushing.

## Agent Output

The agent produced:

- `src/lib/jumbotron/contracts.ts`: runtime data contracts.
- `src/lib/jumbotron/track-profile.ts`: Zod schema for `track.profile.json`.
- `src/lib/jumbotron/track-runtime.ts`: path sampling, lane offsets, horse pose, stale state, s-axis interpolation and collision boxes.
- `src/lib/jumbotron/adapter.ts`: DCR race data to Jumbotron snapshot adapter.
- `/jumbotron`: Race Live View.
- `/jumbotron/calibrator`: Track Profile Calibrator.
- `assets/tracks/*`: semantic track profiles, notes, prompts and preview images.
- `docs/jumbotron-mvp.md`: implementation notes.
- `docs/jumbotron-demo-video-script.md`: recording script.
- Unit tests for adapter and runtime behavior.

## Human Review And Intervention

After the first MVP, Owen challenged the implementation against the GRS-002 rubric:

- Missing short video means it cannot satisfy the hard submission gate.
- Missing Riding Record means Agent Riding Skill cannot be scored.
- Calibrator existed but did not yet show message zones, no bubble zones, risk zones or JSON diff.
- Race Live View could render but was too static for a strong live-screen demo.
- Mock timestamps were fixed, which could make entries stale during later demos.

Corrections made:

- Added scoring matrix in `plan/2026-06-13-01-jumbotron-as-sprint.md`.
- Added dynamic mock snapshot generation using current time.
- Converted Race Live View into a client-side live demo with s-axis progress updates.
- Added debug collision boxes and risk zone overlays.
- Added Calibrator zone editing, JSON diff preview and debug SVG export.
- Added this Riding Record and a video script.

Second review intervention:

- Owen decided to defer actual video recording and manual live demo until later.
- The sprint therefore focused on every non-video deliverable that can raise the GRS-002 score now.
- The agent added an in-page Entry Inspect drill-down instead of placeholder TOP3 links.
- The agent expanded Calibrator controls for start / finish, lane add / delete, checkpoint rename / move / delete and zone delete.
- The agent strengthened seed data so the Jumbotron can demonstrate a semi-real DCR data story without relying only on mock fallback.
- The agent added `docs/grs002-submission-checklist.md` to map each rubric item to concrete evidence.

## Errors And Lessons

### Error 1: MVP Was Not Submission-Complete

The first version focused on code implementation and did not include enough submission evidence.

Improvement:

- For rubric-based assignments, create a scoring matrix before coding polish.
- Treat video script and Riding Record as first-class deliverables, not afterthoughts.

### Error 2: Fixed Mock Time Could Produce Stale Entries

Mock `updatedAt` values were fixed to 2026-06-09. When the demo is opened later, runtime stale logic can mark entries stale.

Improvement:

- Mock snapshots now refresh timestamps from the current demo time.
- Tests keep deterministic timestamps where needed.

### Error 3: Calibrator Was Too Thin For High Score

The first Calibrator could edit centerline and lanes, but did not prove message / no-bubble / risk zone authoring.

Improvement:

- Added zone authoring and diff preview to make asset production visible.

### Error 4: Drill-Down Was Only A Placeholder

The TOP3 cards initially exposed an `Open cockpit` link that could become `#` when no cockpit URL existed. That looked like a drill-down but did not actually explain the selected entry.

Improvement:

- Added an Entry Inspect panel on the Jumbotron screen.
- TOP3 cards and horse markers now select an entry and show rank, progress source, provider, tokens, latest message and risk signals.

## GRS-002 Self-Assessment

| Area | Current State | Residual Risk |
|---|---|---|
| Problem framing | Runtime / Calibrator / DCR adapter boundaries are documented. | Need final spoken explanation in video. |
| Race Live View | Dynamic 16:9 screen, TOP3, KPI, track, ticker, risk, Entry Inspect and debug mode. | Visual polish can still improve during final rehearsal. |
| Calibrator | Import, edit centerline, start / finish, direction, lanes, checkpoints, zones, preview, validate, diff and export. | Export is local only, not database-backed. |
| Runtime correctness | Shared track-runtime drives Jumbotron and Calibrator; tests cover sampling, lane offset, stale, terminal states and zones. | No full browser interaction test yet. |
| Demo/video | Script and checklist exist. | Actual recording intentionally deferred. |
| Riding Skill | Plan, intervention, errors, correction and verification are recorded. | Final human rehearsal notes should be appended after recording. |
| Deliverability | Checklist maps rubric evidence to routes and files. | Online deployment URL is not included in this branch. |

## Verification

Commands used during development:

```bash
node --import tsx --test src/lib/jumbotron/*.test.ts
npm run lint
npm run build
```

Browser checks:

- `/jumbotron?debug=1`
- `/jumbotron?track=city-hairpin&debug=1`
- `/jumbotron/calibrator`

## Remaining PoC Boundaries

- Remote Racing Cockpit links are placeholders unless real DCR URLs are present.
- The Calibrator exports JSON / debug SVG locally; it does not persist profiles to the database.
- The app uses mock fallback when local Prisma data is unavailable.
- The runtime is 2D SVG, not full physics or 3D simulation.
- Actual GRS-002 video recording and manual live demonstration are intentionally deferred by user instruction.
