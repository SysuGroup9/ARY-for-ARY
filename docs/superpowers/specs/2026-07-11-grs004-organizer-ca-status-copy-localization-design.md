# GRS004 / Organizer CA Status Copy Localization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.ia.md`
  - `Organizer View` 需要承载赛事执行信息，而不是混杂未收口的内部英文标签
  - `CA Ingestion Status` 应面向主办方表达 RaceProject 聚合接入状态、CAConnection 状态和异常摘要
- `docs/grs004/registration-ca-rules-alignment.taskbook.md`
  - Organizer 在评审前需要看到风险提示，但这些提示应是正式产品文案，而不是临时英文调试词

当前代码现状：

- `src/app/_components/console/organizer-console-page.tsx` 的 `ca-status` 区已经具备完整主链路
- 但仍残留一组英文用户可见标签：
  - `Trust / Risk Summary`
  - `Status Badge`
  - `Connector Security Controls`
  - `Connector Audit Overview`
  - `Secret Version`
  - `Disable Connector`

这和前面已经完成的 `ReviewReadinessCard` 中文化、phase 中文化不一致，导致 Organizer 在 `CA 状态` 区仍然像在看半成品后台。

## 范围

### 本轮纳入

- 只收口 `src/app/_components/console/organizer-console-page.tsx` 的 `ca-status` 用户可见文案
- 同步更新 `src/app/_components/console/organizer-console-page.test.tsx`
- 回归验证与该区域直接相关的现有 focused tests

### 本轮不纳入

- 不修改权限逻辑
- 不修改 `buildTrustRiskSummary()` 的风险判定规则
- 不修改 `ConnectorAuditOverview` 的数据来源
- 不扩展到 Rider Console 的 CA 区块

## 落地规则

### 信任 / 风险摘要卡

- `Trust / Risk Summary` -> `可信 / 风险摘要`
- `Status Badge` -> `状态`
- `CA Ingestion` -> `CA 接入`
- `Evidence Integrity` -> `证据完整性`
- `Latest Session Risk` -> `最近会话风险`
- `Risk Reason` -> `风险原因`
- `Connector Readiness` -> `连接器就绪度`
- `Review Needed Evidence` -> `需复核证据数`
- `Medium Confidence Evidence` -> `中可信度证据数`
- `Review Reason` -> `复核原因`

### 值映射

- `failed` -> `接入失败`
- `review_needed` -> `需要复核`
- `trusted` -> `可信`
- `ACTIVE` -> `活跃中`
- `CONNECTED` -> `已连接`
- `FAILED` -> `接入失败`
- `NOT_CONFIGURED` -> `未接入`
- `medium_confidence` -> `中可信度`
- `none / low / medium / high` -> `无 / 低 / 中 / 高`

### 风险原因映射

- `signature_invalid` -> `签名无效`
- `disabled_connector` -> `连接器已禁用`
- `handshake_pending` -> `待完成握手`
- `source_event_review_needed` -> `源事件需复核`
- 未收口的技术原因保留原值，避免在本轮发明新的领域术语

### 连接器控制卡

- `Connector Security Controls` -> `连接器安全控制`
- `Connector ID` -> `连接器 ID`
- `CA Type` -> `CA 类型`
- `Ingestion Status` -> `接入状态`
- `Secret Version` -> `密钥版本`
- `Secret Rotated At` -> `最近轮换时间`
- `Handshake State` -> `握手状态`
- `Disabled` -> `是否禁用`
- `Disabled At` -> `禁用时间`
- `Disabled Reason` -> `禁用原因`
- `Sessions` -> `会话数`
- `Disable Connector` -> `禁用连接器`
- `Enable Connector` -> `启用连接器`
- `completed / needs re-handshake / yes / no / active / not yet`
  - 分别收口为 `已完成 / 需重新握手 / 是 / 否 / 正常 / 尚未发生`

### 审计摘要卡

- `Connector Audit Overview` -> `连接器审计摘要`
- `Recent Audit Events` -> `最近审计事件数`
- `Rejected Events` -> `拒绝事件数`
- `Review Events` -> `需复核事件数`
- `Audit Event` -> `审计事件`
- `Audit Reason` -> `审计原因`
- `Audit Connector` -> `审计连接器`
- `No connector audit events yet.` -> `暂无连接器审计事件。`

### 审计结果值映射

- `accepted` -> `已接受`
- `rejected` -> `已拒绝`
- `review_needed` -> `需要复核`
- `integrity_gap` -> `完整性缺口`
- `action` 代码本轮保留原值，作为主办方可读的技术审计线索

## 测试对齐

- 更新：
  - `src/app/_components/console/organizer-console-page.test.tsx`
- 回归：
  - `src/app/_components/console/judge-console-page.test.tsx`
  - `src/app/_components/console/review-readiness-card.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/review-readiness-card.test.tsx
npm run build
```

## 一句话结论

这一轮不改主办方 CA 状态区的数据结构，只把已经存在的聚合状态、风险摘要、连接器控制和审计摘要收口成正式中文产品表达。
