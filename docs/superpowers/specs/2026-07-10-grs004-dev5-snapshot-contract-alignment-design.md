# GRS004 / DEV-5 CA Snapshot Contract Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/PLAN.md`
  - `DEV-5 CA 接入 / Projection / Live Hall`
- `docs/grs004/ary-ca-integration-spec.md`
  - `§6 Session 快照 fetch`

当前真实差距是：

- spec 示例中的 snapshot `ca` 对象包含 `caType`
- snapshot `task` 对象包含 `taskId`
- snapshot `session` 对象使用 `tokens`
- 当前代码仍在 fetch schema 和 patch helper 里使用旧口径：
  - `ca.caType` 缺失
  - `task.taskId` 缺失
  - `session.tokenCost`

本轮目标是：**把 CA snapshot fetch 契约向 `ary-ca-integration-spec.md` 的当前字段口径再收敛一层，同时保持内部 Session 模型不扩散。**

## 范围

### 本轮纳入

- 只收口 snapshot fetch 契约
- 在 fetch schema 中补：
  - `ca.caType`
  - `task.taskId`
  - `session.tokens`
- 内部仍映射到当前 `Session.tokenCost`
- 更新相关 helper/test

### 本轮不纳入

- 不新增 Race.taskId 字段
- 不扩展 snapshot 到新的投影模型
- 不改变 stale snapshot 判定语义
- 不引入新的 snapshot 版本历史表

## 约束

### 当前代码现实

- `src/lib/services/ca-fetch.ts`
  - `snapshotSchema` 当前缺少 `ca.caType / task.taskId`
  - `session.tokenCost` 仍是旧字段
- `src/lib/ca-runtime-helpers.ts`
  - `buildSessionPatchFromSnapshot()` 当前读取 `snapshot.session.tokenCost`
- `Session` 模型内部字段仍叫：
  - `tokenCost`

因此本轮应遵循：**外部契约贴齐 spec，内部模型暂不改名，只做映射。**

## 方案选择

### 方案 A：对齐外部 snapshot 契约，内部继续映射到 `tokenCost`

做法：

- `snapshotSchema.ca.caType` 改为必填
- `snapshotSchema.task.taskId` 改为必填
- `snapshotSchema.session.tokens` 改为必填
- `buildSessionPatchFromSnapshot()` 用 `tokens -> tokenCost`

优点：

- 与 spec 最贴近
- 内部 domain 变更最小

缺点：

- 仍存在“外部字段叫 tokens、内部字段叫 tokenCost”的双口径

### 方案 B：连内部 Session 字段一起重命名

优点：

- 命名完全一致

缺点：

- 扩散面太大
- 超出当前最小切片

### 推荐方案

采用 **方案 A：对齐外部 snapshot 契约，内部继续映射到 `tokenCost`**。

原因：

- 这是最贴近 spec 且最小扰动的实现

## 运行时规则

### 1. snapshot `ca`

- 必须包含：
  - `caConnectionId`
  - `caProjectId`
  - `caSessionId`
  - `caType`

### 2. snapshot `task`

- 必须包含：
  - `taskId`
  - `taskStatus`
  - `progressPercent`

### 3. snapshot `session`

- 必须包含：
  - `tokens`
  - `messageCount`
  - `toolCallCount`
  - `allRidingMessageLength`
  - `startedAt`
  - `lastActiveAt`
  - `endedAt`

### 4. 内部映射

- `session.tokens` -> `Session.tokenCost`
- 其它语义保持不变

## 测试对齐

需要扩展：

- `src/lib/ca-runtime-helpers.test.ts`
- `src/lib/services/ca-fetch-integrity.test.ts`
- `src/lib/services/ca-signature-verification.test.ts`

覆盖：

- spec 对齐后的 snapshot 字段可以通过 schema 与签名校验
- `tokens` 会正确映射到 `tokenCost`
- 缺少 `task.taskId` 时会被拒绝

## 验收对齐

本轮完成后，需要能证明：

1. snapshot fetch schema 与 spec 当前字段更一致
2. `tokens` 会正确进入内部 `tokenCost`
3. `task.taskId / ca.caType` 不再被静默缺失
4. 本轮没有扩大到新的投影或表结构

## 一句话结论

`DEV-5 snapshot contract alignment` 的目标是：*把 CA snapshot fetch 的外部字段口径对齐到 `ary-ca-integration-spec.md`，同时把变更控制在 fetch schema 和内部映射层。*

## 已落地实现补记（2026-07-10）

- `src/lib/services/ca-fetch.ts`
  - snapshot schema 现已要求：
    - `ca.caType`
    - `task.taskId`
    - `session.tokens`
- `src/lib/ca-runtime-helpers.ts`
  - `buildSessionPatchFromSnapshot()` 现在会把：
    - `session.tokens`
    映射到内部：
    - `tokenCost`
- `src/lib/ca-runtime-helpers.test.ts`
  - 已补 snapshot patch 从 `tokens -> tokenCost` 的对齐覆盖
- `src/lib/services/ca-fetch-integrity.test.ts`
  - 已补 spec 对齐后的 snapshot payload
  - 已补 `task.taskId` 缺失拒绝
- `src/lib/services/ca-signature-verification.test.ts`
  - signed snapshot 现已按：
    - `ca.caType`
    - `task.taskId`
    - `session.tokens`
    口径通过签名校验

### 本轮明确没有做的事

- 没有把 `taskId` 接到 Race 模型
- 没有新增 snapshot 版本历史表
- 没有扩大 snapshot 的下游消费语义
- 没有新增新的 Projection

### 新鲜验证证据

- `node --test-concurrency=1 --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`
- `npm run build`
