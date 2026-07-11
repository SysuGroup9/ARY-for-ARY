# GRS004 / P2-A Connector Credential Fingerprint 与消息签名 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.1 缺少消息级签名`
  - `§6 P2：增强 connector 认证`
    - `1. 在 connector 层引入公钥注册或 credential fingerprint`
    - `2. Signal payload 增加签名`
    - `3. 支持 connector secret rotation`
    - `4. 支持 disabled / revoked connector 的审计与可视化`
- `docs/grs004/ary-ca-integration-spec.md`
  - `RidingSignalMessage`
  - `Session snapshot fetch`

在 `P1-C` 之后，系统已经能统一审计 `CA registration / handshake / signal / snapshot`，但 connector 认证仍然只有 `connectorSecret` bearer token。`P2-A` 的目标是先补上**公钥注册 / credential fingerprint / 已登记 credential 下的 signed signal 与 signed snapshot 验签**，让 connector 身份从“知道 secret”推进到“知道 secret 且能持有对应签名私钥”。

## 范围

### 本轮纳入

- 在 `CAConnection` 上新增：
  - `credentialFingerprint`
  - `publicKeyPem`
  - `signatureVersion`
- `completeCAConnectionHandshake()` 支持登记 connector 公钥与 fingerprint
- `ingestRidingSignalMessage()` 支持对已登记 credential 的 connection 强制验签
- `fetchCASessionSnapshotForConnection()` 支持对已登记 credential 的 snapshot 响应强制验签
- 统一 `SecurityAudit` 里新增签名相关 rejected reason

### 本轮不纳入

- `connectorSecret` rotation
- `disabled / revoked connector` 的 UI 可视化
- 新建独立 `CACredential` 表
- 正式密钥轮换流程
- 全量强制所有旧 connection 立刻改为签名模式

## 约束

### 必须服从的上游文档

- `docs/grs004/防伪与防篡改计划.md`
- `docs/grs004/ary-ca-integration-spec.md`
- `docs/superpowers/status.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`

### 当前代码现实

- `CAConnection` 目前只有 `connectorSecret`，没有任何公钥或 fingerprint 字段
- `completeCAConnectionHandshake()` 当前只校验 `connectorSecret + connectorId + caProjectId`
- `ingestRidingSignalMessage()` 与 `fetchCASessionSnapshotForConnection()` 当前都不看 `signature`
- 当前 seed 和本地测试连接都没有 credential 信息

因此 `P2-A` 必须支持**渐进增强**：

- 没有登记 credential 的旧 connection 继续沿用 bearer-only 模式
- 一旦 connection 登记了 `publicKeyPem / credentialFingerprint / signatureVersion`，后续 signal / snapshot 就必须带有效签名

## 方案选择

### 方案 A：直接在 `CAConnection` 上存 credential 字段

做法：

- 为 `CAConnection` 直接增加 `credentialFingerprint / publicKeyPem / signatureVersion`
- handshake 成功时登记这些字段

优点：

- 与 `docs/grs004` 的允许范围一致
- 最小改动
- 不需要额外 join

缺点：

- 后续做真正轮换时，一条 connection 只能看到当前 credential

### 方案 B：新增 `CACredential` 子表

做法：

- `CAConnection` 挂多个 credential 版本

优点：

- 更适合未来轮换

缺点：

- 会把本轮范围放大到 rotation 管理
- 当前证据不足以支撑立即拆表

### 推荐方案

采用 **方案 A：直接扩 `CAConnection`**。

原因：

- 用户要求尽量减少自己的想法
- 文档已经允许 `CAConnection` 承载 fingerprint
- `P2-A` 只是先把签名边界建立起来，不是一次性做完整 credential 生命周期

## 凭证与签名约定

### 1. Handshake

在当前 handshake payload 上新增可选字段：

```json
{
  "credentialFingerprint": "...",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----...",
  "signatureVersion": "ed25519:v1"
}
```

