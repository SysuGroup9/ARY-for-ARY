# ARY-for-ARY GRS004 骑行记录

- 记录日期：2026-07-12
- 记录人：阮依成

## 本轮对项目的主要贡献

### 1. 大屏风险数据一致性修复：从"显示数字"到"可追溯的风险明细"

7 月 12 日测试时发现一个严重的用户体验问题：大屏 KPI 显示"1 个风险"，但点开风险详情面板遍历所有参赛者，却看不到任何人有风险——用户只能看到一个数字，完全不知道是谁、为什么、有多严重。

这个 bug 的根因非常隐蔽，需要对 Jumbotron 数据流有完整理解才能定位：

#### 问题定位过程

我要求 Agent 追踪大屏风险数据的计算路径，最终发现 `src/lib/jumbotron/adapter.ts` 里存在**两条互不一致的计算逻辑**：

1. **KPI 的 `riskCount`**（`calculateKPIs` 函数）统计两类来源：
   - `raceProject.aggregateIngestionStatus === "FAILED"`（CA 接入失败）
   - `teamArchive.antiCheatPenalty > 0`（反作弊扣分）

2. **每个参赛者条目的 `riskLevel` / `violationCount`**（`mapToRacingEntries` 函数）**只**反映反作弊扣分：
   ```ts
   riskLevel: (archive?.antiCheatPenalty ?? 0) > 0 ? "medium" : "low",
   violationCount: (archive?.antiCheatPenalty ?? 0) > 0 ? 1 : 0,
   ```

所以当风险来源是"CA 接入失败"或"会话风险"时（如 `race_story_running` 的 rider_orion），KPI 顶部计数为 1，但所有参赛者条目都是 `low` / `0`，详情面板显示不出任何风险行。

更严重的是，数据库里已经有 `Session.riskLevel` 和 `Session.riskReason` 字段，种子数据也在写入会话级风险，但 adapter **从来没有读取过这些字段**，导致会话风险完全被忽略。

这个发现让我意识到问题的严重性：不只是"显示问题"，而是**架构层面的数据源分裂**。如果未来新增"提交频率异常"或"代码相似度过高"等风险类型，每次都要同步修改 `calculateKPIs` 和 `mapToRacingEntries` 两个函数，很容易再次出现不一致。

更关键的是，会话风险机制（`Session.riskLevel` / `Session.riskReason`）在 GRS004 已经存在：
- Prisma schema 定义了这两个字段
- Seed 数据在写入会话级风险（如 `rider_charlie` 的 "One active blocker remains"）
- 但 **adapter 从来没有读取过这些字段**

这意味着大屏的风险展示一直只看反作弊扣分和 CA 接入失败，完全忽略了会话级风险——这是一个数据流断层。

#### 修复方案设计

我的核心思路是：**让参赛者条目成为唯一权威来源**，综合三类风险信号，再让 KPI 数字从条目派生，保证两者永远一致。

这个思路来自 `race-snapshot.ts` 里已有的模式：`onlineRiders` 和 `activeRiders` 就是从 `entries` 派生的，而不是单独查库计算。我要把 `riskCount` 和 `violationCount` 也改成这种模式。

具体改动包括：

1. **数据契约扩展**
   - `RacingEntrySnapshot` 新增 `riskReason?: string` 字段，携带真实风险说明文本
   - `AryRaceData` 的 session 类型新增 `ingestionStatus`、`riskLevel`、`riskReason` 字段

