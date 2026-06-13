# Agent Riding Record: GRS-002 Jumbotron

## Goal

Build a Jumbotron subsystem PoC that can score well under ARY GRS-002:

- Race Live View must be executable and understandable.
- Calibrator must prove a background can become a semantic `track.profile.json`.
- Runtime must be profile-driven, not hard-coded x/y animation.
- The submission must include process evidence and demo script.

## Context And Assignment Interpretation

GRS-002 asks for more than a visual dashboard. The core question is whether a classroom / hackathon race can be projected onto a public big screen through trusted data, trusted track geometry and a repeatable asset pipeline. I treated the assignment as an engineering proof with three claims:

1. **A Race Live View can be driven by public race snapshots.** It should summarize progress, leaders, messages, token usage and risk signals without exposing private Coding Agent sessions or full source logs.
2. **A track background is not enough.** The background can be AI-generated or manually drawn, but runtime positions must come from `track.profile.json`, centerline sampling and lane offsets.
3. **The Agent Riding process is part of the deliverable.** The final work must show how the human rider observed, challenged, corrected and verified agent output instead of accepting a one-shot generated UI.

This framing changed the implementation strategy. I did not try to build a generic event control room or a full physics engine. I focused on the GRS-002 proof boundary: Jumbotron runtime, Calibrator, track-runtime, data adapter, seed/mock data story, debug evidence, demo script and verification.

## Riding Plan

1. Read subsystem definition, IA documents and GRS-002 rubric.
2. Split work into contracts, runtime, adapter, Race Live View, Calibrator, assets, tests and docs.
3. Implement a thin MVP first to make the route runnable.
4. Compare MVP against rubric and identify missing high-score evidence.
5. Sprint on the current branch to add dynamic demo, zone editing, debug evidence and process documentation.
6. Run tests, lint and build before pushing.

## Detailed Task Decomposition

### Workstream A: Data Contracts

The first decomposition was to define what data the big screen is allowed to know. The contracts became:

- `JumbotronSnapshot`: top-level runtime input.
- `CompetitionSnapshot`: public race-level state such as title, phase, round and elapsed time.
- `CompetitionKpiSnapshot`: aggregated public metrics.
- `RacingEntrySnapshot`: public team / project progress state.
- `RidingMessageSnapshot`: short public messages suitable for bubble or ticker display.
- `AttentionItem`: risk, obstacle and violation signals.
- `TrackProfile`: semantic track geometry and asset metadata.

The human decision here was to keep the screen public and summarized. The Jumbotron must not leak full agent prompts, private code review logs, hidden test cases or Organizer private Runner logic.

### Workstream B: Track Runtime

The runtime needed to prove that movement follows geometry:

- Parse and validate a `track.profile.json`-style object.
- Build polyline segments and sample points along the `s` axis.
- Compute tangent, normal and rotation.
- Resolve `laneId` and offset the sampled point by lane normal.
- Derive `HorsePose` including collision boxes and motion state.
- Handle stale, terminal, blocked and fallback lane cases.
- Provide debug data that can be rendered in both Jumbotron and Calibrator.

The human intervention was to reject any plan that placed horses with fixed x/y coordinates on top of a background image. The accepted approach made the centerline and lane offset the source of truth.

### Workstream C: Jumbotron UI

The Race Live View was split into:

- Header and LIVE status.
- KPI strip.
- TOP3 cards.
- Main track SVG.
- Mini map and checkpoints.
- Live Story.
- Entry Inspect drill-down.
- Riding Message bubbles and bottom ticker.
- Debug layers.

The first version was runnable but too static. Owen explicitly challenged whether it could score high under the rubric. That pushed the UI toward a stronger live-screen experience with dynamic s-axis movement, risk zones, collision boxes and an in-page drill-down.

### Workstream D: Calibrator

The Calibrator had to prove the asset production chain:

- Import or use a background.
- Edit centerline points.
- Toggle open / closed path.
- Reverse path direction.
- Set start / finish.
- Add, rename, offset and delete lanes.
- Add, rename, move and delete checkpoints.
- Add/edit/delete message zones, no-bubble zones and risk zones.
- Preview multiple horses using the same `track-runtime`.
- Validate profile and inspect JSON diff.
- Export `track.profile.json` and debug SVG.

