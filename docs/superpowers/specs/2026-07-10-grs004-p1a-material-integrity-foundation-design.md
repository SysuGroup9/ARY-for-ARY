# GRS004 / P1-A 材料引用与 Hash 基础层 Design

## 目的

本设计对应 `docs/grs004/防伪与防篡改计划.md` 中：

- `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`
- `§6 P1：补材料完整性`
- `§10 企业题目防篡改`
- `§11 选手代码防篡改`

目标不是一次性完成 `P1` 的全部内容，而是先把“材料本身的引用与 hash 元数据”补齐，为后续：

- `Report` 输入版本固定
- `Award / JudgingRecord` 引用快照
- 统一 `SecurityAudit / IntegrityEvent`

提供可落地的底座。

本 slice 收敛为 `P1-A 材料引用与 hash 基础层`，只覆盖：

- 企业题目材料
- Work 公开资产引用
- 选手代码与 Riding Record 材料

不把 `Award / Report / JudgingRecord` 的版本冻结一起混进来。

## 范围

### 本轮纳入

- 为企业办赛材料补最小完整性字段：
  - `taskPackage` 文件 hash
  - `proposal` 文件 hash
  - 批准后带入 Race 的 challenge material 引用与 digest
- 为 `Work` 补最小完整性字段：
  - `sourceRefJson`
  - `contentHash`
- 为选手代码材料补最小完整性字段：
  - `codeContentHash`
  - `ridingRecordHash`
  - 与提交者身份绑定的最小 `submitterBindingJson`
- 保持现有公开读取与评审读取链路不变，但让材料从“只有内容”变成“内容 + 来源引用 + hash”

### 本轮不纳入

- GitHub commit SHA / tag / release digest 的外部拉取
- Demo / 视频远程资源的主动抓取校验
- `Award / JudgingRecord / Report` 的输入版本冻结
- 独立 `MaterialIntegrityRecord` 表
- 统一 `SecurityAudit / IntegrityEvent`
- 数字签名、公钥注册、不可抵赖身份签名

## 来源约束

设计必须同时满足以下源文档与当前代码事实：

- `docs/grs004/防伪与防篡改计划.md`
- `docs/grs004/ary-domain-analysis.v0.3.md`
- `docs/grs004/ary-mvp.ia.md`
- `prisma/schema.prisma`
- `src/lib/services/cooperation.ts`
- `src/lib/services/submissions.ts`
- `src/lib/services/works.ts`
- `src/lib/services/judging.ts`
- `src/lib/services/reports.ts`
- `src/lib/services/awards.ts`

最高优先级约束：

1. `P1` 当前要补的是材料完整性，不是把评审结果冻结一次做完。
2. `Evidence` 已经在 `P0` 中具备 `sourceRef / digest / confidence` 语义；`P1-A` 需要让 `Work` 和材料源也具备相同基础能力。
3. 当前仓库普遍采用“直接在现有模型上加字段 + JSON 字符串”模式；在没有强证据前，不额外拆独立 integrity 子表。
4. 公开页面与工作台读取结构应尽量保持稳定，不在本轮引入新的复杂查询层。

## 当前实现基线

### 已经具备

- `CooperationRequest` 已保存：
  - `taskPackageFileName / taskPackageFilePath`
  - `proposalFileName / proposalFilePath`
- `Work` 已保存：
  - `demoUrl`
  - `repoUrl`
  - `videoUrl`
  - `techNotes`
- `Submission / SubmissionArtifact / TeamArchive` 已保存：
  - `codeContent`
  - `ridingRecord`
- `Evidence` 已在 `P0` 中具备：
  - `sourceRefJson`
  - `sourceDigest`
  - `integrityStatus`
  - `confidenceLevel`

### 当前缺口

- 企业题目材料上传后未计算 hash
- Race 批准后没有保留 challenge material 的来源引用与 digest
- `Work` 没有 `sourceRefJson / contentHash`
- 选手代码提交没有 `codeContentHash / ridingRecordHash`
- “代码 hash 与用户 ID 绑定”的事实没有被显式记录
- `Award / JudgingRecord / Report` 目前也没有固定引用当时使用的材料版本，但这属于 `P1-B`，不是本轮

## 方案比较

### 方案 A：在现有模型上补 `sourceRef + hash` 字段

做法：

- 直接扩展 `CooperationRequest / Race / Work / Submission / SubmissionArtifact / TeamArchive`
- 继续使用 JSON 字符串保存结构化来源引用

优点：

- 与当前 schema 风格一致
- 不需要额外 join 新表
- 迁移成本低，能直接覆盖现有上传、提交、归档路径

缺点：

