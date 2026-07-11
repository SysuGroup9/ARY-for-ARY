# GRS004 / Race Console Scope Alignment Implementation Plan

## 目标

让 Race Console 的 `entry / organizer / rider / judge` 详情页复用与列表页一致的 scope 过滤，避免通过手工改 slug 进入未授权赛事上下文。

## 任务拆分

### Task 1: 先补 service 级失败用例

- [ ] 修改 `src/lib/services/console-routes.test.ts`
- [ ] 覆盖：
  - Organizer 仅能读取自己负责赛事的 organizer detail
  - Rider 仅能读取自己已报名赛事的 rider detail
  - Judge 仅能读取自己有 assignment 赛事的 judge detail
  - entry helper 只返回当前用户真实可见的 access

### Task 2: 新增 scoped helper

- [ ] 修改 `src/lib/services/console-routes.ts`
- [ ] 新增：
  - `getConsoleRaceEntriesBySlugForUser()`
  - `getConsoleRaceBySlugForAccess()`
- [ ] 复用 `listConsoleRacesForUser()`

### Task 3: 接入 4 个 Race Console route

- [ ] 修改：
  - `src/app/console/races/[raceSlug]/page.tsx`
  - `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx`
  - `src/app/console/races/[raceSlug]/rider/[section]/page.tsx`
  - `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/lib/services/console-routes.test.ts`
  - 如有必要，补跑相关 console access 测试
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/lib/services/console-routes.test.ts src/lib/viewer-access.test.ts src/lib/services/judge-scope-convergence.test.ts
```

## 完成标准

- Race Console 详情页已按 scope helper 读取
- Rider / Judge / Organizer 越权 slug 不再可用
- Admin 保持系统范围
- 聚焦测试通过
