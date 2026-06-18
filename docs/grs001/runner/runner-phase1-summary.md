# ARY Runner 第一期重构说明

日期：2026-06-06

## 1. 这份文档的目的

这份文档用于总结当前工作区里已经完成的 runner 第一期重构改动。

它回答四个问题：

1. 这轮改动想解决什么问题
2. 实际改了哪些代码和数据模型
3. 现在 runner 主链路变成了什么样
4. 哪些部分已经验证通过，哪些部分还留给下一阶段

## 2. 这轮改动的核心目标

这轮改动的核心目标是把当前项目里的 runner 流程，从“ARY 直接围绕 `Submission` 做评分”重构成“以独立任务为中心的 runner 主链路”，并且把分数计算边界改成：

- organizer 侧 runner 回传包含评分分项的 JSON
- ARY 根据创建比赛时配置的权重自行计算总分、分项投影与最终展示

同时保留以下约束：

- 第一阶段先不实现 `register / heartbeat / renew / status / fail`
- 第一阶段继续复用当前按钮触发任务
- 第一阶段继续让 `pull` 返回内联内容，不先做 signed URL 下载链路

## 3. 已完成的模型改动

### 3.1 新增的 schema

在 [prisma/schema.prisma](D:/Desktop/ARY-for-ARY/prisma/schema.prisma) 中新增了：

- `RunnerTaskType`
  - `SUBMISSION_TEST`
  - `PROGRESS_EVAL`
  - `HARNESS_EVAL`
- `RunnerTaskStatus`
  - `QUEUED`
  - `CLAIMED`
  - `SUCCEEDED`
  - `FAILED`
  - `STALE`
- `SubmissionArtifact`
  - 保存某次提交对应的不可变评测输入
- `RunnerTask`
  - 保存独立 runner 任务

### 3.2 现有 schema 的调整

还做了这些兼容性调整：

- `SubmissionStatus` 新增 `FAILED`
- `Submission.recordLabel` 改为可空
- `Submission.ridingRecord` 继续可空
- `TeamArchive.recordLabel` / `ridingRecord` 改为可空
- `TeamArchive.taskScore` / `dialogueScore` / `tokenScore` / `reasoningScore` / `keywordScore` 改为可空
- `LeaderboardEntry.taskScore` / `tokenScore` / `dialogueScore` 改为可空
- `HarnessEntry.reasoningScore` / `keywordScore` 改为可空
- `LeaderboardEntry` 增加 `raceId + teamId` 唯一约束
- `HarnessEntry` 增加 `raceId + teamId` 唯一约束

### 3.3 migration

新增 migration：

- [20260606190000_runner_tasks](D:/Desktop/ARY-for-ARY/prisma/migrations/20260606190000_runner_tasks/migration.sql)

这个 migration 做了两类事情：

1. 重建旧表，使可空字段和唯一约束与新模型一致
2. 新建 `SubmissionArtifact` 与 `RunnerTask`

## 4. 已完成的服务层改动

### 4.1 `Submission` 的职责被收窄

[src/lib/services/submissions.ts](D:/Desktop/ARY-for-ARY/src/lib/services/submissions.ts) 现在只负责：

- 处理用户提交
- 创建 `Submission`
- 创建 `SubmissionArtifact`
- 自动入队一个 `SUBMISSION_TEST` 任务

它不再负责：

- runner 拉取任务
- runner 回传结果
- ARY 自己计算分数
- 直接重算公开榜单或 Harness 展示

### 4.2 新增独立 runner service

新增文件：

- [src/lib/services/runner.ts](D:/Desktop/ARY-for-ARY/src/lib/services/runner.ts)

当前它已经负责：

- `enqueueSubmissionTestTask`
- `enqueueProgressEvalTasks`
- `enqueueHarnessEvalTasks`
- `pullRunnerTask`
- `completeRunnerTask`

当前落地的行为是：

