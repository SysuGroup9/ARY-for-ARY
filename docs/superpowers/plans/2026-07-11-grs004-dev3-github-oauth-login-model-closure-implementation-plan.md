# GRS004 / DEV-3 GitHub OAuth 登录模型收口 Implementation Plan

## 目标

把登录模型真正收口到“GitHub 是正式入口，本地账号只保留开发 fallback”。

## 任务拆分

### Task 1: 新增 auth entry helper

- [ ] 新增 `src/lib/auth-entry.ts`
- [ ] 输出：
  - `isGitHubOAuthConfigured()`
  - `isLocalAuthFallbackEnabled()`
- [ ] 增加 `src/lib/auth-entry.test.ts`

### Task 2: 收 `/login` 页结构

- [ ] `src/app/login/page.tsx`
  - GitHub 继续保留为正式入口
  - local fallback 关闭时隐藏本地表单
  - local fallback 关闭时隐藏 `SeedAccountsPanel`
- [ ] `src/app/_components/ary-shared.tsx`
  - `AuthTabsPanel` 支持不渲染本地表单

### Task 3: 服务端限制本地账号

- [ ] `src/lib/services/users.ts`
  - `registerUser()` 在 fallback 关闭时拒绝
  - `loginUser()` 在 fallback 关闭时拒绝

### Task 4: 补测试

- [ ] `src/app/_components/public/public-copy-cleanup.test.tsx`
  - fallback 关闭时只显示 GitHub
  - `/login` 只在 fallback 开启时保留 `SeedAccountsPanel`
  - users service source 已有服务端 gating

### Task 5: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-dev3-github-oauth-login-model-closure-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-dev3-github-oauth-login-model-closure-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/actions.return-to.test.ts
npm run build
```

## 完成标准

- GitHub 仍是正式入口
- 本地账号不再对所有环境默认开放
- local auth 关闭时，UI 和服务端都不再暴露本地账号路径
- 开发 fallback 仍保留
- 聚焦测试和构建通过
