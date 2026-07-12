# GRS004 / 大屏风险数据一致性 Implementation Plan

关联设计：`docs/superpowers/specs/2026-07-12-grs004-jumbotron-risk-consistency-design.md`

## 背景

大屏 KPI 显示"1 个风险"，但点开参赛者看不到任何风险，只是一个数字。根因是 KPI 的 `riskCount` 与参赛者条目的 `riskLevel`/`violationCount` 由两条不一致的逻辑计算 —— KPI 覆盖"CA 接入失败 + 反作弊扣分"，而条目只反映"反作弊扣分"。

## 实施步骤

### 步骤 1 — 数据契约扩展 ✅

- [x] `src/lib/jumbotron/track-runtime/types.ts`：`RacingEntrySnapshot` 新增 `riskReason?: string`
- [x] `src/lib/jumbotron/adapter.ts`：`AryRaceData` session 类型新增 `ingestionStatus?`、`riskLevel?`、`riskReason?`

### 步骤 2 — 综合风险推导 ✅

- [x] `mapToRacingEntries()` 在 return 前加入风险合并逻辑（反作弊扣分 / CA 接入失败 / 会话风险）
- [x] return 对象改用派生的 `riskLevel`、`violationCount`、`riskReason`

### 步骤 3 — 查询补齐字段 ✅

- [x] `src/lib/services/race-snapshot.ts`：查询 `caConnections.select` 加 `ingestionStatus`；`sessions.select` 加 `riskLevel`、`riskReason`
- [x] raceData 映射透传上述字段

### 步骤 4 — KPI 从条目派生 ✅

- [x] `buildRaceSnapshot` 计算 `entries` 后覆盖 `kpis.riskCount` / `kpis.violationCount`，与 `onlineRiders`/`activeRiders` 覆盖同处

### 步骤 5 — Attention Items 覆盖会话风险 ✅

- [x] `generateAttentionItems()` 增加对会话 `medium`/`high` 风险的 ticker 条目生成

### 步骤 6 — UI 展示 ✅

- [x] 风险详情面板：过滤出真正有风险的参赛者，新增"风险说明"列 + 彩色徽章 + 空态文案
- [x] 抽屉：风险等级中文标签 + `⚠ {riskReason}` 行
- [x] 新增 `riskLevelLabel()` 辅助函数与 `.jt-risk-badge` / `.jt-kpi-detail__empty` / `.jt-drill__risk` CSS

### 步骤 7 — 验证 ✅

- [x] `tsc --noEmit` 对 4 个改动文件零错误（其余报错均为既有 `.test.ts` mock 类型问题，与本次无关）
- [x] `npm run db:seed` 重新生成快照
- [x] 校验三场进行中赛事：KPI 风险数 == 有风险条目数，且每条都有原因

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `src/lib/jumbotron/track-runtime/types.ts` | `RacingEntrySnapshot.riskReason` |
| `src/lib/jumbotron/adapter.ts` | session 类型扩展、综合风险推导、attention items 会话风险 |
| `src/lib/services/race-snapshot.ts` | 查询/映射补齐字段、KPI 从条目派生 |
| `src/app/jumbotron/[raceId]/JumbotronClient.tsx` | 详情面板/抽屉风险展示、辅助函数、CSS |

## 验收结果

| 赛事 | KPI 风险数 | 有风险条目 | 说明 |
|---|---|---|---|
| `race_active` | 2 | charlie（会话阻塞）、diana（反作弊扣分） | 一致 |
| `race_active_oval` | 1 | diana（token 成本预警） | 一致 |
| `race_story_running` | 1 | orion（CA 接入失败） | **修复的核心场景** |
