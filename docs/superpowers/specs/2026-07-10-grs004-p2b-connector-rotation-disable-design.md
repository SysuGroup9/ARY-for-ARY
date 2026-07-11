# GRS004 / P2-B Connector Secret Rotation 与 Disabled Connector 可视化 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§6 P2：增强 connector 认证`
    - `3. 支持 connector secret rotation`
    - `4. 支持 disabled / revoked connector 的审计与可视化`
    - `5. 在 Organizer Console 中显示接入可信度和风险提示`

`P2-A` 已经补上 credential fingerprint、公钥登记和 signal/snapshot 验签。当前剩余的 `P2` 缺口是：**connectorSecret 仍不可轮换、disabled 状态只能在 schema 中存在但没有业务操作入口、当前控制台也看不到“这个 connector 已被禁用/secret 已轮换，需要重新握手”的状态。**

## 范围

### 本轮纳入

- 为 `CAConnection` 增加最小 secret 轮换元数据：
  - `secretVersion`
  - `secretRotatedAt`
  - `disabledReason`
- 为 rider 提供当前 connection 的 `secret rotation` 入口
- 为 organizer 提供当前 connection 的 `disable / enable` 入口
- 在 `Rider Console` 与 `Organizer Console` 的现有 CA 状态页面展示：
  - `disabledAt / disabledReason`
  - `secretVersion / secretRotatedAt`
  - “需要重新 handshake” 提示
- 复用 `SecurityAudit` 记录：
  - `ca_connection.secret_rotated`
  - `ca_connection.disabled`
  - `ca_connection.enabled`

### 本轮不纳入

- 独立 `revokedAt` 字段
- 多版本 secret 历史表
- 自动 secret 过期策略
- Admin/Organizer 单独的审计总览页
- disabled/revoked 的大屏展示

## 约束

### 当前代码现实

- `CAConnection` 已有 `connectorSecret`、`handshakeCompletedAt`、`disabledAt`
- runtime 已经在以下路径拒绝 `disabledAt` 的 connection：
  - `completeCAConnectionHandshake()`
  - `ingestRidingSignalMessage()`
  - `fetchCASessionSnapshotForConnection()`
- rider console 目前直接暴露 `Connector Secret`
- organizer console `ca-status` 面板能看到聚合状态，但看不到 secret 版本和 disabled 细节

因此本轮应该**直接扩展现有 `CAConnection` 和当前控制台路径**，而不是新建额外 connector 管理子系统。

## 方案选择

### 方案 A：`secret rotation = 替换当前 secret + 失效当前 handshake`

做法：

- 轮换时生成新的 `connectorSecret`
- `secretVersion += 1`
- `secretRotatedAt = now`
- `handshakeCompletedAt = null`
- `ingestionStatus = CONNECTED`

优点：

- 实现最小且安全含义明确
- 旧 secret 立即失效
- connector 需要重新 handshake 才能继续进入有效链路

缺点：

- 不保留旧 secret 历史

### 方案 B：轮换 secret 但保留当前 handshake

优点：

- 对运行中 connector 影响更小

缺点：

- “已完成 handshake 的旧 secret 是否还可信”会变得模糊
- 与当前 runtime 的信任边界不一致

### 推荐方案

采用 **方案 A：轮换 secret 时清空 handshake**。

原因：

- 更贴合 `docs/grs004` 里的“可信 connector 边界必须明确”
- 旧 secret 失效之后，让 connector 重新 handshake 是最自然的安全边界

## 对 “revoked connector” 的处理

本轮不新增 `revokedAt`。

解释方式：

- **disabled connector**：使用现有 `disabledAt` 表达当前 connector 被停用
- **revoked connector**：通过 `secret rotation` 撤销旧 secret 的继续使用资格

这满足文档里“disabled / revoked connector”的最小业务语义，同时避免在当前证据不足时再发明一层独立状态机。

## 数据模型

在 `CAConnection` 上新增：

- `secretVersion Int @default(1)`
- `secretRotatedAt DateTime?`
- `disabledReason String @default("")`

## 运行时规则

### 1. Secret Rotation

触发点：

- rider 在自己的 `RaceProject` 连接上手动触发

轮换效果：

