# GRS004 / P1-G 提交代码材料展示/投影读取校验 + 审计 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§11 选手代码防篡改`
    - 评审或展示时未校验代码完整性
    - 缺少代码修改的审计日志
- `docs/superpowers/specs/2026-07-10-grs004-p1e-submission-artifact-read-verification-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1f-submission-artifact-write-audit-design.md`

`P1-E` 已经在 `pullRunnerTask()` 前补上 Runner 读取前校验，`P1-F` 已经为 sanctioned 写路径补上审计。但当前仍有一条真实后续读链路没有收口：

- `completeRunnerTask()` 在成功回传后，会继续读取 `SubmissionArtifact`
- `PROGRESS_EVAL` 会把 artifact 内容写进 `TeamArchive`
- `HARNESS_EVAL` 会从 artifact 生成 `RidingHighlight.codeSnippet`

这意味着：**如果 artifact 在 Runner 拉取后、结果回传前被篡改，未校验内容仍可能继续流入归档与展示层。**

本轮目标是：**在 `completeRunnerTask()` 的成功投影前，补上第二道 artifact 完整性校验，并把校验结果写入统一 `SecurityAudit`。**

## 范围

### 本轮纳入

- 只收口 `SubmissionArtifact` 的后续展示/投影读链路
- 只在 `completeRunnerTask()` 成功路径前校验
- 覆盖以下真实消费分支：
  - `PROGRESS_EVAL`
  - `HARNESS_EVAL`
  - `SUBMISSION_TEST`
- 校验以下字段：
  - `codeContentHash`
  - `ridingRecordHash`
  - `submitterBindingJson`
- 使用现有 `SecurityAudit` 记录：
  - 校验通过
  - hash 不匹配
  - submitter binding 非法或不匹配

### 本轮不纳入

- 不新增 schema
- 不新增 judge/public 页面
- 不补完整代码修改历史 UI
- 不引入数字签名
- 不扩展到 Work / 企业题目文件的展示读取校验

## 约束

### 当前代码现实

- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 已做一次 artifact 校验
  - `completeRunnerTask()` 当前会重新读取数据库里的 `artifact`
  - `projectProgressEvalSuccess()` 会把 artifact 写入 `TeamArchive`
  - `projectHarnessEvalSuccess()` 会从 artifact 生成 `RidingHighlight`
- `src/lib/material-integrity-helpers.ts`
  - 已有 `verifySubmissionArtifactIntegrity()`
- `SecurityAudit`
  - 已能承载 `targetType / targetId / detailsJson`

因此本轮应遵循：**不重做新模型，只把现有 artifact integrity helper 延伸到 complete 阶段真实读链路。**

## 方案选择

### 方案 A：在 `completeRunnerTask()` 成功投影前校验

做法：

- `completeRunnerTask()` 取到 claimed 任务后
- 在成功投影前再次校验当前 artifact：
  - `codeContentHash`
  - `ridingRecordHash`
  - `submitterBindingJson`
- 若失败：
  - 不进入 `projectSubmissionTestSuccess()`
  - 不进入 `projectProgressEvalSuccess()`
  - 不进入 `projectHarnessEvalSuccess()`
  - 当前 `RunnerTask` 标记为 `FAILED`
  - 写统一审计

优点：

- 直接命中“展示/投影前读取校验”
- 可以阻断篡改内容继续流入 `TeamArchive / RidingHighlight`
- 复用当前 helper，改动小

缺点：

- 仍不是 judge/public 页面上的独立二次校验

### 方案 B：只依赖 `pullRunnerTask()` 的首次校验

优点：

- 不增加额外校验点

缺点：

- 无法覆盖“拉取后到回传前被改写”的窗口
- 不符合当前真实投影读链路

### 推荐方案

采用 **方案 A：在 `completeRunnerTask()` 成功投影前校验**。

原因：

- 这是当前代码里最贴近第 11 节“展示时未校验”的真实入口
- 不需要扩页面，也不需要发明新审计模型

## 审计策略

继续使用现有 `SecurityAudit`：

