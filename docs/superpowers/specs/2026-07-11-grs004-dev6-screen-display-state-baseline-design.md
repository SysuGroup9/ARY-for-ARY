# GRS004 / DEV-6 ScreenDisplay State Baseline Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-permission-matrix.md`
  - `3.13 ScreenDisplay`
    - `view_public_display`
    - `configure`
    - `switch_mode`
    - `fallback_to_stable_projection`
    - `fallback_to_static_notice`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `ScreenDisplay`
  - `Screen Display Flow`
  - `ScreenMode`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
  - `Screen Display`
  - `Theme / Calibration / Fallback`
- `docs/grs004/ary.plan.md`
  - `DEV-6 Screen Console / 大屏联调`
- `docs/grs004/ary-qa-plan.md`
  - `2.7 大屏测试`

当前代码已经有：

- `Screen Console` 独立路由
- `announcement` 独立播放页
- `jumbotron` / `live` / `results` / `works` 等可复用展示页
- `resolveRaceSnapshotForDisplay()` fallback 机制

但还缺少一层关键真相：

- `ScreenDisplay` 还没有变成独立读模型
- 当前大屏模式只是路由参数，不是持久化状态
- Screen Console 还不能真正“配置当前显示状态”
- 还没有一个稳定的公共播放 URL 代表“当前屏幕正在播什么”

本轮目标是把这层状态补齐，而不是重做所有大屏页面。

## 范围

### 本轮纳入

- 新增持久化 `ScreenDisplay` 读模型
- 持久化：
  - `mode`
  - `theme`
  - `fallback override`
- Screen Console 可以更新：
  - 当前 mode
  - 当前 theme
  - fallback override 到：
    - 稳定 Projection
    - 静态公告
- 新增稳定公共播放入口：
  - `/screen/{raceSlug}`

### 本轮不纳入

- 不重做每一个 mode 的专用播放 UI
- 不重写 `Jumbotron` runtime
- 不做复杂主题系统
- 不做多屏、多 display、播放队列或排班
- 不把 `calibration` 并入 `ScreenDisplay` 持久化读模型

## 当前缺口

### 1. `ScreenDisplay` 只存在于文档，不存在于代码

`ary-domain-analysis.v0.3.md` 已明确：

- `ScreenDisplay`
  - `displayId`
  - `mode`
  - `theme`

但当前仓库没有任何对应模型。

### 2. 当前 Screen Console 只是“路由控制台”，不是“状态控制台”

现在的 `Screen Console` 主要是：

- `/console/screen/{raceSlug}/{mode}`
- 由 URL 参数临时决定当前模式

这不等于真正的 `ScreenDisplay`：

- 没有当前持久化 mode
- 没有当前 theme
- 没有当前 fallback override

### 3. 当前还没有“当前公开大屏”的稳定 URL

文档里把 `Screen Display` 定义为独立展示输出面。现在已有：

- `/jumbotron/{raceId}`
- `/races/{raceSlug}/live`
- `/races/{raceSlug}/results`
- `/races/{raceSlug}/works`
- `/screen/{raceSlug}/announcement`

但没有统一的：

- `/screen/{raceSlug}`

来表达“当前 ScreenDisplay 正在播什么”。

## 方案选择

### 方案 A：直接重做所有 mode 的专用大屏页

优点：

- 最终形态更完整

缺点：

- 范围过大
- 会把 `DEV-6` 从“状态收口”扩成“整套大屏重写”

### 方案 B：新增 `ScreenDisplay` 状态层，播放层尽量复用现有页面

做法：

- `ScreenDisplay` 负责保存：
  - 当前 mode
  - 当前 theme
  - fallback override
- `/screen/{raceSlug}` 读取 `ScreenDisplay`，再分发到现有展示面

优点：

- 直接命中文档里的 `ScreenDisplay`
- 范围可控
- 不需要重复造现有播放页

缺点：

- 部分 mode 仍复用现有 public/jumbotron 页面
- theme 本轮只先落状态和最小消费，不做完整视觉系统

### 推荐方案

采用 **方案 B：新增 `ScreenDisplay` 状态层，播放层尽量复用现有页面**。

## 数据设计

新增：

- `ScreenDisplay`
  - `id`
  - `raceId`，一场 race 只保留一个当前 display state
  - `mode`
  - `theme`
  - `fallbackMode`
  - `createdAt`
  - `updatedAt`

`mode` 只覆盖文档里的显示模式：