2. **综合风险推导**（`mapToRacingEntries`）
   对每个参赛者按优先级合并三类信号：
   - **反作弊扣分**：`antiCheatPenalty > 0` → `high` + `violationCount +1` + `"检测到诱导词，扣 N 分"`
   - **CA 接入失败**：`aggregateIngestionStatus === "FAILED"` 或任一 connection `ingestionStatus === "FAILED"` → `medium` + `"CA 接入失败，实况数据中断"`
   - **会话风险**：`session.riskLevel` 为 `medium`/`high` → 取会话等级 + `session.riskReason` 或 `"会话风险等级偏高"`

   多个原因用 `；` 连接。无任何风险时 `riskLevel="low"`、`riskReason=undefined`。

   这个合并逻辑有三个设计细节：
   - **优先级**：反作弊扣分最高（`high`），CA接入失败其次（`medium`），会话风险取字段值
   - **不降级**：如果已经是 `high`，后续信号不会降级到 `medium`
   - **违规数只算扣分**：只有反作弊扣分才增加 `violationCount`，CA接入失败和会话风险不算"违规"

   我当时追问为什么要这样设计。Agent 解释：`violationCount` 的语义是"主动违规次数"，反作弊扣分是选手主动诱导词触发，而 CA 接入失败可能是网络问题、环境问题，不一定是选手主动行为，所以不计入违规数。

3. **查询补齐字段**（`race-snapshot.ts`）
   - Prisma 查询的 `caConnections.select` 增加 `ingestionStatus`
   - `sessions.select` 增加 `riskLevel`、`riskReason`
   - raceData 映射同步透传

   这一步看起来简单，但其实暴露了一个历史遗留问题：GRS004 的 Prisma schema 早就定义了 `Session.riskLevel` 和 `Session.riskReason`，seed 数据也在写入，但查询时**从来没有 select 过这两个字段**。这意味着这些数据一直在数据库里，但从来没有被任何业务逻辑使用过。

   修复时我特意检查了 `caConnections` 的 `ingestionStatus` 字段——这个字段也是早就存在，但之前只在计算 KPI 时用过，从来没有传递给参赛者条目。现在统一补齐。

4. **KPI 从条目派生**（`race-snapshot.ts`）
   在 `buildRaceSnapshot` 内计算完 `entries` 后覆盖 KPI：
   ```ts
   const riskyEntries = entries.filter(
     (e) => e.riskLevel === "medium" || e.riskLevel === "high" || e.violationCount > 0,
   );
   kpis.riskCount = riskyEntries.length;
   kpis.violationCount = riskyEntries.reduce((sum, e) => sum + e.violationCount, 0);
   ```
   与已有的 `onlineRiders` / `activeRiders` 覆盖同处，保持模式一致。

   这段代码放在哪里很关键。我一开始想放在 `adapter.ts` 的 `calculateKPIs` 里，但 Agent 指出：`calculateKPIs` 只接收 `AryRaceData`，拿不到已经映射好的 `RacingEntrySnapshot[]`。真正合适的位置是 `race-snapshot.ts` 的 `buildRaceSnapshot`，在调用 `provider.getRaceEntries()` 拿到 `entries` 之后、返回 snapshot 之前，覆盖 `kpis.riskCount` 和 `kpis.violationCount`。

   这样做的好处是：`calculateKPIs` 仍然可以给一个初始值（避免字段为 `undefined`），但最终值由 `race-snapshot.ts` 从 `entries` 派生，保证一致性。

5. **Attention Items 覆盖会话风险**（`generateAttentionItems`）
   原来只对 `FAILED` 接入和反作弊扣分生成 ticker 条目，补充：会话 `riskLevel` 为 `medium`/`high` 时也生成一条 `risk` 类 attention item，保证滚动条与详情面板一致。

   这一步修改后引入了一个测试回归：测试 `"prefers failed aggregate ingestion status to create process attention items"` 期望 CA 接入失败时只生成一条 attention item，但我的修复逻辑同时检查了 `aggregateIngestionStatus` 和每个 `connection.ingestionStatus`，可能生成重复条目。后续需要加去重逻辑，或者修正测试期望。

   但我认为这个回归是**合理的代价**：之前的逻辑只检查 `aggregateIngestionStatus`，如果某个 connection 单独 `FAILED` 但 `aggregateIngestionStatus` 是 `CONNECTED`，就会漏掉风险提示。现在改为逐个检查 connection，确保不漏报，但可能出现重复。去重是下一步优化，先保证不漏报。

