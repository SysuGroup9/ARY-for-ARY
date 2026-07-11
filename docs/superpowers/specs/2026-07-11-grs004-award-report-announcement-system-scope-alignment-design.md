# GRS004 / Award Report Announcement System Scope Alignment Design

## 目的

本设计直接承接：

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
  - `4. 测试要求`
    - `Projection 重建、Report 生成、大屏 fallback 等内部维护动作只能由 Organizer 管理赛事范围或 Admin 系统范围执行`
- `docs/grs004/ary-mvp.ia.md`
  - `Admin Console` 不承担赛事执行主工作台，但不否定系统范围内部维护权限

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `publishLeaderboardAction`
  - `generateAwardDraftsAction`
  - `withdrawPublishedAwardsAction`
  - `updateAwardDraftAction`
  - `generateReportsAction`
  - `publishReportAction`
  - `updateReportDraftAction`
  - `markReportReviewedAction`
  - `createAnnouncementDraftAction`
  - `updateAnnouncementDraftAction`
  - `publishAnnouncementAction`
  - `hideAnnouncementAction`
  - 这些入口当前都还是 `requireRole("ORGANIZER")`
- `src/lib/services/awards.ts`
  - 当前只接受 `organizerId`
  - `race.organizerId !== organizerId` 就直接拒绝
- `src/lib/services/reports.ts`
  - 当前只接受 `organizerId`
  - `getRaceForManagedReportAction()` / `getManagedReportForAction()` 只允许赛事 Organizer
- `src/lib/services/announcements.ts`
  - 当前只接受 `organizerId`
  - `getRaceForManagedAnnouncementAction()` / `getManagedAnnouncementForAction()` 只允许赛事 Organizer

这与权限矩阵中的 `managed race | system` 不一致。

## 范围

### 本轮纳入

- 对齐 `Award / Report / Announcement` 三组动作的 server action 准入
- 对齐对应 service 层的 `managed race | system` scope
- 补最小测试证明：
  - Admin/system 可以执行这些动作
  - Organizer managed-race 路径保持不变
  - action wiring 不再只卡死在 `ORGANIZER`

### 本轮不纳入

- 不新增新的 Admin 页面入口
- 不重做 `Race Console` / `Admin Console` IA
- 不扩大到所有 Race 相关 action
- 不改公开读模型或页面展示

## 约束

### 文档约束

- Organizer 的权限仍然是 `managed race`
- Admin 的权限是 `system`
- `Admin Console` 不承担赛事执行主工作台，不等于系统动作必须被代码拒绝

### 当前实现约束

- 现有 `ScreenDisplay` 与赛道校准相关动作已经使用 `allowSystem?: boolean` 模式
- 本轮优先复用同样的 server-side scope 表达，而不是新造权限模型

因此本轮应遵循：

1. **只补 server action 与 service scope**
2. **沿用 `allowSystem?: boolean` 这种现有模式**
3. **不顺手扩张 UI、导航或 read model**

## 方案选择

### 方案 A：沿用 `allowSystem?: boolean`，补到 action 与 service

做法：

- `actions.ts` 中相关 action 不再直接 `requireRole("ORGANIZER")`
- 改为读取 `loadDatabaseUser()`，并允许：
  - `ORGANIZER`
  - `ADMIN`
- 调用 service 时传：
  - `organizerId: user.id`
  - `allowSystem: hasRole(user.roles, "ADMIN")`
- `awards.ts` / `reports.ts` / `announcements.ts` 的 managed helper 接入 `allowSystem`

优点：

- 与 `screen-display.ts`、`races.ts` 现有模式一致
- 改动最小
- 不需要新增角色模型或共享鉴权框架

缺点：

- 仍然属于 action/service 层显式布线，不是统一权限中台

### 方案 B：新增通用“managed race or system”鉴权 helper

优点：

- 更抽象

缺点：

- 超出本轮最小对齐范围
- 会引入额外重构面

### 推荐方案

采用 **方案 A：沿用 `allowSystem?: boolean`**。

## 用户可见变化

本轮落地后：

1. 对普通 Organizer 页面操作没有可见倒退
2. Admin 若通过系统范围入口触发 `Award / Report / Announcement` 内部维护动作，不会再被 server action 先行拦死
3. 不会新增新的 Admin 主导航或比赛工作台 UI

## 测试对齐

需要覆盖：

- `src/lib/services/awards-draft-withdraw.test.ts`
  - Admin/system 可对非自己组织的赛事执行：
    - generate draft
    - edit draft
    - publish
    - withdraw
- `src/lib/services/reports-generation.test.ts`
  - Admin/system 可对非自己组织的赛事执行：
    - generate
    - edit draft
    - mark reviewed
    - publish
- `src/lib/services/announcements.test.ts`
  - Admin/system 可对非自己组织的赛事执行：
    - create draft
    - edit
    - publish
    - hide
- 新增 `src/app/actions.managed-race-system-access.test.ts`
  - 锁定相关 server action 已改为 Admin/Organizer 双入口，并向 service 传入 `allowSystem`

验证命令：

```bash
node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Award / Report / Announcement` 的 server action 不再只允许 Organizer
2. Service 层对这些动作已支持 `managed race | system`
3. Organizer managed-race 路径不受影响
4. 聚焦测试通过

## 一句话结论

这一轮要修的不是新功能，而是把 `Award / Report / Announcement` 这三组内部维护动作，从“代码里只有 Organizer 能做”收口到“文档要求的 Organizer managed-race 或 Admin system 都能做”。
