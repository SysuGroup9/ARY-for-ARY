# GRS004 / Organizer Core Friendly Error Surface Extension Implementation Plan

## 实施步骤

✅ 盘点 organizer 剩余仍直接暴露异常的核心 action
✅ 扩展 `src/lib/action-feedback.ts`，加入 `organizer_settings / organizer_announcements / organizer_awards / organizer_reports`
✅ 给 settings 相关 action 补 `returnTo + buildActionFeedbackHref(...)`
✅ 给 announcements 相关 action 补 `returnTo + buildActionFeedbackHref(...)`
✅ 给 awards 相关 action 补 `returnTo + buildActionFeedbackHref(...)`
✅ 给 reports 相关 action 补 `returnTo + buildActionFeedbackHref(...)`
✅ 给 organizer console 相关表单补 `raceSlug + returnTo`
✅ 更新 `src/app/actions.return-to.test.ts`
✅ 跑 organizer/public/rider 聚焦回归
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/console/races/[raceSlug]/rider/[section]/page.test.ts" "src/app/races/[raceSlug]/register/page.test.ts" "src/app/_components/public/race-register-page.test.tsx" "src/app/_components/console/rider-console-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 本轮结果

- organizer settings / announcements / awards / reports 失败时已统一回到原分区
- 当前 GRS004 的主办方高频操作已基本纳入统一友好报错面
- 仍未全面覆盖 admin、judge、maintenance、screen 等所有次级 action，后续继续按核心度推进