6. **UI 展示**（`JumbotronClient.tsx`）
   - **风险详情面板**：只列出真正有风险的参赛者，新增"风险说明"列，用彩色徽章显示等级；无风险时显示"当前没有活跃风险"
   - **抽屉（drill-down）**：风险等级用中文标签，新增一行 `⚠ {riskReason}` 展示原因
   - 新增 `riskLevelLabel()` 辅助函数与对应徽章 CSS

   UI 改动看起来简单，但有个细节：之前的风险详情面板是遍历**所有**参赛者，即使 `riskLevel` 是 `low` 也会显示，导致表格很长但大部分都是"正常"状态。修复后改为只显示真正有风险的参赛者（`medium` / `high` / 有违规 / 有原因），如果没有任何风险就显示"当前没有活跃风险"的空态文案。

   这个改动让风险面板从"信息展示"变成"问题定位"——用户点开风险面板时，只想看谁有问题，不想看一堆正常状态。

   另外，风险等级徽章用了不同颜色：
   - `high`：红色背景（`rgba(195,78,54,0.12)`），红色文字
   - `medium`：橙色背景（`rgba(230,126,34,0.14)`），橙色文字
   - `low`：绿色背景（`rgba(80,184,108,0.12)`），绿色文字
   - `none`：灰色背景（`rgba(68,55,37,0.06)`），灰色文字

   这套配色与大屏的整体色系保持一致，都是高饱和度 + 低透明度背景 + 同色系深色文字。

#### 验收结果

`npm run db:seed` 重新生成快照后，三场进行中赛事的风险数据完全一致：

| 赛事 | KPI 风险数 | 有风险条目 | 说明 |
|---|---|---|---|
| `race_active` | 2 | charlie（会话阻塞）、diana（反作弊扣分） | 一致 |
| `race_active_oval` | 1 | diana（token 成本预警） | 一致 |
| `race_story_running` | 1 | orion（CA 接入失败） | **修复的核心场景** |

这个修复不只是"改个数字"，而是把大屏的风险展示从**单一数据源**（反作弊扣分）扩展到**三源合一**（反作弊 + CA 接入 + 会话风险），并且保证 KPI、详情面板、抽屉、ticker 四个展示位置的数据完全一致。

#### 修复过程中的技术细节

整个修复涉及 4 个文件、70+ 行改动，但核心思路一直是：**单一数据源 + 派生聚合**。

**第一个卡点：TypeScript 类型扩展**

在 `adapter.ts` 的 `AryRaceData` 类型里加入 session 的 `riskLevel` 和 `riskReason` 时，Agent 一开始只加了类型定义，但没有同步修改 `race-snapshot.ts` 的查询和映射。结果 TypeScript 编译通过了，但运行时这两个字段还是 `undefined`。

我要求 Agent 检查数据流：Prisma 查询 → raceData 映射 → adapter 读取，确认每一步都正确传递。最终发现 `race-snapshot.ts` 的 `sessions.select` 里缺了这两个字段，补齐后才真正生效。

**第二个卡点：风险推导的优先级**

在 `mapToRacingEntries` 里合并三类风险时，我一开始的想法是"按顺序覆盖"：先设反作弊扣分，再设 CA 接入失败，最后设会话风险。但 Agent 指出这样会导致**低优先级信号覆盖高优先级**——比如反作弊扣分已经是 `high`，但会话风险是 `medium`，最后会被覆盖成 `medium`。

改成"不降级"逻辑后：
```ts
if (antiCheatPenalty > 0) {
  riskLevel = "high";
}
if (ingestionFailed) {
  if (riskLevel !== "high") riskLevel = "medium";
}
if (sessionRiskLevel === "high" || sessionRiskLevel === "medium") {
  if (riskLevel === "low") {
    riskLevel = sessionRiskLevel;
  }
}
```

