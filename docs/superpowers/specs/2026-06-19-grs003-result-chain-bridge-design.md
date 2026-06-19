# GRS003 Result Chain Bridge Design

## Purpose

This slice moves the repository from its current legacy result chain:

- `Submission`
- `LeaderboardEntry`
- `HarnessEntry`
- `RidingHighlight`
- `TeamComment`

toward the `grs003` result chain centered on:

- `Work`
- `JudgeAssignment`
- `JudgingRecord`
- `Award`
- `Report`

The goal is not to remove every legacy structure in one pass. The goal is to make the final-result side of the system structurally real so public `Works / Results / Review / Rider Profile` pages can stop depending on ad hoc legacy tables as their only fact source.

## Scope

### In Scope

- add `Work`
- add `JudgeAssignment`
- add `JudgingRecord`
- add `Award`
- add `Report`
- bridge current finished-race data into those models
- move public results/review/work detail pages toward those entities first

### Out Of Scope

- full CA connector push/fetch runtime
- final removal of `Submission`, `LeaderboardEntry`, `HarnessEntry`, `RidingHighlight`, `TeamComment`
- fully replacing every public/read model in one slice

## Source Constraints

Derived from:

- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-mvp.prd.md`
- `docs/grs003/ary-mvp.ia.md`
- `docs/grs003/grs003-gap-analysis.md`

Most important constraints for this slice:

1. `Work` is an asset, not a submission record.
2. one `Registration` has at most one primary `Work` in MVP.
3. `JudgeAssignment` records allocation from organizer/admin to a judge.
4. `JudgingRecord` carries `scoreResult`, `scoreRiding`, and `comments`.
5. `Award` is the fact source for final results; final result pages should not treat process projection as final truth.
6. `Report` expresses post-judging result and summary, not real-time process.

## Design Decision

### Recommended approach: bridge legacy result tables into the new result chain before removing them

There are three realistic approaches:

1. hard replace all legacy result tables:
   cleanest end state, highest immediate breakage risk.
2. add the new result chain and bridge current data into it:
   best aligned while preserving working pages.
3. leave public pages on legacy result tables and delay domain migration:
   safest short-term, but keeps the repo structurally far from `grs003`.

This slice uses option 2.

## Transitional Semantics

### Work

`Work` becomes the asset source of truth. `Submission` remains the legacy action log and raw source for backfilling current data.

### JudgeAssignment / JudgingRecord

These become real entities even if the current system still lacks full manual judging workflow depth.

The bridge should allow:

- placeholder or transitional judge assignment data in seed/demo states
- basic structure for future Judge View work

### Award

`Award` becomes the final-result fact source. Existing `LeaderboardEntry` and `HarnessEntry` remain compatibility layers until pages fully switch.

### Report

`Report` becomes the published result-summary fact source for:

- rider report
- race report
- review summary

Existing `organizerComment`, `RidingHighlight`, and `TeamComment` can be used to backfill initial report content.

## Model Intent

### Work

Minimum fields:

- `id`
- `registrationId`
- `title`
- `summary`
- `demoUrl`
- `repoUrl`
- `videoUrl`
- `techNotes`
- `status`
- `visibility`
- `createdAt`
- `updatedAt`

### JudgeAssignment

Minimum fields:

- `id`
- `workId`
- `judgeId`
- `assignedByUserId`
- `assignedAt`

### JudgingRecord

Minimum fields:

- `id`
- `judgeAssignmentId`
- `scoreResultJson`
- `scoreRidingJson`
- `comments`
- `submittedAt`
- `createdAt`
- `updatedAt`

### Award

Minimum fields:

- `id`
- `raceId`
- `registrationId`
- `workId?`
- `awardName`
- `rank`
- `decisionReason`
- `publishedAt?`
- `createdAt`
- `updatedAt`

### Report

Minimum fields:

- `id`
- `raceId`
- `subjectRegistrationId?`
- `type`
- `status`
- `title`
- `summary`
- `body`
- `publishedAt?`
- `createdAt`
- `updatedAt`

## Public/Page Impact

### Works / Work Page

Should prefer real `Work` rows over `RidingHighlight` when present.

### Results

Should prefer `Award`-backed result groups over raw legacy leaderboard tables.

### Review

Should prefer published `review_summary` report plus evidence references over organizer-comment-only fallback.

### Rider Profile

Should aggregate `Registration -> Work -> Award -> Evidence -> Report` instead of `Team / Highlight / Comment` first.

## Acceptance Criteria

This slice is complete when:

1. `Work`, `JudgeAssignment`, `JudgingRecord`, `Award`, and `Report` exist in Prisma
2. demo data can backfill those entities for finished races
3. public `Results` and `Review` can read the new entities where present
4. public `Work Page` can read `Work` as an asset rather than only a highlight projection
5. docs/superpowers status clearly records which legacy result tables remain compatibility-only

## Implementation Note

This slice is still a bridge.

It does not claim that:

- every public page is fully migrated
- every legacy result table is removed
- the full judging workflow is finished

It only claims that the final-result domain has become structurally real enough for later full alignment.

In the current implementation:

- finished-race demo data is backfilled into `Work / JudgeAssignment / JudgingRecord / Award / Report`
- public route reads prefer the new entities where present
- legacy leaderboard/highlight/comment tables still remain as fallback sources during transition
