# GRS004 / DEV-3 GitHub OAuth 登录模型收口 Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-3 登录 / 角色 / Race Console`
  - 交付范围：`GitHub 登录`、`资料补全`
- `docs/grs004/ary-mvp.prd.md`
  - `MVP 使用 GitHub 登录作为账号入口`
- `docs/grs004/grs003-gap-analysis.md`
  - `GitHub 登录 | 🔶 部分解决`
  - `登录模型仍偏向"任何人都可直接注册/登录本地账号"`
  - `首页身份入口链路断点`
- `docs/grs004/github-oauth-ca-demo.md`
  - `GitHub OAuth as the formal login entry`
  - `local username/password forms as a development fallback`

当前代码里：

- `src/lib/github-oauth.ts`
  - OAuth service / state cookie / callback / session 创建都已具备
- `/login`
  - 页面文案已把 GitHub 写成正式入口
- 但 `src/lib/services/users.ts`
  - `registerUser()` / `loginUser()` 仍对所有环境开放本地账号
- `src/app/_components/ary-shared.tsx`
  - 本地登录 / 注册表单默认始终显示
- `src/app/login/page.tsx`
  - `SeedAccountsPanel` 默认始终显示

本轮目标是：**把“GitHub 作为正式账号入口，本地账号只保留开发 fallback”真正落实到 UI 和服务端限制，而不是只停留在文案层。**

## 范围

### 本轮纳入

- 新增统一配置 helper：
  - `isGitHubOAuthConfigured()`
  - `isLocalAuthFallbackEnabled()`
- `/login`
  - GitHub 作为正式入口
  - 本地账号表单只在 fallback 开启时显示
- `registerUser()` / `loginUser()`
  - 本地账号关闭时服务端拒绝
- `SeedAccountsPanel`
  - 只在本地 fallback 开启时显示

### 本轮不纳入

- 不做真实 GitHub 授权浏览器联调
- 不做 profile completion 工作流重构
- 不重做首页身份入口按钮结构
- 不移除数据库里的本地密码字段
- 不移除本地账号逻辑本身，只改成开发 fallback

## 约束

### 文档约束

- GitHub 应是正式账号入口
- 本地用户名 / 密码只能作为开发或演示兜底

### 当前代码现实

- OAuth 主链路已经有了
- 真正不符合文档的是“本地账号默认对所有环境开放”

因此本轮应遵循：

1. **不重写 OAuth 主链路**
2. **先收登录模型，不先做浏览器验收**
3. **服务端和 UI 同时收口**

## 方案选择

### 方案 A：GitHub 正式入口 + local fallback 开关

做法：

- `isGitHubOAuthConfigured()`
  - 判断是否具备 OAuth 环境变量
- `isLocalAuthFallbackEnabled()`
  - 默认：非 production 环境开启
  - 可用 `ARY_ENABLE_LOCAL_AUTH_FALLBACK` 显式覆盖
- `/login`
  - GitHub 按正式入口渲染
  - local fallback 关闭时：
    - 不渲染本地登录 / 注册表单
    - 不渲染 `SeedAccountsPanel`
- `registerUser()` / `loginUser()`
  - local fallback 关闭时直接拒绝

优点：

- 直接命中文档里的“登录模型未收口”
- 不破坏本地开发 / 演示兜底
- 改动小，风险可控

缺点：

- 还不能证明真实 GitHub 授权全链路已在浏览器中完整验收

### 方案 B：彻底删除本地账号

优点：

- 语义最彻底

缺点：

- 会直接破坏当前开发 / 演示兜底路径
- 超出文档里“development fallback”的允许范围

### 推荐方案

采用 **方案 A：GitHub 正式入口 + local fallback 开关**。

## 运行时规则

### 1. GitHub OAuth 配置

- `GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET` 同时存在时：
  - GitHub 按正式入口渲染

### 2. local auth fallback

- `ARY_ENABLE_LOCAL_AUTH_FALLBACK` 显式存在时：
  - 以该值为准
- 否则：
  - `NODE_ENV !== production` 时开启
  - `NODE_ENV === production` 时关闭

### 3. `/login`

- local fallback 开启：
  - GitHub 入口继续显示
  - 本地登录 / 注册表单继续作为开发兜底
  - `SeedAccountsPanel` 保留
- local fallback 关闭：
  - 只保留 GitHub 入口
  - 本地表单隐藏
  - `SeedAccountsPanel` 隐藏

### 4. 服务端兜底

- `registerUser()`
  - local fallback 关闭时：
    - 拒绝本地注册
- `loginUser()`
  - local fallback 关闭时：
    - 拒绝本地登录

## 用户可见变化

本轮落地后，用户现在能直接看到：

1. `/login`
   - GitHub 被明确保留为正式入口
2. 非开发 fallback 环境
   - 本地用户名 / 密码表单不再出现
   - 演示账号面板不再出现
3. 开发 fallback 环境
   - 本地表单仍在，但会明确标成开发 / 演示兜底

## 测试对齐

需要覆盖：

- `src/lib/auth-entry.test.ts`
  - helper 的环境开关逻辑
- `src/app/_components/public/public-copy-cleanup.test.tsx`
  - local fallback 关闭时不渲染本地表单
  - `/login` 只在 fallback 开启时保留 `SeedAccountsPanel`
  - `users.ts` 已有服务端 gating 文案

验证命令：

```bash
node --import tsx --test src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/actions.return-to.test.ts
npm run build
```

## 验收对齐

本轮完成后，需要能证明：

1. GitHub 仍是正式账号入口
2. 本地账号不再对所有环境默认开放
3. local auth 关闭时，UI 和服务端都会拒绝本地账号路径
4. 开发环境仍保留本地 fallback
5. 聚焦测试与构建通过

## 一句话结论

这轮不是“GitHub OAuth 全链路验收完成”，而是先把“本地账号默认开放”这条模型偏差收回来。

## 已落地实现补记（2026-07-11）

- `src/lib/auth-entry.ts`
  - 已新增：
    - `isGitHubOAuthConfigured()`
    - `isLocalAuthFallbackEnabled()`
- `src/app/login/page.tsx`
  - 已改为根据 fallback 开关决定是否显示本地表单和 `SeedAccountsPanel`
- `src/app/_components/ary-shared.tsx`
  - `AuthTabsPanel` 已支持只显示 GitHub 入口
- `src/lib/services/users.ts`
  - 本地注册 / 登录在 fallback 关闭时会被服务端拒绝
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/actions.return-to.test.ts`
  - `npm run build`
