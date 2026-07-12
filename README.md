# ARY for ARY

ARY 是当前 GRS004 阶段的 Agent Racing 平台实现。这个仓库已经具备一条可以实际运行的核心业务链路，覆盖：

- 公开赛事 / 作品 / 赛果 / Review 浏览
- 面向 `Admin`、`Organizer`、`Judge`、`Rider` 的分角色控制台
- 正式赛事生命周期管理（8 阶段）
- 报名审核、CA 接入、作品提交、评审、奖项、报告
- 公共大屏展示路由与大屏控制台路由
- 面向用户可见失败场景的页内友好报错

最近更新：`2026-07-12`

---

## 现在已经实现的功能

### 1. 正式赛事生命周期

- 赛事阶段统一为 `draft → published → registration → running → submitting → judging → completed → archived`
- 新建赛事默认不会直接公开，必须由 `Organizer` 或 `Admin` 显式发布
- 已完成赛事可以归档，归档后仍保留公开查看和历史回看入口
- 公共站点、控制台和大屏路由已按正式阶段切换文案和可用动作

### 2. 角色工作台主链路

- `Admin` 可以进入 `/console/races` 和 `/console/races/new`，创建赛事并指定 Organizer
- `Organizer` 可以正式管理 `settings`、`registrations`、`works`、`judges`、`awards`、`reports`、`announcements`
- `Rider` 的链路已变成正式流程：报名 → 等待审核 → CA 接入 → 保存草稿 → 正式提交
- `Judge` 可以进入分配到的评审任务视图，提交评审记录
- `Screen` 已有独立的大屏展示页和控制台页

### 3. 报名审核与参赛资格闸门

- Rider 提交报名后状态先进入 `submitted`，不再默认通过
- Organizer 或 Admin 可把报名处理为 `approved` 或 `rejected`
- Rider 在允许阶段内可主动撤回，状态进入 `withdrawn`
- 只有 `approved` 的报名，后续 CA 接入和作品提交通道才会解锁

### 4. 作品提交与公开控制分离

- Rider 可先保存作品草稿，再做正式提交
- 草稿物化为正式 `Work` 资产，但默认不自动公开
- 正式提交后进入 `SUBMITTED`，不等同于"立即公开"
- 作品的公开、隐藏、锁定控制权在 Organizer 或 Admin

### 5. 公共站点和大屏展示

- 可直接访问 `/screen/{raceSlug}` 及子页：`live`、`leaderboard`、`works`、`announcement`、`billboard`
- Live Hall 和大屏实时页已具备3s自动刷新基线
- 大屏控制台已支持显示模式切换、主题切换、回退到稳定显示等动作

### 6. 登录、资料补全和 OAuth

- `/login` 明确区分 GitHub OAuth 是否真的配置完成
- 如果 `.env` 仍是 `replace-with-*` 占位值，页面会提示 GitHub 登录未配置
- 新用户或资料未补全用户会先进入 `/profile` 完成资料
- Session 侧统一使用 `roles`，已清理旧的单值 `role` 残留

### 7. 用户可见错误友好提示

- 登录、注册、资料补全、报名、CA 接入、作品提交、评审提交、大屏设置等失败场景，已统一回到页面内中文错误卡片，不再暴露原始异常
- Organizer 后台动作（settings、announcements、awards、reports、judging 等）失败时回到原分区显示中文提示
- Admin 建赛、角色管理、合作申请审批失败时回到原页面显示友好提示
- Rider 在 review 页可发起反馈；Organizer 可在 reports 页回复选手反馈线程

---

## 各角色能看到什么

### Admin
- `/console/races` 和 `/console/races/new` 可用
- 能创建赛事并把赛事分配给指定 Organizer
- 能进入赛事 Organizer workspace 做系统级管理

### Organizer
- settings 区能看到发布、归档和显示设置动作
- registrations 区能看到 `submitted / approved / rejected / withdrawn` 正式审核状态
- works 区能管理作品公开、隐藏、锁定
- judges 区能分配和移除评委
- reports 区能编辑团队评语、查看选手反馈并发送回复
- screen console 区能调大屏模式、主题、校准和回退显示

### Rider
- 登录页明确告知 GitHub 登录是否可用
- 报名后先进入待审核状态，审核通过后 CA 接入和作品提交才放开
- 可先保存草稿再正式提交

