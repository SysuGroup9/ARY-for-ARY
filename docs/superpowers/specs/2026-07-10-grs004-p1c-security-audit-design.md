# GRS004 / P1-C 统一 SecurityAudit 层 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.6 缺少统一审计模型`
  - `§6 P1：补材料完整性`
    - `4. 引入统一 SecurityAudit / IntegrityEvent`

在 `P0` 已补可信接入字段、`P1-A` 已补材料完整性、`P1-B` 已补结果引用冻结之后，当前最大的结构性缺口是：**系统还没有一个统一对象去记录安全相关动作到底由谁触发、作用到哪个对象、结果是什么、为什么失败或进入 review。**

`P1-C` 的目标不是做全站行为日志，而是先把 `docs/grs004` 当前主链路里最关键的 `CA` 边界动作统一落到一个可查询、可扩展的审计模型中。

## 范围

### 本轮纳入

- 新增统一 `SecurityAudit` 模型
- 覆盖当前 `CA` 主链路的四类真实动作：
  - `ca_connection.register`
  - `ca_connection.handshake`
  - `ca_signal.ingest`
  - `ca_snapshot.fetch`
- 审计记录至少包含：
  - `actorKind`
  - `action`
  - `targetType / targetId`
  - `result`
  - `reason`
  - `payloadDigest`
  - `detailsJson`
  - `createdAt`
  - 以及可选的 `race / raceProject / registration / user / caConnection` 归属引用

### 本轮不纳入

- 全站用户行为审计
- `disabled / revoked connector` 的可视化展示
- UI 查询页或 Organizer Console 审计面板
- `ip / userAgent` 真实采集
  - 文档要求是“如可得”，当前 server action / service 入口没有统一提供这类上下文
- 独立 `IntegrityEvent` 第二张表
- 人工角色修改、合作审批、作品/文件修改日志
  - 这些后续可以复用同一模型继续接入

## 约束

### 必须服从的上游文档

- `docs/grs004/防伪与防篡改计划.md`
- `docs/grs004/ary.plan.md`
- `docs/superpowers/status.md`
- `docs/superpowers/specs/2026-07-10-grs004-dev5-p0-trusted-ingestion-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1b-result-reference-freeze-design.md`

### 当前代码现实

- `completeCAConnectionHandshake()` 只处理 connector 侧握手，没有统一审计
- `ingestRidingSignalMessage()` 已有 scope / secret / idempotency / integrity 分支，但没有统一审计对象
- `fetchCASessionSnapshotForConnection()` 已有抓取与 stale 保护，但没有统一审计对象
- `createCAConnectionForRaceProject()` 是当前 rider 手动登记 connector 的真实入口
- 现有公开层、控制台和 seed 都不依赖任何审计模型

因此 `P1-C` 最稳妥的落点，是**先只接入 CA 边界服务**，不强行扩到别的业务域。

## 方案选择

### 方案 A：单表 `SecurityAudit`

做法：

- 新增一张 `SecurityAudit` 表
- 每条安全相关动作写一行
- 通过 `detailsJson` 承载动作特有的补充上下文

优点：

- 最接近 `grs004` 文档里“统一审计对象”的表述
- 写入链路简单
- 后续可逐步接入更多服务

缺点：

- `detailsJson` 结构会按动作不同而变化

### 方案 B：`SecurityAudit + IntegrityEvent` 双表

做法：

- 通用行为写 `SecurityAudit`
- 只和完整性相关的异常再写 `IntegrityEvent`

优点：

- 类型分离更明显

缺点：

- 当前没有足够证据需要两层抽象
- 会扩大 schema、helper、测试和读路径复杂度

### 推荐方案

采用 **方案 A：单表 `SecurityAudit`**。

原因：

- 用户要求尽量减少自己的想法，`docs/grs004` 也只要求统一对象，不要求双表
- 当前最缺的是“先有统一审计入口”，而不是“先做完美分类体系”

## 数据模型

建议字段：

```text
SecurityAudit
- id
- raceId?
- raceProjectId?
- registrationId?
- userId?
- caConnectionId?
- actorKind
- action
- targetType
- targetId
- result
- reason
- payloadDigest
- detailsJson
- ipAddress?
- userAgent?
- createdAt
```

说明：

- `userId`
  - 对用户动作使用当前用户
  - 对 connector 动作使用 `registration.userId` 作为归属用户
- `caConnectionId`
  - 让 connector 相关事件可以直接回溯连接对象
- `detailsJson`
  - 保存 `connectorId / caSessionId / idempotencyKey / sequence / messageId / fetchedAt` 这类动作特有上下文
