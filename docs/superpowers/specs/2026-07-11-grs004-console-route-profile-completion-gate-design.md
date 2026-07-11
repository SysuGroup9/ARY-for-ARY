# GRS004 / Console Route Profile Completion Gate Design

## 目的

本设计直接承接：

- `docs/superpowers/specs/2026-07-11-grs004-dev3-profile-completion-formal-flow-design.md`
  - `未补全用户不能继续走 role-protected action`
  - `控制台入口不再直接放行未补全账号`
  - 验收：`未补全账号不能直接从控制台入口或 role-protected action 继续深入`
- `docs/grs004/ary-mvp.prd.md`
  - `用户可以通过 GitHub 登录并补全个人资料`
- `docs/grs004/ary-qa-plan.md`
  - `GitHub 登录 -> 资料补全 -> Admin 分配 roles -> ...`

当前代码里已经有：

- `src/lib/auth.ts`
  - `requireRole()`
    - 已会在 `profileCompleted=false` 时直接 `redirect("/profile")`
- `src/app/console/page.tsx`
  - 已会把未补全账号导去 `buildProfileCompletionHref("/console")`

但当前缺口是：

- 绝大多数 `console/*` 页面仍直接用 `loadDatabaseUser()`
- 因此未补全账号理论上可以绕过 `/console` 根页，手工访问：
  - `/console/races`
  - `/console/races/[raceSlug]/*`
  - `/console/races/new`
  - `/console/admin/[section]`
  - `/console/screen/*`

本轮目标是：**把“资料补全后才能继续深入控制台”从 `/console` 根页扩到所有 `console/*` 页面路由。**

## 范围

### 本轮纳入

- 新增 console route 级 helper
- 接入全部 `src/app/console/**/page.tsx`
- 让未补全账号统一跳：
  - `/profile?returnTo=...`
- 增加源码级回归测试

### 本轮不纳入

- 不做全局 middleware
- 不扩到公开站全部登录后页面
- 不改资料字段模型
- 不改 `/profile` 页面本身

## 约束

### 文档约束

- 未补全账号不能直接从控制台入口继续深入
- 资料补全完成后应能回到原 `returnTo`
- 只做最小正式闭环，不做全局中间件

### 当前代码现实

- `buildProfileCompletionHref()` 已可安全保留 `returnTo`
- `console/page.tsx` 已有现成口径
- 其他 console route 还没复用

因此本轮应遵循：

1. **优先抽共享 helper**
2. **所有 console route 统一复用**
3. **继续保留基于 `returnTo` 的恢复能力**

## 方案选择

### 方案 A：新增 `requireConsoleUser(returnTo)` helper

做法：

- 在 `src/lib/auth.ts` 中新增：
  - `requireConsoleUser(returnTo)`
- 逻辑：
  - 未登录 -> `/login`
  - 已登录但未补全 -> `buildProfileCompletionHref(returnTo)`
  - 已补全 -> 返回 `DatabaseSessionUser`
- 各 `console/*` route 改为复用该 helper

优点：

- 改动集中
- 与当前 `/console` 根页口径一致
- 易于后续继续覆盖其它 console route

缺点：

- 仍不是全局 middleware

### 方案 B：每个 page 各自写 profileCompleted 判断

优点：

- 直接

缺点：

- 容易再次漏页
- 口径分散

### 推荐方案

采用 **方案 A：新增 `requireConsoleUser(returnTo)` helper**。

## 用户可见变化

本轮落地后：

1. 未补全账号直接访问任意 `console/*` 路径时，不再能绕过资料补全
2. 会统一跳到 `/profile?returnTo=原目标路径`
3. 完成资料补全后，仍可回到原本想进入的控制台页面

## 测试对齐

需要覆盖：

- `src/app/console/page.test.tsx`
  - 保持 `/console` 根页已有回归
- 新增 console route 源码级回归测试
  - `races/page.tsx`
  - `races/new/page.tsx`
  - `races/[raceSlug]/page.tsx`
  - `races/[raceSlug]/organizer/[section]/page.tsx`
  - `rider/[section]/page.tsx`
  - `judge/[section]/page.tsx`
  - `screen/page.tsx`
  - `screen/[raceSlug]/[mode]/page.tsx`
  - `admin/[section]/page.tsx`

验证命令：

```bash
node --import tsx --test src/app/console/page.test.tsx src/app/console/console-route-profile-gating.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. 未补全账号不能再直接深入任意 `console/*` 路由
2. 所有 console route 都复用了统一 gate
3. `returnTo` 仍能保留原目标路径
4. 聚焦测试通过

## 一句话结论

这轮要补的不是“资料补全页还能不能打开”，而是“未补全用户不能靠手工改 URL 绕过控制台的资料补全前置门”。 
