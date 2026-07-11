# GRS004 / Race Edit System Scope Alignment Implementation Plan

## 目标

把 `Race.edit` 对应的 `updateRaceAction()`、`updateOrganizerCommentAction()`、`updateDisplayOptionsAction()` 及其 service，从当前的 Organizer-only 对齐到 `docs/grs004/ary-permission-matrix.md` 要求的 `managed race | system`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.race-edit-system-scope.test.ts`
- [ ] 新增 `src/lib/services/race-edit-scope.test.ts`
- [ ] 覆盖：
  - action wiring 不再只锁 `ORGANIZER`
  - foreign organizer 不能借 `allowSystem` 越权
  - admin/system 可以跨赛事执行 race edit

### Task 2: 对齐 service scope

- [ ] 修改 `src/lib/services/races.ts`
- [ ] 给以下 service 新增 `allowSystem?: boolean`
  - `updateRaceContent()`
  - `updateOrganizerComment()`
  - `updateRaceDisplayOptions()`
- [ ] 统一复用 `assertManagedRaceActionAccess()`

### Task 3: 对齐 server action

- [ ] 修改 `src/app/actions.ts`
- [ ] 将以下 action 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
  - `updateRaceAction()`
  - `updateOrganizerCommentAction()`
  - `updateDisplayOptionsAction()`
- [ ] 调用 service 时统一传入：
  - `allowSystem: hasRole(user.roles, "ADMIN")`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.race-edit-system-scope.test.ts src/lib/services/race-edit-scope.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.race-edit-system-scope.test.ts src/lib/services/race-edit-scope.test.ts
```

## 完成标准

- 3 个 Race.edit action 已允许 `ADMIN | ORGANIZER`
- 对应 service 已按 `managed race | system` 工作
- foreign organizer 不再能跨赛事修改 race 内容
- admin/system 可以跨赛事执行同类编辑
- 聚焦测试和构建通过
