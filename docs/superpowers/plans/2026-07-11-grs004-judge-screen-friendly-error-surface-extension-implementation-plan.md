# GRS004 / Judge And Screen Friendly Error Surface Extension Implementation Plan

## 实施步骤

✅ 审计 judge / organizer judges / screen console 当前错误暴露路径
✅ 扩展 `src/lib/action-feedback.ts`，加入 `judge_review / organizer_judges / screen_console`
✅ 给 judge section page 接入 route-level feedback
✅ 给 screen mode page 接入 route-level feedback
✅ 给 `JudgeConsolePageView` 接入 `ErrorNotice + returnTo`
✅ 给 `OrganizerConsolePageView` judge assignment 表单补 `returnTo`
✅ 给 `ScreenConsolePageView` 接入 `ErrorNotice + returnTo`
✅ 给 judge / organizer judges / screen 相关 action 补 `try/catch + buildActionFeedbackHref(...)`
✅ 新增 page source tests
✅ 更新 `src/app/actions.return-to.test.ts`
✅ 跑聚焦测试
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/[raceSlug]/judge/[section]/page.test.ts" "src/app/console/screen/[raceSlug]/[mode]/page.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/_components/console/judge-console-page.test.tsx" "src/app/_components/console/screen-console-controls.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 本轮结果

- judge 提交失败不再直接炸原始异常
- organizer judges 分配失败不再直接炸原始异常
- screen console 模式与主题控制失败不再直接炸原始异常
- 当前尚未覆盖 runner API、maintenance 次级动作和 admin 余量动作，后续继续按核心度推进
