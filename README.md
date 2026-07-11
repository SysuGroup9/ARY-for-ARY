# ARY for ARY

ARY 是当前 GRS004 阶段的 Agent Racing 平台实现。这个仓库现在已经不是只有文档或原型，而是具备一条可以实际运行的核心业务链路，覆盖：

- 公开赛事 / 作品 / 赛果 / Review 浏览
- 面向 `Admin`、`Organizer`、`Judge`、`Rider` 的分角色控制台
- 正式赛事生命周期管理
- 报名审核、CA 接入、作品提交、评审、奖项、报告
- 公共大屏展示路由与大屏控制台路由
- 面向用户可见失败场景的页内友好报错，而不是直接暴露原始异常

## 当前重点

当前产品基线主要维护在：

- [`docs/grs004`](D:/Desktop/ARY-for-ARY/docs/grs004)
- [`docs/superpowers/status.md`](D:/Desktop/ARY-for-ARY/docs/superpowers/status.md)

如果你想看当前实现态的集中说明，优先阅读：

- [`docs/grs004/README.md`](D:/Desktop/ARY-for-ARY/docs/grs004/README.md)

## 当前已经能做什么

- 赛事阶段已统一为 `draft -> published -> registration -> running -> submitting -> judging -> completed -> archived`。
- `Admin` 可以创建赛事并分配 Organizer。
- `Organizer` 可以管理 settings、registrations、works、judges、judging、announcements、awards、reports、maintenance。
- `Rider` 可以报名、完成 CA 设置、保存作品草稿、正式提交作品、查看反馈。
- `Judge` 可以打开分配给自己的作品并提交评审记录。
- `/screen/{raceSlug}` 与 `/console/screen/{raceSlug}/{mode}` 已可用于公共展示和操作员控制。
- 登录、注册、资料补全、报名审核、提交、评审、GitHub OAuth 等失败路径，已经接入统一的页内错误提示。

## 快速开始

### 环境要求

- `Node.js 20+`
- `npm`
- `SQLite`

### 安装依赖

```powershell
cd D:\Desktop\ARY-for-ARY
npm install
```

### 初始化环境变量

```powershell
Copy-Item .env.example .env
```

当前示例环境变量如下：

```env
DATABASE_URL="file:./dev.db"
ARY_BASE_URL=http://localhost:3000
GITHUB_CLIENT_ID=replace-with-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=replace-with-github-oauth-app-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
ARY_RUNNER_TOKEN=ary-runner-dev-secret
ARY_RACE_ID=race_sort_demo
POLL_INTERVAL_MS=2000
TASK_TIMEOUT_MS=5000
```

补充说明：

- 如果 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 仍然是占位值，登录页会把 GitHub OAuth 视为“未配置”。
- 即使不先接 GitHub OAuth，本地也可以使用 seed 账号验证主链路。

### 初始化数据库

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
```

### 本地启动

```powershell
npm run dev
```

默认本地地址：

```text
http://localhost:3000
```

### 构建检查

```powershell
npm run build
```

### 本地模拟生产启动

```powershell
npm run build
npm run start
```

### Vercel 构建脚本

```powershell
npm run vercel-build
```

## 种子账号

执行完 `npm run db:seed` 后，可以直接使用以下账号：

- `organizer_demo / organizer123`
- `admin_demo / organizer123`
- `judge_demo / rider123`
- `rider_alice / rider123`
- `rider_bob / rider123`
- `rider_charlie ~ rider_kate / rider123`

## 常用入口

- `/`
- `/login`
- `/console`
- `/console/races`
- `/console/races/new`
- `/console/screen`
- `/races`
- `/works`
- `/races/race_signup--api-design-race/register`
- `/screen/race_active--sorting-challenge`
- `/screen/race_active--sorting-challenge/live`
- `/screen/race_active--sorting-challenge/leaderboard`
- `/screen/race_active--sorting-challenge/announcement`

## 建议手工验收的场景

1. 使用 `admin_demo` 登录，并从 `/console/races/new` 创建赛事。
2. 使用 `organizer_demo` 登录，检查现有赛事的发布、归档和 organizer 分区。
3. 在公开报名页完成一次 Rider 报名，并确认状态进入 `submitted`。
4. 由 Organizer 审核通过报名，确认 CA 设置和作品提交通道被解锁。
5. 以 Rider 身份提交作品，再由 Organizer 检查 `works`、`judging`、`reports`。
6. 打开 `/screen/race_active--sorting-challenge`，确认公共展示路由正常渲染。
7. 人为触发一个可控失败场景，例如输入错误账号密码，确认页面显示友好的页内错误提示。

## 相关文档

- [`docs/grs004/README.md`](D:/Desktop/ARY-for-ARY/docs/grs004/README.md)
- [`docs/grs004/ary-mvp.prd.md`](D:/Desktop/ARY-for-ARY/docs/grs004/ary-mvp.prd.md)
- [`docs/grs004/ary.plan.md`](D:/Desktop/ARY-for-ARY/docs/grs004/ary.plan.md)
- [`docs/grs004/ary-permission-matrix.md`](D:/Desktop/ARY-for-ARY/docs/grs004/ary-permission-matrix.md)
- [`docs/superpowers/status.md`](D:/Desktop/ARY-for-ARY/docs/superpowers/status.md)

## 一句话总结

这个仓库已经不再只是一个原型壳子。当前 GRS004 分支已经具备一条可运行的公开站点与控制台主链路，支持角色分权、赛事流程、大屏输出、seed 本地验证，以及比较完整的友好错误提示闭环。
