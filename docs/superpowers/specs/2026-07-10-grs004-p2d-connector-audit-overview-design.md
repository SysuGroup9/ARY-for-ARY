# GRS004 / P2-D Connector Audit Overview 可视化 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§6 P2：增强 connector 认证`
    - `4. 支持 disabled / revoked connector 的审计与可视化`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`

`P1-C` 已经把 `CA registration / handshake / signal / snapshot` 统一写入 `SecurityAudit`，`P2-B` 已经补上 `secret rotation` 与 `disable / enable`，`P2-C` 已经让 organizer 能看到 registration 级 `Trust / Risk Summary`。当前剩余缺口不是新的认证机制，而是：

*Organizer 仍然看不到 connector 安全事件本身。系统已经记录了 `SecurityAudit`，但 `ca-status` 页面还没有任何审计总览或最近事件可视化。*

本轮目标是：**只复用现有 `SecurityAudit`，在 Organizer Console / `ca-status` 中补一个最小可读的 connector 审计总览层。**

## 范围

### 本轮纳入

- 只收口 `Organizer Console / ca-status`
- 只消费现有 `SecurityAudit` 事实，不新增新表、不修改认证规则
- 在 race 读取链路中补充最近的 `SecurityAudit`
- 在每个 registration 的 `ca-status` 卡片中新增只读 `Connector Audit Overview`
- 展示内容限制为：
  - 当前 registration 相关的 recent connector audit entries
  - 最近事件总数
  - `accepted / rejected / stale / review_needed / integrity_gap / deduped` 等结果摘要
  - 最近事件列表中的：
    - `createdAt`
    - `action`
    - `result`
    - `reason`
    - `connectorId`（若可得）

### 本轮不纳入

- 不新增独立 `SecurityAudit` 页面
- 不新增 organizer 级全局筛选器、搜索器、分页器
- 不扩 `ProjectionType.RISK`
- 不新增新的认证策略、信任评分或处罚策略
- 不扩展到 public site / jumbotron / rider console
- 不补 `revokedAt`

## 约束

### 当前代码现实

- `src/lib/services/races.ts`
  - 当前 organizer 页面读取 `registrations / evidences / raceProject.caConnections.sessions / projections`
  - 还没有把 `SecurityAudit` 读到页面
- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 已经有：
    - registration 级 `Trust / Risk Summary`
    - connector 级 `Security Controls`
  - 但没有任何审计事件展示
- `prisma/schema.prisma`
  - `SecurityAudit` 已有：
    - `raceId / raceProjectId / registrationId / userId / caConnectionId`
    - `action / result / reason / detailsJson / createdAt`
- `src/lib/services/ca-connections.ts`
  - 已写入：
    - `ca_connection.register`
    - `ca_connection.secret_rotated`
    - `ca_connection.disabled`
    - `ca_connection.enabled`
- `src/lib/services/ca-fetch.ts`
  - 已写入：
    - `ca_connection.handshake`
    - `ca_snapshot.fetch`
- `src/lib/services/ca-ingestion.ts`
  - 已写入：
    - `ca_signal.ingest`

因此本轮应遵循：**只把现有 `SecurityAudit` 拉到 organizer 读模型里并可视化，不重构服务层审计写入逻辑。**

## 方案选择

### 方案 A：在 `ca-status` 中做 registration 级最小审计总览

做法：

- `listRaces()` 追加读取 race 相关 `SecurityAudit`
- organizer `ca-status` 按 `registrationId / caConnectionId` 过滤相关审计
- 在每个 registration 卡片里显示最近事件摘要和列表

优点：

- 改动最小
- 直接满足“connector 审计与可视化”
- 与 `P2-B / P2-C` 已有页面结构一致
- 不引入新页面和新路由

缺点：

- 如果未来需要更强审计视图，后续仍要抽独立页面

### 方案 B：新建独立 organizer 审计页面

优点：

- 更适合后续做筛选与检索

缺点：

- 超出当前最小切片
- 会引入新路由、新导航、新范围

### 推荐方案

采用 **方案 A：在 `ca-status` 中做 registration 级最小审计总览**。

原因：

- `docs/grs004` 当前要求的是 connector 审计与可视化，不要求新页面
- 用户要求尽量减少额外想法，因此应先把最小展示层接上
- 当前 `ca-status` 已经是 organizer 观察 connector 风险与状态的主页面

## UI 收口

### Organizer Console / `ca-status`

在每个 registration 的 CA 卡片中新增 `Connector Audit Overview` 子区块。

建议最小内容：

- 摘要行：
  - `Recent Audit Events`
  - `Rejected Events`
  - `Review Events`
- 最近事件列表：
  - `timestamp`
  - `action`
  - `result`
  - `reason`
  - `connectorId`

展示规则：

- 只显示当前 registration 关联的审计事件
- 优先按 `createdAt desc`
- 不显示原始 `detailsJson`
- 若没有事件，则显示 `No connector audit events yet.`

### 结果语义

- `Rejected Events`
  - `result === rejected`
- `Review Events`
  - `result === review_needed || result === integrity_gap`
- `Recent Audit Events`
  - 当前 registration 可见的最近事件总数

## 数据读取策略

### 1. Race 读取层

在 `listRaces()` 中：

- 先取 race 基础数据
- 再按 `race.id[]` 查询 `SecurityAudit`
- 按 `raceId` 分组后挂回 race read model

### 2. Registration 过滤层

在 organizer `ca-status` 中：

- 通过 `registration.id`
- 与 `registration.raceProject.caConnections[].id`

过滤当前 registration 相关审计事件。

## 测试对齐

需要新增或扩展：

- `src/app/_components/console/organizer-console-page.test.tsx`

覆盖：

- `Connector Audit Overview` 标题存在
- 只显示当前 registration 相关事件，不泄漏其他 registration 审计
- 显示 `Recent Audit Events / Rejected Events / Review Events`
- 显示 `action / result / reason / connectorId`
- 无事件时显示空状态文案

本轮不要求新增服务级 mutation 测试，因为审计写入本身已在前序切片验证过；本轮聚焦的是读模型和 UI 展示。

## 验收对齐

本轮完成后，需要能证明：

1. organizer 在 `ca-status` 中能看到当前 registration 的 connector 审计总览
2. 展示直接来自现有 `SecurityAudit`，而不是新 projection 或新表
3. `disabled / enabled / secret_rotated / handshake / signal / snapshot` 等现有事件可以被可视化
4. 页面不会显示其他 registration 的审计事件
5. 本轮没有新增新的认证策略、审计页面或 projection 扩展

## Implementation Notes

- 本轮故意不新建独立审计页面
- 审计列表先限制在 organizer 的 `ca-status`
- 若后续多个页面都需要同一份聚合逻辑，再在下一轮抽 helper

## 一句话结论

`P2-D` 的目标是：*不新增认证机制，只把已经存在的 `SecurityAudit` 接到 Organizer Console / `ca-status`，让 organizer 能直接看到每个 registration 的 connector 审计总览与最近安全事件。*

## 已落地实现补记（2026-07-10）

- `src/lib/services/races.ts`
  - 已在 `listRaces()` 中追加读取 race 相关 `SecurityAudit`
  - 已按 `raceId` 分组并挂回当前 race read model
- `src/app/_components/console/organizer-console-page.tsx`
  - 已新增本地 audit 过滤与摘要 helper
  - `ca-status` 现在会为每个 registration 渲染 `Connector Audit Overview`
  - 当前已展示：
    - `Recent Audit Events`
    - `Rejected Events`
    - `Review Events`
    - recent audit event rows
    - `Audit Reason`
    - `Audit Connector`
- `src/app/_components/console/organizer-console-page.test.tsx`
  - 已新增 `P2-D` focused UI 覆盖
  - 已覆盖：
    - 当前 registration 审计摘要
    - 无关 registration 审计隔离
    - 空状态文案
    - `action / result / reason / connectorId`

### 本轮明确没有做的事

- 没有新增独立 organizer 审计页面
- 没有新增筛选、搜索或分页
- 没有修改 `SecurityAudit` 写入链路
- 没有扩 `ProjectionType.RISK`
- 没有新增新的认证策略或处罚策略

### 新鲜验证证据

- `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`
- `npm run build`
