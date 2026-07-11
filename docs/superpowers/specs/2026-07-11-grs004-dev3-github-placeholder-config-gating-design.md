# GRS004 / DEV-3 GitHub Placeholder Config Gating Design

## 目的

本设计直接承接：

- `docs/grs004/github-oauth-ca-demo.md`
  - `.env` 示例使用 `replace-with-github-oauth-app-client-id`
  - `replace-with-github-oauth-app-client-secret`
- `docs/grs004/grs003-gap-analysis.md`
  - `GitHub OAuth 登录 | 🔶`
  - 真实验收仍未完成
- 当前代码状态
  - `isGitHubOAuthConfigured()` 只检查非空
  - `.env` / `.env.example` 里的占位值会被误判成“已配置”

这会导致一个真实问题：

- `/login` 会误显示 GitHub 正式入口
- 用户点击后只会拿着假 `client_id` 走授权链路
- 这会干扰后续真实浏览器验收

本轮目标是：**把占位值从“已配置”改成“未配置”，并让 `/login` 和 `startGitHubOAuth()` 使用同一套可用配置判断。**

## 范围

### 本轮纳入

- `isGitHubOAuthConfigured()` 改为识别占位值
- 新增统一 helper，返回“可用的 GitHub OAuth credentials”或 `null`
- `startGitHubOAuth()`
  - 改为复用同一套判断
- 运行时验证
  - 当前 `.env` 仍是占位值时：
    - `/login` 不再渲染 GitHub OAuth 表单按钮

### 本轮不纳入

- 不做真实 GitHub OAuth 浏览器授权成功验收
- 不改 `.env.example` 的占位内容
- 不做新的账号流程设计

## 约束

1. 只按当前文档里已有占位格式 `replace-with-*` 识别。
2. 不引入新的配置中心。
3. 保持现有 `github_not_configured` 回退语义。

## 方案

### 方案 A：占位值识别 + 统一 credential helper

做法：

- 在 `src/lib/auth-entry.ts` 中新增：
  - 占位值识别
  - `getGitHubOAuthCredentials()`
- `isGitHubOAuthConfigured()`
  - 改为基于 `getGitHubOAuthCredentials()`
- `src/lib/github-oauth.ts`
  - `startGitHubOAuth()`
  - `exchangeCodeForAccessToken()`
  - 都复用新的 helper

优点：

- 直接解决“假配置被当成真配置”的误导
- 不改变真实配置下的正常行为
- 为后续浏览器联调清掉一个前置噪音源

### 推荐方案

采用方案 A。

## 用户可见变化

在当前仓库默认 `.env` 仍使用占位值的情况下：

1. `/login` 不再误显示 GitHub OAuth 按钮
2. 本地 fallback 仍可见时，用户只会看到本地登录 / 注册兜底
3. 若有人强行触发 GitHub action，仍会回到 `github_not_configured`

## 测试对齐

需要覆盖：

- `src/lib/auth-entry.test.ts`
  - `replace-with-*` 占位值应返回 `false`
- `src/app/_components/public/public-auth-entry-regression.test.tsx`
  - `github-oauth.ts` 继续保留 `github_not_configured` 路径
  - 且已接入 `isGitHubOAuthConfigured`

运行时证据：

- 当前 `.env` 使用占位值时：
  - `GET /login?returnTo=%2Fraces`
  - HTML 中不再出现：
    - `auth-oauth-form`
    - `使用 GitHub 登录` 按钮

## 验收对齐

本轮完成后，需要能证明：

1. 占位值不再被误判为“已配置”
2. `/login` 与 `startGitHubOAuth()` 使用同一套判断
3. 当前默认 `.env` 下不会误显示 GitHub 正式入口
4. 聚焦测试和构建通过

## 一句话结论

这轮不是“GitHub OAuth 联调完成”，而是先把“假配置被当成真配置”的干扰源清掉。
