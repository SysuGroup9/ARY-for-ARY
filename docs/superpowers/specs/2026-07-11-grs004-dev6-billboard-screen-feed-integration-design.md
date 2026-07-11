# GRS004 / DEV-6 Billboard Screen Feed Integration Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Billboard`
    - 信息看板视图
    - 偏榜单、公告、状态信息
  - `screen_feed_projection`
    - 大屏展示数据聚合
    - `Screen Console / 大屏 | Live、current_leaderboard_projection、leaderboard_read_model、Works、Announcement 的大屏专用投影`
  - `screen_feed_projection 应区分 feed item 类型`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display`
    - `Billboard`
  - `Screen Console`
    - `当前 Race、当前 Display Mode`
    - `Jumbotron、Billboard、Live、Leaderboard、Works、Announcement`
    - `Theme、Calibration、Fallback`
  - `进行中状态`
    - `Jumbotron / Billboard`
    - `选手进度`
    - `活跃动态`
    - `风险事件`
    - `当前排行榜`
    - `阶段公告`

当前代码已经有：

- `ProjectionType.SCREEN_FEED`
- `rebuildRaceProcessProjections()`
- `/screen/{raceSlug}/billboard`
- `BillboardDisplayView`

但当前 `BillboardDisplayView` 仍主要直接拼：

- `awards`
- `latestAnnouncement`
- `ridingSkillHighlights`
- `riskCount`

还没有真正消费已有的 `SCREEN_FEED` 大屏专用投影。

## 范围

### 本轮纳入

- `BillboardDisplayView` 开始消费 `SCREEN_FEED`
- 在 billboard 页面中显式展示 feed item 类型
- 保留现有：
  - Award 摘要
  - latest announcement
  - risk summary

### 本轮不纳入

- 不新增新的 ProjectionType
- 不重写 `rebuildRaceProcessProjections()`
- 不改 `Live / Leaderboard / Works Display`
- 不做 Jumbotron / Billboard 高级配置

## 当前缺口

### 1. 文档已经有 `screen_feed_projection`，但 Billboard 还没真正消费

当前仓库里：

- `ProjectionType.SCREEN_FEED` 已存在
- projection rebuild 已产出 `announcement / session_summary / current_leaderboard_projection`

但 `BillboardDisplayView` 还没有把这些 items 作为主输入展示出来。

### 2. Billboard 作为“信息看板”还不够显式表达 feed item 类型

文档明确要求：

- `screen_feed_projection` 要区分 feed item 类型

当前 billboard 只是在不同卡片里混合展示，不够像真正的 `Billboard` 信息看板。

## 方案选择

### 方案 A：继续沿用当前 direct read model 拼装

优点：

- 不需要动当前 Billboard 结构

缺点：

- 没有兑现 `screen_feed_projection` 的文档语义
- `Billboard` 和普通 public 摘要页仍然界限不清

### 方案 B：让 Billboard 直接消费现有 `SCREEN_FEED`

优点：

- 最贴近文档
- 不引入新事实层
- 能把 `Billboard` 与其他 screen mode 区分开

缺点：

- 需要在页面里新增最小 feed item 类型映射

### 推荐方案

采用 **方案 B：让 Billboard 直接消费现有 `SCREEN_FEED`**。

## 页面结构

### 顶部状态

- `Billboard`
- 赛事标题
- 当前阶段

### 指标区

- 已发布奖项
- 公开作品
- 风险数
- feed item 数

### Screen Feed 区

- 新增 `Screen Feed`
- 展示已有 `SCREEN_FEED.items`
- 每条 item 明示类型：
  - `公告`
  - `过程榜`
  - `Session 摘要`

### 其他摘要区

- 最近公告
- 已发布 Award
- 骑行亮点

保留这些区块，但 `Screen Feed` 成为更像 billboard 的核心区块。

## 运行时规则

- `SCREEN_FEED` 只读现有 projection
- JSON 解析失败时：
  - 不崩溃
  - 回退为空 feed
- `current_leaderboard_projection` 只作为过程榜 feed item 类型，不冒充最终赛果

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `/screen/{raceSlug}/billboard`
   - 不再只是普通摘要卡拼装
2. 页面中会出现 `Screen Feed`
3. feed item 会明确标出：
   - 公告
   - 过程榜
   - Session 摘要

## 测试对齐

需要覆盖：

- `src/app/_components/public/billboard-display.test.tsx`
  - `Screen Feed`
  - `公告 / 过程榜 / Session 摘要`
  - 真实 `SCREEN_FEED` 内容

## 验收对齐

本轮完成后，需要能证明：

1. Billboard 已开始消费现有 `SCREEN_FEED`
2. feed item 类型在页面中可见
3. `current_leaderboard_projection` 仍然只是过程 feed，不是最终榜

## 一句话结论

这一刀要解决的不是“Billboard 有没有信息”，而是：既然仓库里已经有 `screen_feed_projection`，那 `Billboard` 就不该继续绕开它，而应该真正成为这条大屏专用 feed 的展示面。
