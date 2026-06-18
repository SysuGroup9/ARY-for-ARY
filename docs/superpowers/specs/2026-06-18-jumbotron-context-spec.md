# Jumbotron Context Spec

## Purpose

本文是给后续 Agent 使用的 Jumbotron 子系统上下文基线。

它不替代产品源文档，而是把以下三份文档压缩成“可执行的后续工作基线”：

1. `docs/grs002/Jumbotron信息架构.md`
2. `docs/grs002/Jumbotron子系统定义.md`
3. `docs/grs002/Jumbotron-PRD.md`

后续任何 Jumbotron 相关任务，都应先读这份 spec，再看代码和 `status.md`。

## Source Hierarchy

三份源文档的作用不同，后续 Agent 不应混用：

- `Jumbotron信息架构.md`
  - 定义 Jumbotron 应展示什么、不应展示什么
  - 定义核心信息对象与容器级信息架构

- `Jumbotron子系统定义.md`
  - 定义子系统边界、组成模块、共享契约和运行时 / 设计时职责

- `Jumbotron-PRD.md`
  - 定义当前 ARY 仓库中的作品说明、工程落点、PoC 边界和已实现能力

当三者出现张力时：

1. 信息架构文档回答“目标展示模型”
2. 子系统定义回答“模块和职责”
3. Jumbotron-PRD 回答“当前仓库里已经实现到哪里”

## Subsystem Baseline

Jumbotron 子系统的最小真实边界是：

```text
Jumbotron Subsystem
├── Runtime Side
│   ├── Jumbotron / Race Live View
│   ├── Jumbotron Adapter
│   └── track-runtime
│
└── Design-time Side
    └── Track Profile Calibrator
```

后续 Agent 必须把它当成一个“运行时展示 + 设计时赛道资产生产 + 共享几何运行包”的组合系统，而不是单一页面。

## Display Boundary

Jumbotron 是公开大屏容器，职责是展示赛事摘要，不展示完整 Session 细节。

应展示的核心内容：

- 赛事标题、LIVE 状态、阶段、时间
- Racing Entry 的排名、位置、进度、成本、风险和消息摘要
- 赛事级 KPI
- TOP3 与高亮 Entry
- Riding Message
- Risk / Obstacle / Violation

不应展示的内容：

- 完整终端日志
- 完整 Coding Agent Session
- 长文本评论流
- 复杂代码 diff
- 细粒度后台管理信息
- 需要个人授权的私密内容

## Runtime Model

运行时主链路的真实基线是：

```text
ARY DB
→ generateRaceSnapshot()
→ RaceSnapshot JSON
→ Jumbotron Adapter
→ RacingEntrySnapshot[]
→ track-runtime
→ JumbotronClient
```

后续 Agent 应特别注意：

- 当前运行时不是直接从独立 DCR 平台实时流读取
- 当前快照 JSON 是实际展示链路的一部分
- `DCRaceDataProvider` 是预留接口，不等于已接入

## Geometry Truth

赛马位置的可信性来自几何链路，而不是视觉摆放。

可信链路应被表述为：

```text
roundProgress
→ centerlinePath distance
→ point / tangent / normal
→ laneOffset
→ HorsePose
```

任何后续改动都不应回退成：

- 手写 `x / y`
- 按排名直接硬编码位置
- Calibrator 和运行时各维护一套独立几何逻辑

## Calibrator Baseline

Calibrator 是设计时赛道校准工具，不是运行时功能页。

它的最小职责包括：

- 导入赛道底图
- 创建 / 导入候选 Track Profile
- 编辑 centerline points
- 设置方向、起点、lane offsets、checkpoints
- 预览单马与多马运行
- Validate
- Export `track.profile.json`

关键约束：

- Calibrator 预览必须复用 `track-runtime`
- `track.profile.json` 是冻结后的运行时语义资产

## Current ARY Integration

根据 `Jumbotron-PRD.md`，当前仓库中的真实落点是：

- Next.js App Router 集成
- Prisma + SQLite 数据层
- `src/app/jumbotron/[raceId]/`
- `src/app/calibrator/`
- `src/lib/services/race-snapshot.ts`
- `src/lib/jumbotron/adapter.ts`
- `src/lib/jumbotron/track-runtime/`

这意味着后续 Agent 在改文档时，不应把当前项目描述成：

- 独立 monorepo 的 Jumbotron 平台
- 与 ARY 主应用分离的子项目
- 已脱离当前本地快照与本地数据层的系统

## Known Tension Points

后续任务中最容易出现错误判断的点：

### 1. IA target vs implemented reality

信息架构中的对象更完整，当前仓库实现不一定每个字段都是真实数据源。

### 2. DCR concept vs ARY-local implementation

子系统定义里保留了 DCR / DevCompass 语义，但当前仓库主要依赖 ARY 本地数据与快照。

### 3. True progress vs derived fields

作品说明已经强调位置由真实 `roundProgress` 驱动，但部分周边展示字段仍可能带推导性质。

### 4. Display container vs admin console

Jumbotron 是展示容器，不应被改造成后台管理台或调试中心。

## Documentation Rules For Future Agents

后续 Agent 更新 Jumbotron 文档时，遵守以下规则：

- 先分清是在改信息架构、子系统定义，还是当前实现说明
- 先说明当前真实状态，再写目标
- 如果某能力仍是 PoC，明确写出来
- 如果某字段是推导值，不要写成真实企业源字段
- 如果实现已变，先同步 `status.md` 和这份 spec，再补其他文档

## Maintenance Contract

这是 `docs/superpowers` 里 Jumbotron 文档的自动维护规则：

- 改 `docs/grs002` 源文档：检查并更新本 spec
- 改 Jumbotron 当前实现状态：检查并更新 `status.md`
- 改后续 Agent 的工作纪律：检查并更新 `agent.md`

默认要求：

每次 Jumbotron 相关任务收尾时，显式判断一次：

1. 这次改动是否改变了子系统边界
2. 这次改动是否改变了当前真实状态
3. 这次改动是否改变了后续 Agent 的阅读顺序或维护纪律

只要任一答案为“是”，就同步 `docs/superpowers` 对应文档。
