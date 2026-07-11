# GRS004 / DEV-3 资料补全正式工作流 Implementation Plan

## 目标

把 `DEV-3` 中“GitHub 登录、资料补全”的第二段正式补齐，落成最小可用闭环。

## 任务拆分

### Task 1: 新增 profile completion helper

- [ ] 新增 `src/lib/profile-completion.ts`
- [ ] 输出：
  - `buildProfileCompletionHref()`
  - `resolveProfileCompletionReturnTo()`
  - `getPostAuthRedirectTarget()`
- [ ] 增加 `src/lib/profile-completion.test.ts`

### Task 2: 新增资料补全写路径

- [ ] `src/lib/validation.ts`
  - 新增 `profileCompletionSchema`
- [ ] `src/lib/services/users.ts`
  - 新增 `completeUserProfile()`
- [ ] 增加 `src/lib/services/users-profile-completion.test.ts`

### Task 3: 新增 `/profile` 页面

- [ ] 新增 `src/app/profile/page.tsx`
- [ ] 页面要求：
  - 未登录跳 `/login`
  - 已补全直接回 `returnTo`
  - 未补全显示最小资料表单
- [ ] 增加 `src/app/profile/page.test.tsx`

### Task 4: 打通认证后跳转与控制台入口

- [ ] `src/app/actions.ts`
  - `registerAction`
  - `loginAction`
  - `completeProfileAction`
- [ ] `src/lib/github-oauth.ts`
  - callback 成功后走统一 post-auth redirect helper
- [ ] `src/app/login/page.tsx`
  - 已登录但未补全时直接跳 `/profile`
- [ ] `src/app/console/page.tsx`
  - 未补全时跳 `/profile?returnTo=%2Fconsole`
- [ ] 更新 `src/app/actions.return-to.test.ts`
- [ ] 新增 `src/app/console/page.test.tsx`

### Task 5: 收口公开报名页

- [ ] `src/app/_components/public/race-register-page.tsx`
  - 已登录但未补全的 Rider 先显示补全资料提示
- [ ] 更新 `src/app/_components/public/race-register-page.test.tsx`

### Task 6: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-dev3-profile-completion-formal-flow-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-dev3-profile-completion-formal-flow-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/profile-completion.test.ts src/lib/services/users-profile-completion.test.ts src/app/profile/page.test.tsx src/app/console/page.test.tsx src/app/actions.return-to.test.ts src/app/_components/public/race-register-page.test.tsx
npm run build
```

## 完成标准

- 登录成功后的未补全账号先进入 `/profile`
- `/profile` 能写回最小资料并标记完成
- 完成后能继续回原 `returnTo`
- `/console` 与 role-protected action 不再直接放行未补全账号
- 公开报名页先提示补全资料