规则：

- 若 connection 还没有 credential 字段，且 handshake 带了这三项，则登记到 `CAConnection`
- 若 connection 已有 credential，再次 handshake 时必须与已登记值一致
- 若 fingerprint 与 `publicKeyPem` 计算结果不一致，则拒绝

### 2. Signal

在 `RidingSignalMessage` 顶层新增：

```json
{
  "signedAt": "2026-06-19T10:00:00.000Z",
  "signatureVersion": "ed25519:v1",
  "signature": "base64..."
}
```

签名内容：

- 对完整 payload 做 canonical digest
- 仅排除 `signature` 本身
- `signedAt` 和 `signatureVersion` 保留在被签名内容内

### 3. Snapshot

在 snapshot response 顶层同样新增：

```json
{
  "signedAt": "2026-06-19T10:18:36.000Z",
  "signatureVersion": "ed25519:v1",
  "signature": "base64..."
}
```

规则：

- 仅当 connection 已登记 credential 时强制校验
- 未登记 credential 的旧 connection 仍允许无签名快照

## 验签 helper

新增 `ca-signature-helpers.ts`：

- `buildCredentialFingerprint(publicKeyPem)`
- `buildSignedPayloadDigest(payloadWithoutSignature)`
- `verifySignedPayload({ payload, publicKeyPem })`

本轮只支持：

- `signatureVersion = ed25519:v1`

这样不提前扩到多算法管理。

## 写入与拒绝策略

### Handshake

- credential 正确时更新 `CAConnection`
- mismatch 时返回 rejected
- `SecurityAudit` reason 增加：
  - `credential_fingerprint_mismatch`
  - `credential_mismatch`

### Signal

对已登记 credential 的 connection：

- 缺少签名 → `signature_missing`
- `signatureVersion` 不一致 → `signature_version_mismatch`
- 验签失败 → `signature_invalid`

### Snapshot

同 signal。

## 与 P1-C 的关系

`P1-C` 已有 `SecurityAudit`。`P2-A` 不新增第二套日志，而是复用当前审计模型，把新增的签名拒绝原因写进去。

## 验收对齐

本轮完成后，需要能证明：

1. `CAConnection` 具备 `credentialFingerprint / publicKeyPem / signatureVersion`
2. handshake 可登记 credential，且 fingerprint 不匹配时会拒绝
3. 已登记 credential 的 connection，其 signal 必须带有效签名
4. 已登记 credential 的 connection，其 snapshot 必须带有效签名
5. 旧 connection 在未登记 credential 时仍可沿用 bearer-only 模式
6. `secret rotation` 与 `revoked/disabled` UI 可视化仍未开始

## Implementation Notes

- 本轮只做 `ed25519:v1`，避免在证据不足时提前抽象多算法管理。
- 渐进增强是必要的，因为当前 seed、测试和本地 demo 连接都还没有 credential。
- `P2-A` 不改变 `connectorSecret` 的存在意义，而是在其上增加“已登记 credential 时必须能完成消息签名”的第二层认证。

### 已落地实现补记

- `CAConnection` 已直接扩展 `credentialFingerprint / publicKeyPem / signatureVersion`，没有新建 `CACredential` 表。
- `completeCAConnectionHandshake()` 已支持登记 credential，并拒绝 `credential_fingerprint_mismatch / credential_mismatch`。
- `ingestRidingSignalMessage()` 与 `fetchCASessionSnapshotForConnection()` 已对“已登记 credential 的 connection”强制执行签名校验。
- 旧 connection 在未登记 credential 时仍保持 bearer-only 兼容模式。
- 本轮新鲜验证已通过：
  - `node --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

## 一句话结论

`P2-A` 的目标是：**先把 connector 身份从“知道 secret”推进到“知道 secret 且能持有对应签名私钥”，并把这个能力落到 handshake 登记、signal 验签和 snapshot 验签三条真实运行时链路里。**
