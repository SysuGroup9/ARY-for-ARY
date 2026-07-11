# GRS004 / Race Create System Scope Alignment Implementation Plan

## 目标

把 `Race.create` 从当前的 Organizer-only，对齐到 `docs/grs004/ary-permission-matrix.md` 要求的 `Organizer yes | Admin system`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 更新 `src/lib/viewer-access.test.ts`
- [ ] 新增 `src/app/actions.race-create-system-scope.test.ts`
- [ ] 新增 `src/lib/services/race-create-scope.test.ts`
- [ ] 覆盖：
  - Admin 可访问创建页
  - Admin system create 会读取 `organizerId`
  - foreign organizer 不能借 `allowSystem` 代别人创建
  - Admin 不能指向非 organizer 账号

### Task 2: 对齐页面与表单

- [ ] 修改 `src/lib/viewer-access.ts`
- [ ] 修改 `src/app/console/races/new/page.tsx`
- [ ] 修改 `src/app/_components/ary-shared.tsx`
- [ ] 修改 `src/app/_components/create-race-form-client.tsx`
- [ ] Admin 路径增加最小 organizer 选择字段

### Task 3: 对齐 action 与 service

- [ ] 修改 `src/app/actions.ts`
- [ ] 修改 `src/lib/services/races.ts`
- [ ] `createRaceAction()` 改为 `ADMIN | ORGANIZER`
- [ ] `createRace()` 改为区分 `actorUserId` 与 `organizerId`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/actions.race-create-system-scope.test.ts src/lib/services/race-create-scope.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/lib/viewer-access.test.ts src/app/actions.race-create-system-scope.test.ts src/lib/services/race-create-scope.test.ts
```

## 完成标准

- `createRaceAction()` 已允许 `ADMIN | ORGANIZER`
- Admin 可进入创建页
- Admin 可代 Organizer 创建赛事
- foreign organizer 不再能代别人创建
- 非 organizer 账号不能被指定为赛事 organizer
- 聚焦测试和构建通过
