# GRS004 / DEV-6 Live Display Dedicated Output Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-mvp.ia.md`
  - `Live Display`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display`
    - 现场观看产物
    - 不是后台页面放大版
    - 远距离可读
    - 强状态
- `docs/grs004/design-prototype/index.html`
  - `page-screen`
  - `Live Riding Board`
  - `screenCanvas`
  - `screen-metrics`
- `docs/grs004/design-prototype/script.js`
  - `active riders`
  - `sessions`
  - `cost watch`
  - `submit left`

当前代码已经有：

- `ScreenDisplay` 状态层
- `/screen/{raceSlug}/live`
- `JumbotronInline`
- `resolveRaceSnapshotForDisplay()`

但当前 `/screen/{raceSlug}/live` 仍只是：

- `ScreenDisplayShell`
  - 包一层
- `LiveHallView`
  - 普通 public 页面内容

这与原型和 `ux-hifi.taskbook.md` 中“现场大屏输出面”的要求不够一致。

## 范围

### 本轮纳入

- 新增专用 `LiveDisplayView`
- `/screen/{raceSlug}/live` 改为使用它
- 复用现有：
  - `JumbotronInline`
  - `RaceSnapshot`
  - `public-safe` race read model

### 本轮不纳入

- 不重做 `JumbotronClient`
- 不新建新的 Projection 类型
- 不重写 `Live Hall`
- 不顺手改 `Leaderboard / Works Display`

## 当前缺口

### 1. 现在的 live screen 还是普通公开页结构

`LiveHallView` 的结构是：

- 多个普通卡片
- 普通页面 CTA
- 公开页信息密度和阅读节奏

它适合“浏览”，不够像“现场播放”。

### 2. 原型已经给出更明确的 live display 方向

原型里 `page-screen` 的主元素是：

- 顶部状态条
- `Live Riding Board`
- 中心赛道 / 投影
- 一排高可读指标

这比当前 `LiveHallView` 更接近文档要的输出面。

## 方案选择

### 方案 A：继续复用 `LiveHallView`

优点：

- 零新增概念

缺点：

- 明显不符合“不是后台页面放大版”
- 与原型偏差大

### 方案 B：新增 `LiveDisplayView`，但继续复用现有数据源和 Jumbotron

优点：

- 最贴近文档和原型
- 不需要新事实层
- 可以快速得到更像大屏的输出面

缺点：

- 会有一小段与 `LiveHallView` 指标计算的重复

### 推荐方案

采用 **方案 B：新增 `LiveDisplayView`，继续复用现有数据源和 Jumbotron**。

## 页面结构

### 顶部状态条

- 赛事标题
- 当前 phase
- 当前 mode：`Live Display`

### 中心主区域

- `JumbotronInline`
  - 有 live / stable snapshot 时直接展示
- 没有 snapshot 时
  - 使用已有 `StaticDisplayFallback`

### 大字指标条

优先展示：

- `active riders`
- `sessions`
- `risk count`
- `submit left`

补充：

- `average progress`
- `total token cost`

### 辅助信息区

只保留最贴近现场值守的信息：

- 最近公告
- 过程榜前三
- 最近事件前三

不保留普通 public 页那类导航式入口按钮。

## 运行时规则

- 数据仍来自：
  - `public-safe race read model`
  - `resolveRaceSnapshotForDisplay()`
- 有 snapshot 时：
  - 展示 live board
- `stable` 时：
  - 明示 `稳定快照 fallback`
- `static` 时：
  - 明示 `静态 fallback`

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `/screen/{raceSlug}/live`
   - 不再是普通 `Live Hall` 页面包壳
2. 页面中心是更明确的大屏板面
   - 中心赛道
   - 大字指标
   - 精简辅助信息
3. Screen Display 与 Live Hall 的视觉角色会更清楚地区分

## 测试对齐

需要覆盖：

- `src/app/_components/public/live-display.test.tsx`
  - live board 主标题
  - 大字指标
  - 最近公告
  - fallback 提示

## 验收对齐

本轮完成后，需要能证明：

1. `/screen/{raceSlug}/live` 已不再只是 `LiveHallView` 包壳
2. 页面结构更接近原型中的 `Live Riding Board`
3. 数据仍只来自现有 public-safe / snapshot 链路
4. fallback 状态仍然可见

## 一句话结论

这一刀要解决的不是“live 数据有没有”，而是：`Live Display` 既然是现场大屏输出，就不能继续长得像普通浏览页，至少要先收口成接近原型的专用展示面。

## 已落地实现补记（2026-07-11）

- `src/app/_components/public/live-display.tsx`
  - 已新增专用 `LiveDisplayView`
- `src/app/screen/[raceSlug]/live/page.tsx`
  - 已改为使用 `LiveDisplayView`
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/app/_components/public/live-display.test.tsx src/app/_components/public/live-hall.test.tsx src/lib/services/screen-display.test.ts src/app/_components/console/screen-console-controls.test.tsx`
  - `npm run build`
