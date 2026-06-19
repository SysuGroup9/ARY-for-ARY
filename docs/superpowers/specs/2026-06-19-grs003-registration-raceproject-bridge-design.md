# GRS003 Registration and RaceProject Bridge Design

## Purpose

This slice begins the real domain transition from the current `Team / Submission / RunnerTask` participation model toward the `grs003` participation model centered on:

- `Registration`
- `RaceProject`
- eventually `CAConnection`

The objective of this bridge slice is not to remove `Team` immediately. The objective is to make `Registration` and `RaceProject` real first-class facts in the repository so the rest of the refactor can stop depending on team semantics as the source of truth.

## Scope

### In Scope

- add `Registration` entity
- add `RaceProject` entity
- add participation/status enums required by those entities
- make registration create `Registration` and an idempotent `RaceProject`
- keep `Team` as a compatibility layer for existing submission / leaderboard workflows
- switch Console registration-facing pages to prefer `Registration` / `RaceProject`
- seed demo data for registrations and race projects

### Out Of Scope

- removing `Team`
- replacing submission / leaderboard / highlight pipelines
- full `CAConnection` / `Session` realtime implementation
- `JudgeAssignment`, `JudgingRecord`, `Award`, `Evidence`, `Report`

## Source Constraints

This slice is derived from:

- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-mvp.prd.md`
- `docs/grs003/ary-mvp.ia.md`
- `docs/grs003/registration-ca-rules-alignment.taskbook.md`

The most important constraints for this slice are:

1. MVP supports individual participation only, not Team, as the participation fact.
2. One `User` has at most one `Registration` per `Race`.
3. One `Registration` has at most one `RaceProject`.
4. `Registration approved` must idempotently generate a `RaceProject`.
5. Rider View should enter a generated participation workspace, not ask the rider to bind it manually.

## Design Decision

### Recommended approach: bridge by dual-writing `Registration / RaceProject` alongside `Team`

There are three possible approaches:

1. Hard replace `Team` immediately:
   accurate, but would break too much current functionality in one pass.
2. Ignore domain change until later:
   lowest effort now, but keeps the repository structurally far from `grs003`.
3. Bridge with dual write:
   create `Registration` and `RaceProject` now, keep `Team` only as compatibility for legacy flows.

This slice uses approach 3.

That means:

- `Registration` becomes the participation fact
- `RaceProject` becomes the generated rider workspace fact
- `Team` continues to exist only because submissions, leaderboard entries, archives, and highlights still point at it
- rider registration UI should no longer express “create a team with members” as the primary participation model

## Transitional Semantics

Because the repository still lacks the full `grs003` judging/evidence/award model, the bridge needs explicit transitional rules:

- `Registration` is created as the participation fact.
- `RaceProject` is created idempotently as soon as the registration is approved.
- to preserve current app behavior, a compatibility `Team` row may still be auto-created for the rider if legacy submission/leaderboard code still requires it.
- that `Team` is not treated as the conceptual source of truth anymore; it is only a compatibility container for legacy flows.

## Model Shape

### Registration

Minimum fields for this slice:

- `id`
- `raceId`
- `userId`
- `status`
- `submittedAt`
- `approvedAt?`
- `rejectedAt?`
- `withdrawnAt?`
- `createdAt`
- `updatedAt`

Key invariant:

- unique `(raceId, userId)`

### RaceProject

Minimum fields for this slice:

- `id`
- `registrationId`
- `githubRepoUrl`
- `aggregateIngestionStatus`
- `createdAt`
- `updatedAt`

Key invariant:

- unique `registrationId`

## Registration Flow

Bridge flow for this slice:

```text
Rider clicks register
-> create Registration if missing
-> mark Registration approved in the transitional MVP flow
-> ensure exactly one RaceProject exists
-> ensure compatibility Team exists if legacy code still needs it
```

This keeps the application functional now while making the stored participation graph significantly closer to `grs003`.

## Console Impact

### Rider View

The registration page should now show:

- Registration status
- RaceProject presence
- compatibility note if legacy team-backed workflows still exist

### Organizer View

The registrations page should now list:

- riders by registration
- registration status
- race-project generated state
- compatibility team existence only as secondary context

## Acceptance Criteria

This slice is complete when:

1. `Registration` exists in Prisma and is used as the participation fact
2. `RaceProject` exists in Prisma and is generated idempotently from approved registrations
3. riders no longer register through a team-member form as the primary model
4. rider and organizer registration-facing console pages show `Registration / RaceProject` data
5. seed data contains registrations and race projects for demo races
6. docs/superpowers status clearly states that `Team` is still present only as a compatibility layer

## Implementation Note

The current implementation of this slice uses an explicit bridge:

- `Registration` and `RaceProject` are now real Prisma entities
- rider registration creates those first
- `Team` is only created to keep existing submission / leaderboard / archive paths working

This means the participation graph is now structurally closer to `grs003`, even though the legacy scoring and submission surfaces have not yet been moved off `Team`.
