# GRS004 / Award Report Announcement System Scope Alignment Implementation Plan

## 目标

把 `Award / Report / Announcement` 的 action 和 service 权限，从当前的 Organizer-only，对齐到 `docs/grs004/ary-permission-matrix.md` 要求的 `managed race | system`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.managed-race-system-access.test.ts`
- [ ] 修改 `src/lib/services/awards-draft-withdraw.test.ts`
- [ ] 修改 `src/lib/services/reports-generation.test.ts`
- [ ] 修改 `src/lib/services/announcements.test.ts`
- [ ] 覆盖：
  - action wiring 不再只依赖 `requireRole("ORGANIZER")`
  - Admin/system 可以执行 award/report/announcement 的 managed-race 动作

### Task 2: 对齐 Award service scope

- [ ] 修改 `src/lib/services/awards.ts`
- [ ] 给 managed action 输入补：
  - `allowSystem?: boolean`
- [ ] 让：
  - `generateAwardDraftsForRace()`
  - `updateAwardDraftForRace()`
  - `publishAwardsForRace()`
  - `withdrawPublishedAwardsForRace()`
  支持 `managed race | system`

### Task 3: 对齐 Report 与 Announcement service scope

- [ ] 修改 `src/lib/services/reports.ts`
- [ ] 修改 `src/lib/services/announcements.ts`
- [ ] 给 managed helpers / action 输入补：
  - `allowSystem?: boolean`
- [ ] 让：
  - report 的 `generate / edit / reviewed / publish`
  - announcement 的 `create / edit / publish / hide`
  支持 `managed race | system`

### Task 4: 对齐 server action 准入

- [ ] 修改 `src/app/actions.ts`
- [ ] 将下列 action 从 Organizer-only 改为 `ADMIN | ORGANIZER`：
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
- [ ] 调用 service 时传入：
  - `organizerId: user.id`
  - `allowSystem: hasRole(user.roles, "ADMIN")`

### Task 5: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts`
- [ ] 如有必要，补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts
```

## 完成标准

- `Award / Report / Announcement` action 不再卡死为 Organizer-only
- 对应 service 已支持 `allowSystem` 语义
- Admin/system 可以操作非自己组织的赛事资源
- Organizer 现有路径保持可用
- 聚焦测试通过
