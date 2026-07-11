# GRS004 / Console Route Profile Completion Gate Implementation Plan

## 目标

把 `profileCompleted` 的控制台前置门从 `/console` 根页扩展到全部 `console/*` 页面。

## 任务拆分

### Task 1: 先补源码级失败用例

- [ ] 新增 `src/app/console/console-route-profile-gating.test.ts`
- [ ] 覆盖所有 `console/*` route 页面都应复用统一 helper

### Task 2: 新增共享 helper

- [ ] 修改 `src/lib/auth.ts`
- [ ] 新增：
  - `requireConsoleUser(returnTo)`
- [ ] 复用：
  - `loadDatabaseUser()`
  - `buildProfileCompletionHref()`

### Task 3: 接入所有 console route 页面

- [ ] 修改：
  - `src/app/console/races/page.tsx`
  - `src/app/console/races/new/page.tsx`
  - `src/app/console/races/[raceSlug]/page.tsx`
  - `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx`
  - `src/app/console/races/[raceSlug]/rider/[section]/page.tsx`
  - `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`
  - `src/app/console/admin/[section]/page.tsx`
  - `src/app/console/screen/page.tsx`
  - `src/app/console/screen/[raceSlug]/[mode]/page.tsx`

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/console/page.test.tsx src/app/console/console-route-profile-gating.test.ts`
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/console/page.test.tsx src/app/console/console-route-profile-gating.test.ts
npm run build
```

## 完成标准

- 所有 console route 页面已复用统一 profile completion gate
- 未补全账号不能再直接深入 `console/*`
- `returnTo` 仍保留原目标路径
- 聚焦测试与构建通过
