# ARY for ARY

ARY 是一个面向 Agent Racing 演示场景的全栈项目，当前仓库已经拆成两套体验：

- 公开站：赛事、作品、骑手、赛果、合作入口
- 控制台：按角色进入赛事工作台、管理控制台和大屏控制台

当前主要技术栈：

- `Next.js 16`
- `React 19`
- `Prisma 7`
- `SQLite`

## 项目入口

常用页面：

- 公开首页：`/`
- 登录页：`/login`
- 控制台首页：`/console`
- 赛事列表：`/races`
- 大屏页：`/jumbotron/[raceId]`
- 赛道校准工具：`/calibrator`

seed 后默认会有 3 场演示赛事：

- `race_active`：`Sorting Challenge`，进行中
- `race_signup`：`API Design Race`，报名中
- `race_finished`：`Performance Marathon`，已结束

## 演示账号

先执行：

```bash
npm run db:seed
```

默认账号如下：

| 角色 | 用户名 | 密码 | 说明 |
| --- | --- | --- | --- |
| Organizer | `organizer_demo` | `organizer123` | 主办方演示账号 |
| Admin | `admin_demo` | `organizer123` | 管理员演示账号 |
| Judge | `judge_demo` | `rider123` | 评委演示账号 |
| Rider | `rider_alice` ~ `rider_kate` | `rider123` | 骑手演示账号 |

## 分角色教程

### 公开访客

1. 打开首页 `/`
2. 进入 `赛事`、`作品`、`骑手`、`合作`
3. 在赛事详情页按状态选择：
   - 报名中：进入报名页
   - 进行中：进入实况大厅
   - 已结束：查看赛果、作品和复盘

### Rider

1. 打开 `/login`
2. 可优先点击 `使用 GitHub 登录`；本地 `rider_* / rider123` 仍保留为开发兜底
3. 登录后可在公开首页点 `进入控制台`，或直接打开 `/console`
4. 进入 `赛事控制台`
5. 选择目标赛事

不同赛事状态下的 Rider 路径：

- 报名中赛事：
  1. 打开公开赛事报名页，例如 `/races/race_signup--api-design-race/register`
  2. 点击 `报名参赛`
  3. 报名成功后进入 Rider 工作台的 `报名` 页面

- 比赛中 / 提交中赛事：
  1. 打开 `/console/races/race_active--sorting-challenge/rider/submission`
  2. 在 `作品提交` 页面选择本地代码文件，或直接填写代码文件名、Agent 类型、Token 消耗和代码内容
  3. 点击 `提交代码并进入待评测队列`

- 已结束赛事：
  1. 打开 `/console/races/race_finished--performance-marathon/rider/submission`
  2. 在赛后提交页分别选择本地最终代码和本地 `Riding Record`
  3. 点击 `提交赛后代码与 Riding Record`

Rider 控制台的主要分区：

- `报名`
- `CA 接入`
- `骑行状态`
- `作品提交`
- `评审结果`
- `骑手报告`

### Organizer

1. 使用 `organizer_demo / organizer123` 登录
2. 打开 `/console`
3. 进入 `赛事控制台`

Organizer 的常见路径：

1. `创建赛事`
   - 打开 `/console/races/new`
   - 填写赛事基础信息、时间窗口、展示选项和权重

2. `管理单场赛事`
   - 打开某场赛事
   - 默认进入 `Organizer View`
   - 可继续进入：
     - `overview`
     - `settings`
     - `registrations`
     - `riders`
     - `ca-status`
     - `works`
     - `judges`
     - `judging`
     - `awards`
     - `reports`
     - `maintenance`

3. `大屏与展示`
   - 打开 `/console/screen`
   - 选择赛事后进入：
     - `jumbotron`
     - `billboard`
     - `live`
     - `leaderboard`
     - `works`
     - `announcement`
     - `calibration`

### Judge

1. 使用 `judge_demo / rider123` 登录
2. 打开 `/console`
3. 进入 `赛事控制台`
4. 打开被分配的赛事
5. 进入 `Judge View`

Judge 的主要分区：