- 完整性元数据分散在多个模型上
- 后续如果要做统一审计，还需要再抽象

### 方案 B：新增统一 `MaterialIntegrityRecord`

做法：

- 所有题目、作品、代码、外部引用都单独落一张 integrity 表

优点：

- 结构更统一
- 有利于后续审计扩展

缺点：

- 当前仓库没有类似统一 integrity 子表模式
- 会显著放大 `P1-A` 范围
- 当前 public / console 读取链路都要额外改 join

### 方案 C：只覆盖代码材料，不覆盖企业题目与 Work

做法：

- 只补 `Submission / SubmissionArtifact / TeamArchive`

优点：

- 范围最小

缺点：

- 不能对应 `§10 企业题目防篡改`
- 不能对应 `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`

### 推荐方案

采用 **方案 A：在现有模型上补 `sourceRef + hash` 字段**。

原因：

- 这是 `grs004` 文档明确允许的方向：`新增 MaterialIntegrityRecord 或在相关模型增加 sourceRefJson / contentHash`
- 也是和当前仓库落地成本最低、偏差最小的方案

## 设计

### 1. 企业题目材料

#### 1.1 CooperationRequest

当前 `submitCooperationRequest()` 会把文件落到：

- `public/uploads/cooperation/taskpackages`
- `public/uploads/cooperation/proposals`

本轮在 `CooperationRequest` 上补：

- `taskPackageFileHash`
- `proposalFileHash`

两者都在写文件时同步计算。

#### 1.2 Race

当前 `approveCooperationRequest()` 在创建 `Race` 时，只把：

- `raceTitle`
- `taskDescription`
- `trainingDataSummary`
- `taskPackageLabel`

等信息带入新赛事，但没有带入文件来源与 digest。

本轮在 `Race` 上补：

- `challengeSourceRefJson`
- `challengeContentHash`

其中：

- `challengeSourceRefJson` 保存批准时生效的 challenge material 引用
- `challengeContentHash` 保存该组引用的聚合 digest

最小 `challengeSourceRefJson` 结构：

```json
{
  "taskPackage": {
    "fileName": "...",
    "filePath": "...",
    "fileHash": "..."
  },
  "proposal": {
    "fileName": "...",
    "filePath": "...",
    "fileHash": "..."
  }
}
```

说明：

- 本轮不主动去 hash `trainingDataSummary` 文本说明本身
- 本轮不主动抓取外部训练数据文件
- 目标是先固定“当前真实上传到系统中的题目材料”

### 2. Work 公开资产

`Work` 当前只有：

- `title`
- `summary`
- `demoUrl`
- `repoUrl`
- `videoUrl`
- `techNotes`

本轮在 `Work` 上补：

- `sourceRefJson`
- `contentHash`

最小 `sourceRefJson` 结构：

```json
{
  "repoUrl": "...",
  "demoUrl": "...",
  "videoUrl": "...",
  "techNotesIncluded": true
}
```

`contentHash` 的输入不从远端抓取，而是对 Work 当前内部可控字段做稳定序列化：

- `title`
- `summary`
- `demoUrl`
- `repoUrl`
- `videoUrl`
- `techNotes`

原因：

- 文档要求的是“先有 hash 元数据”
- 当前系统并没有 GitHub API 或对象存储校验链路
- 如果强行在 `P1-A` 做远端抓取，会超出当前子项目范围

### 3. 选手代码材料

当前选手代码同时写入：

- `Submission`
- `SubmissionArtifact`
- 赛后归档到 `TeamArchive`

本轮把完整性字段同步补到这三类对象上，避免现有链路中任一读取点落空。

新增字段：

- `codeContentHash`
- `ridingRecordHash`
- `submitterBindingJson`

最小 `submitterBindingJson` 结构：

```json
{
  "registrationId": "...",
  "userId": "...",
  "raceId": "...",
  "submittedAt": "..."
}
```

说明：

- `codeContentHash` 对 `codeContent` 做稳定 hash
- `ridingRecordHash` 对 `ridingRecord` 做稳定 hash；为空则允许空字符串 hash 或空值，具体以实现期统一规则为准
- `submitterBindingJson` 用来满足 `§11` 中“代码 hash 与用户 ID 绑定”的最低要求

本轮不做：

- 用户签名
- 私钥证明
- 不可抵赖签名

### 4. Hash 生成规则

本轮统一复用 `P0` 里已经落地的稳定 digest helper。

原则：

- 所有 hash 都通过同一稳定序列化策略生成
- 本轮统一使用 `sha256`
- 对文件材料：
  - 直接对文件字节生成 hash
- 对文本/结构化材料：
  - 对稳定序列化后的 payload 生成 hash

