# GRS004 / Runner 自动入队降级对齐 Implementation Plan

## 目标

让 Rider 提交流程不再自动触发 Runner 入队，并让 UI 文案和当前主链路保持一致。

## 任务拆分

### Task 1: 先补失败测试

- [ ] `src/app/_components/console/rider-console-page.test.tsx`
  - 比赛中入口不再出现 `赛中代码测试`
  - 按钮文案改为 `提交代码`
- [ ] `src/app/actions.return-to.test.ts`
  - `submitEntryForTestAction` 不再存在
- [ ] `src/lib/services/material-integrity-submissions.test.ts`
  - `createSubmission()` 后不再自动创建 `RunnerTask`

### Task 2: 删除 Rider 自动入队

- [ ] `src/lib/services/submissions.ts`
  - 删除 `enqueueSubmissionTest` 选项
  - 删除对 `enqueueSubmissionTestTask()` 的调用
- [ ] `src/app/actions.ts`
  - 删除 `submitEntryForTestAction`

### Task 3: 收口 Rider 提交区文案

- [ ] `src/app/_components/console/rider-console-page.tsx`
  - 比赛中入口改回 `作品提交`
  - 按钮文案改为 `提交代码`
  - 未开放提示不再写“赛中测试”

### Task 4: 显式测试夹具替代自动入队

- [ ] `src/lib/services/material-integrity-submissions.test.ts`
  - 用显式 `RunnerTask` fixture 继续验证 `pullRunnerTask()` 的完整性边界

### Task 5: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-runner-autoqueue-demotion-alignment-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-runner-autoqueue-demotion-alignment-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/app/actions.return-to.test.ts src/lib/services/material-integrity-submissions.test.ts
npm run build
```

## 完成标准

- Rider 比赛中提交不再自动创建 `RunnerTask`
- `submitEntryForTestAction` 已删除
- Rider Console 文案不再写“赛中代码测试”
- `pullRunnerTask()` 相关兼容测试仍然可运行
