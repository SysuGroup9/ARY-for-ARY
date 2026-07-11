# GRS004 / P1-J Race 题目材料读取校验 Implementation Plan

## 目标

在不新增 schema 的前提下，把 `Race.challengeSourceRefJson / challengeContentHash` 用到 `pullRunnerTask()` 的读取前校验里；题目材料异常时拦截任务并写统一审计，但不自动把选手 submission 判失败。

## 任务拆分

### Task 1: 补 challenge integrity helper 与失败用例

- [ ] 在 `src/lib/material-integrity-helpers.ts` 增加 `verifyRaceChallengeIntegrity()`
- [ ] 复用现有：
  - `buildChallengeMaterialSourceRef()`
  - `verifyStoredUploadHash()`
- [ ] 在 `src/lib/material-integrity-helpers.test.ts` 增加：
  - 正常 challenge sourceRef / hash
  - 篡改文件 hash 不匹配
  - 非法 JSON
  - challengeContentHash 不匹配

### Task 2: 把 challenge 校验接入 `pullRunnerTask()`

- [ ] 在 `src/lib/services/runner.ts` 增加 runner pull 前的 race challenge 校验
- [ ] 失败时：
  - 当前 `RunnerTask.status = FAILED`
  - 写 `SecurityAudit(action=race.challenge_verify)`
  - 不自动修改 `Submission.status = FAILED`
- [ ] 成功时：
  - 写 `SecurityAudit(action=race.challenge_verify, result=accepted)`

### Task 3: 增加 runner 集成测试

- [ ] 在 `src/lib/services/material-integrity-submissions.test.ts` 增加：
  - 构造带 challenge hash 的 race
  - 篡改 `taskPackage` 后 `pullRunnerTask()` 返回 `null`
  - `RunnerTask` 被标记为 `FAILED`
  - `Submission` 没有被直接标记为 `FAILED`
  - `SecurityAudit(action=race.challenge_verify)` 记录了 rejection

### Task 4: 文档同步

- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`
- [ ] 在设计文档中补上“已落地实现补记”

## 验证命令

```bash
node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-submissions.test.ts
npm run build
```

## 完成标准

- `verifyRaceChallengeIntegrity()` 已落地并有测试
- `pullRunnerTask()` 已在返回任务前校验 race challenge material
- challenge material 异常会阻断 runner 任务并写统一审计
- 不新增 schema
- 构建与聚焦测试通过
