# GRS004 / P1-J Race 题目材料读取校验 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`
  - `§8 验收标准`
    - `Work / 题目材料 hash 能记录并在读取时校验（待实现）`
  - `§10 企业题目防篡改`
    - `文件读取时未校验完整性`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1d-cooperation-material-read-verification-design.md`

当前仓库已经具备两段基础能力：

- `P1-A`
  - `Race` 已保存：
    - `challengeSourceRefJson`
    - `challengeContentHash`
- `P1-D`
  - `approveCooperationRequest()` 在创建 `Race` 前会重读并校验题目包 / 方案文件

但当前真正消费赛事题目材料的运行时链路仍然没有把这些字段用起来：

- `pullRunnerTask()` 会直接把
  - `taskPackageLabel`
  - `taskDescription`
  返回给 runner
- 在这个读取点上，没有再次校验：
  - `challengeSourceRefJson`
  - `challengeContentHash`

本轮目标是：**把 `Race.challengeSourceRefJson / challengeContentHash` 真正用于 runner 读取前校验，阻断题目材料在建赛后被篡改后继续进入评测链路。**

## 范围

### 本轮纳入

- 只收口 `Race` 题目材料的读取校验
- 只覆盖当前真实消费点：
  - `pullRunnerTask()`
- 校验对象：
  - `Race.challengeSourceRefJson`
  - `Race.challengeContentHash`
  - `taskPackage.filePath + fileHash`
  - `proposal.filePath + fileHash`
- 失败路径写入统一 `SecurityAudit`

### 本轮不纳入

- 不新增 schema
- 不新增下载路由或预览页
- 不扩展到 public race page / organizer page 的统一读取校验
- 不扩展到远端 GitHub repo / demo / video 抓取校验
- 不把 challenge 材料异常自动等同于 submission 失败或 DQ

## 约束

### 当前代码现实

- `src/lib/services/cooperation.ts`
  - `approveCooperationRequest()` 已把题目材料引用写进：
    - `challengeSourceRefJson`
    - `challengeContentHash`
- `src/lib/material-integrity-helpers.ts`
  - 已有：
    - `buildChallengeMaterialSourceRef()`
    - `verifyStoredUploadHash()`
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 当前只校验 `SubmissionArtifact`
  - 没有校验 `Race` challenge material

因此本轮应遵循：**不重新设计题目材料模型，只在 runner 真实读取前把现有字段用起来。**

## 方案选择

### 方案 A：在 `pullRunnerTask()` 前校验 challenge material，失败时拦任务并审计

做法：

- 新增 `verifyRaceChallengeIntegrity()`
- `pullRunnerTask()` 在返回 runner payload 前先校验当前 `Race`
- 若失败：
  - 当前 runner task 记为 `FAILED`
  - 写入 `SecurityAudit(action=race.challenge_verify)`
  - 继续尝试下一个可拉取任务
- 不自动把 submission 标成失败

优点：

- 直接命中“读取时校验”
- 命中当前真实消费点
- 不会把题目材料问题错误归责给选手 submission

缺点：

- public/console 读取层暂时还不会直接暴露 challenge integrity 状态

### 方案 B：只在 `approveCooperationRequest()` 时校验

优点：

- 代码更少

缺点：

- 建赛后文件仍可能被篡改
- 无法满足“读取时校验”

### 推荐方案

采用 **方案 A：在 `pullRunnerTask()` 前校验 challenge material，失败时拦任务并审计**。

## 运行时规则

### 1. sourceRef JSON 校验

- `challengeSourceRefJson` 必须能解析
- 解析后重算 digest，必须等于 `challengeContentHash`

### 2. 文件 hash 校验

对 `challengeSourceRefJson` 中记录的：

- `taskPackage`
- `proposal`

分别执行：

- 路径合法性校验
- 文件存在性校验
- 文件字节 hash 校验

### 3. 失败时行为

- 当前 runner task：
  - `status = FAILED`
- 写入：
  - `SecurityAudit(action=race.challenge_verify, result=rejected)`
- 对 `SUBMISSION_TEST`：
  - 不自动把 submission 改成 `FAILED`
- `pullRunnerTask()`：
  - 继续尝试拉取下一条任务

### 4. 成功时行为

- 写入：
  - `SecurityAudit(action=race.challenge_verify, result=accepted)`
- 正常返回 runner task payload

## 测试对齐

需要扩展：

- `src/lib/material-integrity-helpers.test.ts`
- `src/lib/services/material-integrity-submissions.test.ts`

覆盖：

1. `verifyRaceChallengeIntegrity()` 对正常 / 篡改 challenge material 的判断
2. `pullRunnerTask()` 在题目包被篡改后拒绝继续派发任务
3. `race.challenge_verify` 审计写入
4. challenge material 异常不会把选手 submission 直接标成失败

## 验收对齐

本轮完成后，需要能证明：

1. `Race.challengeSourceRefJson / challengeContentHash` 已用于读取前校验
2. 题目材料在建赛后被篡改时，runner 任务不会继续消费
3. 失败路径会写统一审计
4. 不新增 schema
5. 不把题目材料异常自动等同于 submission 失败或 DQ

## 一句话结论

`P1-J` 的目标是：*把已写入 `Race` 的题目材料 sourceRef/hash 真正用于 runner 读取前校验，阻断被篡改题目材料继续进入评测链路。*

## 已落地实现补记（2026-07-11）

- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `verifyRaceChallengeIntegrity()`
  - 当前会校验：
    - `challengeSourceRefJson`
    - `challengeContentHash`
    - `taskPackage/proposal` 的上传路径与文件 hash
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 现在会在返回 runner payload 前先校验当前 `Race` challenge material
  - 校验失败时：
    - 当前 `RunnerTask` 标记为 `FAILED`
    - 写入 `SecurityAudit(action=race.challenge_verify)`
    - 不自动把 `Submission` 标记为 `FAILED`
- `src/lib/material-integrity-helpers.test.ts`
  - 已补：
    - 未配置 challenge material 的兼容通过
    - challenge sourceRef/contentHash 正常覆盖
    - 非法 JSON / content hash mismatch / 文件篡改覆盖
- `src/lib/services/material-integrity-submissions.test.ts`
  - 已补：
    - `pullRunnerTask()` 在题目包被篡改后拒绝继续派发任务
    - challenge material rejection 不自动把 submission 判失败
    - `race.challenge_verify` 审计写入

### 本轮明确没有做的事

- 没有扩展到 public race page / organizer page 的统一读取校验
- 没有新增 challenge material 下载页或预览页
- 没有新增远端 GitHub repo / demo / video 抓取校验
- 没有把 challenge material 异常自动等同于 DQ 或 submission 失败

### 新鲜验证证据

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-submissions.test.ts`
- `npm run build`
