# GRS004 / DEV-6 Dedicated Screen Mode Pages Baseline Implementation Plan

**Goal:** 为 `billboard / live / leaderboard / works` 补齐真正的 `screen/*` 播放页，并让 `ScreenDisplay` 状态分发优先落到这些专门模式页。

**Architecture:** 新增统一 `ScreenDisplayShell`，让 `live / leaderboard / works` 在独立 `screen/*` 路由里复用现有 public-safe 视图组件；单独新增 `BillboardDisplayView` 作为最小信息板；更新 `resolveScreenDisplayHref()` 统一分发到这些模式页。

**Tech Stack:** Next.js App Router、TypeScript、现有 public-safe read model、Node test (`tsx`)

---

## Task 1: TDD - Href 分发与 Billboard 组件

✅ 先更新 `src/lib/services/screen-display.test.ts`
  - 补 `billboard / live / leaderboard / works` 的 href 断言
✅ 新增失败测试 `src/app/_components/public/billboard-display.test.tsx`
✅ 跑测试确认因功能缺失而失败

## Task 2: Billboard 视图与 Shell

✅ 新增 `src/app/_components/public/screen-display-shell.tsx`
✅ 新增 `src/app/_components/public/billboard-display.tsx`
✅ 用现有 public-safe race / results 数据拼出最小信息板
✅ 让 `billboard-display.test.tsx` 转绿

## Task 3: Dedicated Screen Routes

✅ 新增：
  - `src/app/screen/[raceSlug]/billboard/page.tsx`
  - `src/app/screen/[raceSlug]/live/page.tsx`
  - `src/app/screen/[raceSlug]/leaderboard/page.tsx`
  - `src/app/screen/[raceSlug]/works/page.tsx`
✅ `live / leaderboard / works` 复用现有视图组件，但外层套 `ScreenDisplayShell`

## Task 4: Update ScreenDisplay Routing

✅ 更新 `src/lib/services/screen-display.ts`
  - `resolveScreenDisplayHref()` 指向新的 `screen/*` 模式页
✅ 如有必要，最小更新 `src/app/_components/console/screen-console-page.tsx`
  - 让当前公开播放入口显示新的模式页 URL

## Task 5: Verification + Docs

✅ 跑聚焦测试：
  - `node --import tsx --test src/lib/services/screen-display.test.ts src/app/_components/public/billboard-display.test.tsx src/app/_components/console/screen-console-controls.test.tsx`
✅ 跑相关回归：
  - `node --import tsx --test src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx`
✅ 跑构建：
  - `npm run build`
✅ 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `billboard` 已成为独立模式页
- `live / leaderboard / works` 已拥有独立 `screen/*` 播放页
- `resolveScreenDisplayHref()` 已分发到新的模式页
- 相关测试与构建全部通过
