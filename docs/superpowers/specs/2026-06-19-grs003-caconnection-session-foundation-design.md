# GRS003 CAConnection and Session Foundation Design

## Purpose

This slice continues the `grs003` domain transition after `User.roles` and `Registration / RaceProject` foundation work.

The objective is to make `RaceProject` useful as a real participation workspace by adding:

- `CAConnection`
- `Session`
- minimal CA-ingestion status semantics

The goal is not to complete the full CA connector platform in one pass. The goal is to stop treating rider progress as only a code-submission artifact and begin representing CA-backed participation facts explicitly.

## Scope

### In Scope

- add `CAConnection` entity
- add `Session` entity
- add minimal enums/fields needed for connection type, source, and lifecycle
- add services for registration and read access of CA connections
- expose CA connection state in Rider / Organizer Console
- keep current runner and jumbotron paths working as transitional compatibility

### Out Of Scope

- replacing runner pull/result APIs immediately
- full `RidingSignalMessage` push ingestion
- full HTTP fetch snapshot endpoint contract
- `Evidence`, `Session Summary`, `Projection`, `JudgingRecord`, `Award`, `Report`

## Source Constraints

This slice is derived from:

- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-ca-integration-spec.md`
- `docs/grs003/ary-mvp.prd.md`
- `docs/grs003/registration-ca-rules-alignment.taskbook.md`

The highest-priority constraints for this slice are:

1. one `RaceProject` can contain multiple `CAConnection`
2. one `CAConnection` can contain multiple `Session`
3. only registered / handshake-complete / correctly-owned / enabled connections may feed valid downstream data
4. failed or not-configured CA state does not auto-withdraw participation
5. Rider can add `CAConnection` during participation

## Design Decision

### Recommended approach: add CA entities and Console state first, keep ingestion compatibility behind them

There are three realistic approaches:

1. wait until full push/fetch connector implementation:
   highest fidelity, but keeps the repository structurally far from `grs003`
2. add CA entities now and keep ingestion compatibility transitional:
   makes the domain model more true immediately without forcing a one-shot runtime rewrite
3. keep only placeholder UI:
   easiest, but leaves `RaceProject` mostly hollow

This slice uses approach 2.

That means:

- `CAConnection` and `Session` become real entities
- Rider / Organizer views can read and display them now
- current runner-backed flows can still coexist temporarily
- later CA push/fetch work can plug into existing entities instead of inventing them from scratch

## Transitional Semantics

This slice intentionally treats connection and session records as the earliest structural layer, not as the completed ingestion platform.

In this pass:

- `CAConnection` can be created from Console
- a connection starts as `CONNECTED` or `NOT_CONFIGURED` depending on what is known at creation time
- `Session` can be stored as a minimal record of one CA collaboration run
- Console reads connection/session state directly from these tables
- current public projections and runner-based submission data remain separate transitional sources

## Model Shape

### CAConnection

Minimum fields for this slice:

- `id`
- `raceProjectId`
- `caType`
- `ingestionSource`
- `connectorId`
- `connectorVersion`
- `caProjectId`
- `ingestionStatus`
- `registeredAt`
- `disabledAt?`
- `lastSyncedAt?`
- `createdAt`
- `updatedAt`

Key invariants:

- belongs to exactly one `RaceProject`
- one `RaceProject` may have many `CAConnection`
- only enabled connections are candidates for valid downstream ingestion

### Session

Minimum fields for this slice:

- `id`
- `caConnectionId`
- `caSessionId`
- `startedAt`
- `endedAt?`
- `messageCount`
- `toolCallCount`
- `tokenCost`
- `lastActiveAt`
- `createdAt`
- `updatedAt`

Key invariants:

- belongs to exactly one `CAConnection`
- one `CAConnection` may have many `Session`
- raw session remains non-public by default

## Console Impact

### Rider View / CA Setup

Should show:

- current race project
- current CA connections
- add-connection entry
- connection status
- last synced / last active hints where available

### Organizer View / CA Status

Should show:

- rider registrations
- race projects
- connection count
- aggregate connection health hints

## Acceptance Criteria

This slice is complete when:

1. `CAConnection` exists in Prisma and can be created per `RaceProject`
2. `Session` exists in Prisma and can be stored per `CAConnection`
3. Rider Console `ca-setup` shows real `CAConnection` data
4. Organizer Console `ca-status` shows real per-rider `CAConnection` state
5. docs/superpowers status clearly distinguishes “entity exists” from “full push/fetch ingestion not implemented yet”

## Implementation Note

This slice is still a bridge. It makes the domain model more correct without claiming that full CA ingestion is finished.

After this slice, the largest remaining CA-side gaps will still be:

- real push ingestion via `RidingSignalMessage`
- real snapshot fetch
- generation of `Session Summary`
- projection rebuild from CA-backed process data

In the current implementation, Rider Console can already create a minimal `CAConnection` record manually and read back `Session` rows from seeded or stored data. That is enough to make the workspace structurally real before the full connector protocol lands.
