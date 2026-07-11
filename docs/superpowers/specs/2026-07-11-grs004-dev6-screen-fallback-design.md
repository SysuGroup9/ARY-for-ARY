# GRS004 / DEV-6 大屏 fallback 机制 Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-6 Screen Console / 大屏联调`
  - 验收：弱网或 Projection 异常时可 fallback 到稳定 Projection 或静态公告 / 榜单
- `docs/grs004/ary-qa-plan.md`
  - `§2.5 Projection 测试`
  - `§2.7 大屏测试`
- `docs/grs004/ary-release-ops-plan.md`
  - `§8.1 Live Hall 不稳定`
  - `§8.2 大屏不稳定`
- `docs/grs004/grs003-gap-analysis.md`
  - `fallback 机制 | ❌ 未解决`

当前代码里已经有：

- `src/lib/services/race-snapshot.ts`
  - `buildRaceSnapshot()`
  - `generateRaceSnapshot()`
  - `loadRaceSnapshot()`
- `public/assets/snapshots/*.json`
  - 已存在稳定快照文件能力

但实际读取路径仍然是：

- `src/app/races/[raceSlug]/live/page.tsx`
- `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
- `src/app/jumbotron/[raceId]/page.tsx`

直接 `buildRaceSnapshot()`，异常时不会优先读取最近一次稳定快照，也不会继续切到静态公告 / 榜单。

本轮目标是：**把“先读实时快照，失败后退到最近一次稳定快照，再失败退到静态公告 / 榜单”的 fallback 逻辑真正接到 Live Hall、大屏控制台预览和 Jumbotron 展示路径。**

## 范围

### 本轮纳入

- 新增统一读取 helper：
  - `resolveRaceSnapshotForDisplay()`
- 成功读取实时 snapshot 时，刷新本地稳定 snapshot 文件
- 失败时优先读取已有稳定 snapshot
- 无稳定 snapshot 时，回退到静态展示
- 接入页面：
  - `Live Hall`
  - `Screen Console` 的 Jumbotron 预览
  - `/jumbotron/[raceId]`

### 本轮不纳入

- 不新增数据库 schema
- 不新增独立的大屏 fallback 持久化状态模型
- 不新增新的 Projection 类型
- 不把 `announcement / leaderboard / works` 模式重构成独立大屏播放页
- 不做自动切换日志或操作员确认流

## 约束

### 文档约束

- fallback 必须优先读最近一次稳定 Projection，不直接回读原始 CA Session
- Projection 不可用时允许展示：
  - 静态赛事状态
  - 阶段公告
  - 静态榜单
  - 已公开作品入口
- fallback 不得污染核心事实数据

### 当前代码现实

- `generateRaceSnapshotAction()` 已存在，说明“稳定快照文件”不是新概念
- `LiveHallView` 当前即使 Projection 缺失，也已有一部分 registration/session 级静态兜底
- `JumbotronInline` 在 snapshot 或 trackProfile 缺失时直接不渲染
- `/jumbotron/[raceId]` 在没有可用 snapshot 时只会返回通用报错提示

因此本轮应遵循：

1. **不重做大屏架构**
2. **优先复用现有 snapshot 文件**
3. **把 fallback 做在读取路径，不改事实生成链**

## 方案选择

### 方案 A：读取路径统一 fallback

做法：

- `resolveRaceSnapshotForDisplay()`
  - 先尝试 `buildRaceSnapshot()`
  - 成功则刷新稳定 snapshot 文件
  - 失败则读 `loadRaceSnapshot()`
  - 仍失败则返回静态 fallback
- Live Hall / Screen Console / Jumbotron 统一消费这组结果

优点：

- 直接命中文档验收点
- 复用现有 snapshot 文件能力
- 不需要引入新的状态机或表

缺点：

- fallback 仍依赖磁盘上的最近一次成功 snapshot
- 还没有“谁触发了 fallback”的持久审计

### 方案 B：引入独立 fallback projection / operator state

优点：

- 可以把切换状态、原因和操作员动作建模得更完整

缺点：

- 超出 `DEV-6` 当前最小验收
- 会把“展示稳定性”问题扩成新的模型工程

### 推荐方案

采用 **方案 A：读取路径统一 fallback**。

## 运行时规则

### 1. 统一 snapshot 读取

`resolveRaceSnapshotForDisplay(raceId)`：

1. 尝试 `buildRaceSnapshot(raceId)`
2. 成功时：
   - 返回 `source = live`
   - 同步刷新 `public/assets/snapshots/{raceId}.json`
3. 失败时：
   - 尝试 `loadRaceSnapshot(raceId)`
   - 若存在，返回 `source = stable`
4. 若稳定 snapshot 也不存在：
   - 返回 `source = static`

### 2. Live Hall

- `Live Hall` 页面不再直接依赖 `buildRaceSnapshot()`
- 若 `source = stable`
  - 显示“当前预览回退到最近一次稳定快照”
- 若 `source = static`
  - 不再空白
  - 展示静态公告 / 榜单 / 公开作品入口

### 3. Screen Console 预览

- Jumbotron 预览不再直接失败
- 若 `source = stable`
  - 显示稳定快照提示
- 若 `source = static`
  - 显示静态 fallback 摘要
  - 引导切到 `announcement / leaderboard` 模式

### 4. `/jumbotron/[raceId]`

- 若目标赛事可生成 snapshot 且可解析 trackProfile
  - 继续使用 Jumbotron 赛道展示
- 若目标赛事 snapshot 不可用或赛道资源不可用
  - 直接展示全屏静态 fallback
  - 不再只显示通用错误文案
- banner 中若某个赛事只剩稳定 snapshot
  - 保留该赛事
  - 标记为 `稳定快照 fallback`

## 用户可见变化

本轮落地后，用户现在能直接看到：

1. `Live Hall`
   - 大屏预览异常时不再整块消失
   - 会明确提示“稳定快照 fallback”或“静态 fallback”
2. `Screen Console`
   - Jumbotron 预览失败时会出现静态兜底说明和切换入口
3. `/jumbotron/[raceId]`
   - 目标赛事的大屏失败时会显示全屏静态公告 / 榜单，而不是仅剩错误提示

## 测试对齐

需要覆盖：

- `src/lib/services/race-snapshot.test.ts`
  - live -> stable -> static 三段 fallback 规则
- `src/app/_components/public/live-hall.test.tsx`
  - 无稳定快照时显示静态 fallback 和公开链接
- `src/app/_components/console/console-copy.test.tsx`
  - Screen Console 出现公告 / 榜单 fallback 引导

验证命令：

```bash
node --import tsx --test src/lib/services/race-snapshot.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx
npm run build
```

## 验收对齐

本轮完成后，需要能证明：

1. Live Hall / Screen Console / Jumbotron 不再直接硬依赖实时 snapshot
2. 实时 snapshot 读取成功时会刷新最近一次稳定 snapshot
3. snapshot 构建失败时会优先退到稳定 snapshot
4. 稳定 snapshot 不可用时会继续退到静态公告 / 榜单 / 公开作品入口
5. fallback 不读取原始 CA Session，也不修改核心事实数据

## 一句话结论

`DEV-6` 这轮要解决的不是“大屏长什么样”，而是：*大屏和 Live Hall 在 Projection 或 snapshot 失败时，还能继续稳定显示。*

## 已落地实现补记（2026-07-11）

- `src/lib/services/race-snapshot.ts`
  - 已新增 `resolveRaceSnapshotForDisplay()`
  - 实时 snapshot 成功时现在会刷新稳定 snapshot 文件
- `src/app/races/[raceSlug]/live/page.tsx`
  - 已切到统一 fallback 读取
- `src/app/_components/public/live-hall.tsx`
  - 已新增稳定快照提示与静态 fallback 展示
- `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
  - Jumbotron 预览已切到统一 fallback 读取
- `src/app/_components/console/screen-console-page.tsx`
  - 已新增静态 fallback 提示与公告 / 榜单切换入口
- `src/app/jumbotron/[raceId]/page.tsx`
  - 目标赛事不可生成 snapshot 时，已改为全屏静态 fallback
- `src/app/JumbotronBanner.tsx`
  - 稳定 snapshot 条目现在会显示 `稳定快照 fallback` 标识
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/services/race-snapshot.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx`
  - `npm run build`
