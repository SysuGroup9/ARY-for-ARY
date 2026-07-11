# GRS004 / Runner 自动入队降级对齐 Design

## 目的

本设计直接承接：

- `docs/grs004/grs003-gap-analysis.md`
  - `CA Push+Fetch 模式 | 🔶`
  - `Runner API 废除 | 🔶`
  - `评分模式迁移 | 🔶`
- `docs/grs004/防伪与防篡改计划.md`
  - Runner 已从主裁决链路降级为兼容链路或辅助处理组件
- 当前代码与文档偏差
  - `docs/superpowers/status.md` 已写明“提交不再自动入 Runner 队列”
  - 但当前代码里：
    - `createSubmission(..., { enqueueSubmissionTest: true })` 仍会自动创建 `RunnerTask`
    - Rider Console 仍把比赛中的提交入口写成 `赛中代码测试`
    - `submitEntryForTestAction` 仍是可调用 action

本轮目标是：把“Rider 提交不再自动触发 Runner”真正落实到代码和文案，让当前代码重新与 `grs004` 的主链路口径一致。

## 范围

### 本轮纳入

- `createSubmission()`
  - 不再支持 Rider 提交时自动 enqueue `RunnerTask`
- `submitEntryForTestAction`
  - 删除
- Rider Console `submission` section
  - 比赛中入口从“赛中代码测试”收回到“作品提交”
  - 提交按钮不再承诺会主动发起 Runner 测试
- 测试更新
  - 明确验证比赛中提交不会自动生成 `RunnerTask`
  - `pullRunnerTask()` 相关完整性测试改为显式构造测试队列，而不是依赖 Rider 自动入队

### 本轮不纳入

- 不删除 `/api/runner/tasks/pull`
- 不删除 `/api/runner/tasks/result`
- 不删除 `RunnerTask` 模型
- 不移除 Organizer 手动触发的兼容 Runner 路径
- 不改 Judge / `JudgingRecord` 主流程

## 约束

1. 只收“自动入队”这条残留，不夸大成“Runner API 已完全废除”。
2. 保留兼容 Runner 路径，避免影响现有材料完整性与评测兼容测试。
3. 用户可见文案必须与实际行为一致。

## 方案

### 方案 A：删除 Rider 自动入队 + 保留兼容 Runner API

做法：

- `src/lib/services/submissions.ts`
  - `createSubmission()` 只负责写 `Submission / SubmissionArtifact / SecurityAudit`
  - 不再接收 `enqueueSubmissionTest` 选项
- `src/app/actions.ts`
  - 删除 `submitEntryForTestAction`
- `src/app/_components/console/rider-console-page.tsx`
  - 比赛中使用 `submitEntryAction`
  - 文案改回 `作品提交 / 提交代码`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 用显式 `RunnerTask` 测试夹具继续验证 `pullRunnerTask()`

优点：

- 直接命中当前代码与文档不一致的点
- 不影响兼容 Runner API 继续存在
- 让用户文案与真实行为重新一致

### 推荐方案

采用方案 A。

## 用户可见变化

本轮落地后，用户现在能直接看到：

1. Rider Console 比赛中入口不再写成“赛中代码测试”
2. 比赛中提交按钮改回 `提交代码`
3. 提交代码时不会再隐式触发 Runner 测试队列
4. 比赛结束后仍可继续补交代码与 `Riding Record`

## 测试对齐

需要覆盖：

- `src/app/_components/console/rider-console-page.test.tsx`
- `src/app/actions.return-to.test.ts`
- `src/lib/services/material-integrity-submissions.test.ts`

验证命令：

```bash
node --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/app/actions.return-to.test.ts src/lib/services/material-integrity-submissions.test.ts
npm run build
```

## 验收对齐

本轮完成后，需要能证明：

1. Rider 比赛中提交不再自动创建 `RunnerTask`
2. `submitEntryForTestAction` 已移除
3. Rider Console 比赛中入口文案不再承诺“发起赛中测试”
4. 兼容 Runner API 仍可被显式测试夹具覆盖

## 一句话结论

这轮补的是“Rider 自动触发 Runner”的降级对齐，不是“Runner API 全面删除”。