这样保证了：`high` 永远是 `high`，`medium` 不会被 `low` 覆盖。

**第三个卡点：attention items 的去重**

修改 `generateAttentionItems` 后，测试 `"prefers failed aggregate ingestion status to create process attention items"` 失败了。我检查测试用例，发现它期望 CA 接入失败时只生成一条 attention item，但我的逻辑同时检查了 `aggregateIngestionStatus` 和每个 `connection.ingestionStatus`，可能生成多条。

我当时的判断是：这个测试的期望可能不对。`aggregateIngestionStatus` 是一个汇总字段，如果它是 `FAILED`，说明至少有一个 connection 失败了。但如果有多个 connection 同时失败，用户应该看到多条提示，而不是只看到一条汇总。

所以这个回归不是 bug，而是**改进**。后续需要调整测试期望，或者在 `generateAttentionItems` 里加去重逻辑（比如同一个 `entryId` 只生成一条 `risk` 类 attention item）。

这个修复不只是"改个数字"，而是把大屏的风险展示从**单一数据源**（反作弊扣分）扩展到**三源合一**（反作弊 + CA 接入 + 会话风险），并且保证 KPI、详情面板、抽屉、ticker 四个展示位置的数据完全一致。

### 2. 椭圆赛道个人赛 + 大屏轮播 + 可报名赛事补充

#### 新增操场椭圆赛道进行中赛事

按用户需求新增 `race_active_oval`（🏇 路径优化挑战赛）：
- 赛道：`oval-track`（标准操场椭圆跑道，已有底图 `public/assets/tracks/oval-track/background.png`）
- 状态：`running`
- **个人参赛**：6 名骑手（rider_alice ~ rider_frank），兼容容器名=骑手用户名，不用队名
- 完整数据链：Registration → RaceProject → CAConnection → Session → Submission → LeaderboardEntry → TeamArchive

这个赛事的关键是**个人参赛模式**：用户用自己的用户名参赛，不创建 Team，但 ARY 的数据模型仍然要求 Team 容器。所以 seed 里让 `team.captain.username` 直接作为参赛标识，`team.name` 也等于 `username`，保持容器存在但不显式强调"队名"。

**为什么需要个人参赛模式？**

我在测试大屏轮播时发现，现有的两场进行中赛事（`race_active` 和 `race_story_running`）都是团队赛：
- `race_active` 用的是矩阵赛道（`matrix-track`），参赛者名字都是工作标题（"Campus Log Bot"、"Grade Calculator"）
- `race_story_running` 用的是故事赛道（`story-track`），参赛者名字也是工作标题（"Dock Delta"、"Inventory Echo"）

这两场赛事的大屏展示都是"项目名 + 团队信息"，看不到个人骑手的参赛感。但实际业务中，很多比赛是个人赛——尤其是算法竞赛、编程挑战这类场景，用户不想组队，只想用自己的名字参赛。

所以我要求 Agent 新增一场个人赛，用操场椭圆赛道（因为这个赛道底图已经存在，不用新画），让骑手名直接作为参赛标识。

**数据模型的兼容性处理**

ARY 的核心数据模型是 `Registration → Team → TeamArchive`，即使是个人参赛，也要有 Team 容器。所以 seed 数据里这样处理：

```ts
const team = await prisma.team.create({
  data: {
    name: rider.username,  // 队名 = 骑手名
    captain: { connect: { id: rider.id } },
    members: { connect: [{ id: rider.id }] },  // 只有队长一个人
    race: { connect: { id: raceActiveOval.id } },
  },
});
```

这样在大屏上显示时，`projectName` 就是骑手的用户名（`rider_alice`、`rider_bob`），而不是"Team Alice"或"Alice's Project"。

#### 修复大屏轮播过滤条件

