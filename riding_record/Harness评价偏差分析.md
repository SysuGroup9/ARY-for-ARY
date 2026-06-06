# Harness 评价实现偏差分析

## 1. PRD 定义的 Harness 评价流程

PRD v5.0 第 3.2.4 节「赛后评价 Rider 驾驭能力流程」定义了 6 个步骤：

| 步骤 | 执行方 | 动作 |
|------|--------|------|
| 1 | ARY | 比赛结束后，自动读取 Rider 的 Riding 记录和代码 |
| 2 | ARY | 记录 Rider 信息 |
| 3 | ARY | 发送 Riding 记录和代码给 Organizer |
| 4 | **Organizer** | 根据记录和代码进行 **Harness 能力评价** |
| 5 | Organizer | 返回评价结果给 ARY |
| 6 | ARY | 在 Harness 能力榜单中更新并展示 |

核心要点：

- **评价主体是 Organizer，不是 ARY。**
- ARY 的角色是「搬运工」——把 Riding 记录和代码从自己的归档中拿出来，发给 Organizer，然后接收并展示 Organizer 的评价结果。
- Harness 评价是**独立于赛中评分的一个流程**，评价的是 Rider 驾驭 Agent 的能力（如何引导 Agent、如何拆解问题、如何验证结果），不是代码写得好不好。

---

## 2. 当前实际实现

### 2.1 调用链

```
publishShowcaseAction (Server Action，Organizer 点按钮触发)
  → publishShowcase(raceId)
    → buildHarnessScore(reasoningScore, keywordScore)   ← ARY 内部计算
    → HarnessEntry.createMany(...)
```

