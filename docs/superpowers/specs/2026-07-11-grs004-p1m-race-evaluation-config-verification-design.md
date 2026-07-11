# GRS004 / P1-M Race 评测配置 version/hash 读取校验 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`
    - `评测配置版本号与 hash`
- `docs/grs004/ary.plan.md`
  - `DEV-5 CA 接入 / Projection / Live Hall`
- `docs/superpowers/specs/2026-07-11-grs004-p1j-race-challenge-read-verification-design.md`

当前代码里，runner 会真实消费一组 Race 配置：

- `pullRunnerTask()`
  - `taskPackageLabel`
  - `taskDescription`
  - `keywordsJson`
- `completeRunnerTask() / scoring`
  - `tokenLimit`
  - `weightTaskPassRate`
  - `weightCodeReview`
  - `weightReasoning`
  - `weightKeywords`
  - `weightTotalTask`
  - `weightTotalToken`
  - `weightTotalDialogue`
  - `harnessWeightReasoning`
  - `harnessWeightKeyword`

但当前 `Race` 上还没有：

- `evaluationConfigVersion`
- `evaluationConfigHash`

本轮目标是：**为 runner 实际消费的评测配置补上 `version/hash` 元数据，并在 `pullRunnerTask()` 读取前校验这份配置是否仍与记录一致。**

## 范围

### 本轮纳入

- 只覆盖 runner 实际消费的 Race 评测配置
- 新增最小字段：
  - `evaluationConfigVersion`
  - `evaluationConfigHash`
- 校验入口：
  - `pullRunnerTask()`
- sanctioned 写路径：
  - `createRace()`
  - `approveCooperationRequest()`
  - `updateRaceContent()`

### 本轮不纳入

- 不扩展到 public race page / organizer page 的统一读取校验
- 不扩展到所有 Race 字段
- 不冻结“任务拉取时看到的旧配置版本”到 RunnerTask
- 不修改 result API 协议

## 约束

### 当前代码现实

- `pullRunnerTask()` 已经有：
  - challenge material 校验
  - submission artifact 校验
- 当前没有独立 `EvaluationConfig` 模型

因此本轮应遵循：

1. **不新建独立表**
2. **直接在 `Race` 上补最小 `version/hash`**
3. **只围绕 runner 真实消费字段计算 digest**

## 方案选择

### 方案 A：在 `Race` 上补 `evaluationConfigVersion/hash`，runner pull 前校验

做法：

- 在 `Race` 上增加：
  - `evaluationConfigVersion Int`
  - `evaluationConfigHash String`
- 增加 helper：
  - `buildRaceEvaluationConfigDigest()`
  - `verifyRaceEvaluationConfigIntegrity()`
- `pullRunnerTask()` 在返回 payload 前校验

优点：

- 直接命中文档里的 `评测配置版本号与 hash`
- 改动最小
- 与 `P1-J` 的 runner 读取校验模式一致

缺点：

- 还没有冻结“任务拉取时看到的是哪一版配置”

### 方案 B：把 config snapshot 冻结进 RunnerTask

优点：

- 可避免 pull 与 complete 间的配置漂移

缺点：

- 扩 scope
- 需要额外 schema 和协议设计

### 推荐方案

采用 **方案 A：在 `Race` 上补 `evaluationConfigVersion/hash`，runner pull 前校验**。

## 评测配置边界

本轮 digest 只覆盖 runner 真实消费字段：

- `taskPackageLabel`
- `taskDescription`
- `keywordsJson`
- `tokenLimit`
- `weightTaskPassRate`
- `weightCodeReview`
- `weightReasoning`
- `weightKeywords`
- `weightTotalTask`
- `weightTotalToken`
- `weightTotalDialogue`
- `harnessWeightReasoning`
- `harnessWeightKeyword`

本轮明确不纳入：

- `trainingDataSummary`
- `cloudStudioUrl`
- `trackConfigJson`
- 展示类开关

## 运行时规则

### 1. sanctioned 写路径

- `createRace()`
  - 写入 `evaluationConfigVersion = 1`
  - 写入当前 digest