- `action = submission_artifact.verify`
- `targetType = SubmissionArtifact`
- `targetId = artifact.id`
- `actorKind = SYSTEM`

### 成功

- `result = accepted`
- `reason = ""`
- `detailsJson` 增加：
  - `taskId`
  - `taskType`
  - `verificationStage = runner_complete`

### 失败

失败原因沿用现有枚举：

- `code_content_hash_mismatch`
- `riding_record_hash_mismatch`
- `submitter_binding_invalid_json`
- `submitter_binding_mismatch`
- `registration_missing`

`detailsJson` 至少带：

- `taskId`
- `taskType`
- `submissionId`
- `registrationId`
- `teamId`
- `verificationStage = runner_complete`

## 运行时规则

### 1. 只在成功投影前追加校验

- 当 `completeRunnerTask()` 接收 `status = succeeded` 时
- 在任何 projection / archive / showcase 写入前执行校验

### 2. 校验失败时的处理

- 当前 `RunnerTask.status` 标记为 `FAILED`
- `runnerComment` 记录完整性失败原因
- 不继续进入：
  - `Submission` 成绩写入
  - `TeamArchive` 写入
  - `Leaderboard` 写入
  - `HarnessEntry` 写入
  - `RidingHighlight` 写入
- 写 `SecurityAudit`

### 3. 校验通过时的处理

- 继续按原有逻辑投影
- 额外写一条 `submission_artifact.verify` accepted 审计，标明 `runner_complete`

## 测试对齐

需要扩展：

- `src/lib/services/material-integrity-submissions.test.ts`

覆盖：

- `PROGRESS_EVAL` 路径下，artifact 在 pull 后被篡改时，`completeRunnerTask()` 不再写入 `TeamArchive`
- `HARNESS_EVAL` 路径下，artifact 在 pull 后被篡改时，`completeRunnerTask()` 不再生成新的 `RidingHighlight`
- 失败路径写入 `SecurityAudit(action=submission_artifact.verify, verificationStage=runner_complete)`

## 验收对齐

本轮完成后，需要能证明：

1. `completeRunnerTask()` 成功投影前会重新校验 `SubmissionArtifact`
2. 篡改后的 artifact 不会继续流入 `TeamArchive / RidingHighlight`
3. 校验结果进入统一 `SecurityAudit`
4. 本轮没有新增 schema、没有新增 judge/public 页面

## 一句话结论

`P1-G` 的目标是：*把 `SubmissionArtifact` 的完整性校验从 Runner 拉取前，再推进到 Runner 成功回传后的展示/投影写入前，阻断被篡改代码继续进入归档和展示层。*

## 已落地实现补记（2026-07-10）

- `src/lib/services/runner.ts`
  - 现已抽出共享的 artifact 完整性校验逻辑，同时供：
    - `pullRunnerTask()`
    - `completeRunnerTask()`
    使用
  - `completeRunnerTask()` 现在会在 `status = succeeded` 时、进入任何成功投影前先校验：
    - `codeContentHash`
    - `ridingRecordHash`
    - `submitterBindingJson`
  - 若 complete 阶段校验失败：
    - 当前 `RunnerTask` 标记为 `FAILED`
    - 若为 `SUBMISSION_TEST`，对应 `Submission` 也标记为 `FAILED`
    - 不再继续写入：
      - `Submission`
      - `TeamArchive`
      - `LeaderboardEntry`
      - `HarnessEntry`
      - `RidingHighlight`
  - 校验通过 / 拒绝当前都会写：
    - `SecurityAudit(action=submission_artifact.verify)`
    - `details.verificationStage = runner_pull | runner_complete`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 已补：
    - progress eval 场景下的 complete 前篡改拦截
    - harness eval 场景下的 complete 前篡改拦截

### 本轮明确没有做的事

- 没有新增 judge/public 页面
- 没有新增完整编辑历史 UI
- 没有新增数字签名
- 没有扩到企业题目文件的展示读取校验

### 新鲜验证证据

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
- `npm run build`