- `connectorSecret` 替换为新值
- `secretVersion += 1`
- `secretRotatedAt = now`
- `handshakeCompletedAt = null`
- `ingestionStatus = CONNECTED`
- `lastSyncedAt` 保留，不回写旧值

审计：

- `action = ca_connection.secret_rotated`
- `result = accepted`

### 2. Disable Connector

触发点：

- organizer 在自己赛事的 `CAConnection` 上手动触发

效果：

- `disabledAt = now`
- `disabledReason = input.reason`
- 后续 handshake / signal / snapshot 都会继续被现有 runtime 拒绝

审计：

- `action = ca_connection.disabled`

### 3. Enable Connector

触发点：

- organizer 手动恢复

效果：

- `disabledAt = null`
- `disabledReason = ""`
- 不自动恢复 handshake，需要 connector 重新 handshake

审计：

- `action = ca_connection.enabled`

## UI 收口

### Rider Console / `ca-setup`

新增最小可见信息：

- `secretVersion`
- `secretRotatedAt`
- `disabledAt / disabledReason`
- “需要重新 handshake” 提示：
  - 当 `handshakeCompletedAt = null`

新增按钮：

- `轮换 Connector Secret`

### Organizer Console / `ca-status`

在现有 `RaceProject CA 状态` 卡片里补：

- 每个 connection 的：
  - `connectorId`
  - `ingestionStatus`
  - `secretVersion`
  - `disabledAt`
  - `disabledReason`
  - `handshakeCompletedAt`

新增操作：

- `禁用`
- `恢复`

## 验收对齐

本轮完成后，需要能证明：

1. `CAConnection` 具备 `secretVersion / secretRotatedAt / disabledReason`
2. rider 可以轮换自己 connection 的 secret
3. secret 轮换后旧 secret 失效，且 connection 需要重新 handshake
4. organizer 可以禁用和恢复自己赛事中的 connection
5. rider / organizer 当前控制台能看到 secret 版本和 disabled 状态
6. 本轮不声称已经实现独立 `revokedAt`、secret 历史表或审计 UI 总览

## Implementation Notes

- 本轮故意不新建 `revokedAt`，而是把“撤销旧 secret”折叠进 `secret rotation`。
- `enable` 只恢复 disabled 状态，不恢复 handshake；这样不会无条件跳过安全边界。
- 轮换后把 `ingestionStatus` 回落到 `CONNECTED`，与当前“已登记但待重新确认”语义一致。

## 一句话结论

`P2-B` 的目标是：**把 connector 从“可长期暴露的静态 secret”推进到“可轮换的当前 secret + 可显式禁用的连接状态”，并让 rider/organizer 在当前控制台里看见这些安全状态变化。**

## 已落地实现补记（2026-07-10）

- `prisma/schema.prisma`
  - `CAConnection` 已实际新增 `secretVersion / secretRotatedAt / disabledReason`
  - migration 已生成并落地：`prisma/migrations/20260710023711_grs004_p2b_connector_rotation_disable/`
- `src/lib/services/ca-connections.ts`
  - 已落地 `rotateCAConnectionSecretForRider()`、`disableCAConnectionForOrganizer()`、`enableCAConnectionForOrganizer()`
  - 轮换 secret 时会同步清空 `handshakeCompletedAt` 并把 `ingestionStatus` 回落到 `CONNECTED`
- `src/app/actions.ts`
  - 已落地 `rotateCAConnectionSecretAction / disableCAConnectionAction / enableCAConnectionAction`
- `src/app/_components/console/rider-console-page.tsx`
  - `ca-setup` 已显示 secret 版本、轮换时间、disabled 原因与 `Handshake State`
  - 已新增 `Rotate Connector Secret` 操作入口
- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 已显示每个 connector 的安全细节
  - 已新增 `Disable Connector / Enable Connector` 操作入口
- `src/lib/services/ca-fetch-audit.test.ts`
  - 已补“轮换后旧 secret 失效、新 secret 可重新 handshake”的回归验证
  - 测试已改为自建临时 connector，避免与其他服务测试共享种子记录

### 新鲜验证证据

- `node --import tsx --test src/lib/services/ca-rotation-disable.test.ts src/lib/services/ca-fetch-audit.test.ts src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx`
- `npm run db:generate`
- `npm run db:seed`
- `npm run build`
