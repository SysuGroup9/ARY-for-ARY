# GRS003 Public IA Design

## Purpose

本文是 `docs/grs003/` 第 1 片区的实施设计稿，目标是先把 **Public Information Architecture** 从当前单页混合结构中拆出来，并与 `grs003` 中关于公开端的要求对齐。

之所以先做这一片区，是因为 `grs003` 实际覆盖了至少三个相对独立的实现面：

1. Public Site / Information Architecture
2. Race Console / Admin Console / Screen Console
3. CA / Projection / Evidence / Report

如果不先拆片区，直接一次性改全仓库，会同时牵动公开端、后台工作台、数据模型与评审语义，难以验证，也容易把当前代码改成无法演示的中间状态。

---

## Scope

本设计只覆盖 **公开端**，不覆盖 Console 和 CA / Projection 深层改造。

### In Scope

- `Home / Race Gallery`
- `Race Page`
- `Live Hall`
- `Works`
- `Work Page`
- `Results`
- `Review`
- `Rider Profile`
- `Cooperation`

### Out Of Scope

- `Race Console`
- `Admin Console`
- `Screen Console`
- `Screen Display` 的控制逻辑
- `CAConnection`、`Projection`、`Evidence`、`Report` 的底层模型重构
- 新权限系统与 `User.roles` 深层治理

---

## Current Gap

当前仓库的主要偏差是：

- 公开端、Rider 操作区、Organizer 操作区被混在 `src/app/page.tsx` 一个页面中
- 当前首页承担了过多后台和工作台语义
- 公开端没有按 `grs003` 拆成多页面信息结构
- 当前 Public Site 以“一个单页仪表盘”方式运行，而不是 `grs003` 要求的 `Gallery-first`

因此第一步不是“补几个组件”，而是把公开端从单页里拆成稳定路由骨架。

---

## Design Decision

第 1 片区采用 **完整公开端优先** 路线，而不是只做 `Home + Race Page`。

原因：

- `grs003/ary-mvp.ia.md` 已经把公开端定义成一组完整的页面系统，而不是两个入口页
- `Home` 的结构依赖 `Latest Results`、`Featured Works`、`Rider Profile`、`Cooperation`
- `Race Page` 的 CTA 又依赖 `Live / Works / Results / Review`
- 如果只做 `Home + Race Page`，会继续保留大量“按钮指向不存在页面”的半成品状态

因此这片区的目标是：**先把公开端全部拆出稳定路由骨架，再逐步替换每个页面内部的数据与内容结构。**

---

## Route Map

公开端第一阶段目标路由：

```text
/                               Home / Race Gallery
/races/[raceSlug]               Race Page
/races/[raceSlug]/live          Live Hall
/races/[raceSlug]/works         Works
/works/[workSlug]               Work Page
/races/[raceSlug]/results       Results
/races/[raceSlug]/review        Review
/riders/[riderSlug]             Rider Profile
/cooperation                    Cooperation
```

### Route Principles

- `/` 只负责公开首页，不再承担 Console 或完整赛事操作区
- `Race` 是公开端主上下文，`live / works / results / review` 都挂在 `raceSlug` 下
- `Work Page` 和 `Rider Profile` 允许独立传播，但必须保留回到所属 Race 的入口
- Console 入口只作为次级入口，不占据公开端主结构

---

## Page Responsibilities

### Home / Race Gallery

首页负责：

- Featured Races / Live Race Switcher
- Latest Results
- Featured Works
- Featured Riders
- Cooperation 入口

首页不负责：

- 完整报名 / 提交 / Organizer 操作流
- 独立 Leaderboards 模块
- 单页承载所有比赛详情

### Race Page

单场赛事公开信息中枢：

- Race title / summary / status / CTA
- Overview / Rules / Schedule
- Riders / Works / Results / Review 的上下文入口

### Live Hall

过程展示页：

- 赛事状态
- Rider activity
- Event stream
- Current leaderboard / risk summary
- Screen entry

### Works

公开作品集合页：

- 按单场 Race 聚合
- 允许筛选和进入 Work Page
- 不展示未公开作品

### Work Page

单作品详情页：

- 作品信息
- 所属赛事
- 作者
- 奖项与公开证据摘要

### Results

赛后结果页：

- Award / final leaderboard
- Winning works
- Review 入口

### Review

评审总结页：

- 已发布 review summary
- Award 与公开 evidence 引用

### Rider Profile

骑手公开档案：

- 基础资料
- 公开作品
- 获奖记录
- 能力标签

### Cooperation

合作承接页：

- 参赛 / 办赛 / 赞助 / 联系路径

---

## Data Reuse Strategy

为保证第一片区可落地，优先复用当前已有读取链路，而不是先重做底层模型。

第一阶段可复用：

- `listRaces()` 及当前 Race 聚合结果
- 当前 public leaderboard / showcase 数据
- 当前 Jumbotron 快照与公开入口
- 当前公开可见的团队、作品样式化数据

第一阶段允许的临时做法：

- 从现有 Race 数据中投影出 `Featured Races / Latest Results / Featured Works / Featured Riders`
- 先用当前 `TeamArchive / LeaderboardEntry / RidingHighlight / TeamComment` 组出公开页读取模型

第一阶段不允许：

- 继续把 Organizer / Rider 操作 UI 混进公开页
- 把单页里所有现有 panel 原样复制成多页

---

## File Strategy

当前代码需要从“单页混合”转向“公开端骨架 + 公共读取组件”。

建议最小结构：

```text
src/app/
├── page.tsx
├── races/[raceSlug]/page.tsx
├── races/[raceSlug]/live/page.tsx
├── races/[raceSlug]/works/page.tsx
├── races/[raceSlug]/results/page.tsx
├── races/[raceSlug]/review/page.tsx
├── works/[workSlug]/page.tsx
├── riders/[riderSlug]/page.tsx
└── cooperation/page.tsx

src/app/_components/public/
├── home-gallery.tsx
├── race-page.tsx
├── live-hall.tsx
├── works-page.tsx
├── results-page.tsx
├── review-page.tsx
├── rider-profile-page.tsx
└── cooperation-page.tsx
```

`src/app/page.tsx` 目标是只保留公开首页，不再承载大段 Organizer / Rider 工作区。

---

## Acceptance Criteria

这一片区完成时，至少要满足：

1. 首页不再是公开端与工作台混合页
2. 公开端存在完整路由骨架，而不是只有首页
3. 用户可从首页进入 Race Page，再进入 `Live / Works / Results / Review`
4. `Results` 与过程展示明确分离，不把过程榜单伪装成最终榜单
5. `Work Page` 与 `Rider Profile` 可独立访问，同时保留 Race 回链
6. Console 入口存在，但不在公开端主视觉中承担主路径
7. `docs/superpowers` 与当前第一片区实施状态保持同步

---

## Superpowers Maintenance

这一片区实施时，需要同步维护：

- `docs/superpowers/status.md`
  - 记录公开端拆分到了哪一步
  - 记录哪些页面已从单页中拆出

- 下一步应新增对应实现计划到 `docs/superpowers/plans/`
  - 例如：`2026-06-18-grs003-public-ia-implementation-plan.md`

不要把这份 spec 当成一次性说明文档。只要公开端设计边界变化，就要回写更新。
