# ARY for ARY

ARY (Agent Racing Yard) 是去中心化智能体赛事平台，核心理念 "Public Yard, Private Race Source"。
GRS004 协作功能已全部完成，仓库具备完整可运行的核心业务链路，覆盖：

- 公开赛事 / 作品 / 赛果 / Review 浏览
- 面向 `Admin`、`Organizer`、`Judge`、`Rider` 的分角色控制台
- 正式赛事生命周期管理（8 阶段）
- 报名审核、CA 接入、作品提交、评审、奖项、报告
- **队伍组建与多人协作**（Team 参赛模型、双审批、任务看板、队内私聊、知识库）
- 公共大屏展示路由与大屏控制台路由（已迁移至 Team 维度）
- 面向用户可见失败场景的页内友好报错

最近更新：`2026-07-15` — GRS003 收口完成，UI 全面翻新（Minimalist Modern 设计系统），Race 8 状态机，骑手画廊拍立得墙，首页 Hero 重设计，导航栏全局化，大屏展示独立化，全站链接审计+字体一致性修复

---

## 现在已经实现的功能

### 1. 正式赛事生命周期

- 赛事阶段统一为 `draft → published → registration → running → submitting → judging → completed → archived`
- 新建赛事默认不会直接公开，必须由 `Organizer` 或 `Admin` 显式发布
- 已完成赛事可以归档，归档后仍保留公开查看和历史回看入口
- 公共站点、控制台和大屏路由已按正式阶段切换文案和可用动作

### 2. 角色工作台主链路

- `Admin` 可以进入 `/console/races` 和 `/console/races/new`，创建赛事并指定 Organizer
- `Organizer` 可以正式管理 `settings`、`registrations`、`teams`、`works`、`judges`、`awards`、`reports`、`announcements`
- `Rider` 的链路已变成正式流程：报名 → 等待审核 → 组队（创建/加入）→ CA 接入 → 保存草稿 → 正式提交
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
- **GRS004 后 Work / Submission / Award 已全部切换为 Team 维度**，参赛主体从单人变为队伍

### 5. 公共站点和大屏展示

- 可直接访问 `/screen/{raceSlug}` 及子页：`live`、`leaderboard`、`works`、`announcement`、`billboard`
- Live Hall 和大屏实时页已具备3s自动刷新基线
- 大屏控制台已支持显示模式切换、主题切换、回退到稳定显示等动作
- **Jumbotron 大屏已迁移至 Team 维度**：赛马动画以队伍为单位渲染，entryId = team.id

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

### 8. 队伍组建与多人协作

GRS004 将参赛主体从单人升级为 **Team（队伍）模型**，支持 1 Leader + N Mate（1-5人），并提供了完整的队内协作工具链。

#### 8.1 Team 参赛模型

- 每个 Team 属于一场 Race，有 `captainId`（创建者）和 `leaderId`（队长）双角色
- Leader 是队内管理者，负责审批成员入队、分配任务
- Team 作为新的参赛主体，Work / Submission / Award / Report 等赛事产物全部归属 Team

#### 8.2 双审批入队流程

- Rider 报名赛事后，先由 **Organizer** 审批 Registration（`approved` / `rejected`）
- 通过后，Rider 可创建 Team 或申请加入已有队伍
- 加入队伍需通过 **Leader** 审批 Member（`APPROVED` / `REJECTED`）
- 两重审批任一未通过，队伍身份不会生效

#### 8.3 任务看板（TeamTask）

- Leader 可在队内创建任务（`TODO`），指派给特定 Mate
- Mate 完成任务后标记为 `DONE`，记录完成时间
- 支持任务标题、描述、指派和状态追踪

#### 8.4 协作消息（CollaborationMessage）

- 队内指定成员间私聊，非群聊广播
- 消息可关联知识资产（`linkedAssetType` + `linkedAssetId`），如作品、任务、提交记录
- 支持 sender / receiver 精确路由，用于队内协同讨论

#### 8.5 知识库（KnowledgeBase）

- 队伍级别的共享知识资产存储
- 与协作消息联动，可在讨论中引用知识条目
- 支持赛事期间队伍知识的积累与沉淀

---

## 各角色能看到什么

### Admin

- `/console/races` 和 `/console/races/new` 可用
- 能创建赛事并把赛事分配给指定 Organizer
- 能进入赛事 Organizer workspace 做系统级管理
- 可查看任意赛事的队伍结构（Team 成员列表和审批状态）
- 可审批企业合作申请（`cooperationRequest`）

### Organizer

- settings 区能看到发布、归档和显示设置动作
- registrations 区能看到 `submitted / approved / rejected / withdrawn` 正式审核状态，**按队伍维度聚合展示报名**
- teams 区可查看所有队伍及其成员审批状态（Leader / Mate / PENDING / APPROVED）
- works 区能管理作品公开、隐藏、锁定，**作品按 Team 聚合展示**
- judges 区能分配和移除评委
- reports 区能编辑团队评语、查看选手反馈并发送回复
- screen console 区能调大屏模式、主题、校准和回退显示

