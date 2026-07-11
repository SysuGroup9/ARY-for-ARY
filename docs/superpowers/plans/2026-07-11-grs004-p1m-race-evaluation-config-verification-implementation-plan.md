# GRS004 / P1-M Race 评测配置 version/hash 读取校验 Implementation Plan

## 目标

为 `Race` 增加 `evaluationConfigVersion / evaluationConfigHash`，让 `createRace()`、`approveCooperationRequest()`、`updateRaceContent()` 维护这组元数据，并在 `pullRunnerTask()` 读取前校验 runner 真实消费的评测配置是否仍一致。

## 任务拆分

### Task 1: 扩 schema 与 helper

- [ ] 在 `prisma/schema.prisma` 为 `Race` 增加：
  - `evaluationConfigVersion`
  - `evaluationConfigHash`
- [ ] 增加 migration 并更新 Prisma Client
- [ ] 在 `src/lib/material-integrity-helpers.ts` 增加：
  - `buildRaceEvaluationConfigDigest()`
  - `verifyRaceEvaluationConfigIntegrity()`
- [ ] 在 `src/lib/material-integrity-helpers.test.ts` 增加 helper 覆盖

### Task 2: 接入 sanctioned 写路径

- [ ] `src/lib/services/races.ts`
  - `createRace()` 写入 version/hash
  - `updateRaceContent()` 递增 version 并重算 hash
- [ ] `src/lib/services/cooperation.ts`
  - `approveCooperationRequest()` 创建 Race 时写入 version/hash

### Task 3: 接入 runner 读取校验

- [ ] `src/lib/services/runner.ts`
  - `pullRunnerTask()` 在 challenge 校验后、artifact 校验前增加：
    - `race.evaluation_config_verify`
- [ ] 失败时：
  - `RunnerTask.status = FAILED`
  - 写审计
  - 不自动把 `Submission` 判失败

### Task 4: 补测试

- [ ] `src/lib/services/material-integrity-cooperation.test.ts`
  - 断言 Race 写入 `evaluationConfigVersion/hash`
- [ ] `src/lib/services/material-integrity-submissions.test.ts`
  - 配置篡改后 `pullRunnerTask()` 返回 `null`
  - `race.evaluation_config_verify` 审计写入
  - `Submission` 没有被自动判失败

### Task 5: 文档同步

- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新设计文档里的“已落地实现补记”
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts
npm run build
```

## 完成标准

- `Race` 已保存评测配置 `version/hash`
- sanctioned 写路径会维护这组元数据
- `pullRunnerTask()` 会在读取前校验
- 配置篡改会阻断 runner task，但不自动把 submission 判失败
- 构建与聚焦测试通过