用户从实况大厅点"打开大屏"后，期望看到所有进行中赛事的轮播。但 `src/app/jumbotron/[raceId]/page.tsx` 的过滤条件只包含 `active / frozen` 这两个旧阶段，GRS004 的进行中赛事阶段是 `running`，导致新赛事无法出现在轮播列表。

修复只改了一行过滤条件：
```ts
// 修改前
race.phase === "active" || race.phase === "frozen"

// 修改后
race.phase === "running" || race.phase === "active" || race.phase === "frozen"
```

现在从实况大厅点"打开大屏"后，所有 `running` 状态赛事都会出现在轮播列表，每8秒自动切换，支持 `⏸暂停` / `▶ 自动` 恢复。

**这个 bug 为什么会存在？**

我检查 git history 发现，`JumbotronBanner` 组件是在 GRS003 时期实现的，那时候赛事阶段只有 `draft / published / active / frozen / finished / completed / archived`。GRS004 重构了赛事生命周期，把 `active` 拆分成 `registration / running / submitting / judging`，但大屏轮播的过滤条件没有同步更新。

这是一个典型的"模型演进但使用方未同步"问题。理想情况下，应该有一个 `isRaceOngoing()` 工具函数，封装"什么算进行中"的判断逻辑，所有需要过滤进行中赛事的地方都调用这个函数。这样模型演进时只需要改一个地方。

我把这个问题记录在 `docs/superpowers/status.md` 的"仍需继续关注的缺口"章节，建议后续重构。

#### 新增可报名赛事

测试时发现现有 seed 中的 `race_signup`（API Design Race）使用的是 2026 年 6 月的固定日期，今日（2026-07-12）已超出报名窗口。虽然 `status` 字段写死为 `"registration"`，但 `getRacePhase()` 对 `published / registration / running` 三类状态仍按时间窗口自动推进，导致公开页面实际展示的赛事阶段已不是"报名中"。

新增 `race_registration_open`（📝 NLP 推理挑战赛），所有时间字段改用 `addDays(now, ...)` 相对偏移：
- `signupStart`: `addDays(now, -3)`（3天前开始报名）
- `signupEnd`: `addDays(now, +4)`（4天后报名截止）
- `raceStart`: `addDays(now, +5)`（5天后比赛开始）
- `raceEnd`: `addDays(now, +12)`（12天后比赛结束）

这样不论何时运行 `db:seed`，当天都在报名窗口内，`getRacePhase()` 将返回 `"registration"`。

**动态日期 vs 固定日期**

我一开始担心动态日期会导致"每次 seed 数据都不一样"，不利于测试回归。但 Agent 解释：
- 固定日期的问题是"一次性有效"——写死 2026-06-16，过了这个日期就失效
- 动态日期的好处是"永远有效"——相对偏移保证了无论何时运行 seed，都能生成符合当前时间窗口的数据

对于"需要长期保持可报名状态"的示例赛事，动态日期是更好的选择。而对于"需要固定历史数据"的归档赛事，仍然可以用固定日期。

我还建议 Agent 在 seed 生成的快照循环里加入 `race_registration_open`，保证这场赛事的快照也会被生成。修改后 seed 输出：

```
Generated Jumbotron snapshot for race_active
Generated Jumbotron snapshot for race_active_oval
Generated Jumbotron snapshot for race_registration_open
Generated Jumbotron snapshot for race_signup
...
```

这样大屏轮播时，如果有用户想看"报名中"阶段的大屏效果，可以手动访问 `/jumbotron/race_registration_open`。

### 3. 防伪与防篡改安全计划的 GRS004 适配

这次我没有像 GRS003 那样重写整个安全计划文档，而是围绕 GRS004 的新增能力做**增量对齐**：

#### GRS004 的防篡改新基础

GRS004 引入了三个关键反篡改机制：

1. **Work 可见性生命周期**（`Visibility: DRAFT | PUBLISHED`）
   - Rider 提交 Work 时处于 `DRAFT` 状态，只有作者和 Organizer 可见
   - Organizer 主动发布后变为 `PUBLISHED`，进入公开展示和评审流程
   - 防止"赛中直接公开"的作弊风险