### Rider

- 登录页明确告知 GitHub 登录是否可用
- 报名后先进入待审核状态，审核通过后解锁后续流程
- CA 接入和作品提交在队伍身份生效后放开
- 可先保存草稿再正式提交

### Leader（队长）— Rider 在 Team 内的管理身份

- **创建队伍**：通过 Organizer 审批后，可创建 Team（自动成为 Leader），队伍规模 1-5 人
- **审批 Mate 入队**：管理其他 Rider 的入队申请，`approve` / `reject`。只有通过后该成员才正式成为 Mate
- **任务看板**：可创建任务（`TODO`）并指派给特定 Mate，追踪完成状态（`DONE`）
- **协作交流**：可向队内指定 Mate 发送私聊消息，关联知识资产（作品、任务、提交记录）
- **知识库**：队伍共享知识条目，可在讨论中引用

### Mate（队员）— Rider 在 Team 内的协作身份

- **加入队伍**：向已有 Team 提交入队申请，等待 Leader 审批
- **任务看板**：查看被分配的任务，完成后标记为 `DONE`
- **协作交流**：可向队内指定成员（Leader 或其他 Mate）发送私聊消息，关联知识资产
- **知识库**：队伍共享知识条目，可在讨论中引用

### Judge

- 能进入分配到的评审任务视图，看到作品摘要和骑行证据
- 评审对象为 **Team 作品**（非单人作品）
- 提交失败会留在当前视图并显示友好提示

### 公共访客 / 大屏观众

- `draft` 赛事不会出现在公开站点
- 已归档赛事仍可作为历史赛事查看
- 未公开作品不会泄漏到公开作品页
- `/screen/{raceSlug}` 及子页可直接打开
- **大屏赛马动画以 Team 为单位渲染**，每队一匹马

---

## 快速开始

### 环境要求

- `Node.js 20+`
- `npm`

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

| 账号                           | 密码             | 角色      |
| ------------------------------ | ---------------- | --------- |
| `organizer_demo`             | `organizer123` | Organizer |
| `admin_demo`                 | `organizer123` | Admin     |
| `judge_demo`                 | `rider123`     | Judge     |
| `rider_alice`                | `rider123`     | Rider     |
| `rider_bob`                  | `rider123`     | Rider     |
| `rider_charlie ~ rider_kate` | `rider123`     | Rider     |

**GRS004 多人队伍种子**：部分赛事已预置多人队伍数据，包含混合 PENDING/APPROVED 状态成员。例如 `race_active--sorting-challenge` 包含 3 支队伍（Fast Sort Squad 3人、Milk Tea Coder 2人、Bug Crusher 1人），可用于直接体验双审批流程和队内协作功能。

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
- **GRS004 协作链路**：Team 创建/加入、成员审批、任务看板、协作消息、知识库
- 最后再跑一次 `npm run build`

**当前测试统计**：51 个测试用例全部通过，tsc / ESLint 零错误。

### 建议手工验收的8组场景

1. **Admin 创建赛事**：登录 `admin_demo`，打开 `/console/races/new`，确认可以创建赛事并指定 Organizer
2. **Organizer 发布或归档赛事**：登录 `organizer_demo`，进入某场赛事 settings，确认能看到发布、归档和显示设置动作
3. **Rider 报名审核流**：在公开报名页提交报名，确认状态先进入 `submitted`，再由 Organizer 审核到 `approved` 或 `rejected`
4. **Rider CA 接入与作品提交**：登录 `rider_alice`，确认审核通过后才能继续 CA 接入和提交作品，并可先保存草稿再正式提交
5. **Organizer 作品公开控制**：在 works 区执行公开、隐藏、锁定动作，确认公开站点展示结果同步变化
6. **Organizer 报告与反馈回复**：在 reports 区确认可以编辑团队评语、查看选手反馈并发送回复
7. **大屏与公开展示**：打开 `/screen/race_active--sorting-challenge` 及子页，确认页面可直接访问、模式可切换、公开展示正常
8. **队伍协作验收**：以 Rider 身份创建/加入 Team → Leader 审批 Mate → Leader 分配任务 → Mate 完成任务 → 队内发送协作消息并关联知识资产，确认整条协作链路可用

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
- [`riding_record_grs004/`](riding_record_grs004/) — GRS004 阶段开发记录（小组分工与个人骑行记录）

## 一句话结论

现在把 GRS004 跑起来，你能直接看到的核心变化是：**Team 参赛模型替代单人参赛**、正式赛事生命周期、双审批报名入队流程、队内任务看板与协作消息、正式作品提交与公开控制、可用的公共站点与 Team 维度大屏展示，以及一整套面向真实用户的友好错误提示闭环。
