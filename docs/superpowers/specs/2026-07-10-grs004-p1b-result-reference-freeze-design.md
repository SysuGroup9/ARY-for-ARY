# GRS004 / P1-B 结果引用冻结层 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§6 P1：补材料完整性`
    - `2. 为 Report 生成记录输入 Evidence / Projection / Work 的版本引用`
    - `3. 为 Award / JudgingRecord 保存参考 Evidence 的快照或引用，避免后续重建导致评审依据漂移`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`

`P1-A` 已经把企业题目、Work、选手代码材料推进到 `sourceRef + hash + submitter binding`。`P1-B` 的目标不是继续补材料本体，而是把**结果对象在写入当下依赖了哪些 Work / Evidence / Projection / Award 上下文**冻结下来，避免后续数据重建、作品更新或展示模型演进后，评审与发布结果失去可追溯依据。

## 范围

### 本轮纳入

- 为 `JudgingRecord` 增加结果引用冻结字段：
  - `sourceRefJson`
  - `sourceDigest`
- 为 `Award` 增加结果引用冻结字段：
  - `sourceRefJson`
  - `sourceDigest`
- 为 `Report` 增加结果引用冻结字段：
  - `sourceRefJson`
  - `sourceDigest`
- 在当前真实写入链路中落地冻结逻辑：
  - `upsertJudgingRecord()` 提交/保存评审时冻结当前 `Work + Registration Evidence` 引用
  - `prisma/seed.ts` / `result-chain-helpers.ts` 在创建 `Award / Report` 时写入冻结引用
- 为 `Report` 冻结当前 race 级输入引用：
  - `Work`
  - `PUBLIC Evidence`
  - `Projection`
  - 已发布 `Award`

### 本轮不纳入

- 新建运行时 `Report Generator` 或 `Award Publisher` 服务
- 新建统一 `SecurityAudit / IntegrityEvent`
- 为 `Projection` 模型本身新增常驻 digest 字段
- 远端 GitHub commit / tag / release 拉取
- Demo / 视频远端内容抓取校验
- 重新设计 Public Site / Console 对这些冻结引用的展示 UI

## 约束

### 必须服从的上游文档

- `docs/grs004/防伪与防篡改计划.md`
- `docs/grs004/ary.plan.md`
- `docs/superpowers/status.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`

### 现有代码现实

- `JudgingRecord` 的真实运行时写入点只有 `src/lib/services/judging.ts` 的 `upsertJudgingRecord()`
- `Award` 当前没有正式运行时发布服务；真实写入点在 `prisma/seed.ts` 与 `src/lib/result-chain-helpers.ts`
- `Report` 当前也没有正式运行时生成服务；真实写入点同样在 `prisma/seed.ts` 与 `src/lib/result-chain-helpers.ts`
- `Projection` 目前只有 `payloadJson + asOfAt`，没有独立 digest 字段
- `Evidence` 已具备 `sourceRefJson / sourceDigest / integrityStatus`
- `Work` 已具备 `sourceRefJson / contentHash`

因此 `P1-B` 应该优先在**现有真实写入链路**上补冻结引用，而不是发明新的发布流程。

## 方案选择

### 方案 A：在 `JudgingRecord / Award / Report` 直接增加 `sourceRefJson + sourceDigest`

做法：

- 与 `Evidence` 采用同一对字段模式
- 冻结对象自身只保存“引用事实”和“聚合 digest”
- 不复制大块正文或 projection payload 到独立表

优点：

- 与当前仓库中 `Evidence / Work` 的元数据风格一致
- 迁移成本最低
- 读路径保持稳定，后续如要展示冻结引用也不需要跨表设计

缺点：

- 不同结果对象里的 `sourceRefJson` 结构会有细微差异

### 方案 B：新增统一 `ResultFreezeRecord`

做法：

- `JudgingRecord / Award / Report` 只关联一个额外冻结记录表

优点：

- 结构统一

缺点：

- 明显超出当前 `P1-B` 最小范围
- 当前仓库没有类似抽象先例
- 会放大 migration、写入链路和测试改动

### 推荐方案

采用 **方案 A：直接为 `JudgingRecord / Award / Report` 增加 `sourceRefJson + sourceDigest`**。

原因：

- 最贴合 `grs004` 文档中“在相关模型增加引用/冻结信息”的表述
- 与 `P1-A` 的实现风格一致
- 不会人为扩展出新的抽象层

## 冻结引用结构

### 1. JudgingRecord

`JudgingRecord.sourceRefJson` 保存当前评审时可见的最小引用快照：

```json
{
  "registration": {
    "id": "...",
    "userId": "..."
  },
  "work": {
    "id": "...",
    "title": "...",
    "contentHash": "...",
    "sourceRefJson": "{...}"
  },
  "evidences": [
    {
      "id": "...",
      "type": "WORK",
      "title": "...",
      "sourceDigest": "...",
      "integrityStatus": "OK"
    }
  ]
}
```

说明：

- `JudgingRecord` 当前真实评审对象是 `JudgeAssignment -> Work -> Registration`
- Judge 视图当前能看到 `work.registration.evidences`
- 为减少主观选择，本轮冻结**该 Registration 下当前可见 Evidence 列表**
- `sourceDigest = sha256(sourceRefJson 对应结构化 payload)`

### 2. Award

`Award.sourceRefJson` 保存获奖决定当下依赖的最小结果依据：

```json
{
  "registration": {
    "id": "...",
    "userId": "..."
  },
  "work": {
    "id": "...",
    "title": "...",
    "contentHash": "..."
  },
  "evidences": [
    {
      "id": "...",
      "type": "WORK",
      "sourceDigest": "..."
    }
  ]
}
```

说明：

- 当前没有运行时 Award 发布器，因此本轮只在 seed / helper 链路中落地
- 不强行伪造“明确选中了哪条 judging comment”；只冻结当时获奖 registration 对应的 Work 与 Evidence 事实

### 3. Report

`Report.sourceRefJson` 保存当前报告版本依赖的 race 级输入快照：

```json
{
  "reportType": "REVIEW_SUMMARY",
  "raceId": "...",
  "subjectRegistrationId": "...",
  "works": [
    {
      "id": "...",
      "registrationId": "...",
      "contentHash": "..."
    }
  ],
  "evidences": [
    {
      "id": "...",
      "registrationId": "...",
      "type": "WORK",
      "sourceDigest": "..."
    }
  ],
  "awards": [
    {
      "id": "...",
      "awardName": "...",
      "rank": 1
    }
  ],
  "projections": [
    {
      "type": "CURRENT_LEADERBOARD",
      "asOfAt": "...",
      "payloadDigest": "..."
    }
  ]
}
```

说明：

- `Projection` 不新增常驻 digest 字段；在冻结时对 `payloadJson` 现值计算 `payloadDigest`
- `RIDER_REPORT` 只冻结与 `subjectRegistrationId` 对应的 Work / Evidence，再加 race 级 Projection / Award 上下文
- `RACE_REPORT` / `REVIEW_SUMMARY` 冻结当前 race 级公开 Work / Evidence / Projection / Award 集合

## 写入时机

### JudgingRecord

- `upsertJudgingRecord()` 每次写入时同步重算 `sourceRefJson / sourceDigest`
- 这样草稿和正式提交都能看到对应时刻的引用依据
- `submittedAt` 继续表示“这份记录是否已提交”，不新增独立冻结时间字段

### Award

- 当前仅在 `buildAwardSeedRecords()` 与 `prisma/seed.ts` 路径落地
- 后续若新增正式 Award 发布服务，继续复用同一 helper

### Report

- 当前仅在 `buildReviewSummaryReportSeed()`、`buildRiderReportSeed()` 与 `prisma/seed.ts` 路径落地
- 后续若新增正式报告生成服务，继续复用同一 helper

## Helper 设计

新增单独 helper 文件，负责生成结构化冻结引用与 digest：

- `buildJudgingRecordSourceRef(...)`
- `buildAwardSourceRef(...)`
- `buildReportSourceRef(...)`

原则：

- 纯函数
- 不直接访问 Prisma
- 输入使用最小必要字段
- `sourceDigest` 统一通过 `buildPayloadDigest()` 计算

## 验收对齐

本轮完成后，需要能用当前仓库状态证明：

1. `JudgingRecord` 写入后带有 `sourceRefJson / sourceDigest`
2. `JudgingRecord.sourceRefJson` 能追溯到 `Work` 与当前 `Evidence`
3. Seed 生成的 `Award` 带有 `sourceRefJson / sourceDigest`
4. Seed 生成的 `Report` 带有 `sourceRefJson / sourceDigest`
5. `Report.sourceRefJson` 至少包含 `Work / Evidence / Projection` 引用
6. 本轮不声称已经完成统一 `SecurityAudit / IntegrityEvent`

## Implementation Notes

- 当前没有正式 `Award` / `Report` 发布服务，本轮先把冻结语义落在真实存在的 seed / helper 写入路径，避免写一个只存在于理想状态中的服务。
- `Projection` 的 digest 只在冻结当下即时计算，不反推修改 `Projection` schema。
- `P1-B` 是 `P1-A` 的延伸层，不重复处理企业题目文件 hash、Work contentHash、Submission hash 等已完成内容。

### 已落地实现补记

- `JudgingRecord` 的真实运行时写入已落在 `src/lib/services/judging.ts` 的 `upsertJudgingRecord()`，会冻结当前 `Work + Registration Evidence` 的引用事实并写入 `sourceRefJson / sourceDigest`。
- `Award / Report` 当前没有正式发布器，因此冻结引用先落在 `src/lib/result-chain-helpers.ts` 与 `prisma/seed.ts` 的真实写入链路。
- `Report` 的 `Projection` 引用没有回推修改 `Projection` schema；当前只在冻结当下对 `payloadJson` 计算 `payloadDigest`。
- 本轮新鲜验证已通过：
  - `node --import tsx --test src/lib/result-reference-freeze-helpers.test.ts src/lib/services/result-reference-freeze-judging.test.ts src/lib/result-chain-helpers.test.ts src/lib/services/result-reference-freeze-seed.test.ts`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

## 一句话结论

`P1-B` 的目标是：**把 `JudgingRecord / Award / Report` 从“只有结果文本与分数”推进到“结果 + 当时依赖的 Work / Evidence / Projection 引用 + 聚合 digest”，确保后续重建不会让评审和发布依据漂移。**
