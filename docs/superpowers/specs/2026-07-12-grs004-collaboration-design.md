# GRS004 / 协作功能 Design

版本：v0.1
日期：2026-07-12
状态：待实施
上游入口：用户需求文档 `ARY协作功能.md`（2026-07-12）
关联任务：DEV-COLLAB
参考基线：`docs/grs004/ary-domain-analysis.v0.3.md`、`docs/grs004/ary-mvp.prd.md`

---

## 1. 目的

将 ARY 赛事平台从"个人参赛模型"升级为"团队协作参赛模型"。Rider 必须以 Team 形式参赛（支持单人成队），Team 内包含 Leader/Mate 双重身份标签，Team 统一管理提交、作品、知识库、评分和协作交流。

---

## 2. 需求范围

### 2.1 Team 参赛体系

- Leader 创建 Team 时自动提交 Registration，待 Organizer 审批后正式生效
- Mate 通过加入已有 Team 提交 Registration，需同时通过 Organizer 审批和 Leader 同意（双重 AND 审批）
- 单人成队自动成为 Leader，多人成队创建者为 Leader，单 Leader 模式（一个 Team 只有一个 Leader）
- Team 人数限制 1-5 人，Team 名在 Race 内唯一
- Leader Registration 被 rejected → 直接删除 Team（只有 approved 的 Team 才能被 Mate 选择加入）
- Mate 不可主动退出，Leader 可踢出 Mate（历史贡献保留，但不传 Award）

### 2.2 Team 统一提交

- Submission 维度归 Team 所有，所有成员均可提交并覆盖上一位成员记录
- 提交时记录修改者（modifiedByUserId）和修改概括（changeSummary），不记录全部修改内容
- 赛中所有成员可随时下载"最新提交代码"

### 2.3 Team 共享 Work

- Work 维度从个人归属改为 Team 归属，Team 内共享同一个 Work 资产

### 2.4 Team 共享赛事进度

- RaceProject 从关联 Registration 改为关联 Team
- Team 内成员查看进度以 Team 为单位，而非个人维度
- CAConnection/Projection 投影到 Team 层级

### 2.5 Team 知识库

- 聚合视图（不新增存储），汇总 Work + Submission 历史 + Task 看板 + 协作交流记录
- 比赛结束后，Team 成员可手动导出为 ZIP（含全部交流记录）；Organizer/Admin 可下载；Public 只能下载 Organizer 公布内容

### 2.6 Team 任务看板

- Leader 可给 Mate 发布任务（title/description/assignee），Mate 完成后确认，看板同步状态

### 2.7 协作交流

- Team 内指定成员私聊（Send/Receive），消息关联知识库（linkedAssetType/linkedAssetId），记录完整历史

### 2.8 Team 共享评分

- Award 授予 Team，Team 内所有成员自动继承（被踢出成员除外）
- Rider Profile 不需要修改 UI 层

---

## 3. 技术方案

### 3.1 核心策略

在现有"个人参赛"模型上进行**结构性迁移**，而非叠加新层。以 Team 为新的参赛主体，Registration 降级为"个人参赛申请记录 + Team 成员资格凭证"，通过 `Registration.teamId` 外键建立关联。利用 Prisma `$transaction` 保证关键流程的原子性。

### 3.2 Schema 变更

#### 修改现有模型

| 模型 | 变更 |
|---|---|
| `Team` | 新增 `leaderId`（替代 `captainId`）、`@@unique([raceId, name])`、移除 `@@unique([raceId, captainId])` |
| `TeamMember` | 新增 `role` 枚举（LEADER/MATE）、`status` 枚举（PENDING/APPROVED/REJECTED/REMOVED）、`@@unique([teamId, userId])` |
| `Registration` | 新增 `teamId?` 外键 |
| `RaceProject` | `registrationId` → `teamId` |
| `Work` | `registrationId @unique` → `teamId @unique` |
| `Submission` | 新增 `modifiedByUserId`、`changeSummary` |
| `Award` | `registrationId` → `teamId` |

#### 新增模型

| 模型 | 字段 |
|---|---|
| `TeamTask` | id / teamId / creatorId / assigneeId / title / description / status（TODO/DONE）/ createdAt / completedAt |
| `CollaborationMessage` | id / teamId / senderId / receiverId / content / linkedAssetType / linkedAssetId / createdAt |

#### 新增枚举

```typescript
enum TeamMemberRole { LEADER, MATE }
enum TeamMemberStatus { PENDING, APPROVED, REJECTED, REMOVED }
enum TaskStatus { TODO, DONE }
```

---

## 4. 关键业务流程

### 4.1 Leader 创建 Team

```
Rider 触发 createTeamAction → Zod 校验 Team 名
→ $transaction:
  1. 检查 Race 处于 registration 阶段
  2. 检查 Team 名在 Race 内唯一
  3. 创建 Team (leaderId=当前用户, name)
  4. 创建 TeamMember (userId=当前用户, role=LEADER, status=APPROVED)
  5. 创建 Registration (userId=当前用户, teamId=新Team, status=SUBMITTED)
```

### 4.2 Mate 加入 Team

```
Rider 触发 joinTeamAction → Zod 校验
→ $transaction:
  1. 检查 Team 存在且 Leader Registration 已 APPROVED
  2. 检查 Team 人数 < 5
  3. 创建 Registration (userId=当前用户, teamId, status=SUBMITTED)
  4. 创建 TeamMember (userId=当前用户, role=MATE, status=PENDING)
→ 等待两条审批线：
  A. Organizer 审批 Registration (approveRegistrationAction)
  B. Leader 审批 TeamMember (approveMemberAction)
→ 入队条件: Registration.status == APPROVED AND TeamMember.status == APPROVED
```

