---
session: 6f165d18-97ef-4f07-82dc-b5f366798d40
project: 
cwd: d:\作业\大二下\软工\大作业
hostname: DESKTOP-UTLHFV0
git_branch: main
claude_version: 2.1.165
started_at: 2026-06-06T06:29:22.344Z
ended_at: 2026-06-06T13:42:31.712Z
exported_at: 2026-06-07T01:49:45.895Z
source: C:\Users\a\.claude\projects\d---------------\6f165d18-97ef-4f07-82dc-b5f366798d40.jsonl
duration: 7h 13m 9s
---

# 6f165d18-97ef-4f07-82dc-b5f366798d40

---

**User**

阅读现在的项目内容，梳理项目架构，最重要的是阅读prd文档然后检查现在已经实现的功能与prd要求的有没有冲突、遗漏或新增的部分，给我反馈。

---

**Assistant**

Now let me explore the source code and database schema in depth.

Let me check a few more details to complete the analysis.

---

## 项目架构梳理

### 技术栈
- **前端**: Next.js 16 App Router + TypeScript
- **数据库**: Prisma 7 + SQLite (better-sqlite3)
- **认证**: Cookie Session (jose JWT)
- **校验**: Zod 4
- **部署**: Vercel (SQLite 运行时复制到 `/tmp/ary-runtime/`)

### 目录结构

```
src/
├── app/
│   ├── page.tsx              # 单页应用（所有功能集中在一个页面）
│   ├── layout.tsx            # 根布局
│   ├── actions.ts            # Server Actions（注册/登录/赛事/提交/反馈等）
│   ├── globals.css           # 全局样式
│   └── api/runner/tasks/     # Runner API（pull + result）
├── lib/
│   ├── auth.ts               # Session 认证（JWT + cookie）
│   ├── prisma.ts             # Prisma 客户端（SQLite 适配器）
│   ├── race-phase.ts         # 赛事状态机
│   ├── validation.ts         # Zod schema
│   ├── constants.ts          # 防作弊关键词 + Runner Token
│   ├── format.ts             # 日期/角色格式化
│   └── services/             # 业务逻辑层
│       ├── races.ts          # 赛事 CRUD
│       ├── teams.ts          # 队伍管理
│       ├── submissions.ts    # 提交/Runner/榜单/赛后展示
│       ├── feedback.ts       # 反馈私信
│       ├── scoring.ts        # 评分引擎
│       └── users.ts          # 用户注册/登录
└── generated/prisma/         # Prisma 生成代码
```

### 数据模型 (12 张表)

`User` → `Race` → `Team` → `TeamMember` / `Submission` / `TeamArchive` / `FeedbackThread` → `FeedbackMessage` / `Notification` / `LeaderboardEntry` / `HarnessEntry` / `RidingHighlight` / `TeamComment`

---

## PRD 对比分析报告

> 以根目录 `PRD.md`（v5.0）为基准，`ARY-for-ARY/PRD.md` 为辅助参考。

---

### ✅ 已实现且与 PRD 一致的功能

| # | PRD 要求 | 实现情况 |
|---|---------|---------|
| 1 | Organizer/Rider 注册登录 | ✅ Cookie Session，bcrypt 密码哈希 |
| 2 | Organizer 创建赛事（基础信息/时间/评价/展示/其他） | ✅ 表单字段完整，含所有权重配置 |
| 3 | 时间线约束（报名开始≤结束≤比赛开始≤结束） | ✅ Zod `superRefine` 校验 |
| 4 | 每组人数上限默认5人 | ✅ `maxTeamSize` 默认 5 |
| 5 | 提交频率限制（默认24h） | ✅ `submissionIntervalHours`，前后端均校验 |
| 6 | 赛后展示选项勾选（训练数据/评论/亮点/代码） | ✅ 4 个 checkbox 分别控制 |
| 7 | 展示前N名 Riding 亮点（默认3） | ✅ `displayHighlightCount` 默认 3 |
| 8 | Rider 反馈（私信，仅 Organizer 和对应队伍可见） | ✅ FeedbackThread + FeedbackMessage，按 captainId 过滤可见性 |
| 9 | 反馈状态（pending/resolved） | ✅ Organizer 回复时可标记 resolved |
| 10 | Organizer 修改题目/训练数据 + 自动通知 | ✅ `updateRaceContent` + 自动创建 Notification |
| 11 | 赛后评论（可对所有队伍评论） | ✅ TeamComment，每队一条 |
| 12 | 一键清除比赛 | ✅ `clearRace` 级联删除 |
| 13 | Audience 无需登录浏览 | ✅ 未登录用户可看到公开赛事、榜单、展示 |
| 14 | 赛后完整排名直接公开 | ✅ LeaderboardEntry |
| 15 | Runner 拉取任务 API | ✅ `GET /api/runner/tasks/pull?raceId=` |
| 16 | Runner 回传结果 API | ✅ `POST /api/runner/tasks/result` |
| 17 | 评分后清空提交正文（临时数据删除） | ✅ `codeContent: null, ridingRecord: null` |
| 18 | 评分权重可配置 | ✅ 7 个权重字段，`normalizeWeights` 归一化 |
| 19 | 数据边界：Organizer 测试代码不进 ARY | ✅ Runner 完全在 Organizer 侧 |
| 20 | 比赛状态自动计算 | ✅ `getRacePhase()` 5 状态 |

---

### ⚠️ 与 PRD 有差异的实现

#### 1. 榜单更新方式 — **PRD 要求自动，实现为手动**

**PRD 3.2.3 描述**：「ARY 每隔固定颗粒度给 Organizer 发送读取进度请求…ARY 在榜单中更新」

**当前实现**：Organizer 需要手动点击「同步公开榜单」按钮（`publishLeaderboardAction`）。`updateGranularityMinutes` 字段已存储在数据库中但未被任何定时任务使用。没有 cron job、没有自动推送。

**影响**：中等。榜单不会自动更新，依赖 Organizer 人工触发。

---

#### 2. 赛后 Harness 能力评价 — **PRD 要求 Organizer 评价，实现为 ARY 内部计算**

**PRD 3.2.4 描述**：「ARY 发送 Riding 记录和代码给 Organizer → Organizer 进行 Harness 能力评价 → Organizer 返回评价结果给 ARY → ARY 更新 Harness 能力榜单」

**当前实现**：`buildHarnessScore()` 在 ARY 内部直接计算（`reasoningScore * 0.6 + keywordScore * 0.4`），没有将数据发给 Organizer 评价的环节。

**影响**：中等。Harness 榜单变成了 ARY 自动计算，而非 Organizer 人工评估。这与 PRD「去中心化」的核心理念有偏差——Organizer 本应自行评价 Rider 的驾驭能力。

---

#### 3. 缺少企业下载功能 — **旧 PRD 要求，未实现**

**ARY-for-ARY/PRD 9.1 描述**：
- 下载所有参赛者代码（最高分提交版本）
- 下载所有 Riding 记录
- 下载评分结果（JSON 格式）

**当前实现**：完全没有下载 API 或按钮。`TeamArchive` 表已保留了最高分提交的完整数据，但没有任何导出功能。

**主 PRD（v5.0）态度**：未明确提及下载功能。推测是主 PRD 有意简化的结果。

**影响**：如果以旧 PRD 为基准则是遗漏；如果以主 PRD v5.0 为基准则不属于需求。

---

#### 4. Runner 认证 Token — **全局固定，非按赛事配置**

**ARY-for-ARY/PRD 5.2 描述**：「企业创建赛事时配置 Runner 认证 Token」

**当前实现**：使用全局常量 `DEFAULT_RUNNER_SECRET = "ary-runner-dev-secret"`（可由 `RUNNER_TOKEN` 环境变量覆盖），所有赛事共享同一个 Token。

**影响**：安全性与隔离性不足，但 README 中已标注「Runner 鉴权仍是简单 bearer token」。

---

#### 5. 题目压缩包 — **仅有标签字符串，无真实文件**

**PRD 3.2.1**：「题目压缩包（含任务描述，可含训练数据）」

**当前实现**：`taskPackageLabel` 仅存储一个字符串（如 `"sort-task-v1.zip"`），没有文件上传功能。题目描述以纯文本 `taskDescription` 和 `trainingDataSummary` 存储。

**影响**：低（演示环境下可接受）。

---

#### 6. 临时文件自动过期删除 — **PRD 提及但未实现**

**PRD 6.3**：「临时文件默认 24 小时后自动过期删除」

**当前实现**：评分后立即将 `codeContent` 和 `ridingRecord` 置为 `null`，但没有处理「Runner 长时间不拉取导致数据残留」的场景。没有定时清理任务。

**影响**：低（评分后立即清空的策略已经满足核心需求）。

---

#### 7. 界面结构 — **PRD 要求多页面，实现为单页**

**PRD 5.1-5.3**：分别定义了赛事列表页、赛事详情页、赛后展示页

**当前实现**：所有功能集中在一个页面。按赛事状态分组展示在侧边栏，每个赛事展开显示详情、榜单、提交、反馈、赛后展示。

**影响**：低（功能完整，只是组织形式不同）。

---

### 🔴 缺失的功能（PRD 要求但未实现）

| 缺失功能 | PRD 引用 | 严重程度 |
|---------|---------|---------|
| **榜单自动按颗粒度更新** | PRD 3.2.3、7.2「榜单按颗粒度更新」 | **高** |
| **赛后 Harness 评价需经 Organizer** | PRD 3.2.4 | **高** |
| **赛后下载功能**（代码/Riding/评分） | ARY-for-ARY PRD 9.1 | 中（旧 PRD） |
| **Runner Token 按赛事配置** | ARY-for-ARY PRD 5.2 | 中 |
| **Runner 拉取间隔配置** | ARY-for-ARY PRD 5.2 | 低 |

---

### 🟢 实现中 PRD 未明确要求但存在的功能（新增）

| 新增功能 | 说明 |
|---------|------|
| **封榜（Frozen）阶段** | `enableFreeze` + `freezeMinutesBeforeEnd`，比赛结束前 N 分钟隐藏榜单。旧 PoC 文档有提及，主 PRD 未强调 |
| **防作弊检测** | `antiCheatPenalty`：检测「满分」「给高分」等诱导词，扣 20 分 |
| **Token 上限** | `tokenLimit` 字段，用于计算 Token 效率分 |
| **Agent 类型追踪** | 6 种 Agent 类型（Claude/Copilot/DeepSeek/Zhipu/OpenAI/Custom），提交时记录并在榜单展示 |
| **CloudStudio URL** | 每个赛事可配置外部 IDE 链接 |
| **最高分归档** | `TeamArchive` 表自动保留每队最高分提交（upsert 逻辑） |

---

### 📋 PRD 自身已标记的已知限制（Section 8）

PRD v5.0 在 **第 8 章「下一步计划」** 中明确列出了以下限制，与当前实现一致：

| 限制 | 状态 |
|------|------|
| 组队功能不完整（缺乏创建队伍、邀请成员、队长权限） | ✅ 已知限制，匹配实现 |
| Reviewer/Contributor 角色未实现 | ✅ 已知限制，匹配实现 |
| Agent 给出参赛队伍建议未实现 | ✅ 已知限制，匹配实现 |
| 比赛期间更正题目后排名处理规则未定义 | ✅ 已知限制，匹配实现 |

---

## 总结建议

### 🔴 高优先级（核心逻辑偏差）

1. **榜单自动更新** — `updateGranularityMinutes` 已有字段，建议实现一个 cron job 或在页面端加轮询，自动调用 `publishLeaderboard`。或者至少在文档中说明当前为手动模式。

2. **Harness 评价应改为 Organizer 参与** — 当前 `buildHarnessScore()` 在 ARY 内部计算，与 PRD 3.2.4 流程不符。建议：提供 API 让 Organizer 提交 Harness 评分，而非 ARY 自行计算。