- 比赛中 `submitEntryAction` 只允许提交代码，并自动生成一条 `SUBMISSION_TEST` 任务
- 比赛结束后 `submitFinalEntryAction` 要求同时提交最终代码与 `Riding Record`
- 赛后提交会自动生成对应的 `HARNESS_EVAL` 任务，Organizer 仍可按需手动再次发起
- Organizer 点“发起进度评测”会按队伍最新代码 artifact 生成 `PROGRESS_EVAL`
- Organizer 点“发起 Harness 评测”会按有 `Riding Record` 的赛后 artifact 生成 `HARNESS_EVAL`
- 同一队伍同一类型的未完成旧任务会被标记为 `STALE`
- runner 从 `RunnerTask` 拉任务，不再直接从 `Submission` 拉
- runner 回传结果时提交评分分项 JSON，ARY 依据比赛权重计算总分

### 4.3 结果投影规则

当前代码里，任务完成后的投影规则是：

- `SUBMISSION_TEST`
  - 回写 `Submission.totalScore`
  - 更新 `Submission.status`
  - 清空主提交流水中的原文
- `PROGRESS_EVAL`
  - 更新 `TeamArchive`
  - 更新 `LeaderboardEntry`
  - 更新 `Race.lastLeaderboardSyncAt`
- `HARNESS_EVAL`
  - 更新 `HarnessEntry`
  - 重建 `RidingHighlight`
  - 更新 `Race.lastShowcaseSyncAt`

这里的重要变化是：

- ARY 会根据 `passRate / codeReviewScore / reasoningScore / keywordScore` 和比赛权重自行计算总分
- runner 不再直接回最终 `score`

## 5. 已完成的接口改动

### 5.1 `pull`

[src/app/api/runner/tasks/pull/route.ts](D:/Desktop/ARY-for-ARY/src/app/api/runner/tasks/pull/route.ts) 已改为走新的 `runner.ts`。

当前响应已经切到任务驱动，返回：

- `taskId`
- `taskType`
- `raceId`
- `teamId`
- `teamName`
- `submissionId`
- `metadata`
- `taskPackageLabel`
- `taskDescription`
- `keywords`
- 内联代码内容
- 仅在 `HARNESS_EVAL` 时才真正附带 `Riding Record`

### 5.2 `result`

[src/app/api/runner/tasks/result/route.ts](D:/Desktop/ARY-for-ARY/src/app/api/runner/tasks/result/route.ts) 已改为接收评分分项 JSON。

当前接收：

- `taskId`
- `submissionId`
- `status`
- `progress`（进行中评测时可选）
- `passRate`
- `codeReviewScore`
- `reasoningScore`
- `keywordScore`
- `runnerComment`
- `resultHash`
- `finishedAt`

ARY 收到这些字段后，会结合比赛创建时配置的权重计算：

- `taskScore`
- `dialogueScore`
- `tokenScore`
- `totalScore`

## 6. 已完成的校验与测试改动

### 6.1 提交校验

[src/lib/validation.ts](D:/Desktop/ARY-for-ARY/src/lib/validation.ts) 已修改：

- 比赛中普通提交只校验代码字段，不再接收 `Riding Record`
- 赛后最终提交必须同时提供代码与 `Riding Record`
- 新增 `runnerResultSchema`
  - 面向 runner 回传的评分分项 JSON 做校验

### 6.2 新增测试

新增测试文件：

- [src/lib/runner-task-helpers.test.ts](D:/Desktop/ARY-for-ARY/src/lib/runner-task-helpers.test.ts)
- [src/lib/runner-validation.test.ts](D:/Desktop/ARY-for-ARY/src/lib/runner-validation.test.ts)

并扩展了：

- [src/lib/validation.test.ts](D:/Desktop/ARY-for-ARY/src/lib/validation.test.ts)

这些测试覆盖了：

- `submission_test` 不带 `Riding Record`
- `harness_eval` 会带 `Riding Record`
- runner 结果可以提交评分分项 JSON 并通过校验
- 普通提交在没有 `Riding Record` 时也能通过校验

## 7. 已完成的页面与交互改动

### 7.1 Organizer 按钮语义改变

[src/app/page.tsx](D:/Desktop/ARY-for-ARY/src/app/page.tsx) 中：

- `同步公开榜单` 改为 `发起进度评测`
- `生成赛后展示` 改为 `发起 Harness 评测`

这样页面语义和 runner 任务模型一致了：按钮本身不是直接改榜单，而是创建任务。