### Judge
- 能进入分配到的评审任务视图，看到作品摘要和骑行证据
- 提交失败会留在当前视图并显示友好提示

### 公共访客 / 大屏观众
- `draft` 赛事不会出现在公开站点
- 已归档赛事仍可作为历史赛事查看
- 未公开作品不会泄漏到公开作品页
- `/screen/{raceSlug}` 及子页可直接打开

---

## 快速开始

### 环境要求

- `Node.js 20+`
- `npm`
- `SQLite`

### 安装依赖

```powershell
npm install
```

### 初始化环境变量

```powershell
Copy-Item .env.example .env
```

关键环境变量：

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

> 如果 `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 仍是占位值，登录页会把 GitHub OAuth 视为"未配置"，但不影响本地用 seed 账号验证主链路。

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

默认访问地址：`http://localhost:3000`

### 构建验证

```powershell
npm run build
```

### 本地模拟生产

```powershell
npm run build && npm run start
```

### Vercel 构建

```powershell
npm run vercel-build
```

此命令按 `db:generate → db:deploy → db:seed → next build` 顺序执行。

---

## 种子账号

执行 `npm run db:seed` 后可直接使用：

| 账号 | 密码 | 角色 |
|---|---|---|
| `organizer_demo` | `organizer123` | Organizer |
| `admin_demo` | `organizer123` | Admin |
| `judge_demo` | `rider123` | Judge |
| `rider_alice` | `rider123` | Rider |
| `rider_bob` | `rider123` | Rider |
| `rider_charlie ~ rider_kate` | `rider123` | Rider |

---

## 测试与验证

### 最小部署验证

```powershell
npm run db:generate && npm run db:deploy && npm run db:seed && npm run build
```

### 一键主链路回归

```powershell
npm run qa:p0
```

覆盖范围：

- Auth / Profile / Role Governance
- Console Access / System Scope
- Race Lifecycle
- Registration / CA Participation
- CA Ingestion / Projection / Live / Screen
- Work Submission / Visibility / Public Routes
- Judging / Awards / Reports / Public Results
- 最后再跑一次 `npm run build`

### 建议手工验收的7组场景

1. **Admin 创建赛事**：登录 `admin_demo`，打开 `/console/races/new`，确认可以创建赛事并指定 Organizer
2. **Organizer 发布或归档赛事**：登录 `organizer_demo`，进入某场赛事 settings，确认能看到发布、归档和显示设置动作
3. **Rider 报名审核流**：在公开报名页提交报名，确认状态先进入 `submitted`，再由 Organizer 审核到 `approved` 或 `rejected`
4. **Rider CA 接入与作品提交**：登录 `rider_alice`，确认审核通过后才能继续 CA 接入和提交作品，并可先保存草稿再正式提交
5. **Organizer 作品公开控制**：在 works 区执行公开、隐藏、锁定动作，确认公开站点展示结果同步变化
6. **Organizer 报告与反馈回复**：在 reports 区确认可以编辑团队评语、查看选手反馈并发送回复
7. **大屏与公开展示**：打开 `/screen/race_active--sorting-challenge` 及子页，确认页面可直接访问、模式可切换、公开展示正常

---

## 常用入口

```text
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/console
http://localhost:3000/console/races
http://localhost:3000/console/races/new
http://localhost:3000/console/screen
http://localhost:3000/races
http://localhost:3000/works
http://localhost:3000/races/race_signup--api-design-race/register
http://localhost:3000/screen/race_active--sorting-challenge
http://localhost:3000/screen/race_active--sorting-challenge/live
http://localhost:3000/screen/race_active--sorting-challenge/leaderboard
http://localhost:3000/screen/race_active--sorting-challenge/announcement
```

---

## 相关文档

- [`docs/grs004/README.md`](docs/grs004/README.md)
- [`docs/grs004/ary-mvp.prd.md`](docs/grs004/ary-mvp.prd.md)
- [`docs/grs004/ary.plan.md`](docs/grs004/ary.plan.md)
- [`docs/grs004/ary-permission-matrix.md`](docs/grs004/ary-permission-matrix.md)
- [`docs/superpowers/status.md`](docs/superpowers/status.md)

## 一句话结论

现在把 GRS004 跑起来，你能直接看到的核心变化是：正式赛事生命周期、正式报名审核链路、正式作品提交与公开控制、可用的公共站点与大屏展示，以及一整套面向真实用户的友好错误提示闭环。