### 4.3 Leader 踢出 Mate

```
Leader 触发 removeMemberAction
→ $transaction:
  1. 验证调用者是 Team Leader
  2. 更新 TeamMember.status = REMOVED
  3. 历史 Submission/Work 保留在 Team 内
  4. 后续 Award 生成时排除 REMOVED 成员
```

### 4.4 Team 解散

```
当 Leader Registration 被 Organizer rejected 时:
→ 直接删除 Team（只有 approved 的 Team 才能被 Mate 选择加入，不存在 Mate 已加入的情况）
```

### 4.5 Award 授予 Team

```
修改 publishAwardsForRace: AwardCandidate 从 registrationId 维度改为 teamId 维度
→ Award.teamId 指向 Team
→ 公开赛果展示时，展开 Team 成员列表，排除 REMOVED 成员
```

---

## 5. 目录结构

```
prisma/
├── schema.prisma                          # [MODIFY] Team/TeamMember/Registration/RaceProject/Work/Submission/Award；
                                           #   新增 TeamTask/CollaborationMessage 模型、枚举
└── migrations/                            # [NEW] Prisma 迁移文件

src/
├── app/
│   └── actions.ts                         # [MODIFY] 新增 createTeamAction/joinTeamAction/approveMemberAction/
                                           #   removeMemberAction/createTaskAction/completeTaskAction/
                                           #   sendMessageAction/exportKnowledgeBaseAction/downloadLatestCodeAction；
                                           #   修改 submitEntryAction/publishAwardAction 签名
├── lib/
│   ├── services/
│   │   ├── teams.ts                       # [NEW] createTeam/joinTeam/approveMember/removeMember/
│   │   │                                   #   getTeamDetail/listTeamsForRace
│   │   ├── team-tasks.ts                  # [NEW] createTask/completeTask/listTasksForTeam
│   │   ├── collaboration.ts              # [NEW] sendMessage/listMessages/getConversation
│   │   ├── knowledge-base.ts             # [NEW] 知识库聚合视图 + ZIP 导出
│   │   ├── registrations.ts              # [MODIFY] registerForRace 增加 teamId；
│   │   │                                   #   approveRegistrationForRace 增加 Leader rejected → 删除 Team
│   │   ├── race-projects.ts              # [MODIFY] RaceProject 从 registrationId 改为 teamId
│   │   ├── projections.ts                # [MODIFY] Projection 投影到 Team 维度
│   │   ├── submissions.ts                # [MODIFY] 增加 modifiedByUserId/changeSummary + 赛中代码下载
│   │   ├── works.ts                       # [MODIFY] upsertWorkAsset 从 registrationId 改为 teamId
│   │   └── awards.ts                      # [MODIFY] AwardCandidate 改为 teamId 维度，展开 Team 成员
│   └── validation.ts                      # [MODIFY] 新增 Team/TeamTask/CollaborationMessage Zod schema
├── app/
│   └── _components/
│       ├── console/
│       │   ├── rider-console-page.tsx     # [MODIFY] Team 信息/任务看板/协作消息/知识库下载/赛中代码下载
│       │   └── organizer-console-page.tsx # [MODIFY] Team 列表/审批入口/Team 详情
│       └── public/
│           ├── race-page.tsx              # [MODIFY] 展示 Team 参赛信息
│           └── results-page.tsx           # [MODIFY] 赛果展示 Team 维度
└── generated/prisma/                      # [AUTO] Prisma 客户端重新生成
```

---

## 6. 权限边界

| 操作 | Leader | Mate | Organizer | Admin | Public |
|---|---|---|---|---|---|
| 创建 Team | ✅ | - | - | ✅ | - |
| 审批 Mate 入队 | ✅ | - | - | ✅ | - |
| 踢出 Mate | ✅ | - | - | ✅ | - |
| 发布任务 | ✅ | - | - | ✅ | - |
| 完成任务 | - | ✅ | - | - | - |
| 发送私聊 | ✅ | ✅ | - | - | - |
| 提交代码 | ✅ | ✅ | - | - | - |
| 赛中下载代码 | ✅ | ✅ | ✅ | ✅ | - |
| 导出知识库 ZIP | ✅ | ✅ | ✅ | ✅ | ❌ (仅公布内容) |
| 审批 Registration | - | - | ✅ | ✅ | - |

---

## 7. 性能与可靠性

- 知识库聚合视图：Service 层一次查询关联数据（Team → Work + Submissions + Tasks + Messages），避免 N+1
- 下载 ZIP：使用 Node.js `archiver` 流式打包，避免大文件内存溢出
- `$transaction` 保证 Team 创建/加入/踢出/解散的原子性

---

## 8. 向后兼容

- 保留旧 `captainId` 字段作为兼容过渡，新增 `leaderId` 并逐步迁移
- `Team` 模型旧约束 `@@unique([raceId, captainId])` 在数据迁移完成后移除
- 旧 `Submission.registrationId` 保留为可选字段，确保现有数据不丢失

---

## 9. 不做什么

- 不做 DC invite 功能（由 DC 实现）
- 不做群聊（只做指定成员私聊）
- 不做知识库外部数据库接入（聚合视图）
- 不做 Rider Profile UI 层修改
- 不做多 Leader 模式（单 Leader）
- 不做 Mate 主动退出功能
