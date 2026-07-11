# GRS004 / Public CA Session 隔离收口 Implementation Plan

## 目标

先收紧公开 `Rider Profile` 与 `Work` 详情页的读取边界：不再直接读 raw Session，Evidence 只暴露 `PUBLIC`。

## 任务拆分

### Task 1: public rider summary 改读 Projection

- [ ] `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 去掉对 `raceProject.caConnections.sessions` 的依赖
  - `performanceSummary.totalTokens` 改读 `COST`
  - `performanceSummary.averageProgressPercent` 改读 `CURRENT_LEADERBOARD`
  - `performanceSummary.riskCount` 改读 `RISK`
- [ ] `listPublicRaces()`
  - 提供 public-safe race read model
  - 首页、`/races`、`/riders`、`/works` 和 `getRaceBySlug()` 改走这条入口
- [ ] `src/app/_components/public/live-hall.tsx`
  - fallback 统计去掉对 raw `sessions` 的直接读取

### Task 2: public evidence visibility 收紧

- [ ] `getWorkBySlug()`
  - `evidenceSummaries` 只返回 `PUBLIC` evidence
- [ ] `getRiderBySlug()`
  - `evidenceCount` 只统计 `PUBLIC` evidence

### Task 3: 补测试

- [ ] `src/lib/services/public-routes.test.ts`
  - raw Session 变化但 Projection 不重建时，public rider summary 不变
  - public work / rider 只暴露 `PUBLIC` evidence
- [ ] `src/app/_components/public/rider-profile-page.test.tsx`
  - 确认 Rider Profile 渲染未坏

### Task 4: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-public-session-isolation-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-public-session-isolation-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/services/public-routes.test.ts src/lib/public-site.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/public/rider-profile-page.test.tsx
npm run build
```

## 完成标准

- public rider summary 不再直接读 raw Session
- public race list / race detail 入口不再把 raw Session 查进 public read path
- public work / rider 只暴露 `PUBLIC` evidence
- 不重建 Projection 时，raw Session 改动不再改变公开表现摘要
- 聚焦测试和构建通过
