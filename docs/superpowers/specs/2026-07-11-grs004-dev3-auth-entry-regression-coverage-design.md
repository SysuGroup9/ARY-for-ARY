# GRS004 / DEV-3 身份入口链路回归覆盖 Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-3 登录 / 角色 / Race Console`
  - 交付范围：`GitHub 登录`、`资料补全`
- `docs/grs004/grs003-gap-analysis.md`
  - `GitHub 登录 | 🔶 部分解决`
  - `首页"身份入口"按钮跳转异常`
  - ` /login 浏览器空白`
- `docs/grs004/github-oauth-ca-demo.md`
  - `User clicks 使用 GitHub 登录`
  - callback error surfaces on `/login`

上一轮 `DEV-3 GitHub OAuth 登录模型收口` 已经把“GitHub 正式入口 + 本地开发 fallback”落到了 UI 和服务端限制，但还缺一块更贴近 gap 文档的问题：**首页公开身份入口、`/login` 的 GitHub 入口 wiring，以及 callback/fallback 文案是否已经有最小可回归证据。**

本轮目标是：**补一层严格受限的回归覆盖与运行时证据，证明首页匿名入口仍能进入 `/login`，`/login` 仍保留 GitHub 正式入口、returnTo 透传和 callback 错误出口；但不把这轮夸大成真实 GitHub 浏览器授权已经全部验收。**

## 范围

### 本轮纳入

- `PublicHeader`
  - 匿名访客仍应把身份入口指向 `/login`
  - 已登录用户不再显示登录 CTA，而是显示 `退出登录 / 进入控制台`
- `/login`
  - 页面源码继续保留：
    - `githubConfigured ? loginWithGitHubAction : undefined`
    - `returnTo`
    - `showLocalFallback`
    - `SeedAccountsPanel` gating
    - `github_callback_failed / github_not_configured`
- `auth-entry` helper
  - 补显式 `false` override 的回归测试
- 最小运行时证据
  - `GET /`
  - `GET /login?returnTo=...`
  - 均返回 `200`

### 本轮不纳入

- 不做真实 GitHub OAuth 浏览器授权点击验收
- 不做 callback 成功后的 session 持久化浏览器联调
- 不做 profile completion 工作流
- 不重做首页视觉或 Public Header 结构

## 约束

1. 遵循 `grs004` 文档原意，不扩大为新的认证方案设计。
2. 只补“历史断点”的可回归证据，不虚报“GitHub 浏览器联调完成”。
3. 既要有源码/渲染回归测试，也要有最小运行时 HTTP 证据。

## 方案

### 方案 A：补最小回归覆盖 + HTTP 运行时验收

做法：

- 新增 `src/app/_components/public/public-auth-entry-regression.test.tsx`
  - 验证匿名 `PublicHeader` 仍指向 `/login`
  - 验证已登录用户显示 `进入控制台`，不再回到登录 CTA
  - 验证 `/login` 源码仍保留 GitHub action wiring、callback error 文案与 fallback gating
- 扩 `src/lib/auth-entry.test.ts`
  - 补 `ARY_ENABLE_LOCAL_AUTH_FALLBACK=false` 的显式关闭回归
- 运行当前开发服务器
  - 记录 `GET /` 和 `GET /login?returnTo=%2Fraces` 的 `200` 证据

优点：

- 直接命中 gap 文档里的“身份入口链路断点 / login 空白”历史风险
- 改动极小，不引入新的行为分支
- 证据边界清晰，不会和“完整 OAuth 浏览器联调”混淆

缺点：

- 仍然不能证明真实 GitHub 授权成功链路在浏览器里已完整走通

### 推荐方案

采用 **方案 A：补最小回归覆盖 + HTTP 运行时验收**。

## 用户可见变化

这轮不是新增新页面，而是把已有入口的稳定性收口为可验证事实：

1. 首页匿名入口仍进入 `/login`
2. `/login` 仍保留 GitHub 正式入口
3. callback 失败与配置缺失仍会落到 `/login` 的错误提示
4. local fallback 的显示条件有明确回归覆盖

## 测试对齐

需要覆盖：

- `src/app/_components/public/public-auth-entry-regression.test.tsx`
- `src/lib/auth-entry.test.ts`
- `src/app/_components/public/public-copy-cleanup.test.tsx`
- `src/app/_components/public/public-header.test.tsx`
- `src/app/actions.return-to.test.ts`

验证命令：

```bash
node --import tsx --test src/app/_components/public/public-auth-entry-regression.test.tsx src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/_components/public/public-header.test.tsx src/app/actions.return-to.test.ts
npm run build
```

运行时证据：

```bash
Invoke-WebRequest -UseBasicParsing http://localhost:3000/
Invoke-WebRequest -UseBasicParsing "http://localhost:3000/login?returnTo=%2Fraces"
```

## 验收对齐

本轮完成后，需要能证明：

1. 匿名公开头部仍把身份入口指向 `/login`
2. 已登录公开头部不再暴露登录 CTA，而是进入控制台
3. `/login` 仍保留 GitHub 正式入口 wiring、returnTo 和 callback error 出口
4. local fallback 开关的显式关闭逻辑有测试覆盖
5. 聚焦测试、HTTP 页面请求和构建通过

## 一句话结论

这轮补的是“身份入口链路的可回归证据”，不是“GitHub OAuth 浏览器联调已完成”。
