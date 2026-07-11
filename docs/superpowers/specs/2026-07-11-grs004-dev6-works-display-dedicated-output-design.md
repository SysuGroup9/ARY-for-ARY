# GRS004 / DEV-6 Works Display Dedicated Output Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display`
    - `Works Display`
  - `Works`
    - `Race Context`
    - `Filter / Sort`
    - `Work Cards`
    - `Featured Works`
    - `Work Page Entry`
  - `Works 只展示已公开作品；隐藏或未发布作品不进入公开列表`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `works_list_read_model`
  - `screen_feed_projection`
    - `Works`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display`
    - 现场观看产物
    - 不是后台页面放大版
    - 远距离可读
    - 强状态
- `docs/grs004/design-prototype/index.html`
  - `Works / Showcase`
  - `作品墙`
  - `全部公开作品 / 精选 / 已获奖 / 评审中`
  - `作品橱窗`
- `docs/grs004/design-prototype/script.js`
  - `精选作品`
  - `作品橱窗`

当前代码已经有：

- `ScreenDisplay` 状态层
- `/screen/{raceSlug}/works`
- `public-safe` race read model
- `WorksPageView`

但当前 `/screen/{raceSlug}/works` 仍只是：

- `ScreenDisplayShell`
  - 包一层
- `WorksPageView`
  - 普通 public 作品列表

这与文档里对 `Works Display` 的要求不够一致。

## 范围

### 本轮纳入

- 新增专用 `WorksDisplayView`
- `/screen/{raceSlug}/works` 改为使用它
- 继续只读取：
  - `public-safe race read model`
  - 已公开 `Work`
  - 已发布 `Award`

### 本轮不纳入

- 不重做 `WorksPageView`
- 不新建新的 `screen_feed_projection`
- 不重写 `Work Page`
- 不顺手改 `Live / Leaderboard / Billboard`

## 当前缺口

### 1. 当前 screen works 仍是普通公开页壳

`WorksPageView` 当前主要是：

- 普通页面标题
- 普通作品卡片
- 普通公开页文案

它适合“浏览公开作品”，不够像“现场展示作品墙”。

### 2. 原型已经给出更明确的 works display 方向

原型里 `Works / Showcase` 的主元素是：

- 作品墙标题
- 过滤语义
- 精选作品 hero
- 大号作品卡
- `作品橱窗`

这比当前 `WorksPageView` 更接近文档要的 `Works Display`。

## 方案选择

### 方案 A：继续复用 `WorksPageView`

优点：

- 零新增概念

缺点：

- 明显不符合“不是后台页面放大版”
- 与原型的 `Works / Showcase` 偏差大

### 方案 B：新增 `WorksDisplayView`，继续复用现有 public-safe 数据源

优点：

- 最贴近文档和原型
- 不需要新事实层
- 可以快速把 screen works 收口成专用展示面

缺点：

- 会有一小段与 `WorksPageView` 的作品整理逻辑重复

### 推荐方案

采用 **方案 B：新增 `WorksDisplayView`，继续复用现有 public-safe 数据源**。

## 页面结构

### 顶部摘要

- `Works / Showcase`
- 赛事标题
- 作品总数 / 已获奖 / 评审中 的大字摘要

### 中心作品墙

- 一个 `Featured Work`
  - 优先已获奖公开作品
  - 否则退回第一条公开作品
- 其余公开作品作为二级卡片
- 每张卡片保留：
  - 作品名
  - 作者
  - 一句话摘要
  - 奖项或阶段标识
  - Work Page 入口

### 顶部过滤语义

第一版只表达状态，不做真正交互切换：

- 全部公开作品
- 精选
- 已获奖
- 评审中
- 排序：最新提交

### 右侧作品橱窗

继续只用现有数据拼最小摘要：

- 主作品
- Demo 展示
- 路线故事
- 亮点时刻
- 评委摘录

其中：

- `Demo 展示`
  - 只表达当前是否存在 `demoUrl / videoUrl`
- `评委摘录`
  - 优先读已发布 Award 的 `decisionReason`
  - 没有就显示待公开

## 运行时规则

- 公开作品集合只来自 `registration.work != null`
- 已获奖标识只来自已发布 `Award`
- 不读取未公开作品
- 不读取 judge/private comment
- 不引入 `CURRENT_LEADERBOARD`

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `/screen/{raceSlug}/works`
   - 不再是普通 `WorksPageView` 页面包壳
2. 页面中心会是更明确的 `Works / Showcase`
   - 精选作品 hero
   - 作品墙卡片
   - 作品橱窗摘要
3. `Works Display` 与普通公开 `Works` 页的角色会更清楚地区分

## 测试对齐

需要覆盖：

- `src/app/_components/public/works-display.test.tsx`
  - `Works / Showcase`
  - `Featured Work`
  - `作品橱窗`
  - 已公开作品卡片
  - 不出现普通 `WorksPageView` 文案

## 验收对齐

本轮完成后，需要能证明：

1. `/screen/{raceSlug}/works` 已不再直接渲染 `WorksPageView`
2. 页面结构更接近原型中的 `Works / Showcase`
3. 数据仍只来自现有 public-safe / published 链路
4. 未公开作品不会进入 `Works Display`

## 一句话结论

这一刀要解决的不是“公开作品有没有”，而是：`Works Display` 既然是大屏模式，就不能继续长得像普通公开作品页，至少要先收口成接近原型的专用作品墙输出面。
