# GRS004 / Projection Rebuild System Scope Alignment Implementation Plan

## 目标

把 `Projection.rebuild` 从当前的 Organizer-only 且缺少 managed-race 校验，对齐到 `docs/grs004/ary-permission-matrix.md` 要求的 `managed race | system`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.projection-rebuild-scope.test.ts`
- [ ] 扩展 `src/lib/services/race-track-calibration.test.ts`
- [ ] 覆盖：
  - action wiring 不再只锁 `ORGANIZER`
  - foreign organizer 不能借 `allowSystem` 越权
  - admin/system 可以跨赛事执行同类 managed-race 动作

### Task 2: 收口 managed-race helper

- [ ] 修改 `src/lib/services/races.ts`
- [ ] 新增可复用 helper：
  - `assertManagedRaceActionAccess()`
- [ ] helper 内校验：
  - 当前 race 是否存在且归属当前 organizer
  - 只有真实 `ADMIN` 才能在 `allowSystem=true` 时跨赛事放行

### Task 3: 对齐 Projection rebuild action

- [ ] 修改 `src/app/actions.ts`
- [ ] 将 `rebuildProcessModelsAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- [ ] 调用 rebuild 前执行：
  - `assertManagedRaceActionAccess()`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.projection-rebuild-scope.test.ts src/lib/services/race-track-calibration.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.projection-rebuild-scope.test.ts src/lib/services/race-track-calibration.test.ts
```

## 完成标准

- `rebuildProcessModelsAction()` 已允许 `ADMIN | ORGANIZER`
- `Projection.rebuild` 已按 `managed race | system` 收口
- foreign organizer 不再能跨赛事重算 Projection
- Admin/system 可以跨赛事执行 rebuild
- 聚焦测试和构建通过
