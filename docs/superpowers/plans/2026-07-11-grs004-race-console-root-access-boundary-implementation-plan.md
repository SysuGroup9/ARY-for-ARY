# GRS004 / Race Console Root Access Boundary Implementation Plan

## 目标

让 `/console/races` 根页只对拥有 `races` section 的账号开放，避免 `ADMIN` 等角色通过手工访问看到空壳赛事控制台。

## 任务拆分

### Task 1: 先补测试

- [ ] 修改 `src/lib/viewer-access.test.ts`
- [ ] 新增 `src/app/console/races/page.test.tsx`
- [ ] 覆盖：
  - Organizer / Rider / Judge 允许
  - Admin / 无 races section 角色拒绝
  - route 源码复用新 helper

### Task 2: 新增 helper

- [ ] 修改 `src/lib/viewer-access.ts`
- [ ] 新增：
  - `getConsoleRacesRootAccess()`

### Task 3: 接入 `/console/races`

- [ ] 修改 `src/app/console/races/page.tsx`
- [ ] 对无 `races` section 的账号跳转到合理默认落点

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/console/races/page.test.tsx`
- [ ] 如有必要，补跑相关 console 测试与 `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/lib/viewer-access.test.ts src/app/console/races/page.test.tsx
```

## 完成标准

- `/console/races` 根页已按 `races` section 边界工作
- `ADMIN` 不再看到空壳赛事控制台
- `ORGANIZER / RIDER / JUDGE` 保持可用
- 聚焦测试通过
