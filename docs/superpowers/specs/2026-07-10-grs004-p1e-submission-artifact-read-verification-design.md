# GRS004 / P1-E 提交代码材料读取校验 + 审计 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§11 选手代码防篡改`
    - 评审或展示时未校验代码完整性
    - 缺少代码修改的审计日志
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`

`P1-A` 已经在提交时补上：

- `codeContentHash`
- `ridingRecordHash`
- `submitterBindingJson`

但当前真实读链路里，Runner 在 `pullRunnerTask()` 中直接把 `SubmissionArtifact` 交给评测链路消费，还没有在“评审前读取代码材料”的第一道入口上重新校验这些字段，也没有把读校验结果写进统一审计。

本轮目标是：**在 Runner 消费 `SubmissionArtifact` 前补上最小代码材料读校验，并把校验结果写入 `SecurityAudit`。**

## 范围

### 本轮纳入

- 只收口 `SubmissionArtifact` 读取链路
- 只收口 Runner 入口：
  - `pullRunnerTask()`
- 校验以下三类字段：
  - `codeContentHash`
  - `ridingRecordHash`
  - `submitterBindingJson`
- 使用现有 `SecurityAudit` 记录：
  - 校验通过
  - hash 不匹配
  - submitter binding 非法或不匹配

### 本轮不纳入

- 不新增 schema
- 不引入数字签名
- 不补公开页面或 judge 页面上的二次校验
- 不补代码编辑历史 UI
- 不扩展到 Work / GitHub repo 引用校验

## 约束

### 当前代码现实

- `src/lib/services/submissions.ts`
  - 提交时已写入 `codeContentHash / ridingRecordHash / submitterBindingJson`
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 当前直接把 artifact 交给 Runner
  - `projectProgressEvalSuccess()` 会继续把 artifact 内容传播进 `TeamArchive`
- `prisma/schema.prisma`
  - `RunnerTask` 已能关联：
    - `registration`
    - `submission`
    - `artifact`
- `SecurityAudit`
  - 已可承载非 CA 场景的 `targetType / targetId / detailsJson`

因此本轮应遵循：**不改提交流程，只在 Runner 读取入口补校验和审计。**

## 方案选择

### 方案 A：在 `pullRunnerTask()` 前校验 artifact

做法：

- Runner 从 queued 任务取出 artifact
- 在返回任务 payload 前校验：
  - 当前 `codeContent` 重算 hash 是否与 `codeContentHash` 一致
  - 当前 `ridingRecord` 重算 hash 是否与 `ridingRecordHash` 一致
  - `submitterBindingJson` 中的 `raceId / registrationId / userId` 是否与当前任务归属一致
- 若校验失败：
  - 不把任务交给 Runner
  - 将任务标记为失败
  - 写审计

优点：

- 直接命中“评审或展示时读取校验”
- 是最早消费代码材料的真实链路
- 不需要新增页面

缂虹偣：

- judge/public 展示层还没有独立二次校验

### 方案 B：在 `completeRunnerTask()` 或各投影写入点才校验

优点：

- 改动点更少

缺点：

- 已经让未经校验的内容进入 Runner 评测
- 不符合“读取入口即校验”的最小安全边界

### 推荐方案

采用 **方案 A：在 `pullRunnerTask()` 前校验 artifact**。

原因：

- 这是第 11 节当前最自然的读校验入口
- 能最小化未校验内容继续向后传播

## 审计策略

使用现有 `SecurityAudit`：

- `action = submission_artifact.verify`
- `targetType = SubmissionArtifact`
- `targetId = artifact.id`

### 成功

- `result = accepted`
- `reason = ""`

### 失败

可能原因：

- `code_content_hash_mismatch`
- `riding_record_hash_mismatch`
- `submitter_binding_invalid_json`
- `submitter_binding_mismatch`
- `registration_missing`

### actor

- `actorKind = SYSTEM`

因为触发点是真实 Runner 拉取前的系统读校验。

## 运行时规则

### 1. code hash 校验

- `buildPayloadDigest(artifact.codeContent)` 必须等于 `artifact.codeContentHash`

### 2. riding record hash 校验

- `buildPayloadDigest(artifact.ridingRecord ?? "")` 必须等于 `artifact.ridingRecordHash`

### 3. submitter binding 校验

`submitterBindingJson` 必须能解析，并且其中：

- `raceId` 等于当前任务 `raceId`
- `registrationId` 等于当前任务 `registrationId`
- `userId` 等于当前任务 `registration.userId`

### 4. 校验失败时的任务处理

- 不再把任务 payload 交给 Runner
- 将当前 `RunnerTask.status` 标记为 `FAILED`
- 若是 `SUBMISSION_TEST`，同步把 `Submission.status` 标记为 `FAILED`
- 写 `SecurityAudit`

## 测试对齐

需要新增或扩展：

- `src/lib/services/material-integrity-submissions.test.ts`

覆盖：

- 正常 artifact 仍可被 Runner 拉取并传播到 `TeamArchive`
- 篡改 `codeContent` 后，`pullRunnerTask()` 不再交付任务，且任务失败并写审计
- 篡改 `submitterBindingJson` 后，`pullRunnerTask()` 不再交付任务，且任务失败并写审计

## 验收对齐

本轮完成后，需要能证明：

1. Runner 在消费 `SubmissionArtifact` 前会重新校验代码材料完整性
2. hash 或 binding 被篡改时，任务不会继续交给 Runner
3. 校验结果进入 `SecurityAudit`
4. 本轮没有新增 schema 或前台页面

## 一句话结论

`P1-E` 的目标是：*把提交时已经写下来的 `codeContentHash / ridingRecordHash / submitterBindingJson` 真正用于 Runner 读取前校验，并把“校验通过 / hash 不匹配 / submitter binding 异常”落到统一 `SecurityAudit`。*

## 已落地实现补记（2026-07-10）

- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `parseSubmissionBindingJson()`
    - `verifySubmissionArtifactIntegrity()`
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 现在会在 Runner 真正拿到任务前校验：
    - `codeContentHash`
    - `ridingRecordHash`
    - `submitterBindingJson`
  - 校验失败时：
    - 不再把任务 payload 交给 Runner
    - 当前 `RunnerTask` 标记为 `FAILED`
    - 若为 `SUBMISSION_TEST`，对应 `Submission` 也标记为 `FAILED`
    - 写入 `SecurityAudit(action=submission_artifact.verify, result=rejected)`
  - 校验通过时：
    - 写入 `SecurityAudit(action=submission_artifact.verify, result=accepted)`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 已补：
    - tampered `codeContent` 被拦截
    - tampered `submitterBindingJson` 被拦截
    - 正常 artifact 仍能继续传播到 `TeamArchive`

### 本轮明确没有做的事

- 没有新增 judge/public 展示层二次校验
- 没有新增代码修改历史 UI
- 没有引入数字签名
- 没有扩展到 Work / GitHub repo 读取校验

### 新鲜验证证据

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
- `npm run build`
