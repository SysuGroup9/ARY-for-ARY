# GRS004 / DEV-3 GitHub Placeholder Config Gating Implementation Plan

## 目标

让 GitHub OAuth 占位值不再被误判为有效配置，并统一 `/login` 与 `startGitHubOAuth()` 的配置判断。

## 任务拆分

### Task 1: 先补失败测试

- [ ] `src/lib/auth-entry.test.ts`
  - `replace-with-github-oauth-app-client-id`
  - `replace-with-github-oauth-app-client-secret`
  - 应返回 `false`
- [ ] `src/app/_components/public/public-auth-entry-regression.test.tsx`
  - `github-oauth.ts` 仍保留 `github_not_configured`
  - 且已接入 `isGitHubOAuthConfigured`

### Task 2: 实现统一 credential helper

- [ ] `src/lib/auth-entry.ts`
  - 新增：
    - 占位值识别 helper
    - `getGitHubOAuthCredentials()`
  - `isGitHubOAuthConfigured()` 改为复用新 helper

### Task 3: 接入 GitHub OAuth service

- [ ] `src/lib/github-oauth.ts`
  - `startGitHubOAuth()` 改为使用统一 helper
  - `exchangeCodeForAccessToken()` 也使用统一 helper

### Task 4: 运行时验证

- [ ] 启动本地开发服务器
- [ ] 记录当前 `.env` 仍为占位值时：
  - `GET /login?returnTo=%2Fraces` 返回 `200`
  - 页面 HTML 中不再出现：
    - `auth-oauth-form`
    - `使用 GitHub 登录` 按钮

### Task 5: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-dev3-github-placeholder-config-gating-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-dev3-github-placeholder-config-gating-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/auth-entry.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx
npm run build
```

## 完成标准

- 占位值不再被视为有效 GitHub OAuth 配置
- `/login` 与 `startGitHubOAuth()` 统一使用同一套判断
- 当前默认 `.env` 下不会误显示 GitHub 正式入口
- 聚焦测试和构建通过
