# GRS004 / P2-E 生产 Connector 强制签名策略 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.1 缺少消息级签名`
  - `§6 P2：增强 connector 认证`
    - `1. 在 connector 层引入公钥注册或 credential fingerprint`
    - `2. Signal payload 增加签名`
- `docs/grs004/ary-ca-integration-spec.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2a-connector-signature-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2d-connector-audit-overview-design.md`

`P2-A` 已经落地“已登记 credential 的 connection 必须验签”，但当前仍保留 bearer-only 兼容路径。`docs/grs004` 的剩余加强点不是再发明新签名协议，而是：

*把签名从“可选增强”收敛成“生产 connector 默认要求”。*

本轮目标是：**只用现有字段和现有签名协议，补上一个更强的运行时策略边界：远程 / 非本地 connector 必须登记 credential 并走签名链路，本地 localhost demo 继续保留 bearer-only 兼容。**

## 范围

### 本轮纳入

- 不新增新表
- 不修改签名算法，继续只支持 `ed25519:v1`
- 对以下链路增加更强 enforcement：
  - `completeCAConnectionHandshake()`
  - `ingestRidingSignalMessage()`
  - `fetchCASessionSnapshotForConnection()`
- 新增“生产 connector 是否强制 credential / 签名”的 policy helper
- 新增拒绝原因：
  - `credential_required`
- 调整测试与本地兼容边界：
  - 远程 / 非本地 connector：必须登记 credential
  - 本地 `localhost / 127.0.0.1 / ::1` demo connector：可继续 bearer-only

### 本轮不纳入

- 不引入多算法支持
- 不引入密钥轮换管理
- 不新增独立 credential 生命周期页面
- 不修改 organizer trust/risk 规则
- 不扩 projection
- 不把私网 IP、一切内网域名都当成本地开发白名单

## 约束

### 当前代码现实

- `src/lib/services/ca-fetch.ts`
  - handshake 当前允许无 credential 的 connection 继续成功
  - snapshot 当前只在 `publicKeyPem` 已登记时才强制验签
- `src/lib/services/ca-ingestion.ts`
  - signal 当前只在 `publicKeyPem` 已登记时才强制验签
- `src/app/_components/console/rider-console-page.tsx`
  - rider 当前可以直接登记 `Connector Base URL`
- `organizer_demo/ca_connector_demo`
  - 当前本地 demo 走 `http://localhost:4010`
  - 文档和演示仍依赖 bearer-only 路径

因此本轮不能直接把“所有 connection 一刀切强制签名”，否则会把当前本地 demo 链路打断。需要严格限定：

- **远程 / 非本地 connector** 强制 credential + 签名
- **localhost demo** 保持兼容

## 方案选择

### 方案 A：按 `connectorBaseUrl` 与现有接入来源做最小生产边界判断

做法：

- 若 `ingestionSource === CONNECTOR`，则视为生产 connector
- 或者 `connectorBaseUrl` 存在，且 host 不是：
  - `localhost`
  - `127.0.0.1`
  - `::1`
- 则该 connection 必须：
  - handshake 时完成 credential 登记
  - signal 时带签名
  - snapshot 时带签名

优点：

- 只用现有字段
- 能保住当前 localhost demo
- 能把远程 connector 默认收口到更强安全边界

缺点：

- “生产”语义仍是策略推断，不是独立 schema 字段

### 方案 B：新增显式 `signaturePolicy` 或 `environment` 字段

优点：

- 语义更直白

缺点：

- 需要 schema 迁移
- 超出“尽量减少自己的想法”的要求

### 推荐方案

采用 **方案 A：基于现有字段推断生产 connector**。

原因：

- 当前文档没有要求单独新增环境字段
- 当前已有 `connectorBaseUrl` 和 `ingestionSource`
- 这是最小且可验证的强化步骤

## 规则

### 1. Production Connector Policy

当满足以下任一条件时，视为需要强制签名的生产 connector：

- `ingestionSource === CONNECTOR`
- `connectorBaseUrl` 为非空，且 host 不是：
  - `localhost`
  - `127.0.0.1`
  - `::1`

### 2. Handshake

若 connection 命中 production policy，则：

