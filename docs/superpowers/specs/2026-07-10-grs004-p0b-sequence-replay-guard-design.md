# GRS004 / P0-B sequence 防重放校验 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.2 幂等键已有，但防重放仍不完整`
    - 时间窗校验
    - sequence 单调性校验
    - 同一 `caConnectionId + caSessionId + sequence` 唯一约束
    - 已接收消息 digest 与 idempotencyKey 冲突检测
- `docs/superpowers/specs/2026-07-10-grs004-dev5-p0-trusted-ingestion-design.md`

当前真实状态是：

- 时间窗校验已落地
- 重复 `idempotencyKey` 且 payloadDigest 不一致的冲突检测已落地
- `sequence` 已写入 `CAIngestionEvent`

但 `sequence` 仍只是“被记录下来”，还没有成为真正的运行时防重放边界。

本轮目标是：**把 `sequence` 从被动记录字段升级为真实防重放边界，对同一 `caConnectionId + caSessionId` 下的消息做单调性与冲突校验。**

## 范围

### 本轮纳入

- 只收口 CA signal ingestion 链路：
  - `ingestRidingSignalMessage()`
- 只处理带 `sequence` 的 signal 消息
- 补以下能力：
  - 同一 `caConnectionId + caSessionId` 下的 `sequence` 单调性校验
  - 同一 `caConnectionId + caSessionId + sequence` 唯一约束
  - replay / out-of-order 时不再推进 `Session / RaceProject / Projection`
  - 统一审计与 `integrity_gap`

### 本轮不纳入

- 不扩 snapshot fetch 语义
- 不引入 nonce
- 不引入更复杂的时间窗 / signedAt 组合策略
- 不改 Projection 粒度
- 不自动处罚或 DQ

## 约束

### 当前代码现实

- `src/lib/services/ca-ingestion.ts`
  - 当前会先校验 auth / scope / handshake / signature
  - 之后做 `idempotencyKey` 去重与 digest 冲突检测
  - 再把 signal 写入 `CAIngestionEvent`，并推进 `Session / CAConnection / RaceProject`
- `prisma/schema.prisma`
  - `CAIngestionEvent` 目前有：
    - `caConnectionId`
    - `messageId`
    - `idempotencyKey`
    - `sequence`
    - `payloadDigest`
    - `integrityStatus`
  - 但还没有 `caSessionId`

因此本轮应遵循：**只在现有 CA signal 主链路上补最小 replay 边界，不扩大到新的消息模型。**

## 方案选择

### 方案 A：为 `CAIngestionEvent` 增加 `caSessionId`，并在 signal ingestion 做 sequence guard

做法：

- `CAIngestionEvent` 增加 `caSessionId`
- 增加唯一约束：
  - `[caConnectionId, caSessionId, sequence]`
- `ingestRidingSignalMessage()` 在写业务状态前先查同 connection+session 的已接收最大 sequence
- 若 incoming sequence 小于等于已接收最大值：
  - 记为 `integrity_gap`
  - 写审计
  - 不推进 `Session / RaceProject / Projection`

优点：

- 与文档原话最贴近
- 后续查询 sequence replay 也更直接
- 不再依赖从 `payloadJson` 反解析 session 标识

缺点：

- 需要 schema + migration

### 方案 B：不改 schema，只靠解析历史 `payloadJson`

优点：

- 不需要 migration

缺点：

- 查询脆弱
- 无法落真实唯一约束
- 不符合 `§5.2` 对唯一边界的建议

### 推荐方案

采用 **方案 A：增加 `caSessionId` 并在 signal ingestion 做 sequence guard**。

原因：

- 这是最贴近文档原意的最小真实实现
- schema 成本可控，收益直接

## 运行时规则

### 1. 仅对带 `sequence` 的 signal 生效

- 如果 signal 未携带 `sequence`
  - 保持当前行为不变

### 2. 单调性校验

- 查询同一 `caConnectionId + caSessionId` 下已接收的最大非空 sequence
- 若 incoming sequence：
  - 大于当前最大值：按正常消息推进
  - 等于当前最大值：记为 replay / `integrity_gap`
  - 小于当前最大值：记为 out-of-order / `integrity_gap`

### 3. integrity_gap 处理

- 不继续推进：
  - `Session`
  - `CAConnection`
  - `RaceProject`
  - `Evidence / Projection` 重建
- 写 `SecurityAudit(action=ca_signal.ingest)`
- `result = integrity_gap`
- `reason` 区分：
  - `sequence_replayed`
  - `sequence_out_of_order`

### 4. 事件记录策略

- 对正常推进的消息，继续写真实 `sequence`
- 对 replay / out-of-order 的消息，允许写一条 `INTEGRITY_GAP` 事件作为取证
- 为避免唯一约束冲突，这类取证事件不再复用原 `sequence`，而是写 `sequence = null`
- 具体原始 `sequence` 仍保留在 `payloadJson` 与 audit details 中

## 测试对齐

需要扩展：

- `src/lib/services/ca-ingestion-integrity.test.ts`
- `src/lib/ca-integrity-helpers.test.ts`（若抽 helper）

覆盖：

- 同一 session 下重复 sequence 不再推进业务状态，并写 `sequence_replayed`
- 同一 session 下倒退 sequence 不再推进业务状态，并写 `sequence_out_of_order`
- 只有首条合法 sequence 会保留真实 sequence 记录

## 验收对齐

本轮完成后，需要能证明：

1. 同一 `caConnectionId + caSessionId` 下的 signal sequence 会被单调性校验
2. replay / out-of-order 不再推进 `Session / Projection`
3. `SecurityAudit` 会留下对应 `integrity_gap`
4. 本轮没有自动 DQ、没有扩大到 snapshot fetch

## 一句话结论

`P0-B` 的目标是：*把 `sequence` 从 `CAIngestionEvent` 的被动记录字段，升级为同一 connection+session 下的真实防重放边界。*

## 已落地实现补记（2026-07-10）

- `prisma/schema.prisma`
  - `CAIngestionEvent` 已新增：
    - `caSessionId`
  - 并已新增唯一边界：
    - `[caConnectionId, caSessionId, sequence]`
- `prisma/migrations/20260710105437_grs004_p0b_sequence_replay_guard/`
  - 已为旧事件回填 `caSessionId`
  - 已把历史 `INTEGRITY_GAP` 取证事件的 `sequence` 置空，避免唯一约束冲突
- `src/lib/ca-integrity-helpers.ts`
  - 已新增：
    - `evaluateSequenceProgression()`
- `src/lib/services/ca-ingestion.ts`
  - `ingestRidingSignalMessage()` 现在会在正常业务写入前校验同一 `caConnectionId + caSessionId` 下的 sequence 进展
  - 对以下情况写 `integrity_gap` 并阻断业务推进：
    - `sequence_replayed`
    - `sequence_out_of_order`
  - replay / out-of-order 当前不会继续推进：
    - `Session`
    - `CAConnection`
    - `RaceProject`
    - `Evidence / Projection`
- `src/lib/services/ca-fetch.ts`
  - snapshot ingestion event 现在也会写入 `caSessionId`
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 已补：
    - replayed sequence 拦截
    - out-of-order sequence 拦截

### 本轮明确没有做的事

- 没有引入 nonce
- 没有扩大到 snapshot fetch sequence 策略
- 没有自动处罚或 DQ
- 没有细化 Projection 粒度

### 新鲜验证证据

- `node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
- `npm run build`
