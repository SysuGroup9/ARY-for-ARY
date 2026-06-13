# GRS-002 Demo Storyboard And Voiceover

## Scene Plan

| Time | Screen | Action | Voiceover |
|---:|---|---|---|
| 0:00-0:20 | `/jumbotron?debug=1` | Show full screen. | "This is the ARY Race Live Jumbotron. It is a public event screen, not a private session viewer." |
| 0:20-0:55 | Race Live header/KPI/TOP3 | Point to title, live phase, KPIs and TOP3. | "Audience and organizers can quickly see the race state, leaders, active riders, token usage and risk counts." |
| 0:55-1:35 | Main track | Let horses move; click a TOP3 entry. | "Horse positions come from `roundProgress`, the semantic track profile, tangent, normal and lane offset. They are not painted into the background." |
| 1:35-2:00 | Entry Inspect | Show selected entry details. | "Entry Inspect explains the public projection: rank, provider, tokens, progress source, latest message and attention items." |
| 2:00-2:30 | `/jumbotron?track=city-hairpin&debug=1` | Switch track. | "The same runtime can load another profile. This proves the system is profile-driven and reusable." |
| 2:30-3:45 | `/jumbotron/calibrator` | Drag point, set start/finish, edit lane/checkpoint/zone, show validation/diff. | "The Calibrator turns a visual background into a validated `track.profile.json` used by the runtime." |
| 3:45-4:20 | Docs/code tabs | Show adapter/runtime docs. | "The adapter maps semi-real DCR seed data into Racing Entry snapshots, messages, KPIs and attention items." |
| 4:20-5:00 | Riding Record | Show process record. | "The record captures plan, agent output, human interventions, mistakes, corrections and verification." |

## Subtitle Draft

1. ARY Jumbotron is a public race live screen.
2. It summarizes progress, leaders, messages, resources and risks.
3. Horse positions are data-driven by `roundProgress` and `track.profile.json`.
4. Debug mode exposes centerline, lane offsets, risk zones and collision boxes.
5. Entry Inspect gives a safe drill-down without exposing private sessions.
6. The Calibrator validates the asset pipeline from background to semantic profile.
7. Seed data demonstrates a semi-real DCR story with teams, Runner tasks and feedback.
8. The Riding Record documents agent collaboration and human correction.

## Manual Recording Notes

- Use 16:9 browser window.
- Keep browser zoom at 90%-100%.
- Do not show terminal secrets or `.env`.
- Keep each scene short; avoid reading long docs line by line.
- End by stating the PoC boundaries clearly.

## Silent Demo Asset

The automated no-audio recording should be generated at:

```text
outputs/grs002-jumbotron-silent-demo.webm
```

Use it as raw material for final voiceover or editing. Do not commit the binary video to Git unless the team explicitly decides to store large media in the repository.
