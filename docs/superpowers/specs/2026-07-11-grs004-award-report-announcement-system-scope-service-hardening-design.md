# GRS004 / Award Report Announcement System Scope Service Hardening Design

## 目的

本设计是对上一轮 `Award / Report / Announcement system-scope alignment` 的补强，而不是新功能扩张。

直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.8 Award / Leaderboard`
    - `create_draft / edit_draft / publish / withdraw_publication`
    - Organizer: `managed race`
    - Admin: `system`
  - `3.10 Report`
    - `generate / edit / publish / regenerate`
    - Organizer: `managed race`
    - Admin: `system`
  - `3.12 Announcement`
    - `create / edit / publish / hide`
    - Organizer: `managed race`
    - Admin: `system`

复查当前代码后确认，上一轮虽然已经完成：

- `src/app/actions.ts` 中相关 action 的 `ADMIN | ORGANIZER` 双入口
- service 调用签名里已有 `allowSystem?: boolean`

但 service 层仍残留真实缺口：

- `src/lib/services/awards.ts`
  - `getRaceForManagedAwardAction()`
  - `updateAwardDraftForRace()`
- `src/lib/services/reports.ts`
  - `getRaceForManagedReportAction()`
  - `getManagedReportForAction()`
  - `publishReportForRace()`
- `src/lib/services/announcements.ts`
  - `getRaceForManagedAnnouncementAction()`
  - `getManagedAnnouncementForAction()`

这些 helper 仍使用旧逻辑：

- `race.organizerId !== organizerId && !allowSystem`

这意味着 foreign organizer 如果直接调用 service，并伪造 `allowSystem: true`，理论上仍可能越权。

## 范围

### 本轮纳入

- 补齐 `Award / Report / Announcement` service 层的真实 Admin role 校验
- 扩展既有 service tests，增加：
  - foreign organizer + `allowSystem: true` 被拒绝
  - admin/system 路径成功

### 本轮不纳入

- 不改 action 层角色入口
- 不新增 UI
- 不重构成通用权限中心
- 不改公开读模型

## 约束

- Organizer 权限仍然只是 `managed race`
- Admin 权限仍然只是 `system`
- `allowSystem` 只是“允许尝试 system scope”，不是“任何调用者都自动获得 system scope”

## 方案

### 方案 A：在 3 个 service 文件中本地补真实 Admin 校验

做法：

- 每个 managed helper 在读取目标资源时，同时读取当前调用者 `rolesJson`
- 只有当：
  - 当前用户就是赛事 organizer
  - 或 `allowSystem === true` 且真实拥有 `ADMIN`
  - 才允许执行

优点：

- 最小改动
- 不引入额外抽象层
- 与 `races.ts`、`screen-display.ts` 当前 hardening 语义一致

缺点：

- 3 个文件内会保留少量重复逻辑

### 方案 B：抽统一 helper

优点：

- 理论上更统一

缺点：

- 会扩大重构面
- 当前目标是补齐文档要求，不是重做权限架构

### 推荐方案

采用 **方案 A：本地补真实 Admin 校验**。

## 测试对齐

需要扩展：

- `src/lib/services/awards-draft-withdraw.test.ts`
  - foreign organizer + `allowSystem: true` 不能：
    - generate draft
    - edit draft
    - publish
    - withdraw
  - admin/system 仍可以
- `src/lib/services/reports-generation.test.ts`
  - foreign organizer + `allowSystem: true` 不能：
    - generate
    - edit draft
    - mark reviewed
    - publish
  - admin/system 仍可以
- `src/lib/services/announcements.test.ts`
  - foreign organizer + `allowSystem: true` 不能：
    - create draft
    - edit
    - publish
    - hide
  - admin/system 仍可以

验证命令：

```bash
node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Award / Report / Announcement` service 层不再信任裸 `allowSystem`
2. foreign organizer 不能再用 `allowSystem: true` 越权
3. admin/system 路径保持可用
4. 现有 action 双入口不回退

## 一句话结论

这轮要修的是上一轮遗漏的 service 边界硬化，把 `Award / Report / Announcement` 从“接口看起来支持 system scope”补到“只有真实 Admin 才能真的使用 system scope”。
