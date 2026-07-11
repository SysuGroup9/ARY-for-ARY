# GRS004 / DEV-6 Announcement + Screen Display Baseline Implementation Plan

**Goal:** 把 `Announcement` 落成第一类实体，并补齐 Organizer 公告管理、公开公告播放页、`Screen Console` 的 announcement 模式入口，以及 `Live Hall` / 静态 fallback 对最近已发布公告的读取。

**Architecture:** 使用现有 `Visibility` 语义新增 `Announcement` 表；Organizer 侧通过新的 service/actions 驱动公告草稿、发布和隐藏；公开侧新增独立 `Announcement Display` 页并在 `Live Hall` / `StaticDisplayFallback` 优先消费最近已发布公告。

**Tech Stack:** Next.js App Router、Server Actions、Prisma、Node test (`tsx`)

---

## Task 1: Schema + Service Baseline

- [ ] 在 `prisma/schema.prisma` 新增 `Announcement` 模型，并把 `Race` 关联补齐
- [ ] 生成 migration 与 Prisma client
- [ ] 新增 `src/lib/services/announcements.ts`
- [ ] 先写失败测试 `src/lib/services/announcements.test.ts`
- [ ] 依次覆盖：
  - create draft
  - edit draft
  - publish
  - hide
  - public read gating
- [ ] 实现最小 service 代码直到测试转绿

## Task 2: Actions + Organizer Console

- [ ] 在 `src/app/actions.ts` 增加：
  - `createAnnouncementDraftAction`
  - `updateAnnouncementDraftAction`
  - `publishAnnouncementAction`
  - `hideAnnouncementAction`
- [ ] 在 `src/app/_components/console/console-shell.tsx` 增加 organizer `announcements` section
- [ ] 在 `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx` 增加对应 label
- [ ] 先写失败测试 `src/app/_components/console/organizer-announcement-controls.test.tsx`
- [ ] 在 `src/app/_components/console/organizer-console-page.tsx` 实现公告 section
- [ ] 确认 organizer 只能看到 managed race 的公告管理入口

## Task 3: Public Announcement Display + Screen Mode Link

- [ ] 新增公开播放组件 `src/app/_components/public/announcement-display.tsx`
- [ ] 新增测试 `src/app/_components/public/announcement-display.test.tsx`
- [ ] 新增公开路由 `src/app/screen/[raceSlug]/announcement/page.tsx`
- [ ] 更新 `src/app/_components/console/screen-console-page.tsx`
  - `announcement` 模式指向独立播放页
  - 显示最近已发布公告概览，而不是只保留占位说明
- [ ] 按 TDD 让 announcement display 测试与 screen console copy 测试转绿

## Task 4: Live Hall + Static Fallback

- [ ] 更新 `src/lib/services/races.ts` 与 `src/lib/services/public-routes.ts`，把公告数据带到读模型
- [ ] 更新 `src/app/_components/public/live-hall.tsx`
  - 新增最近公告卡片
- [ ] 更新 `src/app/_components/public/static-display-fallback.tsx`
  - 优先使用最近已发布公告摘要
- [ ] 先补失败测试到：
  - `src/app/_components/public/live-hall.test.tsx`
  - 如有必要补一条 `StaticDisplayFallback` 断言到现有测试文件
- [ ] 实现最小代码直到测试转绿

## Task 5: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/lib/services/announcements.test.ts src/app/_components/console/organizer-announcement-controls.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx`
- [ ] 跑回归验证：
  - `node --import tsx --test src/lib/services/public-routes.test.ts src/lib/services/results.test.ts src/lib/services/review.test.ts`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `Announcement` 已成为独立模型并完成 migration
- Organizer 已能 create / edit / publish / hide 公告
- Public `Announcement Display` 已可播放最近已发布公告
- `Screen Console` 的 `announcement` 模式不再只是占位说明
- `Live Hall` / 静态 fallback 已优先读取最近已发布公告
- 聚焦测试、公开链路回归和 `npm run build` 全部通过
