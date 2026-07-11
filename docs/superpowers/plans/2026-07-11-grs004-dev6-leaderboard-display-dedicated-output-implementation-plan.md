# GRS004 / DEV-6 Leaderboard Display Dedicated Output Implementation Plan

**Goal:** 把 `/screen/{raceSlug}/leaderboard` 从 `ResultsPageView` 套壳收口成更像现场大屏的最终榜输出面。

**Architecture:** 新增 `LeaderboardDisplayView`，复用 `buildPublicResultsModel()` 与已发布 `race_report` 数据，但用更简洁、更大屏化的结构来表达最终 `Award Leaderboards / Winning Works / Riding Skill Highlights`。

**Tech Stack:** Next.js App Router、TypeScript、现有 results 服务、Node test (`tsx`)

---

## Task 1: TDD - Leaderboard Display 组件测试

- [ ] 新增失败测试 `src/app/_components/public/leaderboard-display.test.tsx`
- [ ] 覆盖：
  - Award 分组
  - Winning Works
  - Riding Skill Highlights
  - 不出现过程榜措辞
- [ ] 运行测试确认因组件缺失而失败

## Task 2: 实现 `LeaderboardDisplayView`

- [ ] 新增 `src/app/_components/public/leaderboard-display.tsx`
- [ ] 只消费：
  - `awards`
  - `raceReport`
  - `ridingSkillHighlights`
- [ ] 不引入 `CURRENT_LEADERBOARD`
- [ ] 让 `leaderboard-display.test.tsx` 转绿

## Task 3: 接入 `/screen/{raceSlug}/leaderboard`

- [ ] 更新 `src/app/screen/[raceSlug]/leaderboard/page.tsx`
  - 改为使用 `LeaderboardDisplayView`
- [ ] 保持 `ScreenDisplayShell` 与 theme 兼容

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/public/leaderboard-display.test.tsx src/lib/services/results.test.ts src/lib/services/review.test.ts`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `/screen/{raceSlug}/leaderboard` 已不再直接渲染 `ResultsPageView`
- 页面只表达最终榜，不混入过程榜语义
- 测试与构建全部通过
