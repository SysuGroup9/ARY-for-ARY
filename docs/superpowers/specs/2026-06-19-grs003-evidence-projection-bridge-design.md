# GRS003 Evidence and Projection Bridge Design

## Purpose

This slice turns the newly added participation entities:

- `Registration`
- `RaceProject`
- `CAConnection`
- `Session`

into usable `grs003` process and capability read models.

The immediate target is to make `Evidence` and `Projection` real enough that Console and public process pages stop depending only on legacy `Team / Highlight / Leaderboard` data for everything process-shaped.

## Scope

### In Scope

- add `Evidence` entity
- add `Projection` entity
- represent `Session Summary` as `Evidence.type = session_summary`
- add rebuild services for minimal process projections
- expose evidence/projection reads in Rider / Organizer Console
- switch Live Hall to prefer projection-backed process data

### Out Of Scope

- `Award`
- `JudgingRecord`
- `Report`
- full connector push/fetch implementation
- replacing every public page with evidence-backed read models in one pass

## Source Constraints

Derived from:

- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-ca-integration-spec.md`
- `docs/grs003/ary-mvp.prd.md`
- `docs/grs003/ary-mvp.ia.md`

Important constraints for this slice:

1. `Session Summary` is an evidence form, not a standalone top-level entity.
2. `Projection` is process display data, not the final result fact source.
3. public pages must never read raw CA session data directly.
4. `screen_feed_projection` must distinguish feed item types.
5. final results still belong to later `Award / Report / leaderboard_read_model` slices.

## Design Decision

### Recommended approach: add bridge models with derived payloads, not full final semantics

There are three options:

1. wait until full Report/Award/Judging arrives:
   keeps the model “clean” but leaves the process layer hollow.
2. add minimal bridge `Evidence` and `Projection` now:
   improves domain truth immediately and gives the current UI real process-shaped reads.
3. keep only ad hoc derivation in pages:
   cheapest, but continues the current drift.

This slice uses option 2.

## Transitional Model

### Evidence

Minimum fields:

- `id`
- `registrationId`
- `type`
- `title`
- `summary`
- `sourceRefJson`
- `visibility`
- `createdAt`
- `updatedAt`

For this slice, evidence is generated from:

- `Session` -> `session_summary`
- later slices can add `work`, `judge_comment`, `video`, `commit_pr`

### Projection

Minimum fields:

- `id`
- `raceId`
- `type`
- `payloadJson`
- `asOfAt`
- `createdAt`
- `updatedAt`

For this slice, the minimal projection set is:

- `race_progress_projection`
- `registration_status_projection`
- `cost_projection`
- `risk_projection`
- `current_leaderboard_projection`
- `screen_feed_projection`

## Rebuild Strategy

The bridge strategy is explicit rebuild, not yet live ingestion.

That means:

- projection rows are rebuilt from current `Registration / RaceProject / CAConnection / Session` state
- evidence rows for session summaries are derived from `Session`
- public and console pages can prefer these bridge reads where appropriate
- later push/fetch ingestion can simply trigger or refine the same rebuild logic

## UI Impact

### Live Hall

Should prefer a projection-backed summary over raw legacy leaderboard derivation where available.

### Rider View

Should show session-summary evidence and current registration/project process state.

### Organizer View

Should show aggregate CA/process status in projection and evidence terms, not only connection/session counts.

## Acceptance Criteria

This slice is complete when:

1. `Evidence` exists in Prisma and session-summary evidence can be generated
2. `Projection` exists in Prisma and process projection rows can be rebuilt for a race
3. Live Hall prefers projection-backed process data where present
4. Rider / Organizer Console can read session-summary evidence
5. docs/superpowers status clearly distinguishes process projection from final results

## Implementation Note

This slice is intentionally still process-only.

It makes the repository more aligned to `grs003` by introducing:

- evidence-backed session summaries
- projection-backed process display

without claiming that final competitive outputs have moved off legacy leaderboard structures yet.

In the current implementation:

- session-summary evidence is generated from stored `Session` rows
- race-level process projections are rebuilt into persisted `Projection` rows
- Live Hall prefers those projection rows when available

This is enough to make process data structurally real before `Award / Report / full connector ingestion` land.