The human judgment was that a Calibrator with only draggable points would be too thin for A/S scoring. It needed to feel like a real asset pipeline, not a debug toy.

### Workstream E: Evidence And Submission Package

The final workstream was non-code but score-critical:

- `docs/grs002-submission-checklist.md`
- `docs/grs002-final-submission.md`
- `docs/grs002-pr-description.md`
- `docs/grs002-demo-storyboard.md`
- `docs/grs002-rehearsal-report.md`
- `docs/jumbotron-demo-video-script.md`
- `docs/grs002-captioned-demo.zh.srt`
- `outputs/grs002-jumbotron-captioned-demo.webm`
- `outputs/grs002-jumbotron-silent-demo.webm`

This part exists because the grading rubric values clarity, reproducibility and Agent Riding evidence. Code alone would not explain the proof.

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

Additional final packaging output:

- `docs/grs002-pr-description.md`: PR body mapped to GRS-002 scoring items.
- `docs/grs002-final-submission.md`: final submission runbook and placeholders.
- `docs/grs002-demo-storyboard.md`: voiceover, scene plan and subtitle draft.
- `docs/grs002-rehearsal-report.md`: automated rehearsal result and manual checklist.
- `scripts/grs002-rehearsal-check.mjs`: route-level smoke check.
- `scripts/record-grs002-demo.mjs`: silent browser recording workflow.
- `scripts/record-grs002-captioned-demo.mjs`: longer no-audio captioned recording workflow.
- `outputs/grs002-jumbotron-captioned-demo.webm`: committed primary captioned demo artifact.
- `docs/grs002-captioned-demo.zh.srt`: exported subtitle timing for the primary demo.
- `outputs/grs002-jumbotron-silent-demo.webm`: committed silent demo artifact required by the team.

## Prompt And Decision Log

This is a summarized process log rather than a verbatim chat transcript.

| Step | Human Prompt / Observation | Agent Action | Human Decision |
|---|---|---|---|
| 1 | Asked whether the GitHub repo can be accessed and pushed as `xiaoyi24`. | Checked repository access and branch workflow. | Use a dedicated feature branch. |
| 2 | Provided Jumbotron subsystem definition and IA docs. | Implemented initial contracts, runtime, UI route and Calibrator MVP. | Continue on `xiaoyi24/jumbotron-subsystem`. |
| 3 | Asked whether current work can score high under the GRS-002 rubric. | Re-read the rubric and identified missing hard-gate evidence. | Raise the bar from MVP to A/S-oriented submission. |
| 4 | Stated that A/S requires video, Riding Record, Calibrator full flow, script, data story and visual quality. | Added sprint plan, dynamic demo, zones, debug overlays, video script and record. | Treat documents as first-class deliverables. |
| 5 | Deferred real video and manual demo, asked to complete everything else first. | Added Entry Inspect, richer seed data, Calibrator editing controls and submission checklist. | Keep actual recording separate but prepare it. |
| 6 | Asked to create PR description, final docs, rehearsal, materials and silent demo. | Added final submission docs, storyboard, rehearsal script and recording script. | Commit silent browser demo as an artifact. |
| 7 | Requested submission to classroom repositories. | Merged current work into `ary-grs-002-xiaoyi24` and `ary-grs-001-xiaoyi24` main branches without force push. | Preserve classroom starter files and deadline badges. |
| 8 | Criticized the first video as too short and lacking subtitles; requested no audio and subtitles instead. | Added a longer no-audio captioned recording workflow, generated `.webm` plus `.srt`, and updated submission docs to make it the primary video artifact. | For video scoring, a silent file still needs explicit narrative via embedded captions. |

The repeated pattern was: agent proposes or implements, human evaluates against the rubric, then the agent corrects the implementation or evidence package.

## Human Responsibilities

The human rider retained control of:

