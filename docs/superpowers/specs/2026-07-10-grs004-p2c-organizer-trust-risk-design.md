# GRS004 / P2-C Organizer Console Trust / Risk 展示 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§6 P2：增强 connector 认证`
    - `4. 支持 disabled / revoked connector 的审计与可视化`
    - `5. 在 Organizer Console 中显示接入可信度和风险提示`
- `docs/superpowers/specs/2026-07-10-grs004-p2a-connector-signature-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`

`P2-A` 已补 connector credential fingerprint 与 signed signal / snapshot，`P2-B` 已补 connector secret rotation 与 disabled / enable 可视化。当前 `P2` 剩余缺口不是新的认证机制，而是：**Organizer 在 `ca-status` 中虽然能看到 connector 配置和操作入口，但还看不到“这条接入当前是否可信、风险来自哪里、是否需要人工复核”的摘要层。**

本轮目标是：**只用现有真实字段，在 Organizer Console 中补出最小 trust / risk 摘要。**

## 范围

### 本轮纳入

- 仅收口 `Organizer Console / ca-status`
- 仅使用当前已存在的数据来源：
  - `Registration.raceProject.aggregateIngestionStatus`
  - `CAConnection.disabledAt / disabledReason / handshakeCompletedAt / ingestionStatus`
  - `Session.riskLevel / riskReason`
  - `Evidence.integrityStatus / confidenceLevel / reviewFlagJson`
  - 现有 `ProjectionType.RISK` 作为汇总计数来源
- 在每个 registration 的 CA 状态卡片中新增只读 `Trust / Risk Summary`
- 新增最小状态标签与原因列表，让 organizer 看到：
  - 接入是否失败
  - 是否存在需人工复核的 Evidence
  - 最近 session 是否报告 medium/high 风险
  - 当前 connector 是否处于 disabled 或待重新 handshake 状态

### 本轮不纳入

- 不新增新的认证策略
- 不扩 `RISK` projection payload 结构
- 不新增单独的 connector 审计总览页
- 不新增 `revokedAt`
- 不引入新的 trust score、风险打分模型或持久化汇总表

## 约束

### 当前代码现实

- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 已能展示：
    - registration 级 `aggregateIngestionStatus`
    - connection 级 `secretVersion / disabledReason / handshake state`
  - 但还没有 trust / risk 摘要层
- `src/lib/services/races.ts`
  - organizer 页面当前已经能拿到：
    - `registration.evidences`
    - `registration.raceProject.caConnections.sessions`
    - `race.projections`
- `src/lib/services/projections.ts`
  - 现有 `ProjectionType.RISK` payload 只有：
    - `registrationId`
    - `aggregateIngestionStatus`
  - 当前不携带 `integrityStatus / confidenceLevel / riskReason`
- `prisma/schema.prisma`
  - `Session` 已有 `riskLevel / riskReason`
  - `Evidence` 已有 `integrityStatus / confidenceLevel / reviewFlagJson`

因此本轮应遵循：**UI 直接消费现有 read model 与当前页面已经拿到的 registration/session/evidence 数据，不先扩 projection 结构。**

## 方案选择

### 方案 A：只在 `ca-status` 聚合现有字段并直接展示

做法：
- 在 organizer console 内部做最小聚合
- trust / risk 摘要只在当前页面生成
- `RISK` projection 保持原样

优点：
- 最贴近 `docs/grs004` 当前这一步的文字要求
- 改动最小
- 不会把切片扩大到投影模型重构

缺点：
- 相同聚合逻辑如果未来别的页面也要用，后续还要再抽 helper

### 方案 B：先扩 `RISK` projection，再由 UI 读取

优点：
- 后续多页面复用更直接

缺点：
- 会把本轮扩大到投影 schema 设计
- 超出“尽量减少自己的想法”和“先走最小切片”的要求

### 推荐方案

采用 **方案 A：只在 `ca-status` 聚合现有字段并直接展示**。

原因：

- `docs/grs004/防伪与防篡改计划.md` 这里要求的是 Organizer Console 中的“显示”
- 现有字段已经足够表达最小 trust / risk 语义
- 当前没有文档要求本轮必须扩 projection payload

## trust / risk 语义

### 1. Summary Badge

每个 registration 的 trust / risk 摘要只输出三种顶层状态：

- `failed`
  - 条件：`aggregateIngestionStatus === FAILED`
- `review_needed`
  - 条件：不满足 `failed`，但出现以下任一项：
    - 任一 internal evidence 的 `integrityStatus !== OK`
    - 最近 session 的 `riskLevel` 为 `medium` 或 `high`
    - 任一 connection 处于 `disabledAt != null`
    - 任一 connection 的 `handshakeCompletedAt == null`
