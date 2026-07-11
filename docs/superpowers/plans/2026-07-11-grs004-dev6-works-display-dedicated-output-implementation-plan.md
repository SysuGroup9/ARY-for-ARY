# GRS004 / DEV-6 Works Display Dedicated Output Implementation Plan

**Goal:** 把 `/screen/{raceSlug}/works` 从 `WorksPageView` 套壳收口成更接近原型的专用大屏作品墙。

**Architecture:** 新增 `WorksDisplayView`，继续复用 `public-safe race read model`，但重新组织页面层次为“精选作品 hero + 作品墙卡片 + 作品橱窗摘要”，而不是普通公开列表页。

**Tech Stack:** Next.js App Router、TypeScript、现有 public route 服务、Node test (`tsx`)

---

## Task 1: TDD - Works Display 组件测试

- [ ] 新增失败测试 `src/app/_components/public/works-display.test.tsx`
- [ ] 覆盖：
  - `Works / Showcase`
  - `Featured Work`
  - `作品橱窗`
  - 已公开作品卡片
  - 不出现普通 `WorksPageView` 文案
- [ ] 运行测试确认因组件缺失而失败

## Task 2: 实现 `WorksDisplayView`

- [ ] 新增 `src/app/_components/public/works-display.tsx`
- [ ] 只消费：
  - `public-safe race read model`
  - 已公开 `Work`
  - 已发布 `Award`
- [ ] 计算：
  - featured work
  - public work count
  - awarded work count
  - judging work count
- [ ] 让 `works-display.test.tsx` 转绿

## Task 3: 接入 `/screen/{raceSlug}/works`

- [ ] 更新 `src/app/screen/[raceSlug]/works/page.tsx`
  - 改为使用 `WorksDisplayView`
- [ ] 保持 `ScreenDisplayShell` 与 theme 兼容

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/public/works-display.test.tsx src/lib/services/screen-display.test.ts`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `/screen/{raceSlug}/works` 已不再直接渲染 `WorksPageView`
- 页面已具备 `Works / Showcase` 的专用大屏结构
- 未公开作品不会进入 `Works Display`
- 测试与构建全部通过