- `ipAddress / userAgent`
  - 本轮先留空，等真实入口能稳定提供时再接

## 动作收敛

### 1. `ca_connection.register`

触发点：

- `createCAConnectionForRaceProject()`

记录内容：

- `actorKind = USER`
- `action = ca_connection.register`
- `targetType = CAConnection`
- `targetId = connection.id`
- `result = success`
- `payloadDigest = ""`
- `detailsJson` 包含 `connectorId / caProjectId / caType`

### 2. `ca_connection.handshake`

触发点：

- `completeCAConnectionHandshake()`

记录内容：

- 成功和失败都记
- `actorKind = CONNECTOR`
- `targetType = CAConnection`
- `result` 取值：
  - `accepted`
  - `rejected`
- `reason` 取值复用当前返回原因：
  - `connection_not_found`
  - `unauthorized`
  - `scope_mismatch`
  - `accepted`

### 3. `ca_signal.ingest`

触发点：

- `ingestRidingSignalMessage()`

记录内容：

- 复用现有所有分支结果
- `result` 取值：
  - `accepted`
  - `deduped`
  - `review_needed`
  - `integrity_gap`
  - `rejected`
- `reason` 复用现有分支：
  - `connection_not_found`
  - `unauthorized`
  - `connection_not_ready`
  - `scope_mismatch`
  - `same_payload_duplicate`
  - `payload_digest_conflict`
  - `timestamp_window_exceeded`
  - `accepted`

### 4. `ca_snapshot.fetch`

触发点：

- `fetchCASessionSnapshotForConnection()`

记录内容：

- `result` 取值：
  - `accepted`
  - `stale`
  - `rejected`
- `reason` 包括：
  - `connection_not_found`
  - `connection_not_ready`
  - `missing_connector_base_url`
  - `fetch_failed`
  - `scope_mismatch`
  - `stale_snapshot`
  - `accepted`

## 写入策略

### 成功路径

- 与主业务写入放在同一事务里时，优先同事务写审计
- 这样不会出现“主状态成功、审计缺失”的半完成状态

### 失败路径

- 对于返回值型失败，先写审计再返回
- 对于抛异常型失败，先构造审计再抛出原错误
- 本轮不改变原有 API 语义，只补审计副作用

## Helper 设计

新增两个层次：

### 1. 纯 helper

- `buildSecurityAuditRecord(input)`
- 负责：
  - 标准化 `reason`
  - 标准化 `detailsJson`
  - 生成最终 Prisma create payload

### 2. 写入 helper

- `recordSecurityAudit(db, input)`
- 负责：
  - 接收 `prisma` 或事务 `tx`
  - 调用 `securityAudit.create()`

## 验收对齐

本轮完成后，需要能证明：

1. schema 中存在统一 `SecurityAudit` 模型
2. rider 手动登记 connector 时会写 `ca_connection.register`
3. handshake 成功/失败会写 `ca_connection.handshake`
4. signal ingest 成功 / dedupe / integrity gap / 拒绝分支会写 `ca_signal.ingest`
5. snapshot fetch 成功 / stale / 拒绝分支会写 `ca_snapshot.fetch`
6. 本轮不声称已经完成全站审计、disabled/revoked 可视化或 ip/userAgent 真实采集

## Implementation Notes

- `P1-C` 先只覆盖 `CA` 主链路，是因为 `docs/grs004` 当前主线仍然是 `DEV-5 CA 接入 / Projection / Live Hall`；把全站动作都混进来会偏离当前优先级。
- `SecurityAudit` 选单表，不引入第二张 `IntegrityEvent`，避免在证据不足时过度抽象。
- `detailsJson` 用于承载动作特有上下文，避免过早把所有字段抬升为 schema 常驻列。

### 已落地实现补记

- `SecurityAudit` 已按单表落地到 Prisma schema，并通过 `src/lib/security-audit-helpers.ts` 与 `src/lib/services/security-audit.ts` 统一构建和写入。
- 当前已接入的真实边界动作只有四类：
  - `ca_connection.register`
  - `ca_connection.handshake`
  - `ca_signal.ingest`
  - `ca_snapshot.fetch`
- `ipAddress / userAgent` 字段已预留，但本轮没有为了“填满字段”去发明不存在的请求上下文。
- 本轮新鲜验证已通过：
  - `node --import tsx --test src/lib/security-audit-helpers.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

## 一句话结论

`P1-C` 的目标是：**先把 `CA registration / handshake / signal / snapshot` 四条真实安全边界动作纳入统一 `SecurityAudit`，让系统第一次具备“谁触发了什么安全动作、作用到谁、结果如何、为什么”的统一审计事实源。**
