# GRS004 / Rider Snapshot Fetch Own Scope Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.3 RaceProject`
    - `manage_ca_connection`: Rider `own connection metadata`
    - `sync_status`: Rider `own status`
- `docs/grs004/ary-ca-integration-spec.md`
  - Rider 必须先拥有该 Race 的 `approved Registration` 和 `RaceProject`
- `docs/grs004/ary-mvp.prd.md`
  - Rider 只能管理自己的报名、RaceProject、Work、报告和可见骑行摘要

当前缺口：

- `src/app/actions.ts`
  - `fetchCASnapshotAction()` 当前只做 `requireRole("RIDER")`
- `src/lib/services/ca-fetch.ts`
  - `fetchCASessionSnapshotForConnection()` 当前只按 `caConnectionId` 读取连接
  - 没有校验当前 Rider 是否就是该 `CAConnection -> RaceProject -> Registration` 的 owner
  - 也没有校验该 `Registration` 是否已经 `APPROVED`

这与 `RaceProject.sync_status = own status` 不一致。

## 范围

### 本轮纳入

- 为 rider 触发的 snapshot fetch 收口 own-scope
- 要求：
  - `userId` 必须命中该连接所属 Registration owner
  - 该 Registration 必须已 `APPROVED`
- 补 action wiring test 与 service scope test

### 本轮不纳入

- 不改 connector 主动 fetch / handshake 协议
- 不改 CA snapshot payload 结构
- 不重做 rider UI

## 方案

- `fetchCASessionSnapshotForConnection()` 增加可选 `userId`
- 若存在 `userId`：
  - owner 不匹配时拒绝
  - Registration 非 `APPROVED` 时拒绝
- `fetchCASnapshotAction()` 继续保留 Rider action，但显式向 service 传 `user.id`

## 测试对齐

- 新增 `src/app/actions.rider-snapshot-own-scope.test.ts`
- 新增 `src/lib/services/ca-fetch-rider-scope.test.ts`
  - foreign rider 拒绝
  - non-approved registration 拒绝

验证命令：

```bash
node --import tsx --test src/app/actions.rider-snapshot-own-scope.test.ts src/lib/services/ca-fetch-rider-scope.test.ts
```

## 一句话结论

这一轮只修 Rider 发起 snapshot fetch 的 own-scope 边界，不扩协议、不扩 UI，直接把当前实现拉回权限矩阵要求。