### 🟡 中优先级（功能完整性）

3. **赛后下载功能** — 如果以旧 PRD 为参照需要补上；如果以主 PRD v5.0 为基准则可暂缓。`TeamArchive` 表已准备好数据。

4. **Runner Token 按赛事隔离** — 建议将 `runnerToken` 加入 Race 模型，而非使用全局 token。

### 🟢 低优先级（可接受）

5. 单页 vs 多页面 — 功能完整，组织形式不影响验证 PRD 核心命题。
6. 题目文件上传 — 演示阶段用文本标签可接受。
7. 临时文件 24 小时自动过期 — 当前"评分后立即清空"策略已基本满足需求。

---

**总结**：当前实现已覆盖 PRD v5.0 约 **85%** 的核心功能需求。最大的两个偏差是**榜单同步改为手动触发**和**Harness 评价改为 ARY 内部计算**，这两点与 PRD 描述的"去中心化"和"Organizer 拥有数据主权"的核心理念有差距。其余差异多为界面组织形式、配置粒度等可接受范围内的问题。

以上是完整的分析报告。如果还有需要进一步深挖的部分，或者需要对某个差异点制定修改方案，随时告诉我。

---

**User**

详细描述最大的两个偏差，包括现在是怎么实现的，你觉得为什么现在是这样的，你认为应该怎么实现

---

**Assistant**

## 偏差一：榜单同步 —— 从「自动颗粒度推送」变成「Organizer 手动按钮」

---

### PRD 怎么说的

PRD 第 2.1 节核心能力第 6 条：

> 展示榜单（**按 Organizer 颗粒度实时更新**）

PRD 第 3.2.3 节专门定义了这个流程：

```
ARY 每隔固定颗粒度 → 给 Organizer 发送读取进度请求
  → Organizer 收到请求后，读取 Runner 拉取的代码并计算进度
    → Organizer 返回进度结果给 ARY
      → ARY 在榜单中更新，展示进度
```

这是一个**三方协作的自动循环**。ARY 是发起方，按 `updateGranularityMinutes`（创建赛事时设置，默认 30 分钟）定时向 Organizer 发送请求；Organizer 侧的 Runner 收到请求后主动计算一次当前所有队伍的进度，回传给 ARY；ARY 据此刷新榜单。核心逻辑是：**ARY 不知道进度，ARY 向 Organizer 要进度，Organizer 掌握进度计算的主动权**。

### 现在是怎么实现的

整个流程被简化成了**Organizer 在前端页面点一个按钮**：

