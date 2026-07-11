# GRS004 / DEV-6 Dedicated Screen Mode Pages Baseline Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display`
    - `Jumbotron`
    - `Billboard`
    - `Live Display`
    - `Leaderboard Display`
    - `Works Display`
    - `Announcement Display`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Billboard`
  - `Screen Display Flow`
  - `screen_feed_projection`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display`
    - 大字号
    - 强状态
    - 远距离可读
    - `Live / Leaderboard / Works / Announcement` 模式
- `docs/grs004/ary.plan.md`
  - `DEV-6 Screen Console / 大屏联调`

上一轮已经完成：

- `ScreenDisplay` 持久化状态
- `/screen/{raceSlug}` 稳定公共播放入口
- `announcement` 独立播放页

但当前还存在一个明显差距：

- `billboard / live / leaderboard / works` 仍主要跳转到普通 public 页面
- 这还不是真正的 `Screen Display` 模式页

本轮目标是把这些模式收口到专门的 `screen/*` 播放页，同时尽量复用现有 public-safe read model 和视图组件，不去发明新的事实层。

## 范围

### 本轮纳入

- 新增：
  - `/screen/{raceSlug}/billboard`
  - `/screen/{raceSlug}/live`
  - `/screen/{raceSlug}/leaderboard`
  - `/screen/{raceSlug}/works`
- 新增 `ScreenDisplayShell`
- 新增 `BillboardDisplayView`
- `resolveScreenDisplayHref()` 改为优先分发到专门的 `screen/*` 模式页

### 本轮不纳入

- 不重做 `jumbotron`
- 不新建新的 Projection 类型
- 不重做 `Live Hall / Results / Works` 的 read model
- 不做 `Billboard` 高级配置或轮播编排
- 不做更复杂的 screen theme system

## 当前缺口

### 1. `ScreenDisplay` 已有状态，但缺少专门播放页

现在 `/screen/{raceSlug}` 已经可以按状态分发，但分发目标仍大量指向：

- `/races/{raceSlug}/live`
- `/races/{raceSlug}/results`
- `/races/{raceSlug}/works`

这说明 `ScreenDisplay` 状态层是真实的，但播放层还不够真实。

### 2. `Billboard` 还不存在

文档明确写了：

- `Billboard 信息看板`
  - 偏榜单、公告、状态信息

但当前仓库里没有任何独立 `Billboard` 页面或组件。

### 3. `Live / Leaderboard / Works` 还没有“屏幕版”

现有 public 页是给普通浏览器用户看的，不完全等于现场屏幕输出。

本轮即使仍复用相同 read model，也至少需要：

- 独立 `screen/*` 路由
- 独立 display shell
- 不再让“当前公开大屏 URL”直接等于普通 public 页面 URL

## 方案选择

### 方案 A：每种 mode 都重写为完全新的大屏 UI

优点：

- 最终形态更接近理想大屏系统

缺点：

- 范围过大
- 会把 `DEV-6` 变成完整前端重构

### 方案 B：新增专门 `screen/*` 播放页，优先复用现有 public-safe 视图

做法：

- `live / leaderboard / works` 模式页先复用现有视图组件
- 外层新增统一 `ScreenDisplayShell`
- `billboard` 单独做最小大字版信息板

优点：

- 最贴近文档里的“Screen Display 是独立展示输出面”
- 不引入新事实层
- 成本可控

缺点：

- `live / leaderboard / works` 本轮仍不算完全专用大屏 UI

### 推荐方案

采用 **方案 B：新增专门 `screen/*` 播放页，优先复用现有 public-safe 视图**。

## 页面设计

### 1. ScreenDisplayShell

作用：

- 提供统一的大屏播放外壳
- 显示：
  - race title
  - 当前 mode
  - theme
- 提供统一背景和全屏布局

### 2. Billboard Display

`Billboard` 采用最小信息板：

- 当前赛事名与阶段
- 最近已发布公告
- 已发布 Award 摘要
- 公开作品数量
- 风险 / 活跃状态摘要

它偏信息汇总，而不是完整赛果页或完整实况页。

### 3. Live / Leaderboard / Works Display

本轮原则：

- 复用当前 `LiveHallView / ResultsPageView / WorksPageView`
- 但外层通过 `ScreenDisplayShell` 提供独立播放面
- 路由入口统一在 `/screen/*`

这样可以先把“模式页”独立出来，再逐步做更强的大屏专用视觉。

## 运行时规则

### 1. `resolveScreenDisplayHref()`

在 `fallbackMode=auto` 下：

- `announcement` -> `/screen/{raceSlug}/announcement`
- `billboard` -> `/screen/{raceSlug}/billboard`
- `live` -> `/screen/{raceSlug}/live`
- `leaderboard` -> `/screen/{raceSlug}/leaderboard`
- `works` -> `/screen/{raceSlug}/works`
- `jumbotron` -> `/jumbotron/{raceId}`

### 2. Theme

本轮 `theme` 继续维持最小消费策略：

- `ScreenDisplayShell`
- `Announcement Display`
- `Static Notice`

不强求所有嵌入视图都立刻完全视觉重做。

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `/screen/{raceSlug}` 不再把 `live / leaderboard / works / billboard` 直接导去普通 public 页面 URL
2. `Screen Display` 将拥有独立的模式页 URL
3. `Billboard` 将首次成为真实页面，而不是文档名词
4. `Screen Console` 的当前公开播放入口将更接近真实大屏输出面

## 测试对齐

需要覆盖：

- `src/lib/services/screen-display.test.ts`
  - `resolveScreenDisplayHref()` 新分发规则
- `src/app/_components/public/billboard-display.test.tsx`
  - billboard 信息板输出
- 如有必要，最小补一条 shell 或 route 相关断言

## 验收对齐

本轮完成后，需要能证明：

1. `Billboard` 已成为真实播放页
2. `Live / Leaderboard / Works` 已拥有独立 `screen/*` 模式页
3. `/screen/{raceSlug}` 分发到真正的 `screen/*` 播放页，而不是继续借道普通 public URL
4. 新模式页继续只消费 public-safe read model

## 一句话结论

这一刀要解决的不是“把所有大屏重做一遍”，而是：`Screen Display` 既然已经有了状态层，就不能继续让大部分模式只是跳回普通 public 页，至少要先拥有真正的 `screen/*` 播放面。

## 已落地实现补记（2026-07-11）

- `src/app/_components/public/screen-display-shell.tsx`
  - 已新增统一大屏外壳
- `src/app/_components/public/billboard-display.tsx`
  - 已新增最小 `Billboard` 信息板
- `src/app/screen/[raceSlug]/billboard/page.tsx`
  - 已新增 `Billboard` 播放页
- `src/app/screen/[raceSlug]/live/page.tsx`
  - 已新增 `Live Display` 播放页
- `src/app/screen/[raceSlug]/leaderboard/page.tsx`
  - 已新增 `Leaderboard Display` 播放页
- `src/app/screen/[raceSlug]/works/page.tsx`
  - 已新增 `Works Display` 播放页
- `src/lib/services/screen-display.ts`
  - `resolveScreenDisplayHref()` 现已优先指向新的 `screen/*` 模式页
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/services/screen-display.test.ts src/app/_components/public/billboard-display.test.tsx`
  - `npm run build`
