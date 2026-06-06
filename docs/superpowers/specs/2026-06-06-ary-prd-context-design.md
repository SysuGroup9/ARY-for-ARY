# ARY PRD Context Design

## Purpose

This document is for future agents working in this repository. Read it after `PRD.md` and before proposing code changes, plans, or product-level documentation changes.

It exists to prevent three recurring failures:

1. treating the old PoC assumptions as if they were still current
2. treating `PRD.md` as if it were already identical to the running codebase
3. smoothing over privacy-boundary mismatches instead of naming them directly

`PRD.md` remains the requirement baseline. This document is an execution-context layer for agents, not a replacement for the PRD.

## Required Reading Order

When starting work in this repository, use this order:

1. `PRD.md`
2. this file
3. `src/lib/services/submissions.ts`
4. `src/lib/services/scoring.ts`
5. runner routes under `src/app/api/runner/tasks/`
6. supporting docs only after the above

Do not start from `README.md` or `ROADMAP.md` and infer the product from there.

## Product Baseline From PRD

The core PRD question is:

> 在 Race 数据存留于 Organizer 侧、ARY 不持久化 Race 数据的前提下，ARY 如何完成赛事的创建、披露、组织与展示？

The PRD requires these product facts to stay central:

- Organizer creates the race, owns test assets, and performs evaluation
- Rider registers, joins, submits, and sends feedback
- Audience reads public race information without needing an account
- Runner is an Organizer-side private evaluator that pulls tasks and returns results
- ARY is responsible for creation, disclosure, organization, and display

The PRD also treats privacy as a first-order requirement:

- Organizer test code must not be exposed to Rider
- Organizer test code must not leave Organizer infrastructure
- ARY must not leak undisclosed showcase content
- feedback visibility is scoped to Organizer and the relevant team

## Current Code Reality

The current repository is already a running full-stack PoC, not a browser-only mock:

- Next.js App Router
- Prisma
- SQLite
- server-side auth
- server-side runner routes

Important implemented behavior:

- Rider submissions are created in `Submission`
- Runner pull returns raw `codeContent` and `ridingRecord`
- Runner result returns structured partial scores
- ARY computes additional public-facing scores locally
- main submission artifacts are nulled after scoring
- best-result artifacts are retained in `TeamArchive`
- leaderboard projection is rebuilt from archive data
- showcase and harness display are generated from archive data

## Non-Negotiable Mismatch Notes

These mismatches must be named explicitly in future work. Do not blur them.

### 1. PRD says localStorage, running PoC uses SQLite

`PRD.md` section `2.4` still says the data store is browser `localStorage`. The repository has already moved past that.

Why this matters:

- reverting mentally to localStorage leads to wrong reasoning about auth, shared state, and runner integration
- the current codebase exists specifically because the user rejected fake browser-only state

Agent instruction:

- treat SQLite as the current PoC implementation truth
- treat the PRD wording here as a stale implementation constraint, not as a reason to undo the architecture

### 2. PRD runner API is conceptual, repo API is actual

The PRD interface section is illustrative. The running repo already exposes a concrete contract:

- pull returns one `task`, not `tasks[]`
- pull returns raw text payloads, not temp download URLs
- result accepts structured scoring inputs, not only one final score

Agent instruction:

- use the code as the source of truth for current protocol shape
- if documenting both, say “PRD intent” vs “current implementation”

### 3. Public leaderboard cadence is not yet automated

The PRD describes progress updates by fixed granularity. Current code still relies on explicit Organizer-triggered publication.

Agent instruction:

- do not describe the system as already doing scheduled or quasi-real-time publication
- if you implement this, keep public projection separate from private scoring details

### 4. Current harness is showcase-derived, not an independent second pipeline

The PRD describes a post-race harness ability evaluation flow. Current code derives `HarnessEntry` during `publishShowcase()` from archived reasoning and keyword scores.

Agent instruction:

- do not claim that the current repo already has a fully separate harness evaluation system
- call it a PoC-level derived showcase metric unless and until a distinct pipeline exists

### 5. ARY still keeps best-archive raw content

The PRD emphasizes not persisting full race data. Current PoC still retains best archived code and Riding Record in `TeamArchive`.

Why it exists:

- local showcase rendering
- top highlight extraction
- optional post-race code disclosure

Agent instruction:

- always describe this as a PoC tradeoff
- never claim “ARY does not save raw rider artifacts” without qualification

## Data Classes To Preserve In Design Discussions

When proposing changes, keep these three classes separate.

### Public Projection

Acceptable in ARY:

- public race description
- public leaderboard rows
- showcase projection
- organizer-approved comments and public notifications

### Process Metadata

Allowed when needed for workflow:

- accounts
- teams
- submission status
- timestamps
- feedback threads
- publication checkpoints

### Private Artifacts

Handle explicitly and carefully:

- Organizer test code
- Organizer runner logic
- raw Rider code
- raw Riding Record
- hidden evaluation detail

For every change touching artifacts, answer these questions in plain text:

- who can see it
- who stores it
- when it is deleted
- whether it becomes a public projection later

## Known Code Paths That Matter First

Future agents should inspect these files before making architecture claims:

- `src/lib/services/submissions.ts`
  - submission lifecycle
  - runner pull/result handling
  - leaderboard publication
  - showcase publication
- `src/lib/services/scoring.ts`
  - score composition
  - harness-display score derivation
  - anti-cheat penalty behavior
- `src/app/api/runner/tasks/pull/route.ts`
  - current runner authorization and response shape
- `src/app/api/runner/tasks/result/route.ts`
  - current result ingestion shape

## Documentation Rules For Future Agents

If you update docs after reading this file:

- do not edit `PRD.md` unless the user explicitly asks
- separate “PRD requirement”, “current implementation”, and “next-step target”
- write privacy boundaries before convenience or performance claims
- if a mismatch exists, name it directly instead of making the docs sound smoother than reality
- do not overclaim ARY observability under a private-runner model

## Recommended Next Workstreams

Based on the current code and PRD, the highest-value follow-up workstreams are:

1. leaderboard cadence alignment
2. harness semantic separation from showcase derivation
3. archive retention tightening
4. stronger runner auth and clearer protocol layering
