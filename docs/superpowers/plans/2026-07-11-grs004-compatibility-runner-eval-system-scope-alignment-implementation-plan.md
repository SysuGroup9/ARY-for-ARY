# GRS004 / Compatibility Runner Eval System Scope Alignment Implementation Plan

## 目标

把 `runCompatibilityProgressEvalAction()` 和 `runCompatibilityHarnessEvalAction()` 从当前的 Organizer-only，对齐到文档对内部维护动作要求的 `managed race | system`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.compatibility-runner-system-scope.test.ts`
- [ ] 覆盖：
  - 两条 action 不再只锁 `ORGANIZER`
  - 调用前会执行 `assertManagedRaceActionAccess()`

### Task 2: 对齐 action

- [ ] 修改 `src/app/actions.ts`
- [ ] 两条 action 改为 `ADMIN | ORGANIZER`
- [ ] 调用各自 enqueue service 前先执行 `assertManagedRaceActionAccess()`

### Task 3: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.compatibility-runner-system-scope.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.compatibility-runner-system-scope.test.ts
```

## 完成标准

- 两条 compatibility runner eval action 已允许 `ADMIN | ORGANIZER`
- 调用前已按 managed-race helper 收口
- 聚焦测试和构建通过