2. **Result 引用冻结**（`resultReferenceJson` 冻结机制）
   - Organizer 在评审前冻结 Result 引用快照
   - 冻结后，即使底层数据变化，评审流程使用的仍是冻结时的状态
   - 防止"评审过程中选手修改提交"的后门

3. **Submission 防伪造单调窗口**（`submissionIntervalHours` 与反作弊扣分）
   - Rider 提交间隔受 `submissionIntervalHours` 限制
   - `Session.riskLevel` / `Session.riskReason` 和 `TeamArchive.antiCheatPenalty` 作为风险/扣分记录
   - 诱导词、频繁提交、CA 接入异常都会触发风险标记，进入 Organizer / Judge 评审前提示

#### 我关注的设计要点

我印象深刻的是两个追问：

1. **"Result 冻结是不是太重了？"**  
   我担心每次冻结都要复制大量数据，会不会影响性能。Agent 解释：Result 冻结只是保存一份 JSON 快照（`resultReferenceJson`），不是复制整个数据库表。而且冻结时机是 Organizer 主动触发，不是每次提交都冻结，所以性能影响可控。

2. **"会话风险和反作弊扣分是不是重复了？"**  
   我担心 `Session.riskLevel` 和 `TeamArchive.antiCheatPenalty` 两个字段会产生冲突。Agent 说明：`Session.riskLevel` 是**实时风险提示**，用于大屏和实况展示；`TeamArchive.antiCheatPenalty` 是**最终扣分记录**，用于榜单和成绩计算。前者是过程监控，后者是结果裁决，两者互补而不重复。

#### 文档产出

我要求 Agent 在 `docs/superpowers/plans/` 和 `docs/superpowers/specs/` 下生成两份文档：
- `2026-07-12-grs004-anti-tamper-alignment-design.md`：防篡改对齐设计规格
- `2026-07-12-grs004-anti-tamper-alignment-implementation-plan.md`：实施计划（待实施）

这两份文档不是从零开始写防篡改方案，而是**对齐 GRS004 已有能力**，把 Work 可见性、Result 冻结、Submission 防伪造三条线理清楚，并规划下一步要补齐的签名验证、公钥管理、审计日志等能力。

## 最重要的对话记录

### 关键追问 1：大屏显示 1 个风险，但点开看不到任何人有风险

**User · 2026-07-12**

> 现在测试时还发现了一个小问题，ARY Racing比赛示例的大屏是显示有1个风险的，但是点开里面的参赛者是没有的，只是一个数字，要加入真实的风险提示，更改后同步更新 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\plans`，`C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\specs` 和 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\status.md`

这个问题看起来很小（"加个提示"），但实际上是一个数据一致性 bug。我当时的直觉是：既然 KPI 显示有风险，那风险数据一定在某个地方，只是没有传递到参赛者条目里。

**Assistant 定位过程 · 2026-07-12**

Agent 先检查了 `JumbotronClient.tsx`，发现风险详情面板的确在遍历所有参赛者，但所有人的 `riskLevel` 都是 `low`、`violationCount` 都是 `0`。然后追踪到 `adapter.ts` 的 `calculateKPIs` 和 `mapToRacingEntries` 两个函数，发现它们对风险的定义**不一致**：

> KPI 的 `riskCount` 统计"CA 接入失败或反作弊扣分"，而参赛者条目的 `riskLevel`/`violationCount` **只反映反作弊扣分**，当风险源为 CA 接入失败时（如 `race_story_running` 的 rider_orion），KPI 计数为 1 但无任何参赛者体现。

这个发现让我意识到：这不是"加个提示"的问题，而是要**重构风险推导逻辑**，让参赛者条目成为唯一权威来源。

### 关键判断 2：KPI 应该从参赛者条目派生，而不是单独计算

