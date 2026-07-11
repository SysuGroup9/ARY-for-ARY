# GRS004 / Public CA Session 隔离收口 Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.prd.md`
  - `原始 CA Session 默认不公开`
  - `公开端只读取 Projection、Evidence 摘要、已公开 Work、已发布 Award、已发布且公开可见的 Report 或公开 Rider Profile`
- `docs/grs004/ary-permission-matrix.md`
  - `Public 不能访问后台、原始 CA Session`
  - `公开端永不读取原始 CA Session`
- `docs/grs004/ary-qa-plan.md`
  - `Public 不能访问后台、原始 CA Session`
- `docs/grs004/grs003-gap-analysis.md`
  - `CA Session 不公开 | 🔶 可见性字段已设计，运行时隔离待核实`

当前代码里存在两个最直接的公开越界点：

1. `src/lib/services/public-routes.ts -> getRiderBySlug()`
   - 直接读取 `raceProject.caConnections.sessions`
   - 用原始 Session 计算 `performanceSummary`
2. `src/lib/services/public-routes.ts -> getWorkBySlug()`
   - 直接把 `registration.evidences` 全量映射到公开 Evidence 摘要
   - 没有按 `Evidence.visibility` 过滤

本轮目标是：**先把公开 `Rider Profile` 和 `Work` 详情页这两条最直接的公开读取链收紧到“只读 Projection / PUBLIC evidence / published report”，不再直接消费 raw Session。**

## 范围

### 本轮纳入

- `getRiderBySlug()`
  - 不再直接读取 Session
  - `performanceSummary` 改从 `Race.projections` 读取
- `getWorkBySlug()`
  - `evidenceSummaries` 只暴露 `visibility = PUBLIC`
- `Rider Profile`
  - `evidenceCount` 只计算 `PUBLIC` evidence

### 本轮不纳入

- 不重做整个 `listRaces()` 共享 read model
- 不重构 `Live Hall / Jumbotron` 的内部 snapshot 生成方式
- 不处理 Judge / Organizer 内部视图的 Session 读取
- 不新增新的可见性 schema

## 约束

### 文档约束

- Public 可以看公开 Rider Profile、Work、Results、Review
- Public 不应直接读 raw Session
- Evidence 需要尊重可见性边界

### 当前代码现实

- `Race.projections` 已经有：
  - `CURRENT_LEADERBOARD`
  - `COST`
  - `RISK`
- `Evidence.visibility` 已存在
- 种子中已经存在 `visibility = PUBLIC` 的 Work evidence

因此本轮应遵循：

1. **先收最直接的公开详情页**
2. **优先复用 Projection 与 visibility 字段**
3. **不把这次切片夸大成“全站完全不读 Session”**

## 方案选择

### 方案 A：公开 Rider / Work 详情页切到 Projection + PUBLIC evidence

做法：

- `getRiderBySlug()`
  - 改成 public-safe query
  - `performanceSummary.totalTokens`
    - 从 `COST` projection 读
  - `performanceSummary.averageProgressPercent`
    - 从 `CURRENT_LEADERBOARD` projection 读
  - `performanceSummary.riskCount`
    - 从 `RISK` projection 读
- `getWorkBySlug()`
  - 只返回 `PUBLIC` evidence summaries

优点：

- 直接收掉最明显的 public 越界点
- 和权限矩阵、PRD 文案完全一致
- 不需要新 schema

缺点：

- `listRaces()` 共享 read model 仍未完全 public-safe 化
- `Live Hall / Jumbotron` 仍有后续空间

### 方案 B：先重做整个 public read model

优点：

- 可以一次性把 public 边界彻底独立出来

缺点：

- 范围过大
- 容易拖慢按文档逐项收口的节奏

### 推荐方案

采用 **方案 A：先收公开 Rider / Work 详情页**。

## 运行时规则

### 1. Public Rider Profile

- `getRiderBySlug()` 不再读取：
  - `raceProject.caConnections.sessions`
- 改为读取：
  - `Race.projections`
  - `PUBLIC evidences`
  - published reports

### 2. Public Work

- `evidenceSummaries`
  - 只返回 `visibility = PUBLIC`
- `INTERNAL` evidence 不再进入公开 Work 页面

### 3. 验证边界

若只篡改 raw Session、但不重建 Projection：

- 公开 Rider Profile 的表现摘要不应变化

这能证明公开路由不再直接依赖 raw Session。

## 用户可见变化

本轮落地后，用户现在能直接感知到：

1. `Rider Profile`
   - 表现摘要继续可见
   - 但已不再直接依赖 raw Session
2. `Work` 详情页
   - “公开证据”区域只显示 `PUBLIC` evidence
   - `INTERNAL` evidence 不再混进公开页面

## 测试对齐

需要覆盖：

- `src/lib/services/public-routes.test.ts`
  - raw Session 改动但 projection 不重建时，public rider summary 不变化
  - public work / rider 只暴露 `PUBLIC` evidence
- `src/app/_components/public/rider-profile-page.test.tsx`
  - 继续保证公开 Rider Profile 渲染未坏

验证命令：

```bash
node --import tsx --test src/lib/services/public-routes.test.ts src/app/_components/public/rider-profile-page.test.tsx
npm run build
```

## 验收对齐

本轮完成后，需要能证明：

1. `public rider profile` 不再直接读 raw Session
2. `public work` 只暴露 `PUBLIC` evidence
3. `public rider profile` 的 `evidenceCount` 只统计 `PUBLIC` evidence
4. 仅修改 raw Session 而不重建 Projection，不再改变公开表现摘要
5. 聚焦测试与构建通过

## 一句话结论

这轮还没有把整个 public 层完全重写，但公开首页、索引页和详情页的赛事入口已经开始统一走 public-safe read model。

## 已落地实现补记（2026-07-11）

- `src/lib/services/public-routes.ts`
  - 已新增：
    - `listPublicRaces()`
  - 首页、`/races`、`/riders`、`/works` 和 `getRaceBySlug()` 现在都可走 `public-safe` race read model
  - `getRiderBySlug()` 已改为：
    - 不再直接读 Session
    - `performanceSummary` 改读 `CURRENT_LEADERBOARD / COST / RISK`
  - `getWorkBySlug()` 已改为：
    - `evidenceSummaries` 只暴露 `PUBLIC` evidence
- `src/app/_components/public/live-hall.tsx`
  - fallback 统计已进一步去掉对 `sessions` 的直接读取
  - 缺少 projection 时只回退到：
    - `registrationStatus`
    - `aggregateIngestionStatus`
    - `caConnectionCount`
- `src/lib/services/public-routes.test.ts`
  - 已新增：
    - raw Session 变化但 Projection 不重建时，public rider summary 不变
    - public work / rider 只暴露 `PUBLIC` evidence
    - `getRaceBySlug()` 返回的 public race 不再带 raw `sessions`
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/services/public-routes.test.ts src/lib/public-site.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/public/rider-profile-page.test.tsx`
  - `npm run build`
