# GRS004 / DEV-6 Leaderboard Display Dedicated Output Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Current Leaderboard`
    - 过程榜，不是最终 Award 排名
  - `leaderboard_read_model`
    - 最终榜读取 `Award`
  - `screen_feed_projection 应区分 feed item 类型`
- `docs/grs004/ary-mvp.ia.md`
  - `Results`
    - `Award Leaderboards`
    - `Winning Works`
    - `Riding Skill Highlights`
  - `Screen Display / Screen Console 可以按展示模式显示过程榜或最终榜，但必须区分 feed item 类型和赛事状态`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display 的实时榜单和 Results 的最终榜单没有区分`
  - `Screen Display 不是后台页面放大版`

当前代码已经有：

- `ScreenDisplay` 状态层
- `/screen/{raceSlug}/leaderboard`
- `buildPublicResultsModel()`
- `ResultsPageView`

但当前 `/screen/{raceSlug}/leaderboard` 还是直接套 `ResultsPageView`，这意味着：

- 它仍像普通公开赛果页
- 而不是现场大屏上的最终榜输出面

## 范围

### 本轮纳入

- 新增专用 `LeaderboardDisplayView`
- `/screen/{raceSlug}/leaderboard` 改为使用它
- 继续只读取：
  - `Award`
  - `leaderboard_read_model` 语义
  - `Report`

### 本轮不纳入

- 不重做 `ResultsPageView`
- 不新建新的榜单事实模型
- 不改 `Live Hall` 过程榜
- 不顺手改 `Works Display`

## 当前缺口

### 1. 当前 screen leaderboard 仍是 public results 壳

`ResultsPageView` 包含：

- 普通结果页层次
- `Review` 入口
- public 页面节奏

这不等于现场 `Leaderboard Display`。

### 2. 文档明确要求区分“过程榜”和“最终榜”

当前系统已经有两类语义：

- `CURRENT_LEADERBOARD`
  - 过程榜
- `Award / leaderboard_read_model`
  - 最终榜

如果 screen leaderboard 继续长得像普通 results 页，就很难把“大屏最终榜”和“公开赛果页”区分开。

## 方案选择

### 方案 A：继续复用 `ResultsPageView`

优点：

- 零新增组件

缺点：

- 不解决“Screen Display 不应等于 public 页面”的问题

### 方案 B：新增 `LeaderboardDisplayView`，但继续复用现有 results 数据源

优点：

- 最贴近文档
- 不新增事实层
- 可以把显示层收口成更像大屏

缺点：

- 会与 `ResultsPageView` 存在少量内容重复

### 推荐方案

采用 **方案 B：新增 `LeaderboardDisplayView`，继续复用现有 results 数据源**。

## 页面结构

### 顶部摘要

- 赛事标题
- phase
- 当前 mode：`Leaderboard Display`

### 主体区域

- `Award Leaderboards`
  - 按 `awardName` 分组
  - 按 `rank` 排列
- `Winning Works`
  - 只展示获奖作品
- `Riding Skill Highlights`
  - 只展示已发布能力亮点

### 页面原则

- 不出现普通 public 页面导览型按钮
- 不混入过程榜措辞
- 不把 `CURRENT_LEADERBOARD` 当成最终榜

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `/screen/{raceSlug}/leaderboard`
   - 不再只是 `ResultsPageView` 套壳
2. 页面会更明确表达“最终榜”
3. 现场大屏最终榜和普通 `Results` 页的角色会更清楚

## 测试对齐

需要覆盖：

- `src/app/_components/public/leaderboard-display.test.tsx`
  - Award 分组
  - Winning Works
  - Riding Skill Highlights
  - 不出现过程榜措辞

## 验收对齐

本轮完成后，需要能证明：

1. `/screen/{raceSlug}/leaderboard` 已不再直接渲染 `ResultsPageView`
2. 页面只表达最终榜，不混入过程榜语义
3. 数据仍只来自 `Award / Report / published results` 链路

## 一句话结论

这一刀要解决的不是“最终榜数据有没有”，而是：`Leaderboard Display` 既然是大屏模式，就不能继续只是普通 `Results` 页，必须先收口成一个明确表达最终榜事实的大屏输出面。

## 已落地实现补记（2026-07-11）

- `src/app/_components/public/leaderboard-display.tsx`
  - 已新增专用 `LeaderboardDisplayView`
- `src/app/screen/[raceSlug]/leaderboard/page.tsx`
  - 已改为使用 `LeaderboardDisplayView`
- `src/lib/services/screen-display.ts`
  - 已补最小 SQLite busy retry，减少并发测试时的 `database is locked`
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/app/_components/public/leaderboard-display.test.tsx src/lib/services/results.test.ts src/lib/services/review.test.ts`
  - `npm run build`