- `jumbotron`
- `billboard`
- `live`
- `leaderboard`
- `works`
- `announcement`

`fallbackMode` 采用最小状态机：

- `auto`
- `stable_projection`
- `static_notice`

说明：

- `auto`
  - 按当前 `mode` 正常播放
- `stable_projection`
  - 当前屏幕切到“稳定 Projection 优先”的保底输出
- `static_notice`
  - 当前屏幕切到静态公告 / 榜单保底输出

## 运行时规则

### 1. Screen Console

Organizer / Admin 在 managed race 下可以：

- `switch_mode`
  - 更新 `ScreenDisplay.mode`
  - 同时把 `fallbackMode` 重置为 `auto`
- `configure`
  - 更新 `theme`
- `fallback_to_stable_projection`
  - 更新 `fallbackMode=stable_projection`
- `fallback_to_static_notice`
  - 更新 `fallbackMode=static_notice`

### 2. 公共播放 URL

新增：

- `/screen/{raceSlug}`

它不承担配置职责，只承担“当前公开输出”的职责。

分发规则：

1. 若 `fallbackMode=static_notice`
   - 进入静态 fallback 播放页
2. 若 `fallbackMode=stable_projection`
   - 进入稳定快照优先的大屏输出
3. 否则按 `mode` 分发：
   - `jumbotron` -> `Jumbotron`
   - `announcement` -> `Announcement Display`
   - `live` -> `Live Hall`
   - `leaderboard` -> `Results`
   - `works` -> `Works`
   - `billboard` -> 当前最接近的信息板输出，先复用 `Results`

### 3. Theme

本轮 `theme` 的目标是先从“无状态”变成“已持久化、可读取”：

- Screen Console 可设置并看到当前 theme
- Announcement / Static Notice 输出可直接消费 theme
- 其他复用现有 public 页的 mode，本轮先不强求完整视觉覆盖

这比完全不落地 theme 更贴近文档，也避免无谓重构。

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. Screen Console 不再只是“切路由”
   - 会显示当前 `ScreenDisplay` 状态
2. Screen Console 可以显式切：
   - mode
   - theme
   - fallback override
3. 新增稳定公共播放入口：
   - `/screen/{raceSlug}`
4. Screen Operator 切换 mode 后，不需要记住具体内部路由
   - 公开播放 URL 保持不变
5. 强制静态公告 / 稳定 Projection fallback 时
   - 当前公开播放入口会反映这个 override

## 测试对齐

需要覆盖：

- `src/lib/services/screen-display.test.ts`
  - get/create default state
  - switch mode
  - configure theme
  - stable/static fallback override
  - public href resolution
- `src/app/_components/console/screen-console-controls.test.tsx`
  - 当前状态展示
  - mode / theme / fallback 控件
- 如需最小路由覆盖，可补服务/helper 层断言，而不是硬做重页面测试

## 验收对齐

本轮完成后，需要能证明：

1. `ScreenDisplay` 已成为独立持久化读模型
2. Screen Console 可以修改当前 mode / theme / fallback override
3. `/screen/{raceSlug}` 已成为当前公开大屏的稳定入口
4. 切换 mode 后，公开播放入口会跟随状态变化
5. fallback override 会被公开播放入口真实消费

## 一句话结论

这一刀要解决的不是“每种大屏都长什么样”，而是：`ScreenDisplay` 不能再只存在于 URL 参数和人脑里，必须先成为一个真实可控、可读、可公开播放的状态对象。

## 已落地实现补记（2026-07-11）

- `prisma/schema.prisma`
  - 已新增 `ScreenDisplay`、`ScreenMode`、`ScreenFallbackMode`
- `src/lib/services/screen-display.ts`
  - 已落地 `mode / theme / fallback override` 服务层
- `src/app/_components/console/screen-console-page.tsx`
  - 已新增 `当前 ScreenDisplay` 状态卡与控制表单
- `src/app/screen/[raceSlug]/page.tsx`
  - 已新增稳定公共播放入口
- `src/app/screen/[raceSlug]/static/page.tsx`
  - 已新增静态 fallback 公共播放页
- `src/app/jumbotron/[raceId]/page.tsx`
  - 已支持 `?source=stable`
- `src/app/_components/public/announcement-display.tsx`
  - 已开始消费 `theme`
- `src/app/_components/public/static-display-fallback.tsx`
  - 已开始消费 `screenDisplay.theme`
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/services/screen-display.test.ts src/app/_components/console/screen-console-controls.test.tsx`
  - `npm run build`