- 若 connection 已有 credential，则允许不重复上传 credential
- 若 connection 尚无 credential，则本次 handshake 必须带：
  - `credentialFingerprint`
  - `publicKeyPem`
  - `signatureVersion`
- 否则拒绝：
  - `credential_required`

### 3. Signal

若 connection 命中 production policy，则：

- 若未登记 credential，直接拒绝：
  - `credential_required`
- 若已登记 credential，则继续沿现有规则：
  - 缺签名 → `signature_missing`
  - 版本不匹配 → `signature_version_mismatch`
  - 验签失败 → `signature_invalid`

### 4. Snapshot

若 connection 命中 production policy，则：

- 若未登记 credential，直接拒绝：
  - `credential_required`
- 若已登记 credential，则继续沿现有 snapshot 验签规则

## 与本地 demo 的边界

本轮明确保留：

- `http://localhost:*`
- `http://127.0.0.1:*`
- `http://[::1]:*`

这些本地 demo connector 可以继续 bearer-only。

这不是对生产策略的放松，而是为了不打断当前 `organizer_demo/ca_connector_demo` 的最小演示闭环。

## 测试对齐

需要新增或调整：

- `src/lib/ca-signature-helpers.test.ts`
  - policy helper 判断
- `src/lib/services/ca-fetch-audit.test.ts`
  - 远程 production handshake 缺 credential 被拒绝
  - localhost demo handshake 可不带 credential
  - production snapshot 在未登记 credential 时被拒绝
- `src/lib/services/ca-signature-verification.test.ts`
  - production signal 在未登记 credential 时被拒绝
  - localhost demo signal 可保持 bearer-only
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - integrity 测试改用 localhost/manual connection，避免误踩 production policy
- `src/lib/services/ca-fetch-integrity.test.ts`
  - 同上

## 验收对齐

本轮完成后，需要能证明：

1. 远程 / 非本地 connector 在未登记 credential 时，handshake 会被 `credential_required` 拒绝
2. 远程 / 非本地 connector 在未登记 credential 时，signal / snapshot 不再允许 bearer-only
3. localhost demo connector 仍可沿用当前 bearer-only 演示链路
4. 已登记 credential 的 production connector 继续沿现有签名校验规则运行
5. 本轮没有新增新的 schema 字段或新的签名算法

## 一句话结论

`P2-E` 的目标是：*不改签名协议本身，只把“远程 / 生产 connector 默认必须登记 credential 并签名，本地 localhost demo 保持兼容”这条更强的运行时边界真正落到 handshake、signal 和 snapshot 三条链路里。*

## 已落地实现补记（2026-07-10）

- `src/lib/ca-signature-helpers.ts`
  - 已新增 production signature policy helper：
    - `requiresProductionConnectorSignature()`
  - 当前规则是：
    - `ingestionSource === CONNECTOR` → 强制签名
    - 非 localhost / 127.0.0.1 / ::1 的 `connectorBaseUrl` → 强制签名
- `src/lib/services/ca-fetch.ts`
  - handshake 现在会在 production connector 且未登记 credential 时拒绝：
    - `credential_required`
  - snapshot fetch 现在会在 production connector 且未登记 credential 时拒绝：
    - `credential_required`
- `src/lib/services/ca-ingestion.ts`
  - signal ingest 现在会在 production connector 且未登记 credential 时拒绝：
    - `credential_required`
- `src/lib/services/ca-fetch-audit.test.ts`
  - 已覆盖：
    - production handshake 缺 credential 被拒绝
    - localhost demo handshake 保持兼容
    - production snapshot 未登记 credential 被拒绝
- `src/lib/services/ca-signature-verification.test.ts`
  - 已覆盖：
    - production signal 未登记 credential 被拒绝
    - localhost demo signal 保持兼容
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 已迁到 localhost/manual connection，避免完整性测试误踩 production policy
- `src/lib/services/ca-fetch-integrity.test.ts`
  - 已迁到 localhost/manual connection，避免 snapshot integrity 测试误踩 production policy

### 本轮明确没有做的事

- 没有新增新的 schema 字段
- 没有新增新的签名算法
- 没有新增 credential 轮换生命周期页面
- 没有把所有私网地址都加入 localhost 兼容白名单

### 新鲜验证证据

- `node --test-concurrency=1 --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts`
- `npm run build`
