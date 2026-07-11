# GRS004 / DEV-6 Billboard Screen Feed Integration Implementation Plan

**Goal:** 让 `/screen/{raceSlug}/billboard` 真正消费现有 `SCREEN_FEED` projection，并把 feed item 类型显式展示出来。

**Architecture:** 保留当前 `BillboardDisplayView` 的公告 / 奖项 / 风险摘要结构，同时新增 `screenFeedItems` 输入，使 billboard 成为 `SCREEN_FEED` 的直接展示面，而不是只拼 public-safe 摘要数据。

**Tech Stack:** Next.js App Router、TypeScript、现有 projection/rebuild 结构、Node test (`tsx`)

---

## Task 1: TDD - Billboard feed 测试

- [ ] 扩展 `src/app/_components/public/billboard-display.test.tsx`
- [ ] 覆盖：
  - `Screen Feed`
  - `公告 / 过程榜 / Session 摘要`
  - feed item summary
- [ ] 运行测试确认失败

## Task 2: 实现 Billboard feed 集成

- [ ] 更新 `src/app/_components/public/billboard-display.tsx`
- [ ] 新增 `screenFeedItems` 输入
- [ ] 显示 feed item 类型标签和 summary
- [ ] 保留现有 Award / 最新公告 / 风险摘要

## Task 3: 接入 `/screen/{raceSlug}/billboard`

- [ ] 更新 `src/app/screen/[raceSlug]/billboard/page.tsx`
  - 解析 `SCREEN_FEED` projection
  - 传给 `BillboardDisplayView`

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/public/billboard-display.test.tsx`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- Billboard 已开始消费现有 `SCREEN_FEED`
- feed item 类型在页面中明确可见
- 没有新增新的 ProjectionType
- 测试与构建全部通过
