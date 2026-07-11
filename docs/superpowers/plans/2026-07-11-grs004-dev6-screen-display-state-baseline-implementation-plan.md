# GRS004 / DEV-6 ScreenDisplay State Baseline Implementation Plan

**Goal:** 把 `ScreenDisplay` 落成真实持久化读模型，并补齐 Screen Console 对 `mode / theme / fallback override` 的控制，以及稳定的公开播放入口 `/screen/{raceSlug}`。

**Architecture:** 新增 `ScreenDisplay` 数据模型和最小服务层，Screen Console 只负责改状态，公开 `/screen/{raceSlug}` 负责读取状态并分发到现有 `jumbotron / live / results / works / announcement` 展示面或 fallback 输出。

**Tech Stack:** Next.js App Router、Server Actions、Prisma、Node test (`tsx`)

---

## Task 1: Schema + Service

- [ ] 在 `prisma/schema.prisma` 新增：
  - `ScreenDisplay`
  - 必要 enum：`ScreenMode`、`ScreenFallbackMode`
- [ ] 生成 migration 与 Prisma client
- [ ] 新增 `src/lib/services/screen-display.ts`
- [ ] 先补失败测试 `src/lib/services/screen-display.test.ts`
- [ ] 覆盖：
  - default state
  - switch mode
  - update theme
  - fallback to stable/static
  - resolve current public href
- [ ] 用最小实现把测试转绿

## Task 2: Read Model Wiring + Actions

- [ ] 更新 `src/lib/services/races.ts`
  - console-safe race read model 带上 `screenDisplay`
- [ ] 更新 `src/lib/services/public-routes.ts`
  - public-safe race read model 带上 `screenDisplay`
- [ ] 在 `src/app/actions.ts` 新增：
  - `updateScreenDisplayModeAction`
  - `updateScreenDisplayThemeAction`
  - `fallbackScreenDisplayToStableAction`
  - `fallbackScreenDisplayToStaticAction`

## Task 3: Screen Console UI

- [ ] 新增测试 `src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 更新 `src/app/_components/console/screen-console-page.tsx`
  - 展示当前 `ScreenDisplay` 状态
  - 提供 mode 切换控件
  - 提供 theme 配置控件
  - 提供 stable/static fallback 按钮
  - 提供稳定公共播放入口 `/screen/{raceSlug}`
- [ ] 更新：
  - `src/app/console/screen/page.tsx`
  - `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
  - 让页面把 `screenDisplay` 状态传给 view

## Task 4: Public Screen Display Route

- [ ] 新增 `src/app/screen/[raceSlug]/page.tsx`
  - 读取 `ScreenDisplay`
  - 按状态分发到当前公开展示目标
- [ ] 新增 `src/app/screen/[raceSlug]/static/page.tsx`
  - 全屏静态 fallback
- [ ] 如有必要，最小更新 `src/app/jumbotron/[raceId]/page.tsx`
  - 支持稳定快照优先入口
- [ ] 保持已有 `announcement` 播放页继续可用

## Task 5: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/lib/services/screen-display.test.ts src/app/_components/console/screen-console-controls.test.tsx src/app/_components/console/console-copy.test.tsx`
- [ ] 跑相关回归：
  - `node --import tsx --test src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/lib/services/public-routes.test.ts`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `ScreenDisplay` 已成为独立持久化读模型
- Screen Console 可以修改 mode / theme / fallback override
- `/screen/{raceSlug}` 已成为稳定的当前公开播放入口
- fallback override 能真实影响公开播放出口
- 聚焦测试、相关回归与 `npm run build` 全部通过
