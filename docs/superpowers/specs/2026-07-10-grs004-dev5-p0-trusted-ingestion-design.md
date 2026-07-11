# GRS004 / DEV-5 / P0 可信链缺口 Design

## 目的

本设计对应 `docs/grs004/防伪与防篡改计划.md` 中：

- `§5 当前主要缺口`
- `§6 GRS004 推荐实现路线`
- `§8 验收标准`

目标不是一次性完成 GRS004 全部安全能力，而是先把当前已经存在的 CA 接入主链路：

`Registration -> RaceProject -> CAConnection -> Session -> Evidence -> Projection`

从“只有基础去重与重建”推进到“具备最小完整性判断与风险标记”的状态。

本 slice 严格对应 `P0：先补可信链缺口`，不混入 `P1 材料完整性` 或 `P2 connector 认证增强`。

## 范围

### 本轮纳入

- 为 `CAIngestionEvent` 增加完整性相关字段：
  - `payloadDigest`
  - `sequence`
  - `receivedAt`
  - `integrityStatus`
- 为 `Evidence` 增加可信度 / 完整性相关字段：
  - `integrityStatus`
  - `confidenceLevel`
  - `sourceDigest`
  - `generatedFromEventIdsJson`
  - `reviewFlagJson`
- 对重复 `idempotencyKey` 且 `payloadDigest` 不一致的情况形成 `integrity risk`
- 对 signal timestamp 增加合理时间窗检查，但只形成风险，不默认判罚
- 把 `RidingSignalMessage` 的解析收口到 `docs/grs004/ary-ca-integration-spec.md` 已定义的最小契约，至少补上：
  - `schemaVersion`
  - `sequence`
- 保持 Evidence / Projection 仍由现有 rebuild 链路生成，但让 Evidence 具备最小可信度表达

### 本轮不纳入

- `Work / 题目 / 外部材料 / 代码` 的 hash 元数据
- 消息级签名、公钥注册、credential fingerprint
- 独立 `SecurityAudit / IntegrityEvent` 模型
- 自动 DQ、自动处罚、自动阻断比赛结果
- Projection 局部重建或 `sourceVersion / inputDigest`

## 来源约束

设计必须同时满足以下源文档与当前代码事实：

- `docs/grs004/防伪与防篡改计划.md`
- `docs/grs004/ary-ca-integration-spec.md`
- `docs/grs004/ary-mvp.prd.md`
- `prisma/schema.prisma`
- `src/lib/services/ca-ingestion.ts`
- `src/lib/services/ca-fetch.ts`
- `src/lib/services/evidence.ts`
- `src/lib/services/projections.ts`

最高优先级约束：

1. 风险默认进入 `Review Flag / Readiness`，不自动 DQ。
2. `connectorSecret`、scope、handshake、disabled 仍然是 CA 可信边界的第一层守卫。
3. `idempotencyKey` 去重继续保留，但需要补上 payload 层面的冲突检测。
4. `Evidence` 必须开始表达“来源、可信度、是否存在缺口”，而不再只是纯摘要。
5. Projection 当前仍允许全量 rebuild；这在 GRS004 P0 中不是缺陷，而是明确保留的 fallback。

## 当前实现基线

### 已经具备

- `CAConnection` 已有：
  - `connectorSecret`
  - `disabledAt`
  - `handshakeCompletedAt`
  - scope 归属关系
- `src/lib/services/ca-ingestion.ts` 已有：
  - secret 校验
  - handshake / disabled 校验
  - scope 校验
  - `idempotencyKey` 唯一去重
  - `Session` upsert
  - `CAConnection` / `RaceProject` ingestion 状态更新
  - 成功后触发 `Evidence` / `Projection` 重建
- `src/lib/services/ca-fetch.ts` 已有：
  - snapshot fetch
  - snapshot payload scope 校验
  - `snapshotFetchedAt` stale 判断
  - fetch 事件入库
  - 成功后触发 `Evidence` / `Projection` 重建
- `src/lib/services/evidence.ts` 已有：
  - 从 `Session` 重建 `SESSION_SUMMARY` Evidence
- `src/lib/services/projections.ts` 已有：
  - race 级全量 rebuild

### 当前缺口

- `CAIngestionEvent` 没有：
  - `payloadDigest`
  - `sequence`
  - `receivedAt`
  - `integrityStatus`
- `RidingSignalMessage` 解析未完全对齐文档契约：
  - 当前未解析 `schemaVersion`
  - 当前未解析 `sequence`
- 重复 `idempotencyKey` 只会直接 dedupe：
  - 不比较 payload 是否一致
  - 不形成 `integrity risk`
- `Evidence` 没有：
  - `integrityStatus`
  - `confidenceLevel`
  - `sourceDigest`
  - `generatedFromEventIds`
  - `reviewFlagJson`

## 方案比较

### 方案 A：严格 P0，先补可信链缺口

做法：

- 只补 `CAIngestionEvent` 与 `Evidence` 的完整性字段
- 只补 payload 冲突检测与时间窗风险
- 不动材料 hash、签名、独立审计模型

