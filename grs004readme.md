# GRS004 README

更新时间：`2026-07-11`

## 当前进度

截至 `2026-07-11`，GRS004 已经从“底层模型和规则对齐”推进到“用户可以直接操作和验证”的阶段。现在这套仓库已经具备一条可以本地部署、可回归测试、可手工验收、可演示的主链路，而不是只停留在文档或零散功能点。

## 现在新增的功能是什么

### 1. 正式赛事生命周期已经落地

- 赛事阶段已经统一为 `draft -> published -> registration -> running -> submitting -> judging -> completed -> archived`。
- 新建赛事默认不会直接公开，必须由 `Organizer` 或 `Admin` 显式发布。
- 已完成赛事可以归档，归档后仍保留公开查看和历史回看入口。
- 公共站点、控制台和大屏路由已经开始按正式阶段切换文案和可用动作。

### 2. 角色工作台主链路已经打通

- `Admin` 可以进入 `/console/races` 和 `/console/races/new`，创建赛事并指定 Organizer。
- `Organizer` 可以正式管理 `settings`、`registrations`、`works`、`judges`、`awards`、`reports`、`announcements`。
- `Rider` 的链路已经变成正式流程：报名、等待审核、CA 接入、保存草稿、正式提交。
- `Judge` 可以进入分配到的评审任务视图，提交评审记录。
- `Screen` 已有独立的大屏展示页和控制台页。

### 3. 报名审核和参赛资格闸门已经正式化

- Rider 提交报名后，状态先进入 `submitted`，不再默认通过。
- Organizer 或 Admin 可以把报名处理为 `approved` 或 `rejected`。
- Rider 在允许阶段内可以主动撤回，状态会进入 `withdrawn`。
- 只有 `approved` 的报名，后续 CA 接入和作品提交通道才会解锁。

### 4. 作品提交与公开控制已经分离

- Rider 可以先保存作品草稿，再做正式提交。
- 草稿会物化为正式 `Work` 资产，但默认不会自动公开。
- 正式提交后进入 `SUBMITTED`，不再等同于“立即公开”。
- 作品的公开、隐藏、锁定控制权已经回到 Organizer 或 Admin。

### 5. 公共站点和大屏展示能力更完整

- 可直接访问 `/screen/{raceSlug}` 及其子页：`live`、`leaderboard`、`works`、`announcement`、`billboard`。
- `Live Hall` 和大屏实时页已具备 `3s` 自动刷新基线。
- `works`、`leaderboard`、`announcement` 等展示页已统一阶段文案和公开边界。
- 大屏控制台已支持显示模式切换、主题切换、回退到稳定显示等动作。

### 6. 登录、资料补全和 OAuth 状态更接近正式产品

- `/login` 会明确区分 GitHub OAuth 是否真的配置完成。
- 如果 `.env` 里仍是 `replace-with-*` 占位值，页面会提示 GitHub 登录未配置，而不是伪装成可用。
- 新用户或资料未补全用户会先进入 `/profile` 完成资料。
- Session 侧已清理旧的单值 `role` 残留，统一使用 `roles`。

### 7. 用户可见错误已经从原始异常收口为友好提示

- 登录、注册、资料补全、报名、CA 接入、作品提交、评审提交、大屏设置等失败场景，已经统一回到页面内错误卡片，而不是直接暴露原始异常。
- Organizer 的 settings、announcements、awards、reports、maintenance、CA status、judge assignment 等后台动作，失败时会回到原分区并显示中文错误提示。
- Admin 的建赛、角色管理、合作申请审批，失败时也会回到原页面显示友好提示。

### 8. 这轮刚补齐的用户可见能力

- Rider 现在可以在 review 页发送反馈，失败时会回到当前 review 页面显示错误提示。
- Organizer 现在可以在 reports 页直接回复选手反馈线程。
- Organizer 现在可以在 reports 页直接编辑并保存团队评语，不再只是只读展示。
- Organizer 在 judging 页触发兼容性评估失败时，会回到当前 judging 页面显示错误提示，而不是把用户甩回别处。

## 作为用户现在能看到什么具体改动

### Admin 视角

- 能看到 `/console/races` 和 `/console/races/new`。
- 能创建新赛事，并把赛事分配给指定 Organizer。
- 能进入赛事 organizer workspace 做系统级管理。

### Organizer 视角

- 在 settings 区能看到更正式的发布、归档和显示设置动作。
- 在 registrations 区能看到 `submitted / approved / rejected / withdrawn` 这种正式审核状态。
- 在 works 区能管理作品公开、隐藏、锁定。
- 在 judges 区能分配和移除评委。
- 在 reports 区能编辑团队评语，并直接回复选手反馈。
- 在 screen console 区能调大屏模式、主题、校准和回退显示。

