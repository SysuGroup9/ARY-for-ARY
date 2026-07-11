# GRS004 / Admin Race Console System Scope Access Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `Race.create / edit / publish / archive`: Organizer `managed race`，Admin `system`
  - `Registration / Work / Award / Report / Projection / Announcement / Screen Display` 多数写动作都允许 Admin `system`
- `docs/grs004/ary-mvp.ia.md`
  - Race Console 是单场 `Race Workspace`
  - Admin 默认进入 Admin Console，但可承担必要系统管理和异常处理
- 当前实现现状
  - 多个 server action 已支持 `allowSystem: hasRole(user.roles, "ADMIN")`
  - 但 `src/lib/viewer-access.ts` 与 `src/lib/services/console-routes.ts` 仍阻止 Admin 进入 `/console/races` 和 `/console/races/{raceSlug}/organizer/*`

当前显式缺口：

- Admin 拥有大量 race-scoped system action，但没有对应的 race-scoped UI 入口
- `/console/races` 对 Admin 当前是拒绝态
- `getConsoleRaceBySlugForAccess(access="organizer")` 对 Admin 当前返回 `null`

## 范围

### 本轮纳入

- Admin 获得 `赛事控制台` 根入口
- Admin 在 race list 中看到全部 races，并通过现有 organizer route 进入单场 race workspace
- Admin 允许读取 organizer access 的 race context，作为 system scope 例外入口
- Admin 默认 `/console` 落点保持 `Admin Console`

### 本轮不纳入

- 不新增单独的 Admin Race Console 页面
- 不改变 `/console` 默认首页逻辑
- 不改变 `Admin Console` 仍以账号、资料状态、`User.roles` 管理为主的定位

## 设计约束

- Admin 进入 race-scoped organizer route，不代表 Admin 变成 organizer
- 这里只提供 system scope 的 race workspace 入口，继续复用现有 organizer 视图
- Organizer 仍只能看到自己的 `managed race`
- Rider / Judge scope 规则不变

## 落地规则

- `getConsoleHomeSections(["ADMIN"])` 现在应包含 `races`
- `getConsoleRacesRootAccess(["ADMIN"])` 现在应允许进入
- `getConsoleRaceViewAccess(view="organizer")` 对 Admin 直接放行
- `listConsoleRacesForUser({ roles: ["ADMIN"] })` 现在返回全部 races，并复用 `organizer/overview` 作为默认落点
- `getConsoleRaceBySlugForAccess(access="organizer")` 对 Admin 现在应可解析任意 race slug

## 测试对齐

- 扩展 `src/lib/viewer-access.test.ts`
- 扩展 `src/lib/services/console-routes.test.ts`
- 回归 `src/app/console/page.test.tsx`
- 回归 `src/app/console/races/page.test.tsx`

验证命令：

```bash
node --test-concurrency=1 --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts
```

## 一句话结论

这一轮不是给 Admin 新造一套赛事后台，而是把已经存在的 `system` 动作补回到可进入的 race-scoped workspace。
