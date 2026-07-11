# GRS004 / DEV-6 Screen Feed Works + Final Leaderboard Implementation Plan

**Goal:** 让 `SCREEN_FEED` 真正补齐 `leaderboard_read_model` 与 `works` 两类已在文档中显式列出的 feed item。

**Architecture:** 继续沿用现有 `ProjectionType.SCREEN_FEED`，只扩 item 类型和 projection rebuild 逻辑，不新增新模型；同时让 `BillboardDisplayView` 把两类新 item 渲染成显式标签。

**Tech Stack:** Prisma、现有 projection rebuild 逻辑、Next.js、TypeScript、Node test (`tsx`)

---

## Task 1: TDD - feed 类型测试

- [ ] 新增 `src/lib/services/screen-feed-projection.test.ts`
- [ ] 扩展 `src/app/_components/public/billboard-display.test.tsx`
- [ ] 覆盖：
  - `SCREEN_FEED` 包含 `leaderboard_read_model`
  - `SCREEN_FEED` 包含 `works`
  - Billboard 可见 `最终榜 / 作品`
- [ ] 运行测试确认失败

## Task 2: 扩 projection 构建

- [ ] 更新 `src/lib/evidence-projection-helpers.ts`
- [ ] 更新 `src/lib/services/projections.ts`
- [ ] `SCREEN_FEED` 新增：
  - `leaderboard_read_model`
  - `works`

## Task 3: 接入 Billboard 展示

- [ ] 更新 `src/app/_components/public/billboard-display.tsx`
- [ ] 更新 `/screen/[raceSlug]/billboard/page.tsx`
- [ ] 让 Billboard 显示两类新标签

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/lib/services/screen-feed-projection.test.ts src/app/_components/public/billboard-display.test.tsx`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `SCREEN_FEED` 已产出 `leaderboard_read_model / works`
- Billboard 可见 `最终榜 / 作品`
- 没有新增新 ProjectionType
- 测试与构建全部通过
