# GRS004 / DEV-3 资料补全正式工作流 Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-3 登录 / 角色 / Race Console`
  - 交付范围：`GitHub 登录`、`资料补全`
- `docs/grs004/ary-mvp.prd.md`
  - `用户可以通过 GitHub 登录并补全个人资料`
  - `User / Account | GitHub 登录并补全资料后的 ARY 用户`
- `docs/grs004/ary-qa-plan.md`
  - P0 回归：`GitHub 登录 -> 资料补全 -> Admin 分配 roles -> ...`
- `docs/grs004/防伪与防篡改计划.md`
  - GitHub OAuth 已具备主链路，但仍需要继续完善 `profile completion`

当前代码里：

- GitHub OAuth 主链路已具备
- 登录模型已收口到 `GitHub 正式入口 + 本地开发 fallback`
- 公开身份入口和 `/login` 已有最小回归覆盖
- 但“资料补全”仍只停留在：
  - `User.profileCompleted / profileName / profileOrgLabel` 字段存在
  - Admin 只能查看资料补全状态
  - 用户本人没有正式补全资料的写路径和引导流程

本轮目标是：把“登录后补全资料”落成最小正式工作流，让未补全用户能够被引导进入资料补全页，完成写入后再回到原目标页面继续。

## 范围

### 本轮纳入

- 新增用户侧资料补全页 `/profile`
- 新增资料补全 action / service
- 登录成功后：
  - 已补全用户继续回到 `returnTo`
  - 未补全用户先进入 `/profile`
- `/console`
  - 未补全用户先跳资料补全页
- 公开报名页
  - 已登录但未补全的 Rider 不再直接看到报名按钮，而是先看到“去补全资料”
- `requireRole`
  - 未补全用户不能继续走 role-protected action

### 本轮不纳入

- 不做完整账号中心
- 不做头像、简介、社交链接等更多资料字段
- 不做资料审核流
- 不做 Admin 代填资料
- 不做 profile completion 的多步骤向导
- 不做所有页面的统一全局拦截中间件

## 约束

1. 只使用现有 `User.profileName / profileOrgLabel / profileCompleted` 字段。
2. 不新增复杂账号模型。
3. 尽量不改变现有公开站与控制台结构，只补最小流程断点。

## 方案

### 方案 A：独立 `/profile` 页 + 认证后前置跳转

做法：

- 新增纯 helper：
  - `buildProfileCompletionHref(returnTo)`
  - `getPostAuthRedirectTarget({ profileCompleted, returnTo })`
- `/login`、本地登录/注册 action、GitHub callback
  - 统一通过 helper 决定后续落点
- 新增 `/profile`
  - 允许已登录但未补全用户提交最小资料
- `completeProfileAction`
  - 成功后回到原 `returnTo`
- `requireRole`
  - 改为读取数据库中的 `profileCompleted`，未补全时跳 `/profile`

优点：

- 直接命中 `DEV-3` 的未完成项
- 复用现有字段，改动集中
- 支持从任意带 `returnTo` 的认证入口恢复原流程

缺点：

- 还不是完整账号中心
- 页面级拦截仍以关键入口为主，不是全局 middleware

### 推荐方案

采用方案 A：独立 `/profile` 页 + 认证后前置跳转。

## 用户可见变化

本轮落地后，用户现在能直接看到：

1. 登录成功但资料未补全时，会先进入 `/profile`
2. `/profile` 可填写：
   - 显示名称
   - 机构 / 标签
3. 资料保存后，会继续回到原先的目标页面
4. 公开报名页中，未补全资料的 Rider 会先看到“去补全资料”
5. 控制台入口不再直接放行未补全账号

## 测试对齐

需要覆盖：

- `src/lib/profile-completion.test.ts`
- `src/lib/services/users-profile-completion.test.ts`
- `src/app/profile/page.test.tsx`
- `src/app/console/page.test.tsx`
- `src/app/actions.return-to.test.ts`
- `src/app/_components/public/race-register-page.test.tsx`

验证命令：

```bash
node --import tsx --test src/lib/profile-completion.test.ts src/lib/services/users-profile-completion.test.ts src/app/profile/page.test.tsx src/app/console/page.test.tsx src/app/actions.return-to.test.ts src/app/_components/public/race-register-page.test.tsx
npm run build
```

## 验收对齐

本轮完成后，需要能证明：

1. 登录成功后的未补全账号会先进入资料补全页
2. `/profile` 可以把最小资料写回数据库并标记 `profileCompleted=true`
3. 资料补全完成后可以继续回到 `returnTo`
4. 未补全账号不能直接从控制台入口或 role-protected action 继续深入
5. 公开报名页会先提示补全资料

## 一句话结论

这轮补的是 `GitHub 登录 -> 资料补全 -> 回到原流程` 的最小正式闭环，不是完整账号中心。