- Scoring interpretation: deciding that the initial MVP was insufficient for A/S.
- Scope priority: choosing to defer human voiceover but finish other materials.
- Submission routing: deciding which classroom repositories must receive the work.
- Quality bar: asking for a longer Riding Record and README additions.
- Final acceptance: deciding whether the silent demo is enough or whether a spoken video is still needed.

The agent handled:

- Code implementation.
- Runtime and adapter tests.
- Route verification.
- Documentation drafts.
- Script generation.
- Local video artifact generation.
- Git commits and pushes.

This division is important: the agent did not decide the grade strategy alone. The human rider repeatedly redirected the work toward the rubric.

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

Final packaging intervention:

- Owen asked the agent to prepare PR material, final submission docs, rehearsal checks, storyboard, subtitle copy and a silent browser demo recording path.
- The agent added `docs/grs002-pr-description.md`, `docs/grs002-final-submission.md`, `docs/grs002-demo-storyboard.md` and `docs/grs002-rehearsal-report.md`.
- The agent added `scripts/grs002-rehearsal-check.mjs` for local route validation.
- The agent added `scripts/record-grs002-demo.mjs` for optional no-audio Playwright recording into `outputs/`.
- GitHub PR creation still depends on GitHub CLI authentication in the local environment.

Repository submission intervention:

- Owen asked to submit the same work to `sysu-se/ary-grs-002-xiaoyi24`.
- The agent added the target repository as a separate remote, inspected its `main`, merged the classroom starter history with the full project and pushed without force.
- Owen then asked to submit the same work to `sysu-se/ary-grs-001-xiaoyi24`.
- The agent repeated the non-force merge process and preserved the GRS-001 classroom README content as `ARY GRS 001 Product Definition 评审标准.md`.
- After Owen asked whether the video had been committed, the agent confirmed the blob existed in both target repositories.

Latest documentation intervention:

- Owen reviewed the Riding Record and judged it too short.
- Owen also noticed README still mostly described GRS-001 and lacked enough GRS-002 context.
- The agent expanded this Riding Record and planned README additions without deleting existing README content.

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

### Error 5: Evidence Was Split Across Too Many Places

After code and docs were added, the submission evidence existed but was scattered across README, `docs/`, `riding_record/`, scripts and output video. This made it possible for a reviewer to miss important evidence.

Improvement:

- Added `docs/grs002-final-submission.md` as a central runbook.
- Added `docs/grs002-submission-checklist.md` as a rubric map.
- Added PR description material that points reviewers to exact routes and files.
- Added README GRS-002 additions so the project entry point is not GRS-001-only.

### Error 6: Video Artifact Policy Was Ambiguous

The first packaging pass did not commit the `.webm` because `outputs/` is ignored and generated videos are usually better hosted externally. Owen later clarified that the video must be committed.

Improvement:

- Committed `outputs/grs002-jumbotron-silent-demo.webm` with `git add -f`.
- Updated docs to state that the team explicitly required the silent demo artifact in Git.

### Error 7: First Video Was Too Short And Had No Narrative

The first browser recording proved that the routes could be shown, but it did not explain the ARY platform, the GRS-001 to GRS-002 relationship, the data story, or the Calibrator flow. It also had no subtitles, so a silent reviewer could miss the argument.

Correction:

- Added `scripts/record-grs002-captioned-demo.mjs`.
- Generated `outputs/grs002-jumbotron-captioned-demo.webm`, a longer no-audio video with embedded Chinese captions.
- Exported `docs/grs002-captioned-demo.zh.srt` so the subtitle text is reviewable outside the video.
- Updated README and submission docs to treat the captioned video as the primary artifact and the short video as a smoke demo.

Prevention:

- Do not treat route traversal as a complete demo. A scoring demo must contain an explicit narrative: platform boundary, feature evidence, data provenance, verification and PoC limits.

### Error 8: Classroom Repository Contents Needed Preservation

The target classroom repositories were not empty. They contained deadline badges and assignment material. A direct force push would have destroyed that history.

Improvement:

- Added each classroom repository as a separate remote.
- Merged with `--allow-unrelated-histories`.
- Resolved README conflicts manually.
- Pushed fast-forward updates to target `main`.

