# Jumbotron MVP Implementation

## Scope

This implementation lands the MVP from `Jumbotron子系统定义.md` and `Jumbotron信息架构.md` without changing the Prisma schema.

Implemented:

- `/jumbotron`: public Race Live View.
- `/jumbotron?debug=1`: geometry debug mode.
- `/jumbotron?track=city-hairpin`: alternate sample track.
- `/jumbotron/calibrator`: design-time Track Profile Calibrator.
- `src/lib/jumbotron/track-runtime.ts`: shared runtime for Jumbotron and Calibrator.
- `src/lib/jumbotron/adapter.ts`: DCR race data to Jumbotron snapshot adapter.
- `assets/tracks/*/track.profile.json`: two sample semantic track profiles.
- `public/jumbotron/tracks/*/background.svg`: visual-only track backgrounds.

Not implemented in MVP:

- Real Remote Racing Cockpit drill-down authorization.
- Persistent Calibrator save workflow.
- AI asset generation pipeline automation.
- Complex physics or 3D rendering.

## Data Flow

```text
RaceListItem from DCR
  -> buildJumbotronSnapshotFromRace
  -> RacingEntrySnapshot[]
  -> buildTrackRuntime(track.profile)
  -> calculateHorsePose(roundProgress + lane offset)
  -> Race Live View SVG layers
```

The visual background is never used as a geometry source. Horse positions are derived only from `roundProgress`, explicit centerline points, tangent, normal and lane offset.

## Runtime Contracts

Core contracts live in:

- `src/lib/jumbotron/contracts.ts`
- `src/lib/jumbotron/track-profile.ts`

Track profiles are validated with Zod and additional geometry checks:

- minimum point count for open / closed tracks
- lane id and offset uniqueness
- path length threshold
- invalid zone ranges
- sharp turn and long segment warnings

## Calibrator

The Calibrator reuses `track-runtime` for preview. It supports:

- background import
- candidate profile import
- centerline point add / drag / delete
- closed / open path toggle
- path direction reversal
- lane offset editing
- checkpoint creation at current scrubber progress
- single and multi-horse preview
- validation results
- JSON export

## Verification

```bash
node --import tsx --test src/lib/jumbotron/*.test.ts
npm run lint
npm run build
```

