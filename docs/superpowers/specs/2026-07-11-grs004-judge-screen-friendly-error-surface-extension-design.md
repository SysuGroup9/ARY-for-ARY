# GRS004 / Judge And Screen Friendly Error Surface Extension Design

## 目的

继续把统一友好报错从 public / rider / organizer 主链路扩展到剩余的核心分区：

- judge console
- organizer judges assignment
- screen console

这三块都属于当前 GRS004 的真实操作入口，且失败时不应再直接暴露原始异常。

## 依据

- `docs/grs004/ary-mvp.prd.md`
  - Judge 需要完成真实评审提交
  - Screen Console 需要完成展示模式和校准控制
- `docs/grs004/ary-mvp.ia.md`
  - `Judge View`
  - `Screen Console`
  - `Judge Assignment`
- 当前仓库已有错误面基础设施
  - `src/lib/action-feedback.ts`
  - `ErrorNotice`
  - route-level `feedbackScope / feedbackMessage`

## 本轮范围

### 纳入

- `submitJudgingRecordAction`
- `assignJudgeToWorkAction`
- `removeJudgeAssignmentAction`
- `updateScreenDisplayModeAction`
- `updateScreenDisplayThemeAction`
- `saveRaceTrackCalibrationAction`
- `fallbackScreenDisplayToStableAction`
- `fallbackScreenDisplayToStaticAction`

### 不纳入

- 本轮不继续扩到 runner result API
- 本轮不继续扩到 admin 区域
- 本轮不继续扩到 maintenance 里的低频动作

## 设计

### 1. action feedback scopes

扩展 `src/lib/action-feedback.ts`：

- `judge_review`
- `organizer_judges`
- `screen_console`

并补充对应标题、业务错误映射与 fallback 文案。

### 2. 页面层接线

给以下页面接入 route-level feedback：

- `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`
- `src/app/console/screen/[raceSlug]/[mode]/page.tsx`

页面只负责：

- 读取 `feedbackScope / feedbackMessage`
- 调 `getActionFeedbackContent()`
- 把结果传给 view 组件

### 3. 组件接线

给以下组件接入 `ErrorNotice` 和隐藏回跳字段：

- `JudgeConsolePageView`
  - 表单补 `returnTo=/console/races/{raceSlug}/judge/{section}`
- `OrganizerConsolePageView`
  - judge assignment 表单补 `raceSlug + returnTo`
- `ScreenConsolePageView`
  - 模式切换、主题保存、fallback 切换表单补 `returnTo`

### 4. action 行为

统一改成：

- 成功：
  - `revalidatePath(...)`
  - `redirect(returnTo)`
- 失败：
  - redirect error 直接 rethrow
  - 其它错误走 `buildActionFeedbackHref(...)`

### 5. 用户可见结果

- Judge 提交评审失败时，会留在 judge 当前分区显示页内错误卡片
- Organizer 分配或移除评委失败时，会留在 organizer judges 分区显示页内错误卡片
- Screen Console 切换模式、改主题、切 fallback、保存校准失败时，会留在当前 screen mode 分区显示页内错误卡片

## 验证

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/[raceSlug]/judge/[section]/page.test.ts" "src/app/console/screen/[raceSlug]/[mode]/page.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/_components/console/judge-console-page.test.tsx" "src/app/_components/console/screen-console-controls.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 一句话结论

本轮把 judge、judge assignment、screen console 也纳入统一友好报错面，使当前 GRS004 最关键的交互分区基本都不再把原始异常直接抛给页面。
