# GRS004 / 协作功能 Implementation Plan

## 目标

将 ARY 赛事平台从"个人参赛模型"升级为"团队协作参赛模型"。Rider 必须以 Team 形式参赛（支持单人成队），Team 内包含 Leader/Mate 双重身份标签，Team 统一管理提交、作品、知识库、评分和协作交流。

---

## 实施阶段划分

采用 5 阶段渐进式实施，每阶段完成后执行：`/cr` 审查 → `/fix` 修复（如有 bug）→ `/tests` 针对性测试（只跑当前阶段测试，不跑全额）。

### 阶段一：数据层奠基（Schema 迁移 + 基础校验）

**目标**：完成所有数据库模型变更，Prisma 迁移成功，Zod 校验就位。

| 任务 | 内容 |
|---|---|
| 1.1 | 修改 Team 模型：`leaderId` 替代 `captainId`，`@@unique([raceId, name])` |
| 1.2 | 修改 TeamMember 模型：新增 `role`/`status`，`@@unique([teamId, userId])` |
| 1.3 | 修改 Registration 模型：新增 `teamId?` |
| 1.4 | 修改 RaceProject 模型：`registrationId` → `teamId`（G2：关联 Team 而非 Registration） |
| 1.5 | 修改 Work 模型：`registrationId` → `teamId` |
| 1.6 | 修改 Submission 模型：新增 `modifiedByUserId`/`changeSummary` |
| 1.7 | 修改 Award 模型：`registrationId` → `teamId` |
| 1.8 | 新增 TeamTask 模型 |
| 1.9 | 新增 CollaborationMessage 模型 |
| 1.10 | 执行 `prisma migrate dev`，验证迁移成功 |
| 1.11 | 更新 Zod validation schemas（新增 Team/TeamTask/CollaborationMessage） |

**验收**：Schema 迁移成功 + Zod schema 完整 → `/cr` → `/fix` → `/tests`

---

### 阶段二：核心服务重构（Team + Registration + Work + Submission）

**目标**：完成参赛模型从个人到 Team 的核心链路重构。

| 任务 | 内容 |
|---|---|
| 2.1 | `teams.ts`（NEW）：createTeam / joinTeam / approveMember / removeMember / getTeamDetail / listTeamsForRace |
| 2.2 | `registrations.ts`（MODIFY）：registerForRace 增加 teamId 参数；Leader rejected → 删除 Team |
| 2.3 | `race-projects.ts`（MODIFY）：RaceProject 从 registrationId 改为 teamId（G2） |
| 2.4 | `works.ts`（MODIFY）：upsertWorkAsset 从 registrationId 改为 teamId |
| 2.5 | `submissions.ts`（MODIFY）：增加 modifiedByUserId/changeSummary + 赛中代码下载接口 |

**验收**：建队/入队/审批/踢出全链路 + RaceProject Team 归属 + Work/Submission Team 维度 → `/cr` → `/fix` → `/tests`

---

### 阶段三：协作模块新增（Task + Message + 知识库）

**目标**：实现 Team 内任务管理、私聊交流和知识库聚合导出。

| 任务 | 内容 |
|---|---|
| 3.1 | `team-tasks.ts`（NEW）：createTask / completeTask / listTasksForTeam |
| 3.2 | `collaboration.ts`（NEW）：sendMessage / listMessages / getConversation |
| 3.3 | `knowledge-base.ts`（NEW）：聚合查询（Work + Submissions + Tasks + Messages） |
| 3.4 | `knowledge-base.ts`：ZIP 导出 + 权限分层（成员/Organizer-Admin/Public） |

**验收**：Task CRUD + 私聊 + 知识库聚合 + ZIP 导出 → `/cr` → `/fix` → `/tests`

---

### 阶段四：评分体系重构（Award + 赛果 + 进度投影）

**目标**：Award 从个人改为 Team 维度，公开赛果展开 Team 成员，进度以 Team 为单位投影。

| 任务 | 内容 |
|---|---|
| 4.1 | `awards.ts`（MODIFY）：AwardCandidate 改为 teamId 维度，排除 REMOVED 成员 |
| 4.2 | `results.ts`（MODIFY）：公开赛果展开 Team 成员列表 |
| 4.3 | `projections.ts`（MODIFY）：Projection 投影到 Team 维度（G1：Team 内成员查看进度以 Team 为单位） |
| 4.4 | `rider-bridge.ts` / 相关查询：适配 Team 维度的 Rider 数据聚合 |

**验收**：Award 授予 Team + 成员继承 + 赛果展示 + Team 进度投影 → `/cr` → `/fix` → `/tests`

---

### 阶段五：UI 接入与集成收口

**目标**：Server Actions 接入，Console/公开页面适配 Team 维度，端到端验证。

| 任务 | 内容 |
|---|---|
| 5.1 | `actions.ts`：新增/修改所有 Team/Task/Message/Export/Download 相关 Action |
| 5.2 | rider-console：Team 信息/任务看板/协作消息/知识库下载/赛中代码下载 |
| 5.3 | organizer-console：Team 列表/审批入口/Team 详情 |
| 5.4 | 公开页面适配：Race Page/Results 展示 Team 维度 |
| 5.5 | Team 共享进度看板（RaceProject/CA 投影到 Team 的 UI 展示） |
| 5.6 | 端到端验收：`npm run build` + 手动走查 |

**验收**：全链路 UI 可操作 → `/cr` → `/fix` → `/tests`

---

## 执行纪律

- **每阶段结束**：调用 `/cr` 审查当前阶段代码 → 如有 bug 调用 `/fix` 修复 → 调用 `/tests` 编写针对性测试（只跑当前阶段测试）
- **不改动核心架构模式**：保持 Server Actions 集中管理、Zod 前置校验、$transaction 原子操作
- **不修改 Rider Profile UI 层**（G3 决策）
- **Mate 只能加入已 approved 的 Team**：Leader rejected → 直接删除 Team

---

## 技术栈

- 框架：Next.js 16 App Router + TypeScript 5
- 数据库：Prisma 7 + SQLite (better-sqlite3)
- 认证：JWT Cookie Session (jose) + GitHub OAuth
- 校验：Zod 4
- 架构模式：Service-Oriented Monolith（Server Actions → Services → Prisma）

---

## 核心策略

在现有"个人参赛"模型上进行**结构性迁移**，而非叠加新层。以 Team 为新的参赛主体，Registration 降级为"个人参赛申请记录 + Team 成员资格凭证"，通过 `Registration.teamId` 外键建立关联。利用 Prisma `$transaction` 保证关键流程（建队+注册、审批+入队、踢出+Award 回收）的原子性。

---

## 向后兼容

- 保留旧 `captainId` 字段作为兼容过渡，新增 `leaderId` 并逐步迁移
- `Team` 模型旧约束 `@@unique([raceId, captainId])` 在数据迁移完成后移除
- 旧 `Submission.registrationId` 保留为可选字段，确保现有数据不丢失
