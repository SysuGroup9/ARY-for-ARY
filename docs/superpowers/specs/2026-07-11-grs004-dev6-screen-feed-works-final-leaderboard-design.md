# GRS004 / DEV-6 Screen Feed Works + Final Leaderboard Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `screen_feed_projection`
    - `Screen Console / 大屏 | Live、current_leaderboard_projection、leaderboard_read_model、Works、Announcement 的大屏专用投影`
  - `screen_feed_projection 应区分 feed item 类型`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `screen_feed_projection、current_leaderboard_projection、leaderboard_read_model、Announcement`
  - `Screen Display / Screen Console 可以按展示模式显示过程榜或最终榜，但必须区分 feed item 类型和赛事状态`

当前代码已经有：

- `ProjectionType.SCREEN_FEED`
- `buildScreenFeedProjectionPayload()`
- `rebuildRaceProcessProjections()`
- `BillboardDisplayView`

但当前 `SCREEN_FEED` 只产出：

- `announcement`
- `session_summary`
- `current_leaderboard_projection`

还没有兑现文档里已经明确列出的：

- `leaderboard_read_model`
- `Works`

## 范围

### 本轮纳入

- 扩 `SCREEN_FEED` item 类型
  - `leaderboard_read_model`
  - `works`
- `rebuildRaceProcessProjections()` 开始产出这两类 item
- `BillboardDisplayView` 显示这两类新标签

### 本轮不纳入

- 不新增新的 ProjectionType
- 不重写 `Results` 或 `Works` 页面
- 不做复杂的 works carousel / 最终榜细节卡

## 当前缺口

### 1. 文档里的 `SCREEN_FEED` 构成比当前实现更完整

文档已经明确把以下几类都列进大屏专用 feed：

- Live
- `current_leaderboard_projection`
- `leaderboard_read_model`
- Works
- Announcement

但当前实现只覆盖了其中一部分。

### 2. 现在 Billboard 还不能显式区分“最终榜 feed”和“作品 feed”

当前 billboard 虽然已经开始读 `SCREEN_FEED`，但 feed item 标签里还没有：

- `最终榜`
- `作品`

因此还没有完全兑现“区分 feed item 类型”的要求。

## 方案选择

### 方案 A：继续维持当前 3 类 feed

优点：

- 改动最小

缺点：

- 与文档的显式构成不一致

### 方案 B：按现有文档最小扩两类 feed

优点：

- 正好补齐文档里已经写出的缺口
- 不需要新增新模型

缺点：

- 需要在 projection rebuild 时多读一点现有事实数据

### 推荐方案

采用 **方案 B：在现有 `SCREEN_FEED` 上最小扩出 `leaderboard_read_model` 与 `works` 两类 item**。

## 运行时规则

### `leaderboard_read_model`

- 只在存在已发布 `Award` 时产出
- 只表达“最终榜可用”
- 不把过程榜和最终榜混成一个标签

### `works`

- 只在存在公开 `Work` 时产出
- 只表达“公开作品可用”
- 不读取隐藏或未公开作品

## 页面变化

`Billboard` 里新增可见标签：

- `最终榜`
- `作品`

这样和现有：

- `公告`
- `过程榜`
- `Session 摘要`

一起组成更完整的 `Screen Feed`。

## 测试对齐

需要覆盖：

- `src/lib/services/screen-feed-projection.test.ts`
  - `SCREEN_FEED` 产出 `leaderboard_read_model`
  - `SCREEN_FEED` 产出 `works`
- `src/app/_components/public/billboard-display.test.tsx`
  - billboard 可见：
    - `最终榜`
    - `作品`

## 验收对齐

本轮完成后，需要能证明：

1. `SCREEN_FEED` 已覆盖文档里新增要求的两类 item
2. Billboard 页面可显式区分：
   - `过程榜`
   - `最终榜`
   - `作品`

## 一句话结论

这一刀要解决的不是“Billboard 还有没有卡片”，而是：既然文档已经把 `leaderboard_read_model` 和 `Works` 写进 `screen_feed_projection`，那这两类 feed 就应该真正进入 projection 和页面，而不是只停留在描述里。