### Rider 视角

- 登录页会明确告诉你 GitHub 登录是否真的可用。
- 注册、登录、资料补全失败时，先看到的是页面内中文提示，而不是技术异常。
- 报名后会先进入待审核状态。
- 审核通过后，CA 接入和作品提交流程才会放开。
- 在 review 页可以发起反馈，在 submission 页可以先保存草稿再正式提交。

### Judge 视角

- 能进入自己的评审任务视图。
- 能看到作品摘要、证据摘要和评审上下文。
- 提交失败时会留在当前视图并显示友好提示。

### 公共访客或现场大屏观众视角

- `draft` 赛事不会误出现在公开站点。
- 已归档赛事仍可作为历史赛事查看。
- 未公开作品不会泄漏到公开作品页。
- `/screen/{raceSlug}` 及其子页可以直接打开。
- 页面异常会落到统一错误页，而不是显示原始异常栈。

## 本地怎么部署

### 环境要求

- `Node.js 20+`
- `npm`
- 默认数据库：`SQLite`

### 1. 安装依赖

```powershell
cd D:\Desktop\ARY-for-ARY
npm install
```

### 2. 初始化环境变量

```powershell
Copy-Item .env.example .env
```

默认示例包含这些关键变量：

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

- 如果 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 仍是占位值，登录页会把 GitHub 登录视为“未配置”。
- 即使不先接 GitHub OAuth，本地也可以先使用 seed 账号验证主链路。

### 3. 初始化数据库并写入演示数据

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
```

### 4. 启动开发环境

```powershell
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

### 5. 做一次接近生产的本地启动验证

```powershell
npm run build
npm run start
```

### 6. 如果要走 Vercel 构建

仓库已经提供了构建脚本：

```powershell
npm run vercel-build
```

这个命令会按 `db:generate -> db:deploy -> db:seed -> next build` 的顺序执行。

## 可以直接使用的测试账号

执行完 `npm run db:seed` 后，可以直接使用这些账号：

- `organizer_demo / organizer123`
- `admin_demo / organizer123`
- `judge_demo / rider123`
- `rider_alice / rider123`
- `rider_bob / rider123`
- `rider_charlie ~ rider_kate / rider123`

## 怎么测试

### 最小部署验证

如果你只想确认“项目能装起来、数据库能起来、构建没坏”，跑这一组：

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
npm run build
```

### 一键主链路回归

仓库已经提供了 GRS004 主链路回归命令：

```powershell
npm run qa:p0
```

它会分模块执行这些验证，并在关键分段前自动重置 seed 数据：

- Auth / Profile / Role Governance
- Console Access / System Scope
- Race Lifecycle
- Registration / CA Participation
- CA Ingestion / Projection / Live / Screen
- Work Submission / Visibility / Public Routes
- Judging / Awards / Reports / Public Results
- 最后再跑一次 `npm run build`

### 建议手工验收的 7 组场景

1. Admin 创建赛事  
   登录 `admin_demo`，打开 `/console/races/new`，确认可以创建赛事并指定 Organizer。
2. Organizer 发布或归档赛事  
   登录 `organizer_demo`，进入某场赛事 settings 页，确认能看到发布、归档和显示设置动作。
3. Rider 报名审核流  
   在公开报名页提交报名，确认状态先进入 `submitted`，再由 Organizer 审核到 `approved` 或 `rejected`。
4. Rider CA 接入与作品提交  
   登录 `rider_alice`，确认审核通过后才能继续 CA 接入和提交作品，并可先保存草稿再正式提交。
5. Organizer 作品公开控制  
   在 works 区执行公开、隐藏、锁定动作，确认公开站点展示结果同步变化。
6. Organizer 报告与反馈回复  
   在 reports 区确认可以编辑团队评语、查看选手反馈线程并发送回复。
7. 大屏与公开展示  
   打开 `/screen/race_active--sorting-challenge` 及其子页，确认页面可直接访问、模式可切换、公开展示正常。

## 推荐先打开的页面

- `http://localhost:3000/login`
- `http://localhost:3000/console`
- `http://localhost:3000/console/races`
- `http://localhost:3000/console/races/new`
- `http://localhost:3000/races`
- `http://localhost:3000/works`
- `http://localhost:3000/races/race_signup--api-design-race/register`
- `http://localhost:3000/screen/race_active--sorting-challenge`
- `http://localhost:3000/screen/race_active--sorting-challenge/live`
- `http://localhost:3000/screen/race_active--sorting-challenge/announcement`

## 一句话结论

现在把 GRS004 跑起来，你能直接看到的核心变化是：正式赛事生命周期、正式报名审核链路、正式作品提交与公开控制、可用的公共站点与大屏展示，以及一整套面向真实用户的友好错误提示闭环。
