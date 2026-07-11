# GRS004 / Core Flow Friendly Error Surface Extension Implementation Plan

## 实施步骤

- [x] 核对 `public register / rider console / organizer console` 当前是否仍缺少 route-level friendly error 接线
- [x] 审计 `register / withdraw / CA setup / submission / organizer registration / organizer works` 的 action 错误路径
- [x] 扩展 `src/lib/action-feedback.ts`，增加 organizer scope 与核心业务错误映射
- [x] 给 `src/app/races/[raceSlug]/register/page.tsx` 接入 `feedbackScope / feedbackMessage`
- [x] 给 `src/app/console/races/[raceSlug]/rider/[section]/page.tsx` 接入 `feedbackScope / feedbackMessage`
- [x] 给 `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx` 接入 `feedbackScope / feedbackMessage`
- [x] 给 `RaceRegisterPageView` 增加页内错误卡片与 `feedbackReturnTo`
- [x] 给 `RiderConsolePageView` 增加页内错误卡片与相关 `returnTo / feedbackReturnTo`
- [x] 给 `OrganizerConsolePageView` 增加页内错误卡片与相关 `returnTo / feedbackReturnTo`
- [x] 给 rider 核心 action 增加 `try/catch + redirect(buildActionFeedbackHref(...))`
- [x] 给 organizer 报名审核与作品控制 action 增加 `try/catch + redirect(buildActionFeedbackHref(...))`
- [x] 更新 `src/app/actions.return-to.test.ts`
- [x] 新增页面级 source tests
- [x] 回归现有 public / rider / organizer 组件测试
- [x] 运行 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/races/[raceSlug]/register/page.test.ts" "src/app/console/races/[raceSlug]/rider/[section]/page.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/_components/public/race-register-page.test.tsx" "src/app/_components/console/rider-console-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 本轮结果

- public register 的失败提示不再掉回原始异常
- rider 的报名 / CA setup / submission 主链路已统一页内错误反馈
- organizer 的报名审核 / 作品控制主链路已统一页内错误反馈
- 当前仍未覆盖所有 admin / judge / announcement / report / award action，后续按主链路优先级继续推进
