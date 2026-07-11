# GRS004 / CA Connection Management System Scope Alignment Implementation Plan

## 目标

把 `manage_ca_connection` 中当前仍是 Organizer-only 的 `disable / enable` 动作，对齐到 `docs/grs004/ary-permission-matrix.md` 要求的 `managed race exception | system exception`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.ca-connection-system-scope.test.ts`
- [ ] 扩展 `src/lib/services/ca-rotation-disable.test.ts`
- [ ] 覆盖：
  - action wiring 不再只锁 `ORGANIZER`
  - foreign organizer 不能借 `allowSystem` 越权
  - admin/system 可以跨赛事 disable / enable

### Task 2: 对齐 service scope

- [ ] 修改 `src/lib/services/ca-connections.ts`
- [ ] 给 `disableCAConnectionForOrganizer()` / `enableCAConnectionForOrganizer()` 新增：
  - `allowSystem?: boolean`
- [ ] 在 service 内校验：
  - 当前 connection 必须存在
  - organizer 只能管理自己赛事下的连接
  - 只有真实 `ADMIN` 才能在 `allowSystem=true` 时跨赛事放行

### Task 3: 对齐 server action

- [ ] 修改 `src/app/actions.ts`
- [ ] 将 `disableCAConnectionAction()` / `enableCAConnectionAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- [ ] 调用 service 时传入：
  - `allowSystem: hasRole(user.roles, "ADMIN")`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.ca-connection-system-scope.test.ts src/lib/services/ca-rotation-disable.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.ca-connection-system-scope.test.ts src/lib/services/ca-rotation-disable.test.ts
```

## 完成标准

- `disableCAConnectionAction()` / `enableCAConnectionAction()` 已允许 `ADMIN | ORGANIZER`
- `disableCAConnectionForOrganizer()` / `enableCAConnectionForOrganizer()` 已按 `managed race exception | system exception` 工作
- foreign organizer 不再能跨赛事 disable / enable
- admin/system 可以跨赛事执行同类异常处理
- 聚焦测试和构建通过