## Technical Decision Record

### Decision 1: Use 2D SVG Instead Of Canvas Or 3D

SVG made the proof easier to inspect. Debug layers such as centerline, lane paths, checkpoints and collision boxes can be represented as semantic SVG elements. A 3D or Canvas implementation might look stronger visually, but would make grading the geometry proof harder.

Trade-off:

- Pros: easier debug, accessible DOM, simpler tests, faster implementation.
- Cons: less cinematic than a full 3D race screen.

### Decision 2: Keep Track Geometry In JSON

`TrackProfile` is a JSON-like object validated by Zod. This makes it easy to export from Calibrator and import into runtime.

Trade-off:

- Pros: clear asset boundary, portable, reviewable in Git.
- Cons: no database persistence for edited profiles yet.

### Decision 3: Reuse `track-runtime` In Both Runtime And Calibrator

The Calibrator preview must not use a separate simplified geometry implementation. Otherwise it could validate one behavior while Jumbotron renders another.

Trade-off:

- Pros: shared correctness and stronger proof.
- Cons: Calibrator component depends on runtime shape and must handle invalid profiles carefully.

### Decision 4: Use Seed Data As Semi-Real DCR Story

The project already had Prisma models for races, teams, submissions, Runner tasks and feedback. The strongest non-production proof was to seed a multi-team story and route it through the adapter.

Trade-off:

- Pros: demonstrates DCR adapter path and public projection model.
- Cons: still not a live external Organizer system.

### Decision 5: Commit Silent Demo Video After Human Request

Normally binary video artifacts should live outside Git. Owen required the video in the submission repository, so the artifact was committed intentionally.

Trade-off:

- Pros: reviewers can find the video directly in GitHub.
- Cons: repository history grows with binary media.

### Decision 6: Use Captions Instead Of Audio For The Final Browser Demo

Owen rejected adding sound and asked for subtitles. The final automated recording therefore uses embedded captions plus an exported `.srt`, rather than a voiceover track.

Trade-off:

- Pros: no audio dependency, reviewable subtitle text, easier to commit and replay consistently.
- Cons: the viewer must read the screen; caption timing and layout become part of the video quality bar.

## GRS-002 Self-Assessment

| Area | Current State | Residual Risk |
|---|---|---|
| Problem framing | Runtime / Calibrator / DCR adapter boundaries are documented and summarized in the captioned video. | External upload URL may still be needed by the course platform. |
| Race Live View | Dynamic 16:9 screen, TOP3, KPI, track, ticker, risk, Entry Inspect and debug mode. | Visual polish can still improve during final rehearsal. |
| Calibrator | Import, edit centerline, start / finish, direction, lanes, checkpoints, zones, preview, validate, diff and export. | Export is local only, not database-backed. |
| Runtime correctness | Shared track-runtime drives Jumbotron and Calibrator; tests cover sampling, lane offset, stale, terminal states and zones. | No full browser interaction test yet. |
| Demo/video | Captioned no-audio `.webm` and `.srt` are generated and committed. | Manual live rehearsal notes should still be appended after Owen reviews the final file. |
| Riding Skill | Plan, intervention, errors, correction and verification are recorded. | Final human rehearsal notes should be appended after recording. |
| Deliverability | Checklist maps rubric evidence to routes and files. | Online deployment URL is not included in this branch. |

## Evidence Map

