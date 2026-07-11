# GRS004 / Race Console Root Access Boundary Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.ia.md`
  - `Race Console 是赛事执行入口，以单场 Race Workspace 为核心上下文，按 organizer / rider / judge role 展示不同工作台`
  - `Admin Console 只处理账号、资料状态和 User.roles，不承载赛事执行`
- `docs/grs004/ary-mvp.prd.md`
  - `Race Console / Organizer View`
  - `Race Console / Rider View`
  - `Race Console / Judge View`
  - `Admin Console 不承担赛事执行或数据运营`
- `docs/grs004/ary-permission-matrix.md`
  - `Race.view_private`
    - Rider: `own registered race`
    - Judge: `assigned race`
    - Organizer: `managed race`
    - Admin: `system`

当前代码里已经有：

- `src/lib/viewer-access.ts`
  - `getConsoleHomeSections()`
    - `ADMIN` -> `["admin", "screen"]`
    - `ORGANIZER / RIDER / JUDGE` -> 包含 `races`
- `src/app/console/page.tsx`
  - console 首页只会给有 `races` section 的账号显示“赛事控制台”入口
- `src/app/console/races/page.tsx`
  - 当前无论 `sections` 是否包含 `races`，都会渲染 `ConsoleRacesPageView`

这里的缺口是：

- `ADMIN` 这类没有 `races` section 的账号，在 console 首页本来就看不到“赛事控制台”入口
- 但如果手工访问 `/console/races`，当前仍会看到一个空壳 `赛事控制台`
- 这与文档里 `Race Console` 的角色边界不一致

本轮目标是：**让 `/console/races` 根页只服务真正拥有 `races` section 的账号；其它账号改为回到自己当前的控制台默认落点。**

## 范围

### 本轮纳入

- 补 `viewer-access` 层的 root access helper
- 修正 `/console/races` 根页
- 补最小源码 / helper 回归测试

### 本轮不纳入

- 不重构 `Race Console` 详情 scope
- 不扩到 `create-race` 或其它 section page
- 不变更 `Admin` 的深层资源系统权限

## 约束

### 文档约束

- `Race Console` 的直接用户是 Organizer / Rider / Judge
- `Admin Console` 不承担赛事执行
- 已登录但无 `races` section 的账号，不应看到误导性的空壳 Race Console

### 当前代码现实

- `getConsoleHomeSections()` 已经足够区分是否有 `races` section
- 真正缺的是 `/console/races` route 本身没有复用这层判断

因此本轮应遵循：

1. **优先复用现有 section 逻辑**
2. **只补 `/console/races` 根页边界**
3. **对无 `races` section 的账号，跳回其合理控制台落点**

## 方案选择

### 方案 A：新增 `getConsoleRacesRootAccess()` 并在 route 中复用

优点：

- 准入决策继续集中在 `viewer-access.ts`
- 可直接测试
- 改动最小

缺点：

- 只解决 root page，不是完整 console route 框架

### 方案 B：直接在 `/console/races/page.tsx` 内写 sections 判断

优点：

- 改动最少

缺点：

- 准入逻辑分散
- 不利于后续继续收口其它 root page

### 推荐方案

采用 **方案 A：新增 `getConsoleRacesRootAccess()`**。

## 用户可见变化

本轮落地后：

1. `ADMIN` 这类没有 `races` section 的账号，手工访问 `/console/races` 时不再看到空壳赛事控制台
2. 会直接跳回自己的控制台默认落点
3. `ORGANIZER / RIDER / JUDGE` 的 `赛事控制台` 路径不受影响

## 测试对齐

需要覆盖：

- `src/lib/viewer-access.test.ts`
  - `getConsoleRacesRootAccess()`
- 新增 `src/app/console/races/page.test.tsx`
  - route 源码复用该 helper

验证命令：

```bash
node --import tsx --test src/lib/viewer-access.test.ts src/app/console/races/page.test.tsx
```

## 验收对齐

本轮完成后，需要能证明：

1. `/console/races` 不再对无 `races` section 的账号渲染空壳页
2. `Race Console` 根页边界与 console 首页 section 逻辑一致
3. `Organizer / Rider / Judge` 不受影响
4. 聚焦测试通过

## 一句话结论

这轮要修的不是“谁能进入具体赛事工作台”，而是“没有 `races` section 的账号，不能再看到一个文档并未赋予他的空壳 Race Console 根页”。