优点：

- 与 `docs/grs004/防伪与防篡改计划.md` 的 `P0 -> P1 -> P2` 顺序完全一致
- 风险收口直接对应当前代码缺口
- 不会把 `DEV-4 / DEV-7` 的材料完整性工作提前混进来

缺点：

- 无法在这一轮解决材料 hash、签名、公钥注册、审计全局模型

### 方案 B：P0 + P1 混做

做法：

- 本轮同时做可信链缺口和材料完整性

优点：

- 一次性补更多安全字段

缺点：

- 范围跨到 `Work / Report / Award`
- 不符合 `grs004` 文档已经写明的推荐顺序
- 会让当前第一子项目失焦

### 方案 C：只补 schema 字段，不补运行规则

做法：

- 只加字段，不做 digest 冲突检测与风险形成

优点：

- 代码改动小

缺点：

- 与 `§8 验收标准` 不一致
- 会产生“字段存在但能力不存在”的假完成

### 推荐方案

采用 **方案 A：严格 P0**。

原因只有一个：它最贴近 `grs004` 已经写明的实现路线，能在不扩大范围的前提下，把当前主链路的可信度表达补齐。

## 设计

### 1. CAIngestionEvent 扩展为“事件事实 + 完整性判断”

`CAIngestionEvent` 在保留现有事实字段的基础上，增加：

- `payloadDigest`
  - 对 canonical JSON 或稳定序列化后的 payload 计算 digest
  - 作为 payload 层冲突检测的依据
- `sequence`
  - 从 `RidingSignalMessage.sequence` 读取
  - 对 snapshot fetch 事件保持可空
- `receivedAt`
  - 记录 ARY 实际收到该事件的时间
  - 与 `observedAt` 区分
- `integrityStatus`
  - 表达该事件在完整性层面的最小判断结果

本轮 `integrityStatus` 只需要覆盖当前 P0 所需最小集合：

- `ok`
- `review_needed`
- `integrity_gap`

说明：

- `ok`：当前未发现完整性风险
- `review_needed`：时间窗或其他不应阻断比赛、但需要人工注意的风险
- `integrity_gap`：同一 `idempotencyKey` 的 payload 不一致

本轮不引入更细分的审计结果层级，避免越过 P0。

### 2. RidingSignalMessage 解析对齐 grs004 契约

`docs/grs004/ary-ca-integration-spec.md` 已把以下字段写入 `RidingSignalMessage`：

- `schemaVersion`：必填
- `idempotencyKey`：必填
- `sequence`：建议
- `timestamp`：必填

因此当前 ingestion schema 需要补上：

- `schemaVersion: string`
- `sequence: number | undefined`

本轮不要求把 `schemaVersion` 做复杂版本协商，只要求：

- 解析并保存到原始 payload 中
- 在后续 digest 计算中纳入输入
- 对明显不符合当前版本预期的输入保留 review 风险扩展点

### 3. payload 冲突检测

当前 `idempotencyKey` 已唯一。本轮在此基础上补两层规则：

#### 情况 A：`idempotencyKey` 不存在

- 正常入库事件
- 正常推进 `Session`
- 正常触发 `Evidence` / `Projection` 重建

#### 情况 B：`idempotencyKey` 已存在，且 `payloadDigest` 相同

- 认定为正常重复投递
- 返回 deduped
- 不重复推进 `Session` / `Evidence` / `Projection`

#### 情况 C：`idempotencyKey` 已存在，但 `payloadDigest` 不同

- 不重复推进业务状态
- 形成 `integrity risk`
- 把当前冲突记录为 `integrity_gap`
- 返回“已接收但需 review”的风险状态

这一规则直接对应 `防伪与防篡改计划.md` 中：

- “对重复 `idempotencyKey` 但 payload digest 不一致的情况标记为 `integrity_gap`”

### 4. signal 时间窗检查

本轮引入最小时间窗检查：

- 比较 `receivedAt` 与 `observedAt`
- 若偏差超出合理窗口，则标记为 `review_needed`

这里的核心要求不是拦截，而是：

- 风险进入 review 语义
- 不自动判罚
- 不直接撤销参赛资格

这直接对应 `P0` 里的：

- “对 signal timestamp 增加合理时间窗检查，但只形成风险，不默认判罚”

### 5. Evidence 扩展为“摘要 + 可信度元数据”

`Evidence` 本轮增加：

- `integrityStatus`
- `confidenceLevel`
- `sourceDigest`
- `generatedFromEventIdsJson`
- `reviewFlagJson`

本轮不新增独立 `EvidenceIntegrity` 表，原因是：

- `grs004` 明确允许“在 Evidence 中增加可信度 / 完整性状态字段，或建立独立 `EvidenceIntegrity`”
- 当前仓库已经普遍采用“主实体 + JSON 字符串字段”的轻量建模方式
- P0 的目标是先让 Evidence 能表达可信度，而不是立即拆成更多聚合

### 6. Session Summary Evidence 的生成规则