代码位置：[src/lib/services/submissions.ts:323-401](src/lib/services/submissions.ts#L323-L401)

```typescript
// publishShowcase() 中的关键代码：
await tx.harnessEntry.createMany({
  data: archives.map((archive) => ({
    raceId,
    teamId: archive.teamId,
    harnessScore: buildHarnessScore(
      archive.reasoningScore,     // ← 赛中 Runner 回传的
      archive.keywordScore,       // ← ARY 赛中自己算的
    ),
    reasoningScore: archive.reasoningScore,
    keywordScore: archive.keywordScore,
  })),
});
```

### 2.2 buildHarnessScore 公式

代码位置：[src/lib/services/scoring.ts:117-119](src/lib/services/scoring.ts#L117-L119)

```typescript
export function buildHarnessScore(
  reasoningScore: number,
  keywordScore: number,
): number {
  return roundScore(reasoningScore * 0.6 + keywordScore * 0.4);
}
```

权重 0.6 : 0.4 硬编码在代码中，Organizer 不可配置。

---

## 3. 两个输入分数的真正来源

Harness = reasoningScore × 0.6 + keywordScore × 0.4

### 3.1 reasoningScore —— 来自 Organizer 侧 Runner

来源：Runner 通过 `POST /api/runner/tasks/result` 回传。

验证入口：[src/lib/validation.ts:105-112](src/lib/validation.ts#L105-L112)

```typescript
export const runnerScoreSchema = z.object({
  submissionId: z.string().min(1),
  passRate: z.coerce.number().min(0).max(100),
  codeReviewScore: z.coerce.number().min(0).max(100),
  reasoningScore: z.coerce.number().min(0).max(100), // ← Organizer Runner 传的
  runnerComment: z.string().trim().max(2000).default(""),
  status: z.enum(["success", "failed"]),
});
```

这个值是 Organizer 侧 Runner 调用 Agent API 评估 Rider 对话推理质量后回传的。**数据主权属于 Organizer。**

### 3.2 keywordScore —— 来自 ARY 自己计算

来源：ARY 在 `buildScoreResult()` 中自己算的，**Runner 根本没有回传这个值**。

计算逻辑：[src/lib/services/scoring.ts:137-143](src/lib/services/scoring.ts#L137-L143)

```typescript
function getKeywordScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 100;
  const matched = keywords.filter((keyword) => text.includes(keyword)).length;
  return (matched / keywords.length) * 100;
}
```

就是简单的字符串 `includes` 匹配：看 Riding 记录文本里出现了多少个 Organizer 预设的关键词。

调用位置在 `buildScoreResult()` 内部：[src/lib/services/scoring.ts:87-88](src/lib/services/scoring.ts#L87-L88)

```typescript
const keywordScore = getKeywordScore(input.artifact.ridingRecord, input.keywords);
```

`keywords` 来自 `Race.keywordsJson`——Organizer 创建赛事时设的。但**匹配计算的过程在 ARY 侧完成**，赛后存入 `Submission.keywordScore`，再由 `TeamArchive.keywordScore` 带入 Harness 计算。

---

## 4. 问题总结

### 4.1 与 PRD 的偏差

| 维度 | PRD 要求 | 实际实现 | 偏差性质 |
|------|---------|---------|---------|
| 评价主体 | Organizer | ARY | **根本性偏差** |
| 数据来源 | Organizer 独立审视 Riding 记录后的判断 | 赛中 Runner 的推理分 + ARY 的关键词匹配分 | **数据来源错误** |
| 评价时机 | 赛后独立流程 | 与 `publishShowcase` 捆绑，Organizer 点一个按钮完成 | 流程简化过度 |
| 公式定义权 | Organizer 定义何为好的驾驭能力 | ARY 代码硬编码 0.6 : 0.4 | **定义权错位** |
| 数据流向 | ARY → Organizer → ARY（双向） | ARY 内部闭环（单向，不经过 Organizer） | **架构违背** |

### 4.2 两个输入分的定性

```
Harness 分 = reasoningScore(Organizer 给的) × 0.6 + keywordScore(ARY 自算的) × 0.4
                ↑                                  ↑
          赛中 Runner 评价 Agent 推理质量       ARY 字符串 includes 匹配
          Organizer 数据主权                   ARY 计算，Organizer 未参与
```

- **reasoningScore 用作 Harness 输入是合理的**——它本身就是 Organizer 对 Rider 对话推理的评估。但它毕竟是在赛中评的，语境是「这个提交的代码推理质量如何」，而非赛后审视全局的「这个 Rider 驾驭 Agent 的能力如何」。
- **keywordScore 用作 Harness 输入是有问题的**——它只是关键词字符串匹配，既不是 Organizer 评价的，也不是 AI 评价的，甚至不是语义理解的。Organizer 完全没有参与这个值的产生过程。

### 4.3 对 PRD 核心理念的冲击

PRD 2.1 节的核心定位：

> ARY 是一个去中心化的智能体赛事平台。核心理念：**Public Yard, Private Race Source**。赛事数据主权属于 Organizer。

PRD 2.2 节要证明的四个能力之一：

> ARY 展示的内容来自 Organizer 主动披露的公开数据

当前 Harness 实现的问题在于：**ARY 展示的 Harness 榜单，其数据既不是 Organizer 主动披露的，也不是 Organizer 独立评价的。** ARY 用自己算的分加上 Organizer Runner 给的推理分，拼出了一个「Harness 分」，然后当作 Organizer 的评价结果展示出去。

这与赛中评分机制形成了鲜明对比——赛中评分通过 Runner pull → score 通道正确地实现了「Organizer 评测，ARY 只展示结果」。Harness 评价本应是这个模式的延续，却在实现中被 ARY 内部闭环替代了。

---

## 5. 改进方案

### 5.2 长期方案：Organizer 掌握完整评价主权

**目标**：按 PRD 3.2.4 实现 ARY → Organizer → ARY 的双向 Harness 评价流程。核心原则：**ARY 只提供原始材料 + 展示结果，所有评分计算都在 Organizer 侧完成。**

#### 5.2.1 方案概述

三层改动，逐步把评价权交还给 Organizer：

| 层级 | 内容 | 解决的问题 |
|------|------|-----------|
| 权重由 Organizer 设 | Race 创建表单增加 `harnessWeightReasoning`、`harnessWeightKeyword`，Organizer 自定义 | ARY 不再硬编码 0.6 : 0.4，定义权归位 |
| keywordScore 由 Organizer 算 | Harness 拉取 API 提供关键词列表和权重，Organizer Runner 独立完成关键词覆盖度评估 | ARY 不再做字符串匹配，计算权归位 |
| 子分数可选回传 | 回传 API 中 `reasoningScore` 和 `keywordScore` 为可选字段，Organizer 决定披露粒度 | Organizer 控制透明度，展示权归位 |

#### 5.2.2 完整数据流

```
赛后：
  ARY → GET /api/runner/harness/pull → Organizer Runner
        (提供：Riding记录 + 代码 + 关键词列表 + 权重配置)

  Organizer Runner 内部：
        reasoningScore = Agent API 评估 Rider 的推理/驾驭质量
        keywordScore   = Agent API 评估关键词覆盖度（语义级，非字符串匹配）
        harnessScore   = reasoningScore × harnessWeightReasoning
                        + keywordScore   × harnessWeightKeyword

  Organizer Runner → POST /api/runner/harness/result → ARY
        (回传：harnessScore(必填) + reasoningScore?(可选) + keywordScore?(可选) + comment?(可选))

  ARY → 存储 HarnessEntry → 展示 Harness 榜单
        (展示内容取决于 Organizer 回传了什么)
```

与当前实现的关键区别：**ARY 在整个流程中不参与任何评分计算。** 它只做三件事：提供原始材料（Riding + 代码 + 关键词 + 权重）、接收结果、展示结果。

#### 5.2.3 权重配置：Race 创建表单扩展

在现有权重配置区域（`weightTaskPassRate`、`weightCodeReview` 等 7 个字段）基础上，增加赛后 Harness 权重：

```
harnessWeightReasoning  Float  (默认 0.6)   —— 推理/驾驭质量在 Harness 总分中的权重
harnessWeightKeyword    Float  (默认 0.4)   —— 关键词覆盖度在 Harness 总分中的权重
```

这两个权重独立于赛中评分权重，语义不同——赛中权重控制「这个提交的任务分怎么算」，Harness 权重控制「这个 Rider 的驾驭能力怎么评」。

#### 5.2.4 API 设计

**① Harness 拉取** —— Organizer Runner 拉取待评价的队伍数据

```
GET /api/runner/harness/pull?raceId=<id>
Authorization: Bearer <runner_token>
```

响应：
```json
{
  "harnessTasks": [
    {
      "teamId": "team_001",
      "teamName": "排序小分队",
      "ridingRecord": "先澄清输入边界，再验证复杂度，最后用正反例检查排序稳定性。",
      "codeSnippet": "export function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
      "agentType": "OPENAI",
      "keywords": ["需求分析", "时间复杂度", "边界条件", "稳定性", "测试验证"],
      "weights": {
        "reasoning": 0.6,
        "keyword": 0.4
      }
    }
  ]
}
```

数据来源：`TeamArchive`（Riding + 代码）+ `Race`（关键词 + 权重）。关键词和权重是 Organizer 创建赛事时自己设的，现在回传给 Organizer Runner 用于计算——数据主权闭环。

**② Harness 回传** —— Organizer Runner 回传评价结果

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

字段说明：

| 字段 | 必填 | 说明 |
|------|------|------|
| `raceId` | 是 | 赛事 ID |
| `teamId` | 是 | 队伍 ID |
| `harnessScore` | **是** | Harness 总分（Organizer 计算的最终驾驭能力分） |
| `reasoningScore` | 否 | 推理/驾驭质量子分。如果 Organizer 不想披露小分可以不传 |
| `keywordScore` | 否 | 关键词覆盖度子分。如果 Organizer 不想披露小分可以不传 |
| `comment` | 否 | Organizer 对该队伍驾驭能力的文字评价 |

**子分数可选的设计意图**：Organizer 控制披露粒度。如果 Organizer 认为只需要展示一个总分，就不传小分，ARY 只展示 `harnessScore`。如果 Organizer 想让 Rider 知道自己哪些维度做得好、哪些需要改进，就传小分，ARY 展示完整的分数拆解。

#### 5.2.5 ARY 侧处理

`scoreHarnessTask()` 收到回传后：

1. 创建/更新 `HarnessEntry`，设置 `harnessSource = ORGANIZER`
2. 存储 `harnessScore`（必填）
3. 如果 Organizer 传了 `reasoningScore` / `keywordScore`，一并存储；否则对应字段为 `null`
4. 如果 Organizer 传了 `comment`，存储并在展示中用

`publishShowcase()` 的改动：

- **删除** `buildHarnessScore()` 调用和自动生成 `HarnessEntry` 的逻辑
- 只负责生成 `RidingHighlight`（因为 Highlight 的 excerpt/codeSnippet 是纯展示性截取，不涉及评价）
- Harness 榜单的展示改为读取 Organizer 回传的数据

#### 5.2.6 UI 调整

赛后展示面板的 Harness 区域区分三种状态：

| 状态 | 条件 | 展示内容 |
|------|------|---------|
| 等待评价 | 比赛已结束，Organizer 尚未回传任何 Harness 结果 | 「等待 Organizer 提交 Harness 评价…」 |
| 仅总分 | Organizer 只传了 `harnessScore` | 展示 Harness 总分 |
| 完整展示 | Organizer 传了子分数和/或评论 | 展示总分 + reasoning/keyword 小分 + 评论 |

#### 5.2.7 数据模型改动

HarnessEntry 模型调整：

```
model HarnessEntry {
  id             String   @id @default(cuid())
  raceId          String
  teamId          String
  harnessScore    Float                    // Harness 总分（Organizer 计算）
  reasoningScore  Float?                   // 可选：推理/驾驭质量子分
  keywordScore    Float?                   // 可选：关键词覆盖度子分
  comment         String   @default("")    // 可选：Organizer 文字评价
  harnessSource   HarnessSource @default(ORGANIZER)  // 评价来源
  createdAt       DateTime @default(now())

  race  Race  @relation(...)
  team  Team  @relation(...)
}

enum HarnessSource {
  ORGANIZER   // Organizer Runner 回传的评价
}
```

#### 5.2.8 改动范围总览

| 文件 | 改动 |
|------|------|
| `prisma/schema.prisma` | Race 加 `harnessWeightReasoning`、`harnessWeightKeyword`；HarnessEntry 加 `comment`、`harnessSource`；`reasoningScore`/`keywordScore` 改为可选；新增 `HarnessSource` 枚举 |
| `src/lib/validation.ts` | `createRaceSchema` 加两个 Harness 权重字段；新增 `harnessPullSchema`、`harnessResultSchema`（harnessScore 必填，其余可选） |
| `src/app/api/runner/harness/pull/route.ts` | **新增**：从 TeamArchive + Race 组装数据返回 |
| `src/app/api/runner/harness/result/route.ts` | **新增**：接收 Organizer 回传，写入 HarnessEntry |
| `src/lib/services/submissions.ts` | 新增 `pullHarnessTask()`、`scoreHarnessTask()`；`publishShowcase()` 中删除自动生成 HarnessEntry 的逻辑；删除 `buildHarnessScore()` |
| `src/lib/services/scoring.ts` | 删除 `buildHarnessScore()` 函数 |
| `src/app/actions.ts` | `publishShowcaseAction` 不再生成 HarnessEntry |
| `src/app/page.tsx` | 创建赛事表单加 Harness 权重输入；Harness 面板按三种状态展示，标注数据来源 |

---

## 6. 附录：相关代码索引

| 描述 | 文件 | 行号 |
|------|------|------|
| Harness 榜单自动生成（需删除） | `src/lib/services/submissions.ts` | 350-374 |
| `buildHarnessScore` 定义（需删除） | `src/lib/services/scoring.ts` | 117-119 |
| `getKeywordScore` 定义（赛中评分保留，但不再用于 Harness） | `src/lib/services/scoring.ts` | 137-143 |
| `keywordScore` 在赛中评分中的赋值 | `src/lib/services/scoring.ts` | 87-88 |
| Runner 回传 schema（不含 keywordScore） | `src/lib/validation.ts` | 105-112 |
| 赛后展示按钮 | `src/app/page.tsx` | 550-555 |
| HarnessEntry 当前数据模型（赛中残留字段） | `prisma/schema.prisma` | 246-258 |

---

*文档生成日期：2026-06-06*
*最后更新：2026-06-06 — 根据讨论修正长期方案，keywordScore 和权重交由 Organizer 计算*
