# GRS004 / DEV-6 Live Display Dedicated Output Implementation Plan

**Goal:** 把 `/screen/{raceSlug}/live` 从 `LiveHallView` 包壳收口成更接近原型的专用大屏输出面。

**Architecture:** 新增 `LiveDisplayView`，继续复用 `public-safe race read model`、`RaceSnapshot` 和 `JumbotronInline`，但重新组织页面层次为“中心 live board + 大字指标 + 精简辅助信息”。

**Tech Stack:** Next.js App Router、TypeScript、现有 snapshot/runtime 组件、Node test (`tsx`)

---

## Task 1: TDD - Live Display 组件测试

- [ ] 新增失败测试 `src/app/_components/public/live-display.test.tsx`
- [ ] 覆盖：
  - `Live Riding Board` 主标题
  - `active riders / sessions / risk / submit left`
  - 最近公告
  - stable/static fallback 提示
- [ ] 运行测试确认因组件缺失而失败

## Task 2: 实现 `LiveDisplayView`

- [ ] 新增 `src/app/_components/public/live-display.tsx`
- [ ] 复用：
  - `JumbotronInline`
  - `StaticDisplayFallback`
- [ ] 使用现有 race read model 和 projections 计算：
  - active riders
  - sessions
  - risk count
  - progress / token
  - submit left
- [ ] 让 `live-display.test.tsx` 转绿

## Task 3: 接入 `/screen/{raceSlug}/live`

- [ ] 更新 `src/app/screen/[raceSlug]/live/page.tsx`
  - 改为使用 `LiveDisplayView`
- [ ] 保持 `ScreenDisplayShell`、theme 和 snapshot fallback 兼容

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/public/live-display.test.tsx src/app/_components/public/live-hall.test.tsx src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `/screen/{raceSlug}/live` 已不再直接渲染 `LiveHallView`
- `LiveDisplayView` 已具备原型式中心大屏结构
- fallback 状态仍然清楚可见
- 测试与构建全部通过
