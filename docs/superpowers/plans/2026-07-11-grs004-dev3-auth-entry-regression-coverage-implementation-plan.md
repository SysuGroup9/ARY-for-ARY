# GRS004 / DEV-3 身份入口链路回归覆盖 Implementation Plan

## 目标

把 `grs004` gap 文档里关于“首页身份入口链路 / /login 空白历史问题”的剩余风险收成最小可回归证据。

## 任务拆分

### Task 1: 补 PublicHeader 身份入口回归测试

- [ ] 新增 `src/app/_components/public/public-auth-entry-regression.test.tsx`
- [ ] 覆盖：
  - 匿名用户仍跳到 `/login`
  - 已登录用户显示 `退出登录 / 进入控制台`
  - 不再显示匿名登录 CTA

### Task 2: 补 `/login` wiring 与 fallback gating 回归测试

- [ ] 在同一测试文件覆盖：
  - `github_callback_failed`
  - `github_not_configured`
  - `loginWithGitHubAction`
  - `returnTo`
  - `showLocalFallback`
  - `SeedAccountsPanel` gating

### Task 3: 补 helper 显式关闭回归

- [ ] 更新 `src/lib/auth-entry.test.ts`
- [ ] 覆盖 `ARY_ENABLE_LOCAL_AUTH_FALLBACK=false`

### Task 4: 记录最小运行时证据

- [ ] 启动本地开发服务器
- [ ] 记录：
  - `GET /`
  - `GET /login?returnTo=%2Fraces`
  - 均返回 `200`

### Task 5: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-dev3-auth-entry-regression-coverage-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-dev3-auth-entry-regression-coverage-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/public/public-auth-entry-regression.test.tsx src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/_components/public/public-header.test.tsx src/app/actions.return-to.test.ts
npm run build
```

## 完成标准

- 匿名首页身份入口仍直达 `/login`
- `/login` 仍保留 GitHub 正式入口 wiring 和 callback error 出口
- local fallback 显式关闭逻辑有测试覆盖
- 最小运行时 HTTP 证据存在
- 不夸大成“完整 GitHub OAuth 浏览器联调已完成”