- `trusted`
  - 条件：以上都不满足

这里不额外发明新的 trust score；只做**现有字段的规则映射**。

### 2. Detail Rows

摘要面板中应至少展示四组只读细节：

- `CA Ingestion`
  - 来源：`aggregateIngestionStatus`
- `Evidence Integrity`
  - 来源：当前 registration 下 `visibility=INTERNAL` 的 evidences
  - 展示：
    - 是否存在 `integrityStatus = REVIEW_NEEDED`
    - 是否存在 `confidenceLevel = MEDIUM`
    - `reviewFlagJson` 中的原因摘要
- `Latest Session Risk`
  - 来源：所有 connection 的 sessions 中最近一条 session
  - 展示：
    - `riskLevel`
    - `riskReason`
- `Connector Readiness`
  - 来源：connections
  - 展示：
    - disabled 数量
    - 待重新 handshake 数量

### 3. 与 P2-B 的边界

`P2-B` 已经负责：

- connector secret rotation
- disable / enable 操作
- connector 级安全状态可视化

`P2-C` 不重复这些操作入口，只在它们上面补一层 **Organizer 可快速判读的 trust / risk 摘要**。

## UI 收口

### Organizer Console / `ca-status`

在每个 registration 的 `public-link-card` 中新增一个 `Trust / Risk Summary` 子区块。

建议最小内容：

- 顶层 badge
  - `trusted`
  - `review_needed`
  - `failed`
- 一组摘要行：
  - `CA Ingestion`
  - `Evidence Integrity`
  - `Latest Session Risk`
  - `Connector Readiness`
- 若存在 review flags 或 risk reason，显示原因列表

本轮只做 organizer 内部管理视图，不同步到 public site / jumbotron / screen console。

## 测试对齐

本轮需要新增或扩展：

- `src/app/_components/console/organizer-console-page.test.tsx`
  - 覆盖：
    - `failed` badge
    - `review_needed` badge
    - `trusted` badge
    - evidence integrity 原因展示
    - latest session risk 展示
    - disabled / pending handshake 会进入 `review_needed`

本轮不要求新增 projection service 测试，因为 projection payload 结构不变。

## 验收对齐

本轮完成后，需要能证明：

1. organizer 在 `ca-status` 中能看到 registration 级 trust / risk 摘要
2. 摘要只基于当前真实字段生成，不依赖新表或新 projection payload
3. `FAILED ingestion` 会映射为 `failed`
4. `Evidence.integrityStatus != OK` 或 `Session.riskLevel in {medium, high}` 会映射为 `review_needed`
5. `disabled` 或 `handshakeCompletedAt == null` 的 connection 会进入 readiness 风险提示
6. 本轮不声称已经实现新的认证策略、投影模型扩容或审计总览页

## Implementation Notes

- 本轮故意不改 `ProjectionType.RISK` 结构，避免把“展示切片”升级成“读模型重构”
- trust / risk 规则必须写死在当前 organizer 页面或其最小 helper 中，不做新的持久化状态
- 若后续多个页面都需要相同摘要，再在下一轮把聚合逻辑抽成 helper

## 一句话结论

`P2-C` 的目标是：**不再新增认证机制，而是在 Organizer Console 中把现有 `aggregateIngestionStatus + Evidence integrity + Session risk + connector readiness` 汇总成一个可直接判读的 trust / risk 摘要层。**

## 已落地实现补记（2026-07-10）

- `src/app/_components/console/organizer-console-page.tsx`
  - 已新增本地 trust / risk 聚合 helper
  - `ca-status` 现在会为每个 registration 渲染 `Trust / Risk Summary`
  - 顶层状态已落地为：
    - `failed`
    - `review_needed`
    - `trusted`
  - 细节已落地为：
    - `CA Ingestion`
    - `Evidence Integrity`
    - `Latest Session Risk`
    - `Connector Readiness`
  - review flags / risk reason / readiness 原因会以只读原因行展示
- `src/app/_components/console/organizer-console-page.test.tsx`
  - 已新增 `P2-C` focused UI 覆盖
  - 已覆盖：
    - `failed`
    - `review_needed`
    - `trusted`
    - evidence review flag 展示
    - latest session risk 展示
    - disabled / pending handshake 导致 `review_needed`

### 本轮明确没有做的事

- 没有扩 `ProjectionType.RISK` payload
- 没有新增新的认证策略
- 没有新增 connector 审计总览页
- 没有改 public site / jumbotron / rider console

### 新鲜验证证据

- `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`
- `npm run build`