| Evidence Type | File / Route | Purpose |
|---|---|---|
| Race Live View | `/jumbotron` | Main public screen. |
| Debug view | `/jumbotron?debug=1` | Shows geometry, sampled path, lane offsets, risk zones and collision boxes. |
| Second profile | `/jumbotron?track=city-hairpin&debug=1` | Demonstrates profile switching. |
| Calibrator | `/jumbotron/calibrator` | Demonstrates asset production and validation. |
| Runtime contracts | `src/lib/jumbotron/contracts.ts` | Defines snapshot and runtime input structures. |
| Track profile schema | `src/lib/jumbotron/track-profile.ts` | Validates semantic track asset. |
| Runtime logic | `src/lib/jumbotron/track-runtime.ts` | Converts progress into horse pose. |
| DCR adapter | `src/lib/jumbotron/adapter.ts` | Maps race data into public Jumbotron snapshot. |
| Seed story | `prisma/seed.ts` | Provides semi-real multi-team DCR data. |
| Demo script | `docs/jumbotron-demo-video-script.md` | Recording plan and caption narrative. |
| Storyboard | `docs/grs002-demo-storyboard.md` | Scene plan and subtitle copy. |
| Rehearsal report | `docs/grs002-rehearsal-report.md` | Automated route check and video artifact result. |
| Captioned demo | `outputs/grs002-jumbotron-captioned-demo.webm`, `docs/grs002-captioned-demo.zh.srt` | Primary no-audio browser walkthrough with embedded Chinese captions. |
| Silent demo | `outputs/grs002-jumbotron-silent-demo.webm` | Short smoke walkthrough. |
| Submission checklist | `docs/grs002-submission-checklist.md` | Rubric-to-evidence map. |
| Final runbook | `docs/grs002-final-submission.md` | Submission package index. |

## Verification Timeline

The final verified command set included:

```bash
node --import tsx --test src/lib/jumbotron/*.test.ts
node --import tsx --test src/lib/*.test.ts
node --import tsx --test organizer_demo/runner_demo/src/*.test.ts
npm run lint
npm run build
npm run db:generate
npm run db:deploy
npm run db:seed
npm run grs002:check
npm run grs002:record
npm run grs002:record:captioned
```

The route rehearsal checked:

- `/jumbotron`
- `/jumbotron?debug=1`
- `/jumbotron?track=city-hairpin&debug=1`
- `/jumbotron/calibrator`

The short recording script generated:

```text
outputs/grs002-jumbotron-silent-demo.webm
```

The captioned recording script generated:

```text
outputs/grs002-jumbotron-captioned-demo.webm
docs/grs002-captioned-demo.zh.srt
```

The repository submission checks included:

- Push to `SysuGroup9/ARY-for-ARY` branch `xiaoyi24/jumbotron-subsystem`.
- Push to `sysu-se/ary-grs-002-xiaoyi24` `main`.
- Push to `sysu-se/ary-grs-001-xiaoyi24` `main`.

## What I Would Improve With More Time

- Review the captioned video and upload it externally only if the course platform requires a link.
- Add Playwright interaction tests for click selection and Calibrator editing.
- Persist exported Calibrator profiles to a database or asset registry.
- Add a real Remote Racing Cockpit route with proper authorization.
- Add richer visual animation while keeping debug evidence inspectable.
- Add a compare view showing Calibrator-exported JSON loaded back into Jumbotron.
- Add a hosted deployment URL so reviewers do not need to run locally.

## Final Validation Plan

Automated:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
npm run grs002:check
npm run grs002:record
npm run grs002:record:captioned
```

Manual:

- Open `/jumbotron?debug=1` and click TOP3 Entry Inspect.
- Open `/jumbotron?track=city-hairpin&debug=1` and verify the second profile.
- Open `/jumbotron/calibrator`, edit at least one point/lane/checkpoint/zone and show Validate / Export.
- Upload the captioned video and replace `VIDEO_URL_PLACEHOLDER` only if an external link is required.

## Recording Preparation

- Use `docs/grs002-demo-storyboard.md` as the scene-by-scene guide.
- Use `docs/jumbotron-demo-video-script.md` as the caption narrative.
- Use `outputs/grs002-jumbotron-captioned-demo.webm` as the primary no-audio subtitle video.
- Use `outputs/grs002-jumbotron-silent-demo.webm` as optional short smoke footage.
- Keep `.env`, terminal secrets and private session logs out of frame.

## Human Retrospective Placeholder

```text
Final recording date:
Video URL:
Human reviewer:
Last issues found:
Fixes after rehearsal:
Final submission decision:
```

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
- Manual live demonstration is intentionally deferred by user instruction; the no-audio captioned video has been generated for repository submission.
- PR creation can be automated only after `gh auth login` or `GH_TOKEN` is available.
