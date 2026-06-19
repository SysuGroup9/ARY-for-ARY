# GRS003 CAConnection Runtime Bridge Design

## Purpose

This slice connects the existing `CAConnection / Session / Evidence / Projection` entities to a real runtime ingestion path.

The immediate target is not a full external connector platform. The immediate target is:

- accept CA push-style riding signals
- validate connection ownership and handshake state
- deduplicate by `idempotencyKey`
- update `Session` and `CAConnection` state
- trigger evidence/projection rebuilds

## Scope

### In Scope

- minimal `RidingSignalMessage` ingestion endpoint
- idempotency persistence
- session lifecycle updates from push events
- connection status updates from push events
- rebuild hooks into evidence/projection bridge services

### Out Of Scope

- full connector handshake UX
- real external snapshot fetch orchestration
- complete screen/runtime replacement of runner

## Source Constraints

Derived from:

- `docs/grs003/ary-ca-integration-spec.md`
- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-mvp.prd.md`

Highest-priority constraints:

1. only registered, handshake-complete, correctly-owned, non-disabled connections may produce valid downstream data
2. duplicate pushes must be idempotent
3. raw signal input updates process state, not final result truth
4. failed CAConnection does not auto-withdraw participation

## Design Decision

### Recommended approach: add a minimal ARY-side push bridge now

This slice implements a bounded server-side ingestion bridge:

- a new internal ingestion event store for dedupe/audit
- one push endpoint
- helper-driven mapping from signal -> session/connection updates

This keeps the repository moving toward `grs003` without waiting for the full final connector ecosystem.

## Acceptance Criteria

This slice is complete when:

1. the app can accept a `RidingSignalMessage`-style payload through a dedicated API route
2. repeated pushes with the same idempotency key do not duplicate effects
3. session_started / session_completed / task_progress-style messages can update `Session`
4. connection status changes can update `CAConnection` and `RaceProject.aggregateIngestionStatus`
5. evidence/projection rebuilds can be triggered from successful ingestion

## Implementation Note

In the current implementation:

- Rider-created CA connections receive a generated `connectorSecret`
- Rider-created CA connections now also store `connectorBaseUrl`
- `/api/ca/signals` accepts the minimal bridge schema
- `/api/ca/handshake` accepts the minimal bridge handshake schema
- accepted messages are persisted through `CAIngestionEvent` for idempotency/audit
- session, connection, aggregate status, evidence, and projection updates all happen from one ingestion path
- snapshot fetch can now be applied through `fetchCASessionSnapshotForConnection()` with timestamp freshness checks

This is enough to make process ingestion runtime-real before the later snapshot-fetch and full connector ecosystem arrive.