### 5. 写入时机

#### 企业题目材料

- `submitCooperationRequest()`
  - 文件落盘时立刻计算并保存 file hash
- `approveCooperationRequest()`
  - 创建 `Race` 时把 challenge sourceRef 和聚合 digest 一并写入

#### Work

当前仓库还没有一个独立的 `createWork()` service；Work 主要出现在 seed 和结果链帮助函数里。

因此本轮对 `Work` 的写入收口为两步：

1. 先扩 schema
2. 先在 seed / helper / 现有创建点补齐 `sourceRefJson / contentHash`

如果后续新增显式 Work 创建/编辑服务，再复用同一 helper。

#### 选手代码材料

- `createSubmission()`
  - 在写 `Submission` 和 `SubmissionArtifact` 时同步写 hash 与 binding
- `createFinalSubmission()`
  - 同上，赛后版本也同步写入
- 归档到 `TeamArchive` 时
  - 同步带入 hash 与 binding

### 6. 与 P1-B 的边界

本轮完成后，系统具备：

- 材料引用可追溯
- 材料 hash 可比较
- 提交人与代码材料有最小绑定事实

但仍然 **不具备**：

- `Award / JudgingRecord / Report` 对“当时使用的 Work/Evidence/Projection 版本”的固定引用

这部分明确留给后续 `P1-B 结果引用冻结层`。

## 数据流

### 企业题目材料

上传 `taskPackage / proposal`
-> 落盘
-> 计算文件 hash
-> 写入 `CooperationRequest`
-> 审批创建 `Race`
-> 带入 `challengeSourceRefJson / challengeContentHash`

### Work 资产

Work 写入/seed
-> 归一化 `repoUrl / demoUrl / videoUrl / techNotes`
-> 生成 `sourceRefJson`
-> 计算 `contentHash`
-> 公开页面与评审页面继续从 Work 读取，不改变路由结构

### 选手代码材料

提交代码 / Riding Record
-> 计算 `codeContentHash / ridingRecordHash`
-> 写入 `Submission / SubmissionArtifact`
-> 归档时复制到 `TeamArchive`
-> 后续评审或公开读取时有材料 hash 可用

## 验收对齐

本 slice 的完成口径与 `防伪与防篡改计划.md` 对齐为：

1. 企业题目材料上传时生成并保存 hash
2. Race 中能追溯当前 challenge material 的来源引用与 digest
3. `Work` 有 `sourceRefJson / contentHash`
4. 选手代码材料写入时生成 `codeContentHash / ridingRecordHash`
5. 选手代码材料至少记录与 `userId / registrationId / raceId` 的绑定事实
6. 本轮不声称已经完成 `Award / Report / JudgingRecord` 的版本冻结

## Implementation Notes

- `Work` 当前主要通过 `src/lib/result-chain-helpers.ts` 中的 `buildWorkSeedRecord()` 进入数据库；本轮先在该创建点补齐 `sourceRefJson / contentHash`，未额外引入新的 Work 创建服务。
- `runner` 的 `projectProgressEvalSuccess()` 已把 `SubmissionArtifact` 上的 `codeContentHash / ridingRecordHash / submitterBindingJson` 同步到 `TeamArchive`。
- 为兼容历史 seed 与旧投影记录，`runner` 中的进度任务、榜单、归档容器匹配统一回落到 `teamId` 维度，避免“新记录有 registrationId、旧记录无 registrationId”时出现重复容器或错误归档。
- `prisma/seed.ts` 已同步对齐 `TeamArchive` 的三项完整性字段，并给 runner 相关投影补上 `registrationId`，确保本地验证数据与当前运行时语义一致。
- `Award / JudgingRecord / Report` 的结果引用冻结仍留在 `P1-B`，本轮没有提前混入。

## 不做的声明

为避免误述，本设计明确声明以下内容 **不是本轮交付目标**：

- 不宣称已经抓取 GitHub commit SHA / tag / release digest
- 不宣称已经校验远程 demo/video 内容
- 不宣称已经完成评审结果冻结
- 不宣称已经完成统一安全审计模型
- 不宣称已经完成数字签名或不可抵赖身份绑定

## 文档同步要求

本 slice 后续若获批落地，至少同步：

- `docs/superpowers/status.md`
  - 记录哪些材料对象已补 hash / sourceRef，哪些还没补
- `docs/superpowers/plans/...`
  - 把 schema、service、seed、验证命令拆成可执行计划

## 一句话结论

`P1-A` 的目标是：**先把企业题目材料、Work 资产、选手代码材料从“只有内容”推进到“内容 + 来源引用 + hash + 最小身份绑定”，为后续结果冻结和审计层提供基础。**