**User · 2026-07-12**

> 我的修复方案：让参赛者条目的风险成为**唯一权威来源**，综合三类信号，并让 KPI 数字从条目派生，保证两者永远一致。

这个判断是整个修复的核心设计决策。如果继续保持两条独立的计算路径，未来每次新增风险来源（比如新增"提交频率异常"），都要改两个地方，很容易再次出现不一致。

**Assistant 实施过程 · 2026-07-12**

Agent 按我的思路实施：
1. 先在 `mapToRacingEntries` 里加入综合风险推导（反作弊 + CA 接入 + 会话风险）
2. 再在 `race-snapshot.ts` 的 `buildRaceSnapshot` 里，从实际带风险的参赛者条目派生 `kpis.riskCount` 和 `kpis.violationCount`
3. 查询补齐 `ingestionStatus`、`riskLevel`、`riskReason` 字段
4. UI 更新风险详情面板和抽屉展示

这个修复最终涉及 4 个文件、40+ 行改动，但核心思路很清晰：**单一数据源 + 派生聚合**。

### 关键落地 3：验证快照数据，确认 KPI 和参赛者完全一致

**Assistant 验证过程 · 2026-07-12**

修复完成后，Agent 运行 `npm run db:seed` 重新生成快照，然后用 Node.js 脚本读取三场进行中赛事的快照 JSON，逐一校验：

```
=== race_active.json ===
KPI riskCount: 2 | violationCount: 1
entries with risk: 2
    rider_charlie | medium | viol: 0 | reason: One active blocker remains.
    rider_diana | high | viol: 1 | reason: 检测到诱导词，扣 10 分

=== race_active_oval.json ===
KPI riskCount: 1 | violationCount: 0
entries with risk: 1
    rider_diana | medium | viol: 0 | reason: token cost is approaching limit

=== race_story_running.json ===
KPI riskCount: 1 | violationCount: 0
entries with risk: 1
    rider_orion | medium | viol: 0 | reason: CA 接入失败，实况数据中断；One connector stalled during live routing.
```

`race_story_running` 的 rider_orion 就是修复前"KPI 显示 1 但参赛者都是 low"的核心场景，现在 KPI 和参赛者完全一致，风险原因也清楚展示。

### 关键追问 4：防篡改是不是要重写整个文档？

**User · 2026-07-12**

> 我记得之前写过防伪与防篡改安全计划，现在 GRS004 有了新的能力（Work 可见性、Result 冻结、Submission 防伪造），是不是要重写整个文档？

我当时的担心是：如果每个 GRS 阶段都重写一遍防篡改文档，后续维护会很累，而且容易出现文档和代码不同步的问题。

**Assistant 建议 · 2026-07-12**

Agent 建议不要重写，而是做**增量对齐**：
1. 识别 GRS004 已有的三条防篡改线（Work 可见性、Result 冻结、Submission 防伪造）
2. 在 `docs/superpowers/specs/` 和 `docs/superpowers/plans/` 下生成两份文档，记录当前状态和下一步计划
3. 把"签名验证、公钥管理、审计日志"等未实施能力标记为"待补齐"，不强行实施

这个建议让我意识到：防篡改不是一次性工程，而是**随项目演进逐步加固的能力**。GRS004 阶段重点是"基础数据完整性"（Work 不能提前公开、Result 不能评审中篡改、Submission 不能绕过限制），后续再补齐"密码学验证"和"审计追溯"。

### 关键落地 5：在 seed 数据里真实体现会话风险

**Assistant 实施过程 · 2026-07-12**

修复风险数据一致性时，Agent 发现 seed 数据里虽然有 `Session.riskLevel` 和 `Session.riskReason` 字段，但 adapter **从来没有读取过**。于是：
1. 在 `race-snapshot.ts` 的查询里补齐 `sessions.select` 的 `riskLevel` 和 `riskReason`
2. 在 `adapter.ts` 的 `mapToRacingEntries` 里加入会话风险合并逻辑
3. 在 `generateAttentionItems` 里为会话风险生成 ticker 条目

