# GRS004 / Judge Assignment System Scope Alignment Implementation Plan

## 目标

把 `JudgeAssignment.create/update` 从当前的 Organizer-only 且缺少 managed-race 校验，对齐到 `docs/grs004/ary-permission-matrix.md` 要求的 `managed race | system`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/lib/services/judging-assignment-scope.test.ts`
- [ ] 新增 `src/app/actions.judge-assignment-scope.test.ts`
- [ ] 覆盖：
  - race organizer 成功
  - foreign organizer 拒绝
  - admin/system 成功
  - action wiring 不再只锁 `ORGANIZER`

### Task 2: 对齐 service scope

- [ ] 修改 `src/lib/services/judging.ts`
- [ ] 给 `assignJudgeToWork()` 新增：
  - `allowSystem?: boolean`
- [ ] 在 service 内校验：
  - `assignedByUserId` 必须拥有 `ORGANIZER` 或 `ADMIN`
  - organizer 必须是当前赛事 organizer，除非 `allowSystem=true`

### Task 3: 对齐 server action

- [ ] 修改 `src/app/actions.ts`
- [ ] 将 `assignJudgeToWorkAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- [ ] 调用 service 时传入：
  - `assignedByUserId: user.id`
  - `allowSystem: hasRole(user.roles, "ADMIN")`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.judge-assignment-scope.test.ts src/lib/services/judging-assignment-scope.test.ts`
- [ ] 视情况补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.judge-assignment-scope.test.ts src/lib/services/judging-assignment-scope.test.ts
```

## 完成标准

- `assignJudgeToWorkAction()` 已允许 `ADMIN | ORGANIZER`
- `assignJudgeToWork()` 已按 `managed race | system` 工作
- foreign organizer 不再能跨赛事分配 Judge
- Admin/system 可以分配 Judge
- 聚焦测试通过
