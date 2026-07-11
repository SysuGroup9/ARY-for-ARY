# GRS004 / Organizer Core Friendly Error Surface Extension Design

## 目的

在已有 `Entry friendly error surface` 与 `Core flow friendly error surface extension` 的基础上，继续把统一友好报错扩展到 organizer 仍会直接操作、且仍可能暴露原始异常的核心链路：

- settings
- announcements
- awards
- reports

本轮继续遵循同一原则：

- 不引入新的交互系统
- 不大改 service 建模
- 只把失败路径收口成与现有页面一致的页内错误卡片

## 依据

- `docs/grs004/ary-mvp.prd.md`
  - Organizer 需要真实完成赛事发布、公告、榜单、报告等核心运营动作
- `docs/grs004/ary-mvp.ia.md`
  - `Organizer Console`
  - `Settings / Announcements / Awards / Reports`
- 当前仓库已有错误面基础设施
  - `src/lib/action-feedback.ts`
  - `src/app/_components/ary-shared.tsx`
  - organizer section page 已支持 route-level feedback

## 本轮范围

### 纳入

- `publishRaceAction`
- `updateRaceAction`
- `updateDisplayOptionsAction`
- `updateOrganizerCommentAction`
- `createAnnouncementDraftAction`
- `updateAnnouncementDraftAction`
- `publishAnnouncementAction`
- `hideAnnouncementAction`
- `generateAwardDraftsAction`
- `updateAwardDraftAction`
- `publishLeaderboardAction`
- `withdrawPublishedAwardsAction`
- `generateReportsAction`
- `updateReportDraftAction`
- `publishReportAction`
- `markReportReviewedAction`

### 不纳入

- 本轮不继续扩到 admin 独立页面
- 本轮不继续扩到 judge action
- 本轮不处理 `runCompatibility*`、`rebuildProcessModels*`、`screen` 等非一线用户主操作

## 设计

### 1. 扩展 organizer scopes

在 `src/lib/action-feedback.ts` 中扩展：

- `organizer_settings`
- `organizer_announcements`
- `organizer_awards`
- `organizer_reports`

并为这些 scope 提供：

- 独立标题
- 高频业务错误到中文提示的映射
- 对应 fallback 文案

### 2. action 处理规则

所有纳入 action 统一改成：

- 从表单接收 `returnTo`
- 成功后 `revalidatePath(...)` 并 `redirect(returnTo)`
- 失败时：
  - redirect error 直接 rethrow
  - 其它错误 redirect 到 `buildActionFeedbackHref(...)`

### 3. 组件回跳字段

在 organizer console 各分区表单中补：

- `raceSlug`
- `returnTo`

保证失败后回到当前分区：

- settings -> `/console/races/{raceSlug}/organizer/settings`
- announcements -> `/console/races/{raceSlug}/organizer/announcements`
- awards -> `/console/races/{raceSlug}/organizer/awards`
- reports -> `/console/races/{raceSlug}/organizer/reports`

### 4. 用户可见结果

- 发布赛事失败时，不再炸原始异常，而是留在 settings 分区显示页内错误卡片
- 编辑 / 发布 / 隐藏公告失败时，留在 announcements 分区显示错误卡片
- 生成 / 编辑 / 发布 / 撤回奖项失败时，留在 awards 分区显示错误卡片
- 生成 / 编辑 / reviewed / 发布报告失败时，留在 reports 分区显示错误卡片

## 验证

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/console/races/[raceSlug]/rider/[section]/page.test.ts" "src/app/races/[raceSlug]/register/page.test.ts" "src/app/_components/public/race-register-page.test.tsx" "src/app/_components/console/rider-console-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 一句话结论

本轮把 organizer 剩余的高频核心操作也纳入统一友好报错面，使 GRS004 当前最重要的用户操作链路基本都不再把原始异常直接暴露到页面。