- `approveCooperationRequest()`
  - 创建 Race 时同上
- `updateRaceContent()`
  - 重新计算 digest
  - `evaluationConfigVersion + 1`

### 2. 读取校验

`pullRunnerTask()` 在返回 payload 前：

1. 重算当前 Race 评测配置 digest
2. 必须等于 `evaluationConfigHash`

失败时：

- 当前 `RunnerTask` 标记为 `FAILED`
- 写入 `SecurityAudit(action=race.evaluation_config_verify)`
- 不自动把 `Submission` 判为失败

### 3. 兼容旧数据

- 若 `evaluationConfigHash` 为空：
  - 视为 legacy 兼容
  - 当前不拦任务

## 测试对齐

需要扩展：

- `src/lib/material-integrity-helpers.test.ts`
- `src/lib/services/material-integrity-submissions.test.ts`
- `src/lib/services/material-integrity-cooperation.test.ts`

覆盖：

1. digest helper 对 runner config 的稳定计算
2. `approveCooperationRequest()` 创建的 Race 带 `evaluationConfigVersion/hash`
3. tampered Race config 会让 `pullRunnerTask()` 拒绝继续派发
4. `race.evaluation_config_verify` 审计写入
5. 配置异常不会自动把 submission 判失败

## 验收对齐

本轮完成后，需要能证明：

1. `Race` 已保存评测配置 `version/hash`
2. sanctioned 写路径会维护这组元数据
3. `pullRunnerTask()` 会在读取前校验
4. 配置篡改会阻断 runner task，但不自动把 submission 判失败
5. 旧数据保持兼容

## 一句话结论

`P1-M` 的目标是：*为 runner 实际消费的 Race 评测配置补上 `version/hash`，并在任务派发前真正校验它。*

## 已落地实现补记（2026-07-11）

- `prisma/schema.prisma`
  - `Race` 已新增：
    - `evaluationConfigVersion`
    - `evaluationConfigHash`
- `prisma/migrations/20260711173000_grs004_p1m_evaluation_config_verification/migration.sql`
  - 已补最小 schema migration
- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `buildRaceEvaluationConfigDigest()`
    - `verifyRaceEvaluationConfigIntegrity()`
- `src/lib/services/races.ts`
  - `createRace()` 现在会写入：
    - `evaluationConfigVersion = 1`
    - `evaluationConfigHash`
  - `updateRaceContent()` 现在会：
    - 重算 `evaluationConfigHash`
    - `evaluationConfigVersion + 1`
- `src/lib/services/cooperation.ts`
  - `approveCooperationRequest()` 创建 Race 时现在也会写入：
    - `evaluationConfigVersion = 1`
    - `evaluationConfigHash`
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 现在会在 `race.challenge_verify` 后、`submission_artifact.verify` 前新增：
    - `race.evaluation_config_verify`
  - 校验失败时：
    - 当前 `RunnerTask` 标记为 `FAILED`
    - 写入 `SecurityAudit(action=race.evaluation_config_verify)`
    - 不自动把 `Submission` 判为失败
  - 返回给 runner 的 payload 现在会带：
    - `evaluationConfigVersion`
    - `evaluationConfigHash`
- `src/lib/material-integrity-helpers.test.ts`
  - 已补 digest helper 与 mismatch 覆盖
- `src/lib/services/material-integrity-cooperation.test.ts`
  - 已补 `approveCooperationRequest()` 创建 Race 时写入 version/hash 覆盖
- `src/lib/services/material-integrity-submissions.test.ts`
  - 已补：
    - tampered evaluation config 会让 `pullRunnerTask()` 拒绝继续派发
    - `race.evaluation_config_verify` 审计写入
    - 配置异常不会自动把 submission 判失败

### 本轮明确没有做的事

- 没有把 config snapshot 冻结到 `RunnerTask`
- 没有修改 result API 协议
- 没有扩展到 public race page / organizer page 的统一读取校验

### 新鲜验证证据

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts`
- `npm run build`
