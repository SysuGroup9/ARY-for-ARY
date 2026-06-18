## 偏差一：榜单同步 —— 从「自动颗粒度推送」变成「Organizer 手动按钮」

---

### PRD 怎么说的

PRD 第 2.1 节核心能力第 6 条：

> 展示榜单（ **按 Organizer 颗粒度实时更新** ）

PRD 第 3.2.3 节专门定义了这个流程：

```
ARY 每隔固定颗粒度 → 给 Organizer 发送读取进度请求
  → Organizer 收到请求后，读取 Runner 拉取的代码并计算进度
    → Organizer 返回进度结果给 ARY
      → ARY 在榜单中更新，展示进度
```

这是一个 **三方协作的自动循环** 。ARY 是发起方，按 `updateGranularityMinutes`（创建赛事时设置，默认 30 分钟）定时向 Organizer 发送请求；Organizer 侧的 Runner 收到请求后主动计算一次当前所有队伍的进度，回传给 ARY；ARY 据此刷新榜单。核心逻辑是： **ARY 不知道进度，ARY 向 Organizer 要进度，Organizer 掌握进度计算的主动权** 。

### 现在是怎么实现的

整个流程被简化成了 **Organizer 在前端页面点一个按钮** ：

[src/app/page.tsx:546-548](vscode-webview://1k1cr68j04ailth94aldinv39bkde4tatel8lc6d4lgssd4srcf6/src/app/page.tsx#L546-L548)

```tsx
<form action={publishLeaderboardAction}>
  <input name="raceId" type="hidden" value={race.id} />
  <button type="submit">同步公开榜单</button>
</form>
```

这个按钮触发 Server Action `publishLeaderboardAction`，最终调用 `publishLeaderboard()`：

[src/lib/services/submissions.ts:272-321](vscode-webview://1k1cr68j04ailth94aldinv39bkde4tatel8lc6d4lgssd4srcf6/src/lib/services/submissions.ts#L272-L321)

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

* `updateGranularityMinutes` 字段 **已经在数据库里** ，创建赛事表单也能设置，但它 **从未被任何代码读取或使用** 。它纯粹是一个存了但不用的字段。
* `lastLeaderboardSyncAt` 记录了最后一次同步时间，但也只用于记录——没有代码检查它是否过期、是否该触发下一次同步。
* 没有任何 cron job、`setInterval`、WebSocket 推送、Server-Sent Events。
* 榜单的数据来源是 `TeamArchive`（每队最高分提交的副本），而不是向 Organizer 请求实时进度。

### 为什么我觉得现在是这样的

这个偏差不是疏忽，而是 **演示环境的边界条件导致的有意取舍** 。原因有三层：

**第一层：没有后台任务基础设施。** 整个应用是 Next.js + SQLite 单体，跑在 Vercel 上。PRD 描述的「每隔 N 分钟自动发送请求」需要一个调度器——要么是 Vercel Cron Jobs（需额外配置），要么是 `setInterval` 在服务端（Serverless 环境下不可靠），要么是客户端轮询（违背"ARY 发起"的语义）。在 PoC 阶段，搭这套基础设施的投入产出比不高。

**第二层：PRD 的自动流程依赖 Organizer 侧在线。** PRD 3.2.3 的流程要求 Organizer「收到请求后，读取 Runner 拉取的代码并计算进度」。这意味着 Organizer 必须有一个常驻服务在监听 ARY 的请求——但当前架构中，Runner 只是一个主动拉取的 HTTP 客户端，没有接收请求的能力。要让这个循环跑起来，需要 Organizer 侧也部署一个接收端。这在演示阶段几乎不可能做到——演示的 Organizer 和 Rider 可能跑在同一个浏览器里。

**第三层：`TeamArchive` 已经提供了退而求其次的数据源。** Runner 每次回传评分后，`scoreRunnerTask()` 会 upsert `TeamArchive`，保留每队最高分提交的完整快照（代码、记录、各项分数）。这不等于「进度」，但它是一个可靠的、反映当前最佳成绩的数据集。`publishLeaderboard` 直接从中读取并投影到 `LeaderboardEntry`，逻辑上自洽。

所以现在的实现本质上是： **把 PRD 中 "ARY 定时向 Organizer 请求进度" 的推拉模型，降级为 "Organizer 觉得该更新了就自己来点一下" 的手动模型** 。数据来源从「Organizer 实时计算」降级为「ARY 本地归档的最高分快照」。

### 我认为应该怎么实现

这取决于目标——是继续做演示，还是要逼近 PRD 的设计意图。分两档方案：

---

#### 方案 A：最小改动，让「手动」看起来像「半自动」（适合继续演示）

改动量很小，不改架构：

1. **让 `updateGranularityMinutes` 活起来。** 在页面上检查 `lastLeaderboardSyncAt`，如果距离上次同步已经超过 `updateGranularityMinutes`，就在「同步公开榜单」按钮旁边显示一个醒目提示： **「榜单已 45 分钟未更新（刷新粒度 30 分钟），建议同步」** 。
2. **把 `TeamArchive` 的数据来源标注清楚。** 在榜单面板上加一行说明：「当前榜单基于各队最高分归档快照，最近同步于 2026-06-06 14:30」。
3. **可选** ：在前端加一个 `setInterval`，每隔 `updateGranularityMinutes * 60 * 1000` 毫秒自动调一次 `publishLeaderboardAction`。这不是真正的「ARY 向 Organizer 请求」，但用户体验上接近自动更新。代价是如果 Organizer 关掉页面，榜单就停止更新——但这在演示场景下是合理的。

```
改动文件：src/app/page.tsx（加提示逻辑 + 可选自动刷新）
          无需改数据库 / API
```

---

#### 方案 B：按 PRD 设计意图重构（适合向生产演进）

需要新增基础设施和 API：

**第 1 步：新增 Organizer 侧的「进度查询」API**

PRD 3.2.3 描述的是 ARY → Organizer 方向。在当前架构中，可以让 Organizer 的 Runner 在回传评分结果时 **顺便带上当前所有队伍的进度快照** 。具体做法：

* 扩展 `POST /api/runner/tasks/result` 的请求体，允许 Runner 在回传单个提交结果的同时附带一个可选的 `leaderboardSnapshot`：

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

* 在 `scoreRunnerTask()` 中，如果 Runner 提供了 `leaderboardSnapshot`，就顺便更新 `LeaderboardEntry`。

这样做的好处是 **不需要 ARY 主动向 Organizer 发请求** ——它利用了已有的 Runner → ARY 回传通道，把「进度」作为回传的附加信息。Organizer 每次评完一个提交，顺手就把全量进度表更新了。这符合 PRD "Organizer 掌握进度计算" 的精神，同时不要求 Organizer 暴露公网接口。

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

* 使用 Vercel Cron Jobs（`vercel.json` 配一个每 N 分钟触发的 endpoint）
* 或者用 Next.js 的 `revalidatePath` / ISR 机制做软刷新
* 或者在页面上用 `setInterval` 轮询（降级方案）

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

 **现阶段用方案 A** 。原因是：

* 项目当前定位是「全栈演示」，ROADMAP 和 README 都明确了这个边界
* PRD 第 8 章也承认很多功能是「初步实现」
* 方案 A 改动小，但至少让 `updateGranularityMinutes` 不再是一个死字段，并在 UI 上体现「同步是 Organizer 主动发起的」

如果后续要往生产演进，方案 B 的第 1 步是最划算的一步——不改架构，只扩展现有 API 的请求体，就让「Organizer 掌握进度数据主权」这个核心理念在代码层面真正成立。
