# GRS-002 Rehearsal Report

## Latest Automated Rehearsal

Status: `PASS`

Last run: `2026-06-13 21:03:00 +08:00`

Command:

```bash
node scripts/grs002-rehearsal-check.mjs
```

Routes checked:

- `/jumbotron`
- `/jumbotron?debug=1`
- `/jumbotron?track=city-hairpin&debug=1`
- `/jumbotron/calibrator`

Expected checks:

- HTTP status is 200 for all routes.
- Race Live View includes TOP3, Entry Inspect, running state and seed demo teams.
- Debug route includes debug geometry layers.
- Calibrator includes Add Lane, Set Start / Finish, Export JSON and Use in Jumbotron controls.

Observed result:

```text
ok http://127.0.0.1:3000/jumbotron
ok http://127.0.0.1:3000/jumbotron?debug=1
ok http://127.0.0.1:3000/jumbotron?track=city-hairpin&debug=1
ok http://127.0.0.1:3000/jumbotron/calibrator
```

Primary captioned no-audio recording:

```text
outputs/grs002-jumbotron-captioned-demo.webm
size: 17,425,594 bytes
docs/grs002-captioned-demo.zh.srt
size: 2,599 bytes
```

Short smoke recording:

```text
outputs/grs002-jumbotron-silent-demo.webm
size: 1,469,042 bytes
```

The video files are committed with `git add -f` because the team explicitly requires video artifacts in the branch. The captioned video is the primary evidence; the short silent recording is retained as a quick smoke demo.

## Manual Rehearsal Checklist

- [ ] Start from a fresh seed with `npm run db:seed`.
- [ ] Open `/jumbotron?debug=1` and wait for motion.
- [ ] Click at least one TOP3 `Inspect entry` button.
- [ ] Switch to `/jumbotron?track=city-hairpin&debug=1`.
- [ ] Open `/jumbotron/calibrator`.
- [ ] Drag a centerline point.
- [ ] Use `Set Start / Finish at Scrubber`.
- [ ] Add or edit one lane.
- [ ] Add or move one checkpoint.
- [ ] Add one risk zone and show validation/diff.
- [ ] Export JSON and debug SVG.
- [ ] Close server after rehearsal.

## Human Notes Placeholder

Append final recording observations here:

```text
Date:
Recorder:
Video URL:
Captioned local artifact: `outputs/grs002-jumbotron-captioned-demo.webm`
Issues found:
Fixes made:
Final decision:
```
