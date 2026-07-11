# GRS004 / P1-F 提交代码材料写入审计 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§11 选手代码防篡改`
    - 缺少代码修改的审计日志
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1e-submission-artifact-read-verification-design.md`

`P1-A` 已经在提交时补上 `codeContentHash / ridingRecordHash / submitterBindingJson`，`P1-E` 已经在 Runner 读取前做完整性校验。但第 11 节里“缺少代码修改的审计日志”仍然存在：当前 sanctioned 写路径 `createSubmission()` / `createFinalSubmission()` 还没有把代码材料写入事实接进统一审计。

本轮目标是：**为提交代码材料的 sanctioned 写路径补上最小 `SecurityAudit` 记录。**

## 范围

### 本轮纳入

- 只收口两条真实写路径：
  - `createSubmission()`
  - `createFinalSubmission()`
- 只为 `SubmissionArtifact` 写入记录审计
- 审计中记录：
  - `raceId`
  - `registrationId`
  - `userId`
  - `submissionId`
  - `artifactId`
  - `codeContentHash`
  - `ridingRecordHash`
  - `submitterBindingJson`
  - 是否为 final submission

### 本轮不纳入

- 不补历史回填
- 不审计 Runner 清空 `Submission.codeContent / ridingRecord` 的内部投影行为
- 不新增提交编辑页面
- 不扩 judge/public 页面
- 不新增 schema

## 约束

### 当前代码现实

- `src/lib/services/submissions.ts`
  - 两条写路径都会同时写：
    - `Submission`
    - `SubmissionArtifact`
- `SubmissionArtifact` 是 Runner 与后续流程的真实代码材料容器
- `SecurityAudit` 已可承载：
  - `raceId / registrationId / userId`
  - `action / targetType / targetId / result / detailsJson`

因此本轮应遵循：**只给 sanctioned 写路径加统一审计，不额外发明新的代码历史模型。**

## 方案选择

### 方案 A：只审计 `SubmissionArtifact` 写入

做法：

- 在 artifact create 成功后写：
  - `action = submission_artifact.create`
- `detailsJson` 带上 hash / binding / submissionPhase

优点：

- 贴合后续真实消费对象
- 改动小
- 不会重复审计 `Submission` 和 `SubmissionArtifact`

### 方案 B：同时审计 `Submission` 和 `SubmissionArtifact`

优点：

- 更完整

缺点：

- 信号重复
- 超出当前最小切片

### 推荐方案

采用 **方案 A：只审计 `SubmissionArtifact` 写入**。

原因：

- 这是当前最真实的代码材料容器
- Runner、评测和归档链路都围绕 artifact
- 用户要求尽量减少额外想法，不应先做双重审计

## 审计策略

使用现有 `SecurityAudit`：

- `action = submission_artifact.create`
- `targetType = SubmissionArtifact`
- `targetId = artifact.id`
- `actorKind = USER`
- `result = accepted`

`detailsJson` 最少包含：

- `submissionId`
- `submissionPhase`
  - `active`
  - `final`
- `codeContentHash`
- `ridingRecordHash`
- `submitterBindingJson`

## 测试对齐

需要新增或扩展：

- `src/lib/services/material-integrity-submissions.test.ts`

覆盖：

- `createSubmission()` 会写 `submission_artifact.create` 审计
- `createFinalSubmission()` 会写 `submission_artifact.create` 审计
- details 中带上 hash / binding / submissionPhase

## 验收对齐

本轮完成后，需要能证明：

1. sanctioned 代码写入路径会写统一审计
2. 审计和 `SubmissionArtifact` 一一对应
3. details 中能带出当前 hash 与 binding 事实
4. 本轮没有新增 schema 或编辑历史页面

## 一句话结论

`P1-F` 的目标是：*把 `createSubmission()` / `createFinalSubmission()` 这两条 sanctioned 代码材料写路径接入统一 `SecurityAudit`，为第 11 节的“代码修改审计日志”补上最小真实入口。*

## 已落地实现补记（2026-07-10）

- `src/lib/services/submissions.ts`
  - `createSubmission()` 现在会在 `SubmissionArtifact` create 成功后写入：
    - `action = submission_artifact.create`
    - `submissionPhase = active`
  - `createFinalSubmission()` 现在会在 `SubmissionArtifact` create 成功后写入：
    - `action = submission_artifact.create`
    - `submissionPhase = final`
  - `detailsJson` 当前已包含：
    - `submissionId`
    - `submissionPhase`
    - `codeContentHash`
    - `ridingRecordHash`
    - `submitterBindingJson`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 已覆盖 active / final submission 的 sanctioned 写路径审计
  - 同时保留上一轮 `Runner` 读校验覆盖

### 本轮明确没有做的事

- 没有新增双重审计到 `Submission`
- 没有新增编辑历史页面
- 没有扩到 judge/public 页面
- 没有新增 schema

### 新鲜验证证据

- `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
- `npm run build`