- `assigned`
- `reviewing`
- `submitted`

评审时可以查看作品摘要、证据摘要，并提交评审结果。

### Admin

1. 使用 `admin_demo / organizer123` 登录
2. 打开 `/console`
3. 进入 `管理控制台`

Admin 的主要分区：

- `users`
- `profile-completion`
- `roles`

用于查看用户、资料补全状态和角色分配。

## 运行教程

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

本项目默认使用本地 SQLite：

```bash
copy .env.example .env
```

如果你已经有 `.env`，确认至少包含：

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET=replace-with-a-long-random-string
ARY_BASE_URL=http://localhost:3000
GITHUB_CLIENT_ID=replace-with-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=replace-with-github-oauth-app-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

GitHub OAuth 说明：

- `ARY_BASE_URL` 用于默认推导回调地址。
- `GITHUB_CALLBACK_URL` 可选；如果显式填写，它会覆盖默认推导值。
- GitHub OAuth App 的 callback URL 需要与 `http://localhost:3000/api/auth/github/callback` 或你的部署地址完全一致。

### 3. 生成 Prisma Client

```bash
npm run db:generate
```

### 4. 执行迁移

```bash
npm run db:migrate
```

### 5. 写入演示数据

```bash
npm run db:seed
```

### 6. 启动开发环境

```bash
npm run dev
```

启动后访问：

- [http://localhost:3000](http://localhost:3000)

### 7. 生产构建验证

```bash
npm run build
```

### 8. 常用验证命令

```bash
npm run lint
npm run build
```

## GitHub OAuth 与真实 agent 演示

### GitHub OAuth

1. 在 GitHub Developer Settings 中创建 OAuth App。
2. Homepage URL 填本地或部署地址。
3. Callback URL 填 `http://localhost:3000/api/auth/github/callback`。
4. 将 Client ID / Client Secret 写入根目录 `.env`。
5. 启动项目后打开 `/login`，点击 `使用 GitHub 登录`。

### Real agent / CA connector demo

仓库内已提供一个最小 connector 演示器：[`organizer_demo/ca_connector_demo/README.md`](ARY-for-ARY/organizer_demo/ca_connector_demo/README.md)

它会完成三步：

1. 调用 ARY handshake API
2. 推送 `session_started` / `task_progress` signal
3. 本地暴露 snapshot 接口，供 Rider 控制台手动抓取

适合本地把 `CAConnection -> handshake -> signal -> snapshot fetch` 这条链路完整跑通。

## 目前推荐的最短体验路径

### 体验 Rider 全流程

1. `npm run db:seed`
2. 登录 `rider_alice / rider123`
3. 在 `/races/race_signup--api-design-race/register` 报名
4. 在 `/console/races/race_active--sorting-challenge/rider/submission` 选择本地代码并提交赛中作品
5. 在 `/console/races/race_finished--performance-marathon/rider/submission` 选择本地最终代码与 Riding Record 后提交

### 体验 Organizer 路径

1. 登录 `organizer_demo / organizer123`
2. 打开 `/console/races`
3. 进入任一赛事的 Organizer 工作台
4. 或打开 `/console/races/new` 创建新赛事

### 体验公开展示

1. 打开首页 `/`
2. 进入进行中赛事页
3. 打开实况大厅 `/races/race_active--sorting-challenge/live`
4. 打开全屏大屏 `/jumbotron/race_active`

## 相关文档

- [docs/grs001/PRD.md](D:/Desktop/ARY-for-ARY/docs/grs001/PRD.md)
- [docs/grs002/Jumbotron-PRD.md](D:/Desktop/ARY-for-ARY/docs/grs002/Jumbotron-PRD.md)
- [docs/grs002/Jumbotron信息架构.md](D:/Desktop/ARY-for-ARY/docs/grs002/Jumbotron信息架构.md)
- [docs/grs002/Jumbotron子系统定义.md](D:/Desktop/ARY-for-ARY/docs/grs002/Jumbotron子系统定义.md)
- [docs/grs003/README.md](D:/Desktop/ARY-for-ARY/docs/grs003/README.md)
