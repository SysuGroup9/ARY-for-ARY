# GRS004 / Rider CA Setup Copy Localization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.prd.md`
  - `Rider View` 需要支持报名后查看状态、配置 CA 接入和提交成果
- `docs/grs004/ary-mvp.ia.md`
  - `Rider View` 应像个人参赛 cockpit，而不是夹杂临时英文后台词
  - `CA Ingestion Status`、CAConnection 状态和接入健康度应以 Rider 可理解的正式产品文案表达
- `docs/grs004/registration-ca-rules-alignment.taskbook.md`
  - Rider View 已从资格硬门禁收口为证据完整度和接入状态表达，文案应与这一方向一致

当前代码现状：

- `src/app/_components/console/rider-console-page.tsx` 的 `ca-setup` 区主链路已经可用
- 但用户可见层仍残留多组英文：
  - `Rider View`
  - `Connector ID`
  - `Secret Version`
  - `Handshake State`
  - `Rotate Connector Secret`
  - `CA Session ID`

这和前面已经完成的 phase 中文化、风险提示中文化、Organizer CA 状态中文化不一致。

## 范围

### 本轮纳入

- 只收口 `src/app/_components/console/rider-console-page.tsx` 的 Rider 视图和 `ca-setup` 用户可见文案
- 同步更新 `src/app/_components/console/rider-console-page.test.tsx`
- 回归 `ReviewReadinessCard` 相关 focused tests

### 本轮不纳入

- 不修改 Rider 权限逻辑
- 不修改 CAConnection 创建、轮换或 snapshot 抓取服务逻辑
- 不修改是否展示连接器密钥这一现有行为
- 不扩展到 Public Site 或 Judge / Organizer 视图

## 落地规则

### Rider 视图眉标

- `Rider View` -> `骑手视图`

### Rider 报名状态区

- `registration.status` 统一映射为：
  - `APPROVED` -> `已通过`
  - `SUBMITTED` -> `待审核`
  - `REJECTED` -> `已拒绝`
  - `WITHDRAWN` -> `已撤回`
- `RaceProject.aggregateIngestionStatus` 统一映射为：
  - `ACTIVE` -> `活跃中`
  - `CONNECTED` -> `已连接`
  - `FAILED` -> `接入失败`
  - `NOT_CONFIGURED` -> `未接入`

### Rider CA 接入表单

- `Connector ID` -> `连接器 ID`
- `Connector Base URL` -> `连接器 Base URL`
- `Connector Version` -> `连接器版本`
- `CA Project ID` -> `CA 项目 ID`

### Rider CA 连接卡

- `Connector` -> `连接器`
- `Connector Secret` -> `连接器密钥`
- `Project` -> `项目 ID`
- `Secret Version` -> `密钥版本`
- `Secret Rotated At` -> `最近轮换时间`
- `Disabled` -> `是否禁用`
- `Disabled At` -> `禁用时间`
- `Disabled Reason` -> `禁用原因`
- `Handshake State` -> `握手状态`
- `Sessions` -> `会话数`
- `Rotate Connector Secret` -> `轮换连接器密钥`
- `CA Session ID` -> `CA 会话 ID`

### 值映射

- `completed / needs re-handshake` -> `已完成 / 需重新握手`
- `yes / no / active / not yet` -> `是 / 否 / 正常 / 尚未发生`
- `connection.ingestionStatus` 复用聚合接入状态映射

### 说明文案

- `connector / session / snapshot` 等提示语句收口为中文产品表达
- `handshake API` 作为技术接口名保留

## 测试对齐

- 更新：
  - `src/app/_components/console/rider-console-page.test.tsx`
- 回归：
  - `src/app/_components/console/review-readiness-card.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/review-readiness-card.test.tsx
npm run build
```

## 一句话结论

这一轮不改 Rider 的 CA 接入能力，只把报名状态、CA 接入表单、CA 连接状态和轮换提示收口成正式中文产品文案。