`SESSION_SUMMARY` Evidence 仍由 `Session` 重建，但重建时必须把相关 ingestion 事件纳入来源判断。

最小生成规则：

- `generatedFromEventIdsJson`
  - 保存参与该 Session Summary 构建的 ingestion event id 列表
- `sourceDigest`
  - 保存此次 Evidence 来源集合的聚合 digest
- `integrityStatus`
  - 若关联事件中出现 `integrity_gap`，则 Evidence 为 `review_needed`
  - 若仅有时间窗风险，也为 `review_needed`
  - 全部正常时为 `ok`
- `confidenceLevel`
  - 全部正常：`high`
  - 有风险但未破坏主链路：`medium`
- `reviewFlagJson`
  - 记录面向 Organizer / Judge 的最小 review 提示

本轮不要求对外公开完整事件细节，只要求让 Organizer / Judge 能看到“该摘要是否存在可信度缺口”。

### 7. Projection 保持现状，不在本轮做局部更新

`防伪与防篡改计划.md` 已明确：

- 当前 CA signal / snapshot fetch 后会重建全赛事 Evidence 和 Projection
- GRS004 后续建议才是“增加局部更新能力”

因此本轮明确保持：

- `src/lib/services/projections.ts` 继续 race 级全量 rebuild

并明确不做：

- `sourceVersion`
- `inputDigest`
- partial rebuild orchestration

这不是遗漏，而是 P0 范围控制。

### 8. Review 语义

本轮新增的所有风险都必须导向 review，而不是自动处罚。

最小原则：

- 风险存在 -> 降低 Evidence 可信度
- 风险存在 -> 进入 `reviewFlagJson`
- 风险存在 -> 保留给 Organizer / Judge 做人工判断
- 风险不直接改写 `Registration`、`RaceProject`、`Award`、`Report` 结论

## 数据流

### Riding signal

`RidingSignalMessage`
-> scope / secret / handshake / disabled 校验
-> 解析 `schemaVersion / sequence / timestamp`
-> 计算 `payloadDigest`
-> 读取 `idempotencyKey`
-> 形成 `CAIngestionEvent`
-> 更新 `Session`
-> rebuild `Evidence`
-> rebuild `Projection`
-> Organizer / Judge 在 review 上下文看到风险提示

### Snapshot fetch

snapshot fetch
-> scope / secret / disabled / handshake 校验
-> stale snapshot 判断
-> 计算 `payloadDigest`
-> 入库 `CAIngestionEvent`
-> upsert `Session`
-> rebuild `Evidence`
-> rebuild `Projection`

## 验收对齐

本 slice 的完成口径与 `docs/grs004/防伪与防篡改计划.md` 对齐为：

1. `connectorSecret` 错误时 handshake / signal / snapshot fetch 仍被拒绝
2. 未握手、disabled、scope mismatch 的 signal 仍被拒绝
3. 重复 `idempotencyKey` 不重复写入业务效果
4. 重复 `idempotencyKey` 且 payload 不一致时能形成 `integrity risk`
5. stale snapshot 仍不覆盖较新的 Session
6. Evidence 能追溯到 `CAConnection / Session / ingestion events`
7. 风险默认进入 review，而不自动 DQ

## 不做的声明

为避免误述，本设计明确声明以下内容 **不是本轮交付目标**：

- 不宣称消息级签名已完成
- 不宣称 connector 公钥体系已完成
- 不宣称题目、作品、代码材料 hash 已完成
- 不宣称独立安全审计模型已完成
- 不宣称风险会自动转成判罚结果

## 文档同步要求

本 slice 后续落地时，至少同步以下文档：

- `docs/superpowers/status.md`
  - 更新当前真实能力、缺口关闭情况、下一步入口
- `docs/superpowers/plans/...`
  - 写出实现计划，明确测试、字段迁移、回写逻辑与验证命令

## Implementation Notes

- `CAIngestionEvent` 本轮没有新增独立 `caSessionId` 字段；`SESSION_SUMMARY` Evidence 仍通过解析 `payloadJson.ca.caSessionId` 与 `Session` 关联。
- `integrity_gap` 的冲突记录不会重复推进 `Session -> Evidence -> Projection` 业务状态，只额外写入风险事件并返回风险结果。
- signal 时间窗风险只会把 ingestion event 标成 `REVIEW_NEEDED`，并在后续 Evidence 中降级为 `review` 语义；它不会自动改写比赛结果。
- Projection 仍保持 race 级全量 rebuild，本轮没有引入 `sourceVersion / inputDigest / 局部重建`。
- 为恢复整轮验证，本轮还顺手修复了一组既有 Console 类型问题，使 `npm run build` 能在当前仓库状态下通过。

## 一句话结论

本设计把 GRS004 的第一子项目严格收敛为：

**在不引入签名、材料 hash、独立审计模型的前提下，为现有 `CAConnection -> Session -> Evidence -> Projection` 主链路补上最小完整性判断、payload 冲突检测和 review 风险语义。**