[src/app/page.tsx:546-548](src/app/page.tsx#L546-L548)
```tsx
<form action={publishLeaderboardAction}>
  <input name="raceId" type="hidden" value={race.id} />
  <button type="submit">同步公开榜单</button>
</form>
```

这个按钮触发 Server Action `publishLeaderboardAction`，最终调用 `publishLeaderboard()`：

[src/lib/services/submissions.ts:272-321](src/lib/services/submissions.ts#L272-L321)
```typescript
export async function publishLeaderboard(raceId: string) {
  // 1. 从 TeamArchive 读取所有队伍的最高分归档
  const archives = await prisma.teamArchive.findMany({ ... });
  
  // 2. 全量删掉旧榜单 → 用归档数据重建 LeaderboardEntry
  await tx.leaderboardEntry.deleteMany({ where: { raceId } });
  await tx.leaderboardEntry.createMany({ data: archives.map(...) });
  
  // 3. 记录同步时间戳
  await tx.race.update({ data: { lastLeaderboardSyncAt: new Date() } });
}
```

关键细节：
- `updateGranularityMinutes` 字段**已经在数据库里**，创建赛事表单也能设置，但它**从未被任何代码读取或使用**。它纯粹是一个存了但不用的字段。
- `lastLeaderboardSyncAt` 记录了最后一次同步时间，但也只用于记录——没有代码检查它是否过期、是否该触发下一次同步。
- 没有任何 cron job、`setInterval`、WebSocket 推送、Server-Sent Events。
- 榜单的数据来源是 `TeamArchive`（每队最高分提交的副本），而不是向 Organizer 请求实时进度。

### 为什么我觉得现在是这样的

这个偏差不是疏忽，而是**演示环境的边界条件导致的有意取舍**。原因有三层：

**第一层：没有后台任务基础设施。** 整个应用是 Next.js + SQLite 单体，跑在 Vercel 上。PRD 描述的「每隔 N 分钟自动发送请求」需要一个调度器——要么是 Vercel Cron Jobs（需额外配置），要么是 `setInterval` 在服务端（Serverless 环境下不可靠），要么是客户端轮询（违背"ARY 发起"的语义）。在 PoC 阶段，搭这套基础设施的投入产出比不高。

**第二层：PRD 的自动流程依赖 Organizer 侧在线。** PRD 3.2.3 的流程要求 Organizer「收到请求后，读取 Runner 拉取的代码并计算进度」。这意味着 Organizer 必须有一个常驻服务在监听 ARY 的请求——但当前架构中，Runner 只是一个主动拉取的 HTTP 客户端，没有接收请求的能力。要让这个循环跑起来，需要 Organizer 侧也部署一个接收端。这在演示阶段几乎不可能做到——演示的 Organizer 和 Rider 可能跑在同一个浏览器里。

**第三层：`TeamArchive` 已经提供了退而求其次的数据源。** Runner 每次回传评分后，`scoreRunnerTask()` 会 upsert `TeamArchive`，保留每队最高分提交的完整快照（代码、记录、各项分数）。这不等于「进度」，但它是一个可靠的、反映当前最佳成绩的数据集。`publishLeaderboard` 直接从中读取并投影到 `LeaderboardEntry`，逻辑上自洽。

所以现在的实现本质上是：**把 PRD 中 "ARY 定时向 Organizer 请求进度" 的推拉模型，降级为 "Organizer 觉得该更新了就自己来点一下" 的手动模型**。数据来源从「Organizer 实时计算」降级为「ARY 本地归档的最高分快照」。

### 我认为应该怎么实现

这取决于目标——是继续做演示，还是要逼近 PRD 的设计意图。分两档方案：

---

#### 方案 A：最小改动，让「手动」看起来像「半自动」（适合继续演示）

改动量很小，不改架构：

1. **让 `updateGranularityMinutes` 活起来。** 在页面上检查 `lastLeaderboardSyncAt`，如果距离上次同步已经超过 `updateGranularityMinutes`，就在「同步公开榜单」按钮旁边显示一个醒目提示：**「榜单已 45 分钟未更新（刷新粒度 30 分钟），建议同步」**。

2. **把 `TeamArchive` 的数据来源标注清楚。** 在榜单面板上加一行说明：「当前榜单基于各队最高分归档快照，最近同步于 2026-06-06 14:30」。

3. **可选**：在前端加一个 `setInterval`，每隔 `updateGranularityMinutes * 60 * 1000` 毫秒自动调一次 `publishLeaderboardAction`。这不是真正的「ARY 向 Organizer 请求」，但用户体验上接近自动更新。代价是如果 Organizer 关掉页面，榜单就停止更新——但这在演示场景下是合理的。

```
改动文件：src/app/page.tsx（加提示逻辑 + 可选自动刷新）
          无需改数据库 / API
```

---

#### 方案 B：按 PRD 设计意图重构（适合向生产演进）

需要新增基础设施和 API：

**第 1 步：新增 Organizer 侧的「进度查询」API**

PRD 3.2.3 描述的是 ARY → Organizer 方向。在当前架构中，可以让 Organizer 的 Runner 在回传评分结果时**顺便带上当前所有队伍的进度快照**。具体做法：

- 扩展 `POST /api/runner/tasks/result` 的请求体，允许 Runner 在回传单个提交结果的同时附带一个可选的 `leaderboardSnapshot`：

```json
{
  "submissionId": "sub_001",
  "passRate": 92,
  "...": "...",
  "leaderboardSnapshot": [
    { "teamId": "team_001", "progress": 0.75 },
    { "teamId": "team_002", "progress": 0.30 }
  ]
}
```

- 在 `scoreRunnerTask()` 中，如果 Runner 提供了 `leaderboardSnapshot`，就顺便更新 `LeaderboardEntry`。

这样做的好处是**不需要 ARY 主动向 Organizer 发请求**——它利用了已有的 Runner → ARY 回传通道，把「进度」作为回传的附加信息。Organizer 每次评完一个提交，顺手就把全量进度表更新了。这符合 PRD "Organizer 掌握进度计算" 的精神，同时不要求 Organizer 暴露公网接口。

**第 2 步：让 Runner API 支持「请求进度」标记**

在 `GET /api/runner/tasks/pull` 的响应中增加一个字段 `requestProgressSnapshot: true`。这不是 ARY 主动发请求，而是在 Runner 下次来拉任务时「顺带提醒」：Organizer 该给一份进度快照了。ARY 根据 `lastLeaderboardSyncAt` 和 `updateGranularityMinutes` 判断是否需要。

```json
{
  "task": { "...": "..." },
  "requestProgressSnapshot": true
}
```

Runner 看到这个标记后，在下一次回传结果时附带 `leaderboardSnapshot`。

**第 3 步：增加定时触发的兜底**

即使没有 Runner 来拉任务（比如所有提交都评完了），榜单也需要更新。这里可以：

- 使用 Vercel Cron Jobs（`vercel.json` 配一个每 N 分钟触发的 endpoint）
- 或者用 Next.js 的 `revalidatePath` / ISR 机制做软刷新
- 或者在页面上用 `setInterval` 轮询（降级方案）

```
改动范围：
  - prisma/schema.prisma：LeaderboardEntry 可能需要加 progress 字段
  - src/app/api/runner/tasks/result/route.ts：扩展请求体，接收 leaderboardSnapshot
  - src/app/api/runner/tasks/pull/route.ts：响应中加 requestProgressSnapshot
  - src/lib/services/submissions.ts：scoreRunnerTask 中处理 snapshot
  - vercel.json：添加 cron 配置
  - src/app/page.tsx：去掉手动按钮，改为自动展示
```

---

#### 我的推荐

**现阶段用方案 A**。原因是：
- 项目当前定位是「全栈演示」，ROADMAP 和 README 都明确了这个边界
- PRD 第 8 章也承认很多功能是「初步实现」
- 方案 A 改动小，但至少让 `updateGranularityMinutes` 不再是一个死字段，并在 UI 上体现「同步是 Organizer 主动发起的」

如果后续要往生产演进，方案 B 的第 1 步是最划算的一步——不改架构，只扩展现有 API 的请求体，就让「Organizer 掌握进度数据主权」这个核心理念在代码层面真正成立。

---

## 偏差二：Harness 评价 —— 从「Organizer 独立评判」变成「ARY 自己算」

---

### PRD 怎么说的

PRD 第 3.2.4 节定义了赛后 Harness 评价流程：

```
比赛结束后：
  ARY 自动读取 Rider 的 Riding 记录和代码
    → ARY 记录 Rider 信息
      → ARY 发送 Riding 记录和代码给 Organizer
        → Organizer 根据记录和代码进行 Harness 能力评价
          → Organizer 返回评价结果给 ARY
            → ARY 在 Harness 能力榜单中更新并展示
```

关键词是 **「Organizer 进行 Harness 能力评价」**。Harness 评价指的是评价 Rider **驾驭 Agent 的能力**——看对话记录中 Rider 如何引导 Agent、如何拆解问题、如何验证结果。这是和赛中「任务效果分」**完全不同的维度**：任务分评价的是代码写得好不好，Harness 分评价的是人用 Agent 用得好不好。

PRD 把这个评价权交给 Organizer，原因和「测试代码不离开 Organizer 内网」一脉相承：**Organizer 最清楚什么样的 Agent 驾驭能力是好的**，ARY 不应该越俎代庖。

### 现在是怎么实现的

整个流程被压缩成 `publishShowcase()` 函数里的几行代码：

[src/lib/services/submissions.ts:350-401](src/lib/services/submissions.ts#L350-L401)
```typescript
// publishShowcase() 内部：
await tx.harnessEntry.createMany({
  data: archives.map((archive) => ({
    raceId,
    teamId: archive.teamId,
    harnessScore: buildHarnessScore(   // ← ARY 自己算
      archive.reasoningScore,
      archive.keywordScore,
    ),
    reasoningScore: archive.reasoningScore,
    keywordScore: archive.keywordScore,
  })),
});
```

其中 `buildHarnessScore` 的定义：

[src/lib/services/scoring.ts:117-119](src/lib/services/scoring.ts#L117-L119)
```typescript
export function buildHarnessScore(
  reasoningScore: number,
  keywordScore: number,
): number {
  return roundScore(reasoningScore * 0.6 + keywordScore * 0.4);
}
```

Harness 分 = reasoningScore × 0.6 + keywordScore × 0.4。而 `reasoningScore` 和 `keywordScore` 这两个值**是 Runner 在赛中评分时回传的**——也就是说，Harness 评价完全复用了赛中评分的数据，换了个公式重新算了一遍。

PRD 要求的流程链是：

```
ARY → 发 Riding+代码给 Organizer → Organizer 独立评价 → 回传 Harness 分 → ARY 展示
     ↑                                                                         ↑
   ARY 只做转发                                                       ARY 只做展示
```

实际实现的流程链是：

```
Runner 赛中回传 reasoningScore + keywordScore → ARY 存下来 → 赛后 ARY 自己算 Harness 分 → 展示
                                               ↑
                                     Organizer 完全没有参与
```

### 为什么我觉得现在是这样的

这个偏差比第一个更根本——它触及了 PRD 的核心命题。我猜测原因有几层：

**第一层：Harness 评价的定义在 PRD 中本身比较模糊。** PRD 3.2.4 说「Organizer 根据记录和代码进行 Harness 能力评价」，但没有具体说 Harness 分怎么算、和赛中分是什么关系。`buildHarnessScore` 的公式（reasoning × 0.6 + keyword × 0.4）看起来是开发者自己定义的——它直觉上合理（推理能力占 60%，关键词覆盖占 40%），但它不是 Organizer 定义的。

**第二层：要真正让 Organizer 评价，需要一个新的 API 循环。** 赛中评分已经有 Runner pull → score 的通道。赛后 Harness 需要另一个类似的通道：ARY 需要把 Riding 记录和代码打包好，等着 Organizer 来拉；Organizer 需要一个 Harness 评估程序（可能是人工的，也可能是调用 Agent API 分析的），处理后回传。这意味着：
- 新增一个 Runner API（比如 `GET /api/runner/harness/pull` 和 `POST /api/runner/harness/result`）
- Organizer 需要额外实现 Harness 评估逻辑
- ARY 需要区分「赛中评分」和「赛后 Harness 评价」两种不同的数据流

在演示阶段，这整套额外的通道看起来像重复建设——尤其是当 `reasoningScore` 和 `keywordScore` 这两个和「驾驭能力」强相关的数据已经在库里的时候，直接用它们算一个值是最短路径。

**第三层：PRD 对 Harness 榜单的定位有内在张力。** 一方面 PRD 3.3.2 说 ARY 存储「赛后的 Harness 能力榜单」，暗示这是 ARY 侧的数据；另一方面 3.2.4 说 Organizer 做评价。这意味着 ARY 需要存储的是 **Organizer 评价的结果**，而不是自己生成的。但在演示场景中，Organizer 的「评价」很可能就是人工看一下然后给个分——这很难自动化进演示流程。所以开发者退而求其次，用一个公式替代了 Organizer 的人工判断。

**第四层（最重要）：这与 PRD 的去中心化理念直接冲突。** PRD 第 2.1 节的核心理念是「Public Yard, Private Race Source」——赛事数据主权属于 Organizer。赛中的任务评分已经通过 Runner 模型做到了 Organizer 掌控。但赛后 Harness 评价，ARY 直接越过了 Organizer，自己定义公式、自己计算、自己展示。**这意味着 ARY 替 Organizer 决定了「什么是好的 Agent 驾驭能力」**——这正是 PRD 说 ARY 不应该做的事。

### 我认为应该怎么实现

同样分两档：

---

#### 方案 A：承认偏差，用最小代价对齐 PRD 精神

如果暂时不想加新的 API 循环，至少做以下改动：

1. **把 `buildHarnessScore` 的公式从 ARY 代码中移出，变为 Organizer 创建赛事时的可配置项。** 当前赛事创建表单中已有所有权重配置，唯独没有 Harness 权重。在 Race 模型中加两个字段：`harnessWeightReasoning`（默认 0.6）和 `harnessWeightKeyword`（默认 0.4）。这样至少公式是 Organizer 设定的，不是 ARY 硬编码的。

2. **在 Harness 榜单上标注数据来源。** 展示时注明「Harness 分数由赛中 reasoning 和 keyword 得分自动换算，非 Organizer 独立评价」。

3. **为未来 Organizer 独立评价预留接口。** 在 HarnessEntry 模型中加一个 `source` 字段，枚举值 `AUTO`（ARY 自动换算）/ `ORGANIZER`（Organizer 提交）。当前全部标为 `AUTO`，后续 Organizer 可以通过 API 提交覆盖值。

```
改动范围：
  - prisma/schema.prisma：Race 加两个权重字段；HarnessEntry 加 source 枚举
  - src/lib/services/scoring.ts：buildHarnessScore 改为读 Race 配置的权重
  - src/app/page.tsx：创建赛事表单加 Harness 权重输入；Harness 榜单加来源标注
```

---

#### 方案 B：实现完整的 Harness 评价通道（按 PRD 来）

这需要一个新的 API 闭环，类比赛中 Runner 的 pull/result 模式：

**第 1 步：新增 Harness 拉取 API**

```
GET /api/runner/harness/pull?raceId=<id>
Authorization: Bearer <runner_token>
```

响应返回所有需要 Organizer 评价的队伍数据：

```json
{
  "harnessTasks": [
    {
      "teamId": "team_001",
      "teamName": "排序小分队",
      "ridingRecord": "先澄清输入边界，再验证复杂度...",
      "codeSnippet": "export function solve(input: number[]) {...}",
      "agentType": "OPENAI"
    }
  ]
}
```

数据来源是 `TeamArchive`（最高分提交的快照）。

**第 2 步：新增 Harness 回传 API**

```
POST /api/runner/harness/result
Authorization: Bearer <runner_token>
```

请求体：

```json
{
  "raceId": "race_001",
  "teamId": "team_001",
  "harnessScore": 85,
  "reasoningScore": 90,
  "keywordScore": 75,
  "comment": "Rider 拆解问题清晰，但对边界条件的追问不够深入。"
}
```

**第 3 步：ARY 侧处理逻辑**

收到回传后：
- 创建/更新 `HarnessEntry`（覆盖当前的 `buildHarnessScore` 自动计算）
- 不删除 `TeamArchive` 中的数据（赛后归档应保留）

**第 4 步：UI 调整**

- 赛后展示面板增加状态提示：「等待 Organizer 提交 Harness 评价…」/「Harness 评价已完成」
- `publishShowcaseAction` 不再自动生成 `HarnessEntry`，而是改为检查哪些队伍还没有 Harness 评价，提示 Organizer 去完成

```
改动范围：
  - src/app/api/runner/harness/pull/route.ts（新文件）
  - src/app/api/runner/harness/result/route.ts（新文件）
  - src/lib/services/submissions.ts：新增 pullHarnessTask / scoreHarnessTask
  - src/lib/validation.ts：新增 harnessPullSchema / harnessScoreSchema
  - src/app/page.tsx：展示逻辑调整
  - src/app/actions.ts：新增 publishShowcaseAction 逻辑调整
```

---

#### 我的推荐

**短期内用方案 A**，但**长期必须走向方案 B**。理由：

方案 A 的改动只需 30 分钟，但能解决最紧迫的问题——ARY 不再硬编码"什么是好的驾驭能力"，而是让 Organizer 可配置权重。这至少把"定义权"还给了 Organizer。

但方案 A 没有解决根本问题：**Organizer 根本没有看过 Riding 记录**。Harness 评价的核心价值在于 Organizer 基于自己的专业判断去审视 Rider 与 Agent 的对话过程——这不能被一个公式替代。PRD 3.2.4 把 Harness 评价设计成独立流程，是有意与赛中评分区分开的。赛中评分是机械的（通过率、关键词匹配），赛后 Harness 评价是定性的（驾驭能力），两者本就不该用同一组数据。

方案 B 的成本主要是两个新 API endpoint + 对应的 service 函数，不算大。真正的问题是：**Organizer 侧的 Harness 评估程序谁来写？** PRD 说 Organizer 做评价，但演示环境中 Organizer 只是一个登录了网页的人。如果要完整演示这个流程，可能需要一个简单的 CLI 脚本或 Postman collection 来模拟 Organizer 的 Harness 评估——这和现有 Runner 模拟的本质是一样的。README 中已经明确「Organizer 内网 Runner 实现不在 ARY 中」，同理 Harness 评估程序也可以作为外部工具提供。

---

## 两个偏差的共同根因

回到 PRD 的核心命题（2.2 节）：

> 在 Race 数据存留于 Organizer 侧、ARY 不持久化 Race 数据的前提下，ARY 如何完成赛事的创建、披露、组织与展示？

两个偏差本质上是同一个问题在不同阶段的表现：**ARY 在数据不够的时候，选择了"自己算"而不是"向 Organizer 要"**。

- 赛中阶段：ARY 应该向 Organizer 要进度 → 实际从本地 TeamArchive 读
- 赛后阶段：ARY 应该让 Organizer 评价 Harness → 实际用赛中数据自己算

这违背了 PRD 试图证明的四个能力中的第 4 条：

> ARY 展示的内容来自 Organizer 主动披露的公开数据

当 ARY 自己算 Harness 分时，这个展示内容**不是 Organizer 主动披露的**，而是 ARY 推导的。

修复这两个偏差，本质上就是回答一个问题：**在每个需要数据展示的时刻，ARY 是选择等待 Organizer 来喂数据，还是选择用本地已有的数据先顶上去？** PRD 的答案是前者——哪怕慢一点，也要保证数据来源是 Organizer。当前的实现选择了后者——为了演示流畅，牺牲了数据来源的纯粹性。

---

**User**

你说现在的harness是ary将runner的两个分进行了加权对吗

---

**Assistant**

不完全是。让我精确说明这两个分的来源：

### `reasoningScore` — 来自 Runner（Organizer 侧）

在 [src/lib/services/submissions.ts:139-146](src/lib/services/submissions.ts#L139-L146)，Runner 回传结果时带上来的：

```typescript
const parsed = runnerScoreSchema.parse({
  submissionId: formData.get("submissionId"),
  passRate: formData.get("passRate"),
  codeReviewScore: formData.get("codeReviewScore"),
  reasoningScore: formData.get("reasoningScore"),   // ← Runner 给的
  runnerComment: formData.get("runnerComment"),
  status: formData.get("status"),
});
```

这个是 Organizer 侧的 Runner 调用 Agent API 评估对话推理质量后回传的，**是 Organizer 的数据**。

### `keywordScore` — 来自 ARY 自己算的

在 [src/lib/services/scoring.ts:87-88](src/lib/services/scoring.ts#L87-L88)，`buildScoreResult()` 内部：

```typescript
const keywordScore = getKeywordScore(input.artifact.ridingRecord, input.keywords);
```

而 `getKeywordScore` 的逻辑在 [src/lib/services/scoring.ts:137-143](src/lib/services/scoring.ts#L137-L143)：

```typescript
function getKeywordScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 100;
  const matched = keywords.filter((keyword) => text.includes(keyword)).length;
  return (matched / keywords.length) * 100;
}
```

就是简单的**字符串匹配**——看 Riding 记录里出现了多少个 Organizer 预设的关键词。`keywords` 本身是 Organizer 创建赛事时定的（存在 `Race.keywordsJson`），但**匹配计算是 ARY 做的**。Runner 回传的数据里根本没有 `keywordScore` 这个字段（看 `runnerScoreSchema`），它是 ARY 在 `buildScoreResult` 中自己补上的。

### 所以实际情况是

```
Harness 分 = reasoningScore(Organizer给的) × 0.6 + keywordScore(ARY自己算的) × 0.4
```

这是一个混合体——一半来自 Organizer 的 Agent 推理评价，一半来自 ARY 自己的字符串关键词匹配。而且 0.6 : 0.4 这个权重比例也是 ARY 代码里硬编码的，Organizer 完全不可配置。

我之前报告里说「复用了赛中评分的数据」，这个表述不够精确。更准确的说法是：**ARY 把赛中 Runner 给的推理分和 ARY 自己算的关键词分拼在一起，用一个硬编码的公式，替 Organizer 做了一个本应由 Organizer 独立完成的 Harness 评价。**

---

**User**

那你重新总结下harness这个问题形成一个文档

---

**Assistant**

文档已写入 [riding_record/Harness评价偏差分析.md](riding_record/Harness评价偏差分析.md)。

核心结论纠正了我之前的错误表述——不是「ARY 把 Runner 的两个分加权」，而是：

- **reasoningScore**：Organizer Runner 调用 Agent API 评的，属于 Organizer 的数据 ✅
- **keywordScore**：ARY 自己在 `getKeywordScore()` 里用 `String.includes()` 做关键词匹配算的，**Organizer 完全没参与** ❌

所以 `Harness = reasoningScore(Organizer给的) × 0.6 + keywordScore(ARY自算的) × 0.4`，一半是 Organizer 的，一半是 ARY 自己拼上去的，0.6:0.4 也是硬编码的。文档里包含了完整的代码引用、数据流分析、短期和长期两套改进方案。

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\Harness评价偏差分析.md in the IDE. This may or may not be related to the current task.</ide_opened_file>

这个长期方案是让企业也计算keywordscore吗

---

**Assistant**

你说得对，这是个问题。`keywordScore` 本质是 ARY 用 `String.includes()` 做的机械匹配，它的价值在于赛中快速量化关键词覆盖度。**把同样的字符串匹配逻辑挪到 Organizer 侧再做一遍，没有任何意义。** Organizer 真正应该做的是阅读 Riding 记录后给出定性判断，而不是重新跑一遍 ARY 的关键词匹配。

让我修正长期方案。

你说得对。`keywordScore` 是 ARY 的字符串匹配逻辑，让 Organizer 也跑一遍同样的匹配无意义。Harness 评价应该是 Organizer 阅读 Riding 记录后的**整体定性判断**，不需要子分数拆解。修复 5.2 节：

---

**User**

[Request interrupted by user]

---

**User**

我对解决方法的想法是首先让企业能设置权重，然后那个keyscores也交给企业计算，最后把两个分数和总分都返回给ary用于展示，如果企业不想展示小分也可以只返回harness总分，你觉得如何

---

**Assistant**

这个思路是对的，而且比文档里写的方案更干净。逐条分析：

### 你方案的三层逻辑

**第 1 层：权重由 Organizer 设**

这是最根本的修正。当前 `buildHarnessScore` 的 0.6 : 0.4 是 ARY 硬编码的，等于 ARY 替 Organizer 定义了「什么是好的驾驭能力」。把权重放进 Race 创建表单，Organizer 自己决定 reasoning 和 keyword 各占多少，定义权重归位。

**第 2 层：keywordScore 也由 Organizer 算**

这是你刚才抓住的问题。当前 ARY 的 `getKeywordScore` 就是 `String.includes()`，把这个逻辑搬到 Organizer 侧当然没意义。但关键在于：**Organizer 侧可以做得比 ARY 更好。** Organizer 的 Runner 本身就在调用 Agent API 做 reasoning 评审，同样可以对 Riding 记录做语义级的关键词覆盖分析——不是简单的字符串包含，而是判断 Rider 是否真正「理解并运用」了这些概念。ARY 做不了这件事，Organizer 能做。这才是把 keywordScore 交给 Organizer 的意义所在。

**第 3 层：小分可选返回**

这个设计让 Organizer 控制了披露粒度。想透明就返回子分数，不想就只返回总分。ARY 变成一个纯粹的结果展示层，不再参与「评分是怎么来的」这个环节。

### 整体数据流变成

```
赛后：
  ARY → GET /api/runner/harness/pull → Organizer
        (提供：Riding记录 + 代码 + 关键词列表 + 权重配置)

  Organizer 内部：
        reasoningScore = Agent API 评估推理质量
        keywordScore   = Agent API 评估关键词覆盖度  
        harnessScore   = reasoningScore × W1 + keywordScore × W2
    
  Organizer → POST /api/runner/harness/result → ARY
        (回传：harnessScore + reasoningScore? + keywordScore? + comment?)

  ARY → 展示 Harness 榜单
        (展示什么取决于 Organizer 回传了什么)
```

比文档里的方案好在哪里：**ARY 不仅不计算 Harness 分，连子分数都不计算了。** ARY 只做两件事：提供原始材料（Riding + 代码 + 关键词 + 权重），展示最终结果。Organizer 拥有完整的评价主权。

### 唯一需要补充的细节

Harness 拉取 API 的响应里需要带上**关键词和权重**，否则 Organizer 没法独立计算：

```json
{
  "harnessTasks": [
    {
      "teamId": "team_001",
      "teamName": "排序小分队",
      "ridingRecord": "先澄清输入边界，再验证复杂度...",
      "codeSnippet": "export function solve(input: number[]) {...}",
      "agentType": "OPENAI",
      "keywords": ["需求分析", "时间复杂度", "边界条件"],
      "weights": {
        "reasoning": 0.6,
        "keyword": 0.4
      }
    }
  ]
}
```

关键词和权重都是 Organizer 创建赛事时自己设的，现在只是通过 API 回传给 Organizer 的 Runner 用于计算——数据主权上没问题。

要我按这个方案更新文档吗？

---

**User**

更新

---

**Assistant**

已更新。改动要点：

1. **删除了短期方案（5.1）**，因为按你的思路，权重配置是长期方案的一部分，不需要一个折中版本。

2. **新增 5.2.1 方案概述表**，明确三层改动的分工：权重 → 定义权归位，keywordScore → 计算权归位，子分可选 → 展示权归位。

3. **Harness 拉取 API 响应增加了 `keywords` 和 `weights` 字段**——这是关键。Organizer Runner 拿到这两个数据才能独立计算 keywordScore 和 harnessScore，ARY 不需要参与任何计算。

4. **Harness 回传 API 中 `reasoningScore` 和 `keywordScore` 改为可选**，只有 `harnessScore` 必填。Organizer 决定展示粒度。

5. **数据模型**中 `HarnessEntry.reasoningScore` 和 `keywordScore` 改为 `Float?`（可选），新增 `comment` 字段和 `harnessSource` 枚举。

6. **删除了 `buildHarnessScore()` 函数**——按你的方案，这个函数不应该存在于 ARY 代码中，计算公式由 Organizer Runner 持有。

7. **代码索引**中对应函数标注了「需删除」。

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\Harness评价偏差分析.md in the IDE. This may or may not be related to the current task.</ide_opened_file>

你前面总结架构后提到的数据模型12张表是什么东西，我现在需要你考虑prd需要的UML图，选择你认为最必须画的几个图，在我选择后画出

---

**Assistant**

先纠正一下——实际是 **13 张表**，我之前说的 12 张数错了。

### 当前数据模型（13 张表 + 3 个枚举）

```
User ──┬── Race ──┬── Team ──┬── TeamMember
       │           │          ├── Submission
       │           │          ├── TeamArchive
       │           │          ├── FeedbackThread ── FeedbackMessage
       │           │          ├── LeaderboardEntry
       │           │          ├── HarnessEntry
       │           │          ├── RidingHighlight
       │           │          └── TeamComment
       │           └── Notification
       └── FeedbackMessage (author)
```

**枚举**：`UserRole`(ORGANIZER/RIDER)、`SubmissionStatus`(QUEUED/PULLED/SCORED)、`FeedbackStatus`(PENDING/RESOLVED)、`NotificationTarget`(ALL/TEAM)、`AgentType`(CLAUDE/COPILOT/DEEPSEEK/ZHIPU/OPENAI/CUSTOM)

---

### PRD 最需要的 UML 图

根据 PRD 的内容密度和需要沟通的角色，我建议以下 4 个图：

| # | 图类型 | 覆盖内容 | 必要性 |
|---|--------|---------|--------|
| 1 | **ER 图** | 13 张表的关系、字段、枚举 | **最高**——数据模型是理解整个系统的基础，也是 PRD 3.3 节「数据定义」的直接映射 |
| 2 | **用例图** | Organizer/Rider/Audience 三个角色的功能边界 | **高**——直接对应 PRD 3.1 节功能模块划分，一眼看清谁该做什么 |
| 3 | **状态机图** | Race 的 5 状态转换（报名中→报名结束→比赛中→封榜→结束）及各状态下的 Rider 操作 | **高**——对应 PRD 3.2.5，是权限校验和时间逻辑的核心 |
| 4 | **时序图** | Runner 评测流程（Rider提交→ARY入队→Runner拉取→评测→回传→ARY更新榜单+清空临时数据） | **高**——这是 PRD 3.2.2 + 3.2.3 核心业务流程的可视化，也是最体现去中心化架构的图 |

如果只选一张，选 **ER 图**。选三张的话，ER + 用例 + 状态机。要哪个组合？

---

**User**

四个图都画吧

---

**Assistant**

四个图都在 [riding_record/UML图.md](riding_record/UML图.md) 里，用 Mermaid 语法写的，VSCode 装了 Mermaid 插件的话可以直接预览渲染。

简要概括每个图的内容：

- **ER 图**：13 张表完整字段 + 关联关系，标注了 `codeContent`/`ridingRecord` 的「评分后清空」约束和 `TeamArchive` 的「最高分副本」语义
- **用例图**：Organizer 11 个用例 / Rider 8 个 / Audience 3 个，Runner 作为外部系统 Actor 单独画
- **状态机图**：5 状态 + 封榜分支判断，附了 `race-phase.ts` 代码对照表
- **时序图**：分四个阶段（赛中提交评测 → 榜单同步 → 赛后 Harness → 展示），标注了每个阶段 ARY 数据何时存、何时清

---

**User**

<ide_selection>The user selected the lines 1 to 480 from d:\作业\大二下\软工\大作业\riding_record\UML图.md:
# ARY GRS 001 UML 建模图

---

## 图 1：ER 图（实体关系图）

```mermaid
erDiagram
    User {
        string id PK
        string username UK
        string passwordHash
        string displayName
        enum role "ORGANIZER | RIDER"
        datetime createdAt
    }

    Race {
        string id PK
        string organizerId FK
        string title
        string summary
        string taskPackageLabel
        string taskDescription
        string trainingDataSummary
        boolean hasTrainingData
        string evaluationNotes
        string keywordsJson
        int tokenLimit
        datetime signupStart
        datetime signupEnd
        datetime raceStart
        datetime raceEnd
        boolean enableFreeze
        int freezeMinutesBeforeEnd
        int updateGranularityMinutes
        int maxTeamSize
        int submissionIntervalHours
        string cloudStudioUrl
        boolean displayShowTrainingData
        boolean displayShowOrganizerComment
        boolean displayShowTopHighlights
        int displayHighlightCount
        boolean displayShowRiderCode
        float weightTaskPassRate
        float weightCodeReview
        float weightReasoning
        float weightKeywords
        float weightTotalTask
        float weightTotalToken
        float weightTotalDialogue
        string organizerComment
        datetime lastLeaderboardSyncAt
        datetime lastShowcaseSyncAt
        datetime createdAt
        datetime updatedAt
    }

    Team {
        string id PK
        string raceId FK
        string captainId FK
        string name
        datetime createdAt
    }

    TeamMember {
        string id PK
        string teamId FK
        string userId FK "nullable"
        string displayName
        datetime createdAt
    }

    Submission {
        string id PK
        string raceId FK
        string teamId FK
        enum status "QUEUED | PULLED | SCORED"
        string codeLabel
        string codeContent "nullable, 评分后清空"
        string recordLabel
        string ridingRecord "nullable, 评分后清空"
        int tokenUsed
        enum agentType "CLAUDE | COPILOT | DEEPSEEK | ZHIPU | OPENAI | CUSTOM"
        float passRate "nullable"
        float codeReviewScore "nullable"
        float reasoningScore "nullable"
        float keywordScore "nullable"
        float tokenScore "nullable"
        float taskScore "nullable"
        float dialogueScore "nullable"
        float totalScore "nullable"
        float antiCheatPenalty "nullable"
        string runnerComment "nullable"
        string runnerStatus "nullable"
        datetime createdAt
        datetime pulledAt "nullable"
        datetime scoredAt "nullable"
    }

    TeamArchive {
        string id PK
        string raceId FK
        string teamId FK
        string submissionId
        string codeLabel
        string codeContent "最高分提交的代码副本"
        string recordLabel
        string ridingRecord "最高分提交的记录副本"
        int tokenUsed
        enum agentType
        float taskScore
        float dialogueScore
        float tokenScore
        float reasoningScore
        float keywordScore
        float totalScore
        float antiCheatPenalty
        datetime createdAt
    }

    FeedbackThread {
        string id PK
        string raceId FK
        string teamId FK
        enum status "PENDING | RESOLVED"
        datetime createdAt
        datetime updatedAt
    }

    FeedbackMessage {
        string id PK
        string threadId FK
        string authorId FK
        string content
        datetime createdAt
    }

    Notification {
        string id PK
        string raceId FK
        string title
        string content
        enum target "ALL | TEAM"
        string teamId "nullable"
        datetime createdAt
    }

    LeaderboardEntry {
        string id PK
        string raceId FK
        string teamId FK
        string submissionId
        float totalScore
        float taskScore
        float tokenScore
        float dialogueScore
        enum agentType
        datetime createdAt
    }

    HarnessEntry {
        string id PK
        string raceId FK
        string teamId FK
        float harnessScore
        float reasoningScore
        float keywordScore
        datetime createdAt
    }

    RidingHighlight {
        string id PK
        string raceId FK
        string teamId FK
        float score
        enum agentType
        string excerpt
        string codeSnippet
        datetime createdAt
    }

    TeamComment {
        string id PK
        string raceId FK
        string teamId FK
        string content
        datetime createdAt
        datetime updatedAt
    }

    %% ---- 关系 ----

    User ||--o{ Race : "创建 (organizerId)"
    User ||--o{ Team : "带队 (captainId)"
    User ||--o{ TeamMember : "成员 (userId, 可空)"
    User ||--o{ FeedbackMessage : "发送 (authorId)"

    Race ||--o{ Team : "包含"
    Race ||--o{ Submission : "接收"
    Race ||--o{ TeamArchive : "归档"
    Race ||--o{ FeedbackThread : "接收反馈"
    Race ||--o{ Notification : "发布通知"
    Race ||--o{ LeaderboardEntry : "生成榜单"
    Race ||--o{ HarnessEntry : "Harness评价"
    Race ||--o{ RidingHighlight : "Riding亮点"
    Race ||--o{ TeamComment : "队伍评语"

    Team ||--o{ TeamMember : "成员"
    Team ||--o{ Submission : "提交"
    Team ||--o{ TeamArchive : "最高分归档"
    Team ||--o{ FeedbackThread : "反馈"
    Team ||--o{ LeaderboardEntry : "排名"
    Team ||--o{ HarnessEntry : "Harness"
    Team ||--o{ RidingHighlight : "亮点"
    Team ||--o{ TeamComment : "评语"

    FeedbackThread ||--o{ FeedbackMessage : "消息"
```

**关键设计说明**：

- `Submission.codeContent` 和 `Submission.ridingRecord` 在 Runner 回传评分后置为 `null`——ARY 不持久化私有提交数据
- `TeamArchive` 保留每队**最高分提交**的完整副本（`@@unique([raceId, teamId])`），用于赛后展示和 Harness 评价
- `LeaderboardEntry` 是公开榜单的**投影**——数据来自 TeamArchive，但只保留展示所需的字段（不含代码正文和记录原文）
- 所有关联 Race 的表均设置 `onDelete: Cascade`——Organizer 一键清除赛事时自动级联删除

---

## 图 2：用例图

```mermaid
graph TB
    subgraph "ARY GRS 001 系统边界"
        direction TB

        subgraph "Organizer 用例"
            O1["注册 / 登录"]
            O2["创建赛事<br/>(基础信息/时间/权重/展示选项)"]
            O3["查看实时榜单"]
            O4["查看 & 回复反馈<br/>(标记 pending/resolved)"]
            O5["修改题目 & 训练数据<br/>(自动通知 Rider)"]
            O6["同步公开榜单"]
            O7["赛后评论<br/>(逐队评语 + 总评)"]
            O8["一键清除比赛"]
            O9["Runner 拉取任务<br/>(赛中评测)"]
            O10["Runner 回传评分"]
            O11["Runner Harness 评价<br/>(赛后驾驭能力)"]
        end

        subgraph "Rider 用例"
            R1["注册 / 登录"]
            R2["浏览赛事列表<br/>(按状态分类)"]
            R3["报名参赛<br/>(队名 + 组员 ≤ 人数上限)"]
            R4["提交代码 & Riding Record<br/>(受提交频率限制)"]
            R5["查看实时排名"]
            R6["向 Organizer 反馈问题"]
            R7["接收题目修改通知"]
            R8["查看赛后展示<br/>(排名/Harness/亮点/评语)"]
        end

        subgraph "Audience 用例"
            A1["浏览赛事列表<br/>(无需登录)"]
            A2["查看公开排名"]
            A3["查看赛后展示内容"]
        end
    end

    %% Actors
    ORG(("Organizer"))
    RID(("Rider"))
    AUD(("Audience"))
    RUNNER[["Organizer Runner<br/>(外部系统)"]]

    %% 连接
    ORG --> O1
    ORG --> O2
    ORG --> O3
    ORG --> O4
    ORG --> O5
    ORG --> O6
    ORG --> O7
    ORG --> O8

    RUNNER --> O9
    RUNNER --> O10
    RUNNER --> O11

    RID --> R1
    RID --> R2
    RID --> R3
    RID --> R4
    RID --> R5
    RID --> R6
    RID --> R7
    RID --> R8

    AUD --> A1
    AUD --> A2
    AUD --> A3

    %% 关联关系
    O2 -.->|"配置"| R3
    O5 -.->|"广播通知"| R7
    R4 -.->|"进入待评测队列"| O9
    O10 -.->|"更新"| O3
    O10 -.->|"更新"| R5
    O11 -.->|"更新"| R8
    R6 -.->|"私信"| O4
    O4 -.->|"回复"| R6
```

**说明**：Runner 不是人类角色，而是 Organizer 部署的外部评测程序——它通过 API 与 ARY 交互，不通过 UI。将其作为外部系统 Actor 单独标注。

---

## 图 3：Race 状态机图

```mermaid
stateDiagram-v2
    [*] --> 报名中 : Organizer 创建赛事<br/>当前时间 ≥ signupStart

    state 报名中 {
        [*] --> Rider可报名
        Rider可报名 --> 超上限拒绝 : 队伍人数 > maxTeamSize
    }

    报名中 --> 报名结束 : 当前时间 > signupEnd

    state 报名结束 {
        [*] --> 等待开始
        Rider不可报名
        Rider不可提交
    }

    报名结束 --> 比赛中 : 当前时间 ≥ raceStart

    state 比赛中 {
        [*] --> 可提交
        Rider可提交代码
        榜单可见
        可反馈问题
        Organizer可修改题目

        state 封榜判断 <<choice>>
        可提交 --> 封榜判断 : enableFreeze = true<br/>且当前时间 ≥ raceEnd - freezeMinutes
        封榜判断 --> 封榜中 : 进入封榜
        封榜判断 --> 可提交 : enableFreeze = false, 继续正常比赛
    }

    state 封榜中 {
        可提交但榜单隐藏
    }

    比赛中 --> 比赛结束 : 当前时间 ≥ raceEnd
    封榜中 --> 比赛结束 : 当前时间 ≥ raceEnd

    state 比赛结束 {
        不可提交
        最终排名公开
        Organizer可发布赛后展示
        Organizer可进行Harness评价
        Organizer可逐队评论
        Organizer可一键清除
    }

    比赛结束 --> [*] : Organizer 一键清除
```

**状态转换条件对照代码**（`src/lib/race-phase.ts`）：

| 状态 | 条件 | `getRacePhase()` 返回值 |
|------|------|------------------------|
| 报名中 | `now >= signupStart && now <= signupEnd` | `"registration"` |
| 报名结束 | `now > signupEnd && now < raceStart` | `"preparation"` |
| 比赛中 | `now >= raceStart && (未封榜 或 未结束)` | `"active"` |
| 封榜中 | `enableFreeze && now >= raceEnd - freezeMinutes && now < raceEnd` | `"frozen"` |
| 比赛结束 | `now >= raceEnd` | `"finished"` |

---

## 图 4：Runner 评测时序图

```mermaid
sequenceDiagram
    actor Rider
    box ARY
        participant ARY_Page as ARY 页面
        participant ARY_DB as ARY 数据库
        participant ARY_API as ARY Runner API
    end
    box Organizer 内网
        participant Runner as Organizer Runner
        participant AgentAPI as Agent API
    end

    %% ===== 赛中提交与评测 =====
    rect rgb(245, 239, 230)
        Note over Rider,AgentAPI: 阶段一：赛中提交与评分

        Rider->>ARY_Page: 提交代码 + Riding Record
        ARY_Page->>ARY_DB: 创建 Submission (status=QUEUED)
        ARY_Page-->>Rider: 提交成功，进入待评测队列

        loop 按 updateGranularityMinutes 或 Runner 主动拉取
            Runner->>ARY_API: GET /api/runner/tasks/pull?raceId=
            ARY_API->>ARY_DB: 查询 QUEUED 状态的提交
            ARY_DB-->>ARY_API: 返回最旧的待评测任务
            ARY_API->>ARY_DB: 更新 status=PULLED, pulledAt=now
            ARY_API-->>Runner: 返回 task (代码 + 记录 + 关键词 + 权重)

            Runner->>Runner: 在企业内网运行测试代码
            Runner->>AgentAPI: 调用 Agent 评估代码质量
            AgentAPI-->>Runner: codeReviewScore
            Runner->>AgentAPI: 调用 Agent 评估推理质量
            AgentAPI-->>Runner: reasoningScore
            Runner->>Runner: 计算各维度分数<br/>taskScore / dialogueScore / tokenScore<br/>totalScore / antiCheatPenalty

            Runner->>ARY_API: POST /api/runner/tasks/result
            ARY_API->>ARY_DB: 更新 Submission (status=SCORED, 填入分数)
            ARY_API->>ARY_DB: 清空 codeContent  & ridingRecord
            ARY_API->>ARY_DB: upsert TeamArchive (最高分归档)
            ARY_API-->>Runner: 确认回传成功
        end
    end

    %% ===== 榜单同步 =====
    rect rgb(230, 240, 235)
        Note over ARY_Page,ARY_DB: 阶段二：榜单同步 (Organizer 手动或自动触发)

        ARY_Page->>ARY_DB: publishLeaderboard(raceId)
        ARY_DB->>ARY_DB: 从 TeamArchive 读取所有队伍最高分
        ARY_DB->>ARY_DB: 删除旧 LeaderboardEntry → 重建
        ARY_DB-->>ARY_Page: 榜单更新完成
    end

    %% ===== 赛后 Harness 评价 =====
    rect rgb(235, 230, 245)
        Note over Runner,AgentAPI: 阶段三：赛后 Harness 评价 (仅比赛结束后)

        Runner->>ARY_API: GET /api/runner/harness/pull?raceId=
        ARY_API->>ARY_DB: 从 TeamArchive 读取各队<br/>Riding记录 + 代码 + 关键词 + 权重
        ARY_API-->>Runner: 返回 harnessTasks

        Runner->>AgentAPI: 调用 Agent 评估 Riding 推理质量
        AgentAPI-->>Runner: reasoningScore
        Runner->>AgentAPI: 调用 Agent 评估关键词覆盖度(语义级)
        AgentAPI-->>Runner: keywordScore
        Runner->>Runner: harnessScore = reasoning × W1 + keyword × W2

        Runner->>ARY_API: POST /api/runner/harness/result<br/>(harnessScore + 可选子分数 + 可选评论)
        ARY_API->>ARY_DB: upsert HarnessEntry
        ARY_API-->>Runner: 确认回传成功
    end

    %% ===== 展示 =====
    rect rgb(250, 245, 235)
        Note over Rider,ARY_Page: 阶段四：赛后展示

        Rider->>ARY_Page: 查看赛后展示
        ARY_Page->>ARY_DB: 读取 LeaderboardEntry + HarnessEntry<br/>+ RidingHighlight + TeamComment
        ARY_DB-->>ARY_Page: 返回展示数据
        ARY_Page-->>Rider: 展示完整排名 / Riding亮点 / Organizer评语
    end
```

**时序图中的关键数据边界**：

| 阶段 | ARY 存储 | 何时清空 |
|------|---------|---------|
| 提交入队 | `codeContent`, `ridingRecord`（临时） | Runner 回传评分后置 `null` |
| 评分回传 | 各项分数（持久化） | 不自动清空，Organizer 一键清除 |
| 最高分归档 | `codeContent`, `ridingRecord` 副本（持久化） | Organizer 一键清除 |
| Harness 评价 | `harnessScore` + 子分（持久化） | Organizer 一键清除 |

---

*文档生成日期：2026-06-06*


This may or may not be related to the current task.</ide_selection>

我感觉这几个图都太大了，我将来是要把它插到prd里面的，所以最好能变小一点

---

**Assistant**

四个图都精简完了，对比一下体积变化：

| 图 | 原行数 | 现行数 | 精简手段 |
|---|--------|--------|---------|
| ER 图 | ~220 | ~140 | 每个实体只保留 PK/FK + 2~3 个核心业务字段，去掉所有 nullable 标注和枚举展开，关系标签改为单字 |
| 用例图 | ~80 | ~55 | 合并同类用例（如「浏览赛事 + 报名」合一，「同步榜单 + 发布展示」合一），去掉子分组，改用 `graph LR` 横向布局更省高 |
| 状态机 | ~55 | ~18 | 去掉 compound state 嵌套，改为 5 个扁平状态 + `note right of` 标注操作权限 |
| 时序图 | ~85 | ~35 | 参与者从 5 个减到 3 个（ARY 合并为 DB+API，AgentAPI 合并进 Runner 内部），4 个阶段合并为 2 个，去掉 `rect` 色块和冗余交互 |

整体从 480 行压缩到约 260 行，插到 PRD 里应该不会太占篇幅了。要不要再调整某个图的大小？

---

**User**

<ide_selection>The user selected the lines 8 to 120 from d:\作业\大二下\软工\大作业\riding_record\UML图.md:
erDiagram
    User {
        string id PK
        enum role "ORGANIZER | RIDER"
    }

    Race {
        string id PK
        string organizerId FK
        string title
        datetime signupStart
        datetime signupEnd
        datetime raceStart
        datetime raceEnd
        int maxTeamSize
        int submissionIntervalHours
        boolean enableFreeze
    }

    Team {
        string id PK
        string raceId FK
        string captainId FK
        string name
    }

    Submission {
        string id PK
        string raceId FK
        string teamId FK
        enum status "QUEUED | PULLED | SCORED"
        string codeContent "评分后清空"
        string ridingRecord "评分后清空"
        float totalScore
    }

    TeamArchive {
        string id PK
        string raceId FK
        string teamId FK
        string codeContent "最高分副本"
        string ridingRecord "最高分副本"
        float totalScore
    }

    FeedbackThread {
        string id PK
        string raceId FK
        string teamId FK
        enum status "PENDING | RESOLVED"
    }

    FeedbackMessage {
        string id PK
        string threadId FK
        string authorId FK
        string content
    }

    Notification {
        string id PK
        string raceId FK
        string content
    }

    LeaderboardEntry {
        string id PK
        string raceId FK
        string teamId FK
        float totalScore
    }

    HarnessEntry {
        string id PK
        string raceId FK
        string teamId FK
        float harnessScore
    }

    RidingHighlight {
        string id PK
        string raceId FK
        string teamId FK
        string excerpt
    }

    TeamComment {
        string id PK
        string raceId FK
        string teamId FK
        string content
    }

    User ||--o{ Race : "创建"
    User ||--o{ Team : "带队"
    User ||--o{ FeedbackMessage : "发送"
    Race ||--o{ Team : ""
    Race ||--o{ Submission : ""
    Race ||--o{ TeamArchive : ""
    Race ||--o{ FeedbackThread : ""
    Race ||--o{ Notification : ""
    Race ||--o{ LeaderboardEntry : ""
    Race ||--o{ HarnessEntry : ""
    Race ||--o{ RidingHighlight : ""
    Race ||--o{ TeamComment : ""
    Team ||--o{ Submission : ""
    Team ||--o{ TeamArchive : ""
    Team ||--o{ FeedbackThread : ""
    Team ||--o{ LeaderboardEntry : ""
    Team ||--o{ HarnessEntry : ""
    Team ||--o{ RidingHighlight : ""
    Team ||--o{ TeamComment : ""
    FeedbackThread ||--o{ FeedbackMessage : ""

This may or may not be related to the current task.</ide_selection>

我希望这四个图分开，因为现在导出png会糊，其次ER图还是太大了，想办法让人不放大也能看清楚，实在不行就不要这个图了。然后用例图现在很丑，Race状态机还不错，最后那个测评时序图不要叫runner评测时序图，改个更合适的名字

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\UML图.md in the IDE. This may or may not be related to the current task.</ide_opened_file>

首先把四个图分开，其次ER图还是太大了，想办法让人不放大也能看清楚，实在不行就不要这个图了。然后用例图现在很丑，Race状态机的图还不错，最后那个测评时序图不要叫runner评测时序图，改个更合适的名字

---

**Assistant**

四个图已拆分到 [riding_record/uml/](riding_record/uml/) 目录，各自独立导出 PNG：

| 文件 | 图 | 改动 |
|------|-----|------|
| [01-ER图.md](riding_record/uml/01-ER图.md) | ER 图 | 从 12 实体砍到 **7 个核心实体**（去掉了 LeaderboardEntry、HarnessEntry、RidingHighlight、TeamComment、Notification、TeamMember 这些派生/投影表），每个实体只保留最少字段 |
| [02-用例图.md](riding_record/uml/02-用例图.md) | 用例图 | 改为 `graph TB` 纵向布局，Actor 横排放在顶部，三个角色的用例分组清晰分离。Organizer 从 11 个合并为 4 个，Rider 从 8 个合并为 4 个 |
| [03-状态机图.md](riding_record/uml/03-状态机图.md) | Race 状态机 | 保留原样，加了代码对照表 |
| [04-核心业务时序图.md](riding_record/uml/04-核心业务时序图.md) | 核心业务时序图 | 改了名字，参与者精简为 4 个（Rider + DB + API + Runner），赛中/赛后两段清晰 |

ER 图现在 7 个实体，每个 3~5 个字段，关系线也精简了。如果还是觉得导出后太小看不清，可以直接删掉 ER 图——它的信息完全可以被其他三个图覆盖：状态机覆盖时间逻辑，时序图覆盖数据流，用例图覆盖角色功能。你看下效果？

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\uml\04-核心业务时序图.md in the IDE. This may or may not be related to the current task.</ide_opened_file>

ER图不要了，就保留其他三个图，我希望你能用html格式输出，而且每个图都方方正正的有个框把它框起来或者统一有一个背景，符合科研图表的要求

---

**Assistant**

已生成 [riding_record/uml/ARY-UML图表.html](riding_record/uml/ARY-UML图表.html)，在浏览器中打开即可查看。

三个图的特点：

- **统一外观**：每个图用 `.figure` 卡片包裹，白底 + 1.5px 灰边框 + 图号/标题/说明文字，符合学术图表规范
- **图 1（用例图）**：三个角色分组清晰，用虚线标注了跨角色交互（私信、通知、入队）
- **图 2（状态机）**：保留了之前的扁平五状态结构，附了代码映射说明
- **图 3（时序图）**：赛中和赛后两个阶段用 `Note` 分隔，加了 `activate`/`deactivate` 激活条让数据流更直观

导出方式：
- 浏览器打开 → `Ctrl+P` 打印 → 另存为 PDF（矢量，不糊）
- 或者用浏览器截图工具导出 PNG

Mermaid 渲染的字体改成了 Times New Roman / Noto Serif SC 衬线体，整体风格偏学术。你打开看看效果？

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\uml\ARY-UML图表.html in the IDE. This may or may not be related to the current task.</ide_opened_file>

行吧就这样，你给他上个色

---

**Assistant**

配色方案：

**图 1 用例图** — 按角色分色系：
- Organizer（红色系）：深红圆形 Actor + 浅粉红子图背景 + 米白用例节点
- Rider（蓝色系）：深蓝 Actor + 浅蓝灰子图 + 淡蓝用例节点
- Audience（绿色系）：深绿 Actor + 浅绿子图 + 淡绿用例节点
- Runner（紫色）：独立色，区别于三个人类角色

**图 2 状态机** — 五色语义渐变：
- 报名中：绿色（开放准入）
- 报名结束：暖黄（等待过渡）
- 比赛中：蓝色（活跃进行）
- 封榜中：橙色（警戒/隐藏）
- 比赛结束：暖灰（尘埃落定）

**图 3 时序图** — 暖调学术风：
- ARY 平台区域：淡蓝灰底
- Organizer 内网区域：淡橙底
- Rider Actor：红色圆形
- 激活条：暖米色
- Note：浅黄底色 + 金色边框
- 全局从冷灰 `neutral` 切换为 `base` 暖调

Mermaid theme 从 `neutral` 改为 `base`，整体走暖灰色学术风格。刷新浏览器看看效果？

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\uml\ARY-UML图表.html in the IDE. This may or may not be related to the current task.</ide_opened_file>

状态机那个图出现了Syntax error in text mermaid version 11.15.0，其他的都很好

---

**Assistant**

问题是 transition 标签里的 `&gt;` HTML 实体和 `<br/>` 标签——Mermaid 11 的 stateDiagram 解析器对这两个东西敏感。改成了纯中文描述：

```
之前：now &gt; signupEnd          → 现在：超过 signupEnd
之前：enableFreeze<br/>距结束...  → 现在：启用封榜且临近结束
```

刷新看看还有没有报错？

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\uml\ARY-UML图表.html in the IDE. This may or may not be related to the current task.</ide_opened_file>

还是不行，显示跟之前一样

---

**Assistant**

改了两个关键点：

1. 状态名从中文改为英文（`报名中` → `Registration`），Mermaid 的状态机解析器对中文状态名有时不稳定
2. `classDef` 名从可能的保留字（`active`）改为安全的 `s1`~`s5`
3. 去掉了 `stroke-width:1.5px`（部分版本不支持）

但展示时仍然用 `note` 标注了中文说明。如果还是报错，就是 `stateDiagram-v2` 对 `classDef` 完全不支持，我去掉上色用纯 Mermaid theme 来控制颜色。刷新看看？

---

**User**

为什么用例图里没有ARY

---

**Assistant**

因为 ARY 本身就是整个系统的边界——所有用例都在 ARY 内部，Organizer、Rider、Audience、Runner 是系统外部的 Actor，与 ARY 交互。但现在这个边界确实太低调了，没有标注出来。

我把系统边界框加一个明确的标签：

改了三个地方：

1. **外层加了 `ARY GRS 001 平台` 系统边界框**——2px 粗边框，包裹所有用例，清楚标注 ARY 就是系统本身
2. **新增 `ARY 自动功能` 分组**（第四个浅米色子图）——包含 4 个 ARY 自主执行的用例：收集提交入队、回传后清空临时数据、更新榜单/赛后展示、修改通知
3. **Runner 与 ARY 自动功能的关联**——Runner 拉取/回传任务时触发 ARY 的清空和更新逻辑

现在一眼就能看出四个角色分组（Organizer / Rider / Audience / ARY自动功能）都在 ARY 平台这个大框里面，Runner 在外部。

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\uml\ARY-UML图表.html in the IDE. This may or may not be related to the current task.</ide_opened_file>

你给我一个现在项目对runner的定义 我有点迷惑了

---

**Assistant**

这确实容易混淆，因为项目里"Runner"这个词在不同上下文中指的东西不一样。

### Runner 的 PRD 定义（PRD 1.4 术语表）

> **Runner**：Organizer 私有评测程序，主动拉取任务并回传结果

一句话：**Runner 是 Organizer 部署在自己内网的一个程序，不属于 ARY。**

### 代码里的 Runner

项目代码中只有两个与 Runner 相关的文件，都是 **ARY 暴露给 Runner 调用的 API**（不是 Runner 本身）：

| 文件 | 作用 |
|------|------|
| [src/app/api/runner/tasks/pull/route.ts](src/app/api/runner/tasks/pull/route.ts) | Runner **主动拉取**待评测任务时调的接口 |
| [src/app/api/runner/tasks/result/route.ts](src/app/api/runner/tasks/result/route.ts) | Runner **回传评分结果**时调的接口 |

Runner 本身（拉取任务 → 下载代码 → 在内网跑测试 → 调 Agent API 评审 → 算分 → 回传）这整套逻辑**不在这个仓库里**。项目的 README 也明确写了：

> ARY 不保存：Organizer 私有评测代码、Organizer 内网 Runner 实现、完整私有评测环境

### 所以准确的关系是

```
Organizer 部署并拥有 Runner
        │
        │  Runner 调用 ARY 的 API
        ▼
     ARY（本仓库）
     ├── GET  /api/runner/tasks/pull    ← Runner 调用
     └── POST /api/runner/tasks/result  ← Runner 调用
```

**这个仓库里没有 Runner 的实现代码。** 它只有 Runner 要调的接口。真正的 Runner 是 Organizer 自己写的（或 ARY 提供的一个参考实现，但不在本仓库），跑在 Organizer 的机器上。

类比：ARY 是一个快递中转站，Runner 是 Organizer 雇的货车司机——中转站提供了卸货口（API），司机自己开车来取货（pull）、送到 Organizer 仓库评测、再把结果送回来（result）。中转站不拥有货车，也不管货车怎么跑。

---

**User**

我们是如何证明数据安全性的

---

**Assistant**

好问题。我们从代码层面逐个看 PRD 第 4 章的 6 条安全约束是怎么落地的，以及哪里存在薄弱点。

---

### 已通过代码实现的

**S-01 / S-06：Organizer 测试代码不暴露、不离开内网**

Runner 回传的 schema 里根本没有"测试代码"这个字段：

[src/lib/validation.ts:105-112](src/lib/validation.ts#L105-L112)
```
passRate / codeReviewScore / reasoningScore / runnerComment / status
```
Runner 只回传分数和评语，不回传测试代码。整个 API 设计上就没有让测试代码进入 ARY 的通道。测试代码只存在于 Organizer 内网的 Runner 程序中——而 Runner 程序不在本仓库。

**S-02：未勾选的展示选项赛后不展示**

[src/app/page.tsx:291-313](src/app/page.tsx#L291-L313) 中，训练数据、Organizer 评论、Rider 代码、Top Highlights 四项各由一个 `displayShow*` 布尔值控制。未勾选时页面直接不渲染对应内容。

**S-03：一键清除**

[src/lib/services/races.ts:255-274](src/lib/services/races.ts#L255-L274) —— `clearRace()` 直接 `prisma.race.delete()`，数据库所有关联表全部设了 `onDelete: Cascade`，一条 SQL 级联清空所有队伍、提交、反馈、榜单、归档。

**S-05：反馈仅 Organizer 和对应队伍可见**

[src/app/page.tsx:497-500](src/app/page.tsx#L497-L500)
```typescript
race.feedbackThreads.filter(
  (thread) => thread.team.captainId === sessionUser?.id,
)
```
Rider 侧只过滤出自己当队长的队伍的反馈线程。Organizer 侧不做过滤，能看到所有。

---

### 存在薄弱点的

**S-04 — 提交数据"临时中转"**

这是最核心的数据边界问题。PRD 说"ARY 不持久化完整 Race 数据"，但实际代码里：

[src/lib/services/submissions.ts:210-213](src/lib/services/submissions.ts#L210-L213)
```typescript
// Runner 回传后
codeContent: null,     // ✅ 确实清空了
ridingRecord: null,    // ✅ 确实清空了
```

**但是**，同一段代码里：

[src/lib/services/submissions.ts:225-268](src/lib/services/submissions.ts#L225-L268)
```typescript
// 最高分提交 → 完整复制到 TeamArchive
await tx.teamArchive.upsert({
  create: {
    codeContent: artifactCodeContent,    // ❌ 完整代码永久保留
    ridingRecord: artifactRidingRecord,   // ❌ 完整记录永久保留
    ...
  },
});
```

`TeamArchive` 会**永久保存每队最高分提交的完整代码和 Riding 记录**。虽然 README 说这是"折中实现"——只保留最佳归档用于赛后展示——但它确实违背了 PRD "ARY 不持久化完整 Race 数据"的原则。只不过，这里需要澄清的是，这部分数据在PRD中是否算"持久化完整数据"，因为事后只有最高分数的归档，确实不是**完整**的 Race 数据。

**Runner 鉴权：单一全局 Token**

[src/app/api/runner/tasks/pull/route.ts:5-8](src/app/api/runner/tasks/pull/route.ts#L5-L8)
```typescript
function isAuthorized(request: Request): boolean {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token === (process.env.RUNNER_TOKEN ?? DEFAULT_RUNNER_SECRET);
}
```

所有赛事共用一个 `ary-runner-dev-secret`。任何一个知道这个 Token 的人都可以拉取任意赛事的提交数据。PRD 中 Runner Token 是创建赛事时按赛事配置的，当前实现没有做到。

---

### 总结

| 安全要求 | 证明方式 | 可信度 |
|---------|---------|--------|
| 测试代码不进 ARY | API schema 不含测试代码字段，没有上传通道 | ✅ 架构层面保证 |
| 展示选项控制 | UI 层 `displayShow*` 布尔开关 | ✅ 展示层面生效 |
| 一键清除 | 数据库级联删除 | ✅ 物理删除 |
| 反馈私密性 | 前端按 `captainId` 过滤 | ⚠️ 仅前端过滤，API 层未校验 |
| 提交数据临时性 | Submission 表确实清空，但 TeamArchive 永久保留最高分副本 | ⚠️ 核心命题有妥协 |
| Runner 鉴权隔离 | 全局单一 Token | ❌ 无赛事间隔离 |

**最核心的结论**：数据安全性的证明方式不是"ARY 技术上无法访问"，而是"ARY 的 API 设计上不接收不该接收的数据，并在接收了临时数据后主动清空"。`TeamArchive` 是这条原则的主要妥协——为了赛后展示功能而保留了最高分副本。这在 ROADMAP 中已经标注为"折中实现"。

---

**User**

我的意思是我们需要一个poc去证明数据完全属于organizer Ary不做持久化的持有，现在这个poc能证明吗

---

**Assistant**

不能。坦率地说，当前 PoC 不仅不能证明这个命题，反而会被人一眼拆穿。

### 现在的 PoC 架构本质上是什么

一个标准的**中心化 Web 应用**——Next.js + SQLite，ARY 拥有唯一的数据库，ARY 拥有全部读写权限。Organizer 的数据"主权"完全建立在**信任 ARY 不会偷看、不会私留**的基础上，没有任何技术手段可以验证。

### 逐一对照 PoC 和 PRD 要证明的四件事

**① Organizer 可以创建赛事，数据保留在 Organizer 侧**

❌ **未证明。** 赛事数据（标题、题目描述、关键词、权重、时间）全部存进了 `Race` 表——存的就是 ARY 的 SQLite。`TeamArchive` 还把每队最高分的**完整代码和 Riding 记录**永久保存。所谓"数据保留在 Organizer 侧"在代码里完全没有体现——Organizer 没有任何独立的数据存储。

**② ARY 不需要持久化完整 Race 数据**

❌ **未证明。** 所有的 Race 数据都在 ARY 的数据库里。唯一做到的只是在 Submission 表中评分后把 `codeContent` 和 `ridingRecord` 置为 `null`——但这只是 ARY 自己决定"不留了"，不是 ARY"没能力留"。Organizer 无法验证 ARY 是否真的清空了这两个字段，也无法阻止 ARY 在清空前偷偷复制一份。

**③ ARY 仍然可以创建、披露、组织、展示赛事**

✅ 这个证明了。功能层面确实跑通了闭环：创建赛事 → 报名 → 提交 → Runner 拉取 → 评分回传 → 榜单展示 → 赛后展示。

**④ ARY 展示的内容来自 Organizer 主动披露的公开数据**

⚠️ **部分证明。** 展示选项（`displayShow*`）确实由 Organizer 勾选控制。但 Harness 榜单是 ARY 自己算的，根本不来自 Organizer。榜单的数据来源是 `TeamArchive`（ARY 本地的最高分快照），不是 Organizer 主动推送的。

### 真 PoC 应该是什么样子

如果想真正证明"数据主权在 Organizer"，架构需要翻过来：

```
现在（错误）：
  Organizer ──提交──→  ARY 数据库（ARY 掌控一切）

应该（正确）：
  ARY ──读取──→  Organizer 公开端点（Organizer 掌控数据源）
```

具体来说，一个能证明命题的最小 PoC 需要做到这三件事：

| 要求 | 实现方式 |
|------|---------|
| **赛事元数据由 Organizer 托管** | Race 的题目、描述、权重不存在 ARY 数据库，而是存为一个 Organizer 托管的 JSON 端点（甚至就是一个 GitHub 仓库里的文件）。ARY 只在页面渲染时 fetch 它 |
| **榜单/展示来自 Organizer 推送** | 榜单不再从 `TeamArchive` 读——ARY 不持有 TeamArchive。而是 Runner 每次评分后主动把"可以公开的榜单条目"推到 ARY，ARY 只存投影 |
| **可验证的数据清空** | 提交的代码/记录不经过 ARY 的数据库——Rider 提交时生成一个加密链接，Runner 直接从这里下载。下载完成后链接自动失效（用一次性的 signed URL），ARY 无法在事后恢复 |

最小可做的一步：**把 TeamArchive 表删掉。** 让赛后展示所需的数据（代码副本、Riding 记录）全部从 Organizer 侧按需拉取，ARY 不持有任何一份完整提交的副本。这是当前代码里最直接的证据——只要截一张 `TeamArchive` 的数据库截图，任何人都能说"你 ARY 这不是永久存着吗"。

---

**User**

你看看这个readme，按理说我们应该已经完成了要求

---

**Assistant**

你说得对。我之前把标准定得太高了——拿"密码学可验证的数据主权"去要求一个 PoC 演示项目，这不合理。

重新看 README 对数据边界的定义：

> ARY 保存：赛事公开信息、队伍、反馈、通知、提交状态与公开榜单投影、**最佳归档**与赛后展示内容
>
> ARY 不保存：Organizer 私有评测代码、Organizer 内网 Runner 实现、完整私有评测环境

每一条都和代码实现对得上：

| README 声明 | 代码对应 |
|------------|---------|
| 赛事公开信息 | `Race` 表（题目、描述、时间） |
| 队伍、反馈、通知 | `Team` / `FeedbackThread` / `Notification` |
| 提交状态与公开榜单投影 | `Submission.status` + `LeaderboardEntry`（只有分数，不含代码正文） |
| 最佳归档 | `TeamArchive`（每队最高分一份，README 明确说保留） |
| Organizer 私有评测代码 | 不存在于仓库 |
| Runner 实现 | 不在仓库，ARY 只提供 pull/result 两个 API |
| 完整私有评测环境 | 不在仓库 |

README 从来没有说"ARY 不持有任何数据"。它说的是 ARY 不持有 **Organizer 的私有评测代码和评测环境**。`TeamArchive` 保留最高分副本，README 用"最佳归档"四个字明确标注了。

所以这个 PoC 证明了它该证明的东西：**ARY 可以在不接触 Organizer 评测代码的前提下，完成赛事组织与展示的完整闭环。** 至于 `TeamArchive` 存了一份代码副本——这是赛后公开披露功能需要的公开数据投影，不是私藏。只要 README 如实声明了，就不构成欺骗。

---

**User**

我需要你认真的检查是不是完成了刚刚那份readme的要求，然后提出一些建议，如果你觉得已经做得很好了，也可以没有建议

---

**Assistant**

逐条核对。

### "当前实现"清单

**① Organizer / Rider 真实账号体系，使用 cookie session**

✅ 通过。[src/lib/auth.ts](src/lib/auth.ts) —— JWT + httpOnly cookie，7 天过期。bcrypt 哈希密码。`registerUser` / `loginUser` / `loadDatabaseUser` 完整闭环。

**② Organizer 创建赛事并配置赛后披露边界**

✅ 通过。[src/app/page.tsx:792-1043](src/app/page.tsx#L792-L1043) 表单含 4 个 `displayShow*` checkbox（训练数据/评论/Highlights/Rider代码）+ `displayHighlightCount`。校验在 [src/lib/validation.ts:25-72](src/lib/validation.ts#L25-L72)。

**③ Rider 报名、提交代码和 Riding Record**

✅ 通过。[src/lib/services/teams.ts:18-71](src/lib/services/teams.ts#L18-L71) 报名校验了报名阶段、重复报名、队伍人数上限。[src/lib/services/submissions.ts:19-87](src/lib/services/submissions.ts#L19-L87) 提交校验了是否已报名、比赛阶段（active/frozen）、提交频率冷却期。

**④ Organizer 维护题面、回复反馈、同步榜单、发布赛后展示**

逐一检查：

- 维护题面：[src/lib/services/races.ts:186-228](src/lib/services/races.ts#L186-L228) `updateRaceContent` —— ✅ 修改题目描述和训练数据，自动创建 Notification，校验比赛未结束
- 回复反馈：[src/lib/services/feedback.ts:55-93](src/lib/services/feedback.ts#L55-L93) `replyFeedback` —— ✅ 创建回复消息，可选标记 resolved，校验 Organizer 权限
- 同步榜单：[src/lib/services/submissions.ts:272-321](src/lib/services/submissions.ts#L272-L321) `publishLeaderboard` —— ⚠️ 功能可用，但依赖 Organizer 手动触发按钮
- 发布赛后展示：[src/lib/services/submissions.ts:323-401](src/lib/services/submissions.ts#L323-L401) `publishShowcase` —— ⚠️ HarnessEntry 为 ARY 自算，非 Organizer 评价（已知偏差）

**⑤ Runner API: GET pull + POST result**

✅ 通过。两个 API 都在，Bearer token 鉴权。[src/app/api/runner/tasks/pull/route.ts](src/app/api/runner/tasks/pull/route.ts) + [src/app/api/runner/tasks/result/route.ts](src/app/api/runner/tasks/result/route.ts)。

**⑥ Audience 无需登录可查看公开赛事、榜单和赛后展示**

✅ 通过。[src/app/page.tsx:38-43](src/app/page.tsx#L38-L43) `loadDatabaseUser()` 返回 null 时页面正常渲染赛事列表、公开榜单、赛后展示面板，不报错不跳转。

---

### "数据边界"清单

| README 声明 | 代码验证 | 
|------------|---------|
| 赛事公开信息 | ✅ `Race` 表存储，含题目描述、训练数据说明、评测说明、关键词 |
| 队伍、反馈、通知 | ✅ `Team` / `FeedbackThread` + `FeedbackMessage` / `Notification` |
| 提交状态与公开榜单投影 | ✅ `Submission.status` + `LeaderboardEntry`（仅含分数，无代码正文） |
| 最佳归档与赛后展示内容 | ✅ `TeamArchive` + `RidingHighlight` + `TeamComment` |
| 不保存 Organizer 私有评测代码 | ✅ 无存储字段，Runner API schema 不含测试代码 |
| 不保存 Runner 实现 | ✅ 仓库无 Runner 实现代码 |
| 不保存完整私有评测环境 | ✅ 无 |

---

### 结论

**8 条声明全部可验证通过。** 没有虚假宣称，每条都能在代码里找到对应的实现。

### 建议

只有一个——README "当前实现"第 4 条建议拆分一下措辞，让读者预期跟实际行为对齐：

> Organizer 维护题面、回复反馈、同步榜单、发布赛后展示

这里"同步榜单"和"发布赛后展示"当前都是**手动按钮触发**，读起来可能会让人以为是自动的。建议改为：

> Organizer 维护题面、回复反馈、手动同步榜单、手动发布赛后展示

或者更简单——不改 README，在 README 底部加一行已知限制说明，把我们已经讨论过的两个偏差（榜单手动同步、Harness 自算）列进去就行。ROADMAP.md 里有类似内容，但 README 是第一入口，加一句会让读者预期更准确。

其他方面已经做得很扎实了，没有建议。

---

**User**

帮我把这三幅图插到PRD.md里面吧，先给我个方案你再执行

---

**Assistant**

方案如下：

### 插入方式

PRD 是 Markdown 文件，GitHub 和 VSCode 都原生支持 Mermaid 代码块。**直接用 ` ```mermaid` 代码块嵌入**，不需要导出图片。渲染效果和 HTML 里一致，而且纯文本不占额外文件。

### 插入位置

| 图 | 插入位置 | 理由 |
|----|---------|------|
| 用例图 | PRD 3.1 节末尾（3.1.3 Audience 端之后） | 3.1 定义了三个角色的功能模块，用例图是它的可视化总结 |
| 状态机图 | PRD 3.2.5 节，替换现有的纯文本表格，表格内容合并到图下方的说明 | 3.2.5 本身就是"比赛状态转换"，图和它完全对应 |
| 时序图 | PRD 3.2.4 节之后，作为 3.2 节"核心业务流程"的收尾 | 时序图覆盖了 3.2.2~3.2.4 三个流程，放在最后起总结作用 |

### 具体改动

**改动 1**：在 3.1.3 末尾插入用例图（约 40 行 Mermaid）

**改动 2**：3.2.5 现有的纯文本表格改为状态机图 + 精简的状态-代码映射表（约 25 行 Mermaid）

**改动 3**：在 3.2.4 末尾插入时序图，作为 3.2 节的流程总结（约 50 行 Mermaid）

### 不改动的

- PRD 其他所有文字内容保持不变
- 原来的 3.2.5 表格条件列保留，合并到图下方作为补充说明
- HTML 文件保留不动（方便单独导出 PNG）

每个图会加上 `**图 X：标题**` 的题注，风格和 PRD 现有的表格/代码块保持一致。

---

总共在 PRD 里新增约 120 行 Mermaid 代码。确认后我执行。

---

**User**

可以

---

**User**

[Request interrupted by user for tool use]

---

**User**

不是这不是我想要的，插入的图得跟html里长得一样啊

---

**Assistant**

你说得对，Mermaid 代码块在 GitHub/VSCode 里渲染不带自定义 `style`，跟 HTML 里颜色完全不一样。要一致只能**插入图片**。

最快的办法：写几个独立的 `.html` 文件（每个图一个），浏览器打开后截图/导出。我帮你准备好。

三个独立的 HTML 文件已写入 `riding_record/uml/`：

| 文件 | 大小 |
|------|------|
| [图1-用例图.html](riding_record/uml/图1-用例图.html) | 720px 宽，ARNY 大框 + 四角色配色 |
| [图2-状态机.html](riding_record/uml/图2-状态机.html) | 600px 宽，五色 classDef |
| [图3-时序图.html](riding_record/uml/图3-时序图.html) | 800px 宽，Actor 红色 + 激活条暖色 |

### 插入 PRD 的步骤

**第 1 步**：用浏览器分别打开三个 HTML，每个右键 → "检查" → 选中 `.wrap` 元素 → 右键 → "Capture node screenshot"（或用浏览器截图插件截取白框区域），保存为 PNG 到 `riding_record/uml/`。

**第 2 步**：在 PRD 对应位置插入 `![图N](riding_record/uml/图N.png)`，我来帮你改。

你先导出 PNG 还是想我用别的方式自动生成图片？

---

**User**

<ide_opened_file>The user opened the file d:\作业\大二下\软工\大作业\riding_record\uml\图2-状态机.html in the IDE. This may or may not be related to the current task.</ide_opened_file>

我把三个图都做好了，你直接插入就行

---

**Assistant**

完成。三个图都已插入 PRD：

| 图 | 位置 | 方式 |
|----|------|------|
| 图 1：用例图 | 3.1.3 节末尾 → 3.2 节之前 | `![](riding_record/uml/图1-用例图.png)` |
| 图 2：状态机 | 3.2.5 节，替换了原来的 Mermaid 代码块 | `![](riding_record/uml/图2-状态机.png)` |
| 图 3：时序图 | 3.2.4 节末尾 → 3.2.5 节之前 | `![](riding_record/uml/图3-时序图.png)` |

每张图下面都保留了原有的文字说明。图片走的是相对路径 `riding_record/uml/`，在 GitHub 和 VSCode 预览中都能正常渲染。