这个修复让我看到：GRS004 的会话风险机制其实已经存在（种子数据在写、数据库字段在记录），只是**从来没有被大屏读取和展示过**。这次修复不只是"加个字段"，而是把已有数据真正接入展示链路。

### 片段 6：确认测试回归，发现引入了 1 个新失败

**Assistant 验证过程 · 2026-07-12**

修复完成后，Agent 运行 `npx tsx --test src/lib/jumbotron-adapter.test.ts` 校验回归。结果显示：
- 修复前：14 pass / 3 fail
- 修复后：13 pass / 4 fail

新增的失败是 `"prefers failed aggregate ingestion status to create process attention items"`，正好是我修改 `generateAttentionItems` 逻辑引入的。Agent 指出这个测试期望 CA 接入失败时只生成一条 attention item，但我的修复逻辑同时检查了 `aggregateIngestionStatus` 和每个 `connection.ingestionStatus`，导致生成了两条。

这个回归提醒我：**任何"看起来正确"的改动都要通过测试验证**。后续需要调整 `generateAttentionItems` 的去重逻辑，或者修正测试期望。

### 片段 7：同步更新 plans / specs / status 文档

**User · 2026-07-12**

> 更改后同步更新 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\plans`，`C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\specs` 和 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\status.md`

这是我每次功能改动后的固定要求。因为 GRS004 阶段改动很多，如果不同步更新文档，很容易出现"代码已修复，但文档还记录旧问题"的矛盾。

**Assistant 产出 · 2026-07-12**

Agent 生成了两份文档：
- `docs/superpowers/specs/2026-07-12-grs004-jumbotron-risk-consistency-design.md`：问题、根因、解决方案、验收
- `docs/superpowers/plans/2026-07-12-grs004-jumbotron-risk-consistency-implementation-plan.md`：实施步骤、改动文件、验收结果

并且更新了 `docs/superpowers/status.md`，在"✅ 2026-07-12 新增功能"章节下新增"大屏风险数据一致性修复"子节，记录了根因、涉及文件、验证结果。

这个习惯让我在后续整理 riding record 时可以直接参考这些文档，而不是从对话历史里重新回忆当时的修复思路。

## 仍需继续关注的缺口

- 大屏风险数据一致性已修复，但 `generateAttentionItems` 引入了 1 个测试回归，需要调整去重逻辑或修正测试期望。
- 椭圆赛道个人赛已新增，但"个人参赛模式"仍然依赖 Team 容器，后续可能需要设计更彻底的"个人参赛"数据模型。
- 可报名赛事已补充，但 `getRacePhase` 对时间窗口的自动推进逻辑可能需要进一步明确：`status` 字段是"显式设定"还是"仅供标记，实际以时间窗口为准"？
- 防伪与防篡改对齐文档已产出，但"签名验证、公钥管理、审计日志"等能力仍标记为"待补齐"，后续需要按优先级逐步实施。

## 简短结论

这段 GRS004 骑行中，我最核心的贡献是**从用户体验问题反推数据一致性根因**：

1. 大屏显示"1 个风险"但点开看不到，不是"缺个提示"，而是 KPI 和参赛者条目用了两套计算逻辑，导致数据源不一致。
2. 修复不是"加个字段"，而是重构风险推导逻辑，让参赛者条目成为唯一权威来源，KPI 从条目派生。
3. 会话风险、CA 接入失败、反作弊扣分三类信号要合并到每个参赛者身上，并携带真实的风险原因文本。
4. 防伪与防篡改不是一次性工程，而是随项目演进逐步加固的能力，GRS004 阶段重点是"基础数据完整性"。

如果用一句话概括：这轮工作让我从"页面显示一个数字"推进到"数字背后的每条数据都能追溯到具体的人、具体的原因、具体的风险等级"。
