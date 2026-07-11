# GRS004 / DEV-5 CA Signal Contract Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/PLAN.md`
  - `DEV-5 CA 接入 / Projection / Live Hall`
    - 继续收敛投影规则、字段必填性、push / fetch 边界和幂等规则
- `docs/grs004/ary-ca-integration-spec.md`
  - `§5 原始骑行状态消息草案`
  - `§5.2 基础字段`
  - `§5.3 signal.type 候选值`
  - `§6 Session 快照 fetch`

当前真实差距是：

- `ingestRidingSignalMessage()` 当前只接受 4 种 `signal.type`
- spec 已经列出更完整的 `signal.type` 候选集合
- spec 样例中的 `signal.noteReason`、`technicalActions` 目前不会被 schema 保留
- `race.taskId` 在 spec 里是 push 消息必填，但当前 schema 仍是可选

本轮目标是：**在不改变现有 Projection 语义的前提下，把 CA signal push 契约向 `ary-ca-integration-spec.md` 再收敛一层。**

## 范围

### 本轮纳入

- 只收口 CA push signal 契约
- 扩容 `signal.type` 到 spec 当前列出的候选集合
- 为 push schema 增加：
  - `signal.noteReason`
  - `technicalActions`
- 将 `race.taskId` 调整为必填
- 保持新字段进入：
  - `payloadJson`
  - `payloadDigest`
  - 签名 digest

### 本轮不纳入

- 不改变 Projection 粒度
- 不为 `technicalActions` 新增持久化表
- 不新增 taskId 到 Race 模型
- 不扩展 Report / Evidence 的消费语义
- 不扩大 snapshot fetch 的业务投影语义

## 约束

### 当前代码现实

- `src/lib/services/ca-ingestion.ts`
  - push schema 目前只接受：
    - `risk_detected`
    - `session_completed`
    - `session_started`
    - `task_progress`
  - `race.taskId` 当前仍是 optional
- `src/lib/ca-runtime-helpers.ts`
  - `RidingSignalInput.type` 仍是 4 项 union
  - `getNextConnectionStatusFromSignal()` 只把 3 类 signal 视为 active
- `zod` 默认会丢弃未声明字段
  - 这意味着 `technicalActions / noteReason` 当前即便发过来也不会进入 `payloadJson`

因此本轮应遵循：**只做契约层和最小运行时状态层扩容，不扩大到新的投影模型。**

## 方案选择

### 方案 A：扩容 push schema 与 helper union，保持业务投影语义最小化

做法：

- 扩容 `signal.type` enum 到 spec 候选集合
- `race.taskId` 改为必填
- 为 `signal` 增加 `noteReason`
- 为顶层消息增加 `technicalActions[]`
- helper 层把这些新增 signal 视为“有效活动信号”，从而允许连接状态进入 / 保持 `ACTIVE`

优点：

- 与 CA integration spec 最贴近
- 改动集中
- 不会发明新的 domain 存储

缺点：

- 只是契约对齐，不是完整消费闭环

### 方案 B：只扩 schema，不扩 helper 层状态逻辑

优点：

- 改动更小

缺点：

- 新增 signal.type 即使通过 schema，也可能在运行时表现不一致
- 不够完整

### 推荐方案

采用 **方案 A：扩容 push schema 与 helper union，并做最小运行时状态对齐**。

原因：

- 这是对 `ary-ca-integration-spec.md` 最直接、最少想象的收敛方式
- 能避免“schema 接受了，运行时却像未定义消息”的半实现状态

## 运行时规则

### 1. `signal.type` 支持面

支持以下候选值：

- `riding_started`
- `riding_paused`
- `riding_resumed`
- `riding_finished`
- `task_started`
- `task_progress`
- `task_completed`
- `task_blocked`
- `session_started`
- `session_completed`
- `cost_updated`
- `risk_detected`
- `milestone_reached`
- `validation_run`
- `artifact_linked`

### 2. `race.taskId`

- push 消息中改为必填
- 当前只做契约校验和 payload 保留
- 本轮不把它接到 Race 模型

### 3. `signal.noteReason` 与 `technicalActions`

- 当前进入 `payloadJson`
- 当前参与 `payloadDigest`
- 若 connection 已登记 credential，则也参与签名 digest
- 本轮不单独投影到其它表

### 4. connection active 语义

- 只要消息不是显式 ingestion failure，且属于有效 push signal
- 新增 signal.type 也应允许 connection 进入 / 保持 `ACTIVE`

## 测试对齐

需要扩展：

- `src/lib/services/ca-signature-verification.test.ts`
- `src/lib/ca-runtime-helpers.test.ts`

覆盖：

- 新增 `signal.type`（如 `milestone_reached` / `validation_run`）可以通过 schema 与签名校验
- `race.taskId` 缺失会被拒绝
- `technicalActions / noteReason` 能保留在 payload 中
- 新 signal.type 也能让 connection 进入 / 保持 `ACTIVE`

## 验收对齐

本轮完成后，需要能证明：

1. push signal schema 已收敛到 spec 当前候选集合
2. `race.taskId` 变为必填
3. `noteReason / technicalActions` 不再被静默丢弃
4. 新增 signal.type 在运行时不会表现异常

## 一句话结论

`DEV-5 signal contract alignment` 的目标是：*把当前 CA push 契约从“最小 4 种 signal type”收敛到 `ary-ca-integration-spec.md` 已经明示的字段和候选集合，同时保持业务投影语义尽量不扩散。*

## 已落地实现补记（2026-07-10）

- `src/lib/services/ca-ingestion.ts`
  - push schema 现已支持 spec 列出的 `signal.type` 候选集合
  - `race.taskId` 现已改为必填
  - `signal.noteReason` 现已保留
  - 顶层 `technicalActions[]` 现已保留，并进入：
    - `payloadJson`
    - `payloadDigest`
    - 已登记 credential 时的签名 digest
- `src/lib/ca-runtime-helpers.ts`
  - `RidingSignalInput.type` 已扩容
  - `getNextConnectionStatusFromSignal()` 现在会把这些有效 push signal 统一视为可进入 / 保持 `ACTIVE`
- `src/lib/ca-runtime-helpers.test.ts`
  - 已补 `milestone_reached` 保持 `ACTIVE`
- `src/lib/services/ca-signature-verification.test.ts`
  - 已补带 `noteReason / technicalActions` 的 signed `milestone_reached` signal
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 已补 `race.taskId` 缺失时 schema 拒绝

### 本轮明确没有做的事

- 没有把 `taskId` 接到 Race 模型
- 没有给 `technicalActions` 新增单独表
- 没有扩大 snapshot fetch 的业务语义
- 没有改变 Projection 粒度

### 新鲜验证证据

- `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
- `npm run build`