### 7.2 提交表单变化

提交表单中的规则现在分成两条：

- 比赛中主动提交：只提交代码，不出现 `Riding Record` 字段
- 赛后最终提交：必须同时提交最终代码和 `Riding Record`

### 7.3 `Runner Queue` 变化

底部 `Runner Queue` 区块已经从展示 `Submission` 改成展示 `RunnerTask`。

当前会显示：

- 队伍
- 任务类型
- 状态
- 提交 ID
- 总分
- 时间

### 7.4 榜单与赛后分项兼容

[src/app/_components/ary-shared.tsx](D:/Desktop/ARY-for-ARY/src/app/_components/ary-shared.tsx) 已改成：

- 榜单里的 `taskScore / tokenScore / dialogueScore` 为空时显示 `-`
- Harness 展示里的 `reasoningScore / keywordScore` 为空时显示 `-`

这样在分项分数尚未齐全时页面仍能继续工作；一旦 runner 回传分项，榜单与赛后页会显示计算后的结果。

## 8. seed 数据已同步

[prisma/seed.ts](D:/Desktop/ARY-for-ARY/prisma/seed.ts) 已经同步到新模型：

- 新建了 `SubmissionArtifact`
- 新建了三条演示任务：
  - `SUBMISSION_TEST`
  - `PROGRESS_EVAL`
  - `HARNESS_EVAL`
- 榜单和 Harness 演示数据改成与“runner 回传分项、ARY 计算总分”的模式兼容

## 9. 已完成的验证

当前已经完成这些验证：

- 本地 SQLite 已手动应用新 migration
- 本地 seed 已重新执行
- `npx prisma generate` 成功
- `node --import tsx --test ...` 通过
- `npm run lint` 通过
- `npm run build` 通过

## 10. 当前仍未完成的内容

这轮改动还没有做完以下事项：

1. `register / heartbeat / renew / status / fail` 控制面接口仍未实现
2. `pull` 仍是内联正文，不是 signed URL / artifact 下载模式
3. 还没有新增 runner 专用的更完整 service 测试
4. 还没有用浏览器完整回归一次：
   - 提交代码
   - 发起进度评测
   - runner 拉任务
   - runner 回传评分分项 JSON
   - 观察首页队列表和榜单变化
5. 当前 `build` 通过，但这轮改动还没有单独 commit

## 11. 这轮修改的关键文件

本轮主要修改文件：

- [prisma/schema.prisma](D:/Desktop/ARY-for-ARY/prisma/schema.prisma)
- [prisma/migrations/20260606190000_runner_tasks/migration.sql](D:/Desktop/ARY-for-ARY/prisma/migrations/20260606190000_runner_tasks/migration.sql)
- [prisma/seed.ts](D:/Desktop/ARY-for-ARY/prisma/seed.ts)
- [src/lib/services/runner.ts](D:/Desktop/ARY-for-ARY/src/lib/services/runner.ts)
- [src/lib/services/submissions.ts](D:/Desktop/ARY-for-ARY/src/lib/services/submissions.ts)
- [src/lib/validation.ts](D:/Desktop/ARY-for-ARY/src/lib/validation.ts)
- [src/app/api/runner/tasks/pull/route.ts](D:/Desktop/ARY-for-ARY/src/app/api/runner/tasks/pull/route.ts)
- [src/app/api/runner/tasks/result/route.ts](D:/Desktop/ARY-for-ARY/src/app/api/runner/tasks/result/route.ts)
- [src/app/actions.ts](D:/Desktop/ARY-for-ARY/src/app/actions.ts)
- [src/app/page.tsx](D:/Desktop/ARY-for-ARY/src/app/page.tsx)
- [src/app/_components/ary-shared.tsx](D:/Desktop/ARY-for-ARY/src/app/_components/ary-shared.tsx)

## 12. 当前结论

当前 runner 第一期已经完成到这样一个状态：

- 代码结构上已经从“Submission 直接评分”切到“任务驱动 runner”
- 分数边界已经切成“Runner 回传分项，ARY 依据比赛权重算总分”
- 页面、接口、schema、seed、基础测试已经同步到新模型
- 编译和测试通过
- 还差实机流程回归和控制面第二阶段实现
