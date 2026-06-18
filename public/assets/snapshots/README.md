# Jumbotron Snapshots

此目录存放由 `generateRaceSnapshot()` 生成的赛事快照 JSON 文件。

## 生成方式

Organizer 在 ARY 首页点击「生成 Jumbotron 快照」按钮，
Server Action 从 Prisma 查询赛事全量数据 → Adapter 映射 → 写入此目录。

## 文件格式

每个快照文件名为 `<raceId>.json`，内容格式参见 `RacingEntrySnapshot` 接口定义。

## Seed 数据

`npm run db:seed` 会自动生成三个赛事的快照：
- `race_active.json` — 8 队竞速中
- `race_signup.json` — 3 队报名中
- `race_finished.json` — 6 队已结束

## Mock 数据说明

| 字段 | 来源 | 说明 |
|------|------|------|
| roundProgress | LeaderboardEntry 排名映射 | 第1名≈85%, 最后一名≈15% |
| overallProgress | TeamArchive.totalScore / maxScore | 基于最高分提交 |
| phaseProgress | = roundProgress (mock) | DC 接入后替换 |
| currentPhase | "DEV" (mock) | DC 接入后替换 |
| costUsd | tokenUsed × 0.0001 (mock 费率) | DC 接入后替换 |
| RidingMessage | 来自 FeedbackThread + mock 生成 | 真实反馈优先，无反馈则 mock |
| AttentionItem | antiCheatPenalty > 0 推导 + mock 风险 | 半真实 |
