# GRS004 / DEV-6 Announcement + Screen Display Baseline Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-permission-matrix.md`
  - `3.12 Announcement`
    - `view_public`
    - `view_private`
    - `create`
    - `edit`
    - `publish`
    - `hide`
  - `3.13 ScreenDisplay`
    - `view_public_display`
    - `switch_mode`
    - `fallback_to_static_notice`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Announcement`
  - `Screen Display Flow`
  - `ScreenDisplay`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
  - `Announcement Display`
  - `Live Hall` 辅助信息中的公告
- `docs/grs004/ary.plan.md`
  - `DEV-6 Screen Console / 大屏联调`
- `docs/grs004/ary-qa-plan.md`
  - `2.7 大屏测试`

当前代码里已经有：

- `Screen Console` 路由壳
- `announcement` 模式切换入口
- `StaticDisplayFallback`
- `Notification` 被临时复用为 projection 中的 `announcement` feed item

但还缺少：

- 第一类事实源 `Announcement`
- Organizer 可操作的公告发布/隐藏工作流
- 独立的 `Announcement Display`
- `Live Hall` 直接读取已发布公告

本轮目标是把这条链路补成一个最小可运行基线，而不是继续停留在占位文案。

## 范围

### 本轮纳入

- 新增第一类 `Announcement` 实体
- Organizer 在 managed race 下创建、编辑、发布、隐藏公告
- Organizer Console 新增公告管理入口
- 新增公开 `Announcement Display` 播放页
- `Screen Console` 的 `announcement` 模式改为指向独立公告播放页
- `Live Hall` 与静态 fallback 优先展示最近已发布公告

### 本轮不纳入

- 不新建持久化 `ScreenDisplay` 数据表
- 不做主题系统、播放列表、轮播编排
- 不做公告评论、置顶、多级审核
- 不把 `live / leaderboard / works / billboard` 全部改造成独立播放页
- 不重写现有 `Notification` 体系

## 当前缺口

### 1. `Announcement` 还不是第一类实体

`prisma/schema.prisma` 里没有 `Announcement`，当前“公告”只存在于：

- `Race.summary`
- `Race.organizerComment`
- `Notification`
- `StaticDisplayFallback` 的临时说明文案

这不满足 `Announcement` 独立权限矩阵，也不利于后续的发布/隐藏语义。

### 2. `announcement` 模式仍是占位

`src/app/_components/console/screen-console-page.tsx` 当前明确写着：

- “公告模式当前仍复用公开赛事上下文，后续再收口到独立公告输出。”

这和 `ary-mvp.ia.md` 中 `Announcement Display` 的要求不一致。

### 3. `Live Hall` 还没有直接公告入口

`Live Hall` 当前读取的是：

- `Projection`
- `Race`
- `Registration / RaceProject`

但没有直接读取“最近已发布公告”，不符合 IA 中“公告”作为辅助信息的要求。

## 方案选择

### 方案 A：继续复用 `Notification`

做法：

- 给 `Notification` 增加公开/隐藏语义
- `Screen Console` 和 `Live Hall` 继续读 `Notification`

优点：

- 改动小

缺点：

- 偏离 `Announcement` 独立实体
- `Notification` 更接近系统消息，不是赛事公告事实源
- 后续会继续把“系统通知”和“现场公告”混在一起

### 方案 B：新增第一类 `Announcement`，但只做最小发布链路

做法：

- 新增 `Announcement` 表
- 仅落地 `create / edit / publish / hide`
- 仅新增 `announcement` 模式对应的独立播放页
- 其他模式继续维持现状

优点：

- 直接命中文档原始概念
- 最小可运行
- 不把 `DEV-6` 扩成完整大屏重构

缺点：

- `ScreenDisplay` 仍未持久化为独立读模型
- 其他大屏模式依然存在过渡实现

### 推荐方案

采用 **方案 B：新增第一类 `Announcement`，但只做最小发布链路**。

原因：

- 它最贴近 `docs/grs004` 原文，不需要发明新的中间语义。
- 它能把当前最明显的“announcement 还是占位”的缺口收口。
- 它不会把本轮范围扩大成整套大屏系统重做。

## 数据设计

新增 `Announcement`：

- `id`
- `raceId`
- `title`
- `body`
- `visibility`
- `publishedAt`
- `createdAt`
- `updatedAt`

关系：

- `Race 1 -> 0..* Announcement`

字段语义：

- `visibility=PRIVATE` 且 `publishedAt=null`
  - 草稿 / 内部可见
- `visibility=PUBLIC` 且 `publishedAt!=null`
  - 已发布公告
- `visibility=PRIVATE` 且 `publishedAt!=null`
  - 已发布后被隐藏；保留历史发布时间，但不再进入公开读取

本轮不新增：

- `hiddenAt`
- `publishedBy`
- `version`
- `ScreenDisplay` 持久化表

## 运行时规则

### 1. Organizer 公告管理

Organizer 在 managed race 下可以：

- 创建公告草稿
- 编辑未公开或已隐藏公告
- 发布公告
- 隐藏公告

约束：

- 只能操作自己管理的 race
- 公开读取只消费 `visibility=PUBLIC && publishedAt!=null`
- 隐藏后不删除记录，只退出公开链路

### 2. Organizer Console

新增 `announcements` section：

- `创建公告草稿`
- `公告草稿`
- `已发布公告`
- `打开 Announcement Display`

每条草稿支持：

- 编辑 `title`
- 编辑 `body`
- 发布

每条已发布公告支持：

- 隐藏

### 3. Screen Console announcement 模式

`announcement` 模式不再只给占位说明，而是明确给出：

- 当前最近已发布公告概览
- 打开独立公告播放页的入口

本轮仍不做：

- Screen Operator 在 Screen Console 直接编辑公告

公告内容编辑仍留在 Organizer Console。

### 4. Public Announcement Display

新增公开播放页，读取最近已发布公告：

- 有公告时：展示标题、正文、赛事名、发布时间
- 无公告时：回退到静态说明，不读取私有草稿

### 5. Live Hall / Static Fallback

`Live Hall` 增加“最近公告”卡片：

- 优先显示最近已发布公告
- 没有时维持静态说明

`StaticDisplayFallback` 的“阶段公告”文案优先级调整为：

1. 最近已发布公告摘要
2. `organizerComment`
3. `race.summary`
4. 默认 fallback 文案

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. Organizer Console 新增 `公告` 分区
   - 可创建、编辑、发布、隐藏公告
2. `Screen Console / announcement`
   - 不再只是占位说明
   - 会提供独立公告播放页入口
3. Public `Announcement Display`
   - 可以直接播放最近已发布公告
4. `Live Hall`
   - 会直接显示最近已发布公告
5. `StaticDisplayFallback`
   - 会优先使用已发布公告作为静态公告内容

## 测试对齐

需要覆盖：

- `src/lib/services/announcements.test.ts`
  - draft create / edit / publish / hide
  - public read gating
- `src/app/_components/console/organizer-announcement-controls.test.tsx`
  - organizer 公告管理入口与按钮
- `src/app/_components/public/announcement-display.test.tsx`
  - 已发布公告展示与空状态
- `src/app/_components/public/live-hall.test.tsx`
  - 最近公告卡片
- `src/app/_components/console/console-copy.test.tsx`
  - `announcement` 模式链接不再只是过渡说明

## 验收对齐

本轮完成后，需要能证明：

1. `Announcement` 已成为独立事实源
2. Organizer 能在 managed race 下创建、编辑、发布、隐藏公告
3. 公开读取不会泄露私有草稿或已隐藏公告
4. `Screen Console` 的 `announcement` 模式已有独立播放入口
5. `Live Hall` 与静态 fallback 能优先展示最近已发布公告

## 一句话结论

这一刀要解决的不是“大屏最终长什么样”，而是：`Announcement` 不能再只是 `Notification / organizerComment` 的代用品，必须先成为可发布、可隐藏、可公开播放的第一类对象。

## 已落地实现补记（2026-07-11）

- `prisma/schema.prisma`
  - 已新增 `Announcement`
- `src/lib/services/announcements.ts`
  - 已落地 draft / publish / hide 基线
- `src/app/_components/console/organizer-console-page.tsx`
  - 已新增 organizer `announcements` 分区
- `src/app/_components/console/screen-console-page.tsx`
  - `announcement` 模式已改为指向独立公告播放页
- `src/app/_components/public/announcement-display.tsx`
  - 已新增独立公告播放组件
- `src/app/screen/[raceSlug]/announcement/page.tsx`
  - 已新增公开公告播放路由
- `src/app/_components/public/live-hall.tsx`
  - 已新增最近公告卡片
- `src/app/_components/public/static-display-fallback.tsx`
  - 已优先使用最近已发布公告作为静态公告内容
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/services/announcements.test.ts src/app/_components/console/organizer-announcement-controls.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx`
  - `npm run build`
