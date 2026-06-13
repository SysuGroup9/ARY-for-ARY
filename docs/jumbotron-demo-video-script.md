# GRS-002 Jumbotron Demo Video Script

Target length: 3-5 minutes.

Current committed delivery is a no-audio captioned video:

```text
outputs/grs002-jumbotron-captioned-demo.webm
docs/grs002-captioned-demo.zh.srt
```

The subtitle text replaces voiceover in the automated recording.

## 0:00-0:30 Problem Framing

Show `/jumbotron?debug=1`.

Talk track:

- Jumbotron is a public race live screen for audience, organizers, teachers and TAs.
- It does not show full Coding Agent sessions, terminal logs or private code.
- The screen answers: race progress, leaders, key messages, resource usage and risks.

## 0:30-1:30 Race Live View

Show:

- Header: title, LIVE, round, phase, elapsed time.
- KPI cards: completion, active riders, total tokens, Codex / Claude split.
- TOP3 cards and Entry Inspect drill-down.
- Main track with moving entries.
- Riding Message bubbles and bottom ticker.
- Risk / obstacle / violation items.

Talk track:

- Horse markers are not baked into the background.
- Positions come from `roundProgress`, explicit `track.profile.json` centerline, tangent, normal and lane offset.
- Debug mode overlays centerline, sampled points, lane paths, risk zones and collision boxes.

## 1:30-2:15 Track Switching

Open:

- `/jumbotron?track=city-hairpin&debug=1`

Talk track:

- Same Race Live View uses a different profile.
- Runtime recomputes horse pose from the new centerline and lane offsets.
- This proves the subsystem is profile-driven, not hard-coded for one image.

## 2:15-3:35 Calibrator Flow

Open `/jumbotron/calibrator`.

Show:

- Existing background and semantic overlays.
- Drag a centerline point.
- Toggle closed / open path or reverse direction.
- Change a lane offset.
- Set start / finish at the scrubber.
- Add, rename or move a checkpoint at the scrubber.
- Add or edit a lane.
- Add a message zone, no bubble zone and risk zone.
- Run validation by showing the validation panel.
- Show JSON diff preview.
- Export JSON and Export Debug SVG.
- Mention the committed captioned browser recording at `outputs/grs002-jumbotron-captioned-demo.webm` and the short smoke demo at `outputs/grs002-jumbotron-silent-demo.webm`.

Talk track:

- Calibrator and Jumbotron reuse `track-runtime`.
- The exported profile is the runtime source of truth.
- AI can create candidate background and points, but runtime trust comes from validated profile data.

## 3:35-4:20 Data Boundary

Show `docs/jumbotron-mvp.md` and `src/lib/jumbotron/adapter.ts`.

Talk track:

- `buildJumbotronSnapshotFromRace` maps existing DCR race data to runtime input.
- If local Prisma data is unavailable, demo falls back to mock snapshot for repeatable presentation.
- Real data source, permissions and remote cockpit semantics stay owned by DCR main app.

## 4:20-5:00 Agent Riding Record

Show `riding_record/agent_riding_jumbotron_grs002.md`.

Talk track:

- Agent generated runtime, UI, assets, tests and docs.
- Human review identified the first MVP could not score high because video, Riding Record, Calibrator zones and dynamic demo were missing.
- The sprint added scoring matrix, runtime correctness, Calibrator evidence, demo script and verification.

## Recording Checklist

- Browser zoom: 90%-100%.
- Use a 16:9 viewport, preferably 1440x810 or 1920x1080.
- Keep `/jumbotron?debug=1` open long enough to show movement.
- Demonstrate `/jumbotron?track=city-hairpin&debug=1`.
- Demonstrate Calibrator export buttons.
- End with verification commands and PoC boundaries.
