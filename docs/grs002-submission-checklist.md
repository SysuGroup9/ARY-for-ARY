# GRS-002 Jumbotron Submission Checklist

## Current Submission State

本清单用于对照 `ARY GRS 002 Jumbotron 评审标准` 准备最终提交。当前冲刺先完成除“实际录制视频”和“人工现场演示”之外的交付物。

| Gate | Status | Evidence |
|---|---|---|
| 可运行 Jumbotron / Race Live View | Done | `/jumbotron`, `/jumbotron?debug=1`, `/jumbotron?track=city-hairpin&debug=1` |
| Calibrator / 赛道校准流程 | Done | `/jumbotron/calibrator` |
| 非写死位置与数据驱动 | Done | `src/lib/jumbotron/track-runtime.ts`, `src/lib/jumbotron/track-profile.ts`, `src/lib/jumbotron/adapter.ts` |
| 短视频 | Pending recording | `docs/jumbotron-demo-video-script.md` 已给出 3-5 分钟脚本 |
| Riding Record | Done | `riding_record/agent_riding_jumbotron_grs002.md` |

## Runtime Demo Entrypoints

```bash
npm install
npm run db:generate
npm run db:seed
npm run dev
```

推荐验收入口：

- `/jumbotron`: 使用本地 DCR seed race；数据库不可用时自动 fallback 到 mock snapshot。
- `/jumbotron?debug=1`: 展示 centerline、sampled points、lane offsets、risk zones、collision boxes 和 lane fallback 信息。
- `/jumbotron?track=city-hairpin&debug=1`: 切换第二条 open-track 资产，证明 runtime 不依赖单条赛道。
- `/jumbotron/calibrator`: 导入底图 / profile，编辑 centerline、start/finish、direction、lanes、checkpoints、message zones、no-bubble zones、risk zones，Validate 后导出 JSON / debug SVG。

## Rubric Evidence Map

| Rubric Item | Evidence |
|---|---|
| 问题理解与系统边界 | `docs/jumbotron-mvp.md`, `plan/2026-06-13-01-jumbotron-as-sprint.md`, `ROADMAP.md` |
| Race Live View 运行体验 | `/jumbotron`, TOP3 cards, KPI strip, main track, mini map, ticker, Entry Inspect panel |
| Calibrator 与赛道资产生产 | `/jumbotron/calibrator`, `assets/tracks/*/track.profile.json`, `assets/tracks/*/preview.png`, `assets/tracks/*/notes.md` |
| track-runtime / 数据契约 | `src/lib/jumbotron/contracts.ts`, `track-profile.ts`, `track-runtime.ts`, `adapter.ts`, `mock-racing-data.ts` |
| Demo 与短视频表达 | `docs/jumbotron-demo-video-script.md`; actual recording is intentionally deferred |
| Agent Riding Skill | `riding_record/agent_riding_jumbotron_grs002.md`, `ROADMAP.md` iteration log |
| 文档与工程交付性 | `docs/jumbotron-mvp.md`, this checklist, README Jumbotron section |

## Data Story

`npm run db:seed` creates a semi-real DCR race story for `race_sort_demo`:

- 4 teams with different agent providers and token usage.
- Public leaderboard projections with rank and score.
- Submissions in `PULLED`, `SCORED`, `FAILED`, and `QUEUED` states.
- Runner tasks in `CLAIMED`, `SUCCEEDED`, `FAILED`, and `QUEUED` states.
- Feedback threads that become Riding Message bubbles.
- Notifications that become ticker items.
- Team comments, harness entries and riding highlights for public projection context.

If local Prisma cannot load, `buildJumbotronSnapshotFromRace(null, track)` falls back to `buildMockJumbotronSnapshot(track, now)` so the Jumbotron route remains demonstrable.

## Calibrator Flow Checklist

1. Open `/jumbotron/calibrator`.
2. Import or use the bundled background.
3. Add / drag / delete centerline points.
4. Set `Start / Finish at Scrubber`, choose direction and open / closed path.
5. Add, rename, offset or delete lanes.
6. Add, rename, move or delete checkpoints.
7. Add / edit / delete message zones, no-bubble zones and risk zones.
8. Use Play / Progress / Horses / Speed to preview multiple horses.
9. Check Validation Results and JSON Diff Preview.
10. Export `track.profile.json` and `debug-preview.svg`.
11. Use `Use in Jumbotron` to open the runtime debug route for bundled profiles.

## Known PoC Boundaries

- Actual video recording remains to be done.
- The Calibrator exports local JSON / SVG; it does not persist edits to the database.
- Remote Racing Cockpit is represented by the race URL exposed in seed data; full cockpit authorization is outside this PoC.
- The runtime is a 2D SVG semantic track renderer, not a full physics engine.
