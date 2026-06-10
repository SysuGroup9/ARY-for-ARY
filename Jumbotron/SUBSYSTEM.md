# Jumbotron 子系统实现说明

> 本文描述 ARY Jumbotron 子系统的业务定义、数据来源和展示规则。  
> 面向本仓库的贡献者和评审者，作为实现的权威参考。

---

## 1. 子系统定位

Jumbotron 是 ARY 的公开大屏容器。

它把多支参赛队伍的 Agent 运行状态聚合为一个以赛马跑马场为视觉形式的大屏画面，
供现场观众、主办方、评委在无需登录的情况下实时了解比赛进度。

**Jumbotron 只展示摘要，不承载完整 Session、完整日志或复杂分析。**

访问方式：
```
/jumbotron?raceId=<id>          全屏大屏
/jumbotron?raceId=<id>&debug=1  调试模式（叠加几何信息）
```

---

## 2. 三维数据模型

Jumbotron 展示三个独立维度，数据来源和触发方完全不同，绝对不能混淆。

| 维度 | 触发方 | 任务类型 | 存储位置 | Jumbotron 用途 |
|------|--------|----------|----------|---------------|
| **进度** | ARY 调度 → 企业 Runner 自动拉取 | `PROGRESS_EVAL` | `LeaderboardEntry.totalScore`（0–100） | 马匹在赛道上的位置：`roundProgress = score / 100` |
| **质量** | 参赛者主动提交 | `SUBMISSION_TEST` | 最新 `Submission.totalScore`（status=SCORED） | 马匹进度%下方的质量参考数字 |
| **风险** | ARY 综合推导 | — | `TeamArchive.antiCheatPenalty`、进度/质量分 | 风险光环颜色 + 违规徽章 + Ticker 条目 |

### 2.1 进度（马匹位置）

进度分由**企业 Runner** 在 `PROGRESS_EVAL` 任务中回传，存入 `LeaderboardEntry.totalScore`。

```
PROGRESS_EVAL 任务
  → LeaderboardEntry.totalScore（0–100）
  → roundProgress = totalScore / 100
  → TrackRuntime.sampleAt(roundProgress)
  → HorsePose { x, y, rotation }
  → SVG 马匹位置
```

Organizer 每次点击「发起进度评测」，ARY 创建一条 `PROGRESS_EVAL` 任务，企业 Runner 拉取并回传。Jumbotron 每 30 秒自动刷新一次服务端数据。

### 2.2 质量（参赛者提交分数）

质量分由**参赛者主动提交代码**后，企业 Runner 通过 `SUBMISSION_TEST` 任务评测并回传，存入 `Submission.totalScore`。

Jumbotron 取每支队伍最新一条 `SCORED` 状态 `Submission` 的 `totalScore`，显示在马匹下方。

### 2.3 风险与违规

风险和违规是 Jumbotron 的安全告警机制，来源不同：

**一般性风险（由进度和质量推导）：**

| 条件 | 风险等级 | 视觉表现 |
|------|----------|---------|
| `antiCheatPenalty > 0` | `high`（直接违规，不再分档） | 橙色虚线环 + 红色感叹号徽章 |
| `min(progress, quality) < 20` | `high` | 红色虚线光环 |
| `min(progress, quality) < 40` | `medium` | 橙色虚线光环 |
| `min(progress, quality) < 60` | `low` | 黄色虚线光环 |
| 否则 | `none` | 无额外标记 |

**违规（来自 `TeamArchive.antiCheatPenalty`）：**

违规的本质是 Organizer 在私有评测中发现的异常，通过 `antiCheatPenalty` 字段记录。

违规包括两类：
1. **代码抄袭**：提交内容与其他队伍代码高度相似
2. **恶意提交**：诱导评分、攻击 ARY 平台、无效代码刷分等

`antiCheatPenalty > 0` 时，Jumbotron 在对应马匹上显示：
- 红色感叹号徽章（`!`）
- 橙色虚线风险环
- Bottom Ticker 中的【违规】条目：`【违规】{队伍名} — 抄袭/恶意提交（-{penalty}分）`

**阻碍（obstacle）：**

阻碍是参赛者在外部环境中遇到的问题（如开发工具故障、网络问题等），与 ARY 评测机制无关，**本版本不追踪此类型**。

---

## 3. 参赛队伍展示规则

### 3.1 领先者展示（进度前 3 名）

实时 TOP3 按**进度分**（`LeaderboardEntry.totalScore`）降序排列，展示前 3 支队伍：

- 全屏模式：左侧面板「实时 TOP 3」
- 嵌入模式：底部统计栏「实时领跑」区域

每个 TOP3 条目包含：
- 奖牌图标（🥇🥈🥉）
- 队伍颜色圆点
- 队伍名称
- 排名变化箭头（↑绿/↓红，与上次刷新对比）
- 进度分

### 3.2 活跃骑手 TOP3（主动提交次数）

活跃骑手按**主动提交次数**（`Submission` 表中 `status=SCORED` 的记录数）降序排列，展示提交最多的前 3 支队伍。

**这与进度 TOP3 是两个完全不同的排名，数据来源不同，不能混淆。**

### 3.3 马匹视觉错开（车道分配）

多支队伍在赛道上会相互重叠。为避免遮挡，每支队伍分配一个独立的**车道偏移量（lane offset）**：

```
LANE_HALF_WIDTH = 75（单位同 viewBox）
LANE_STEP = 150 / (N + 1)
laneOffset(idx) = -75 + LANE_STEP × (idx + 1)
```

- N=1：单队，居中偏移 = 0
- N=8：8支队伍均匀分布在 ±75 范围内
- 偏移量施加在法向量方向，保证弯道处马匹仍然沿赛道轮廓排列

### 3.4 排名变化（rankDelta）

**触发源：企业 Runner 回传的 `PROGRESS_EVAL` 结果**，而非客户端计时器。

数据流：

```
Runner 回传 PROGRESS_EVAL → DB 更新 LeaderboardEntry.totalScore
  → Jumbotron 每 30 秒 router.refresh() 轮询服务端
  → Server Component 重新查 DB，传入新的 snapshot prop
  → useEffect([snapshot]) 触发
  → 新快照 vs sessionStorage 中的上次快照
  → 仅当排名实际变化时显示箭头
```

关键点：
- 30 秒是**轮询间隔**，不是比较周期。两次轮询之间 Runner 没有更新分数 → 快照相同 → 不显示箭头。
- 箭头反映的是：**Runner 本次回传与上次回传之间产生的排名变化**。
- 首次加载（sessionStorage 无历史记录）：不显示任何箭头。

计算规则：

- `prevRank - currRank > 0`：排名提升（数字更小），显示 `↑{delta}`（绿色）
- `prevRank - currRank < 0`：排名下降（数字更大），显示 `↓{|delta|}`（红色）
- 无变化：不显示

箭头出现位置：
- 马匹排名徽章右侧（赛道 SVG 中）
- TOP3 面板的队伍名后

---

## 4. 马匹状态机

每匹马的视觉状态由 `adapter.ts` 中的 `deriveStatus()` 根据数据推导：

| 状态 | 触发条件 | 视觉表现 |
|------|----------|---------|
| `running` | 默认正常状态 | 正常亮度 |
| `finished` | `progressScore >= 95` | 金色光晕 |
| `idle` | `progressScore === 0` | 正常亮度，无进度 |
| `blocked` | `progressScore < 20` | 正常亮度（风险环标记） |
| `pit_stop` | Runner 任务处于 `CLAIMED`（正在评测中） | 橙色虚线圈 + ⚙ 徽章 |
| `stale` | 超过 1 小时无 `LeaderboardEntry` 更新 | 透明度降低，灰色马匹 |

注：`takeover`、`sprinting`、`slowed` 等状态在类型定义中保留，当前 ARY 无对应数据来源。

---

## 5. 访问权限

Jumbotron 页面（`/jumbotron?raceId=<id>`）**不要求登录**，任何人（含观众）都可以直接访问。

嵌入视图（`RaceJumbotron` 组件）出现在赛事列表页的每张赛事卡片中，同样对所有访客可见。

---

## 6. 赛道资产

当前提供两条预设赛道，均由 `TrackRuntime`（Catmull-Rom 样条）驱动：

| `trackId` | 文件 | 形状 | 控制点数 |
|-----------|------|------|---------|
| `oval-standard`（默认） | `Jumbotron/tracks/track.profile.json` | 标准椭圆 | 12 |
| `rect-standard` | `Jumbotron/tracks/rect.profile.json` | 方形（直道+圆角弯） | 12 |

Organizer 创赛时通过「赛道类型」下拉选择。也可填写「自定义控制点 JSON」覆盖预设路径。

---

## 7. 文件结构

```
Jumbotron/
├── SUBSYSTEM.md              本文档
├── types.ts                  核心接口（TrackProfile, RaceSnapshot, HorsePose 等）
├── track-runtime.ts          Catmull-Rom 样条路径引擎（弧长参数化）
├── adapter.ts                DB rows → RaceSnapshot 适配层（deriveStatus, deriveRisk）
└── tracks/
    ├── track.profile.json    默认椭圆赛道（oval-standard，12 个控制点）
    └── rect.profile.json     标准方形赛道（rect-standard，12 个控制点）

src/app/jumbotron/
├── page.tsx                  Server Component（查询 DB 四个来源，传参给 RaceLiveView）
├── race-live-view.tsx        Client Component（SVG 渲染 + 气泡 + 排名变化 + debug）
└── jumbotron.module.css      全屏大屏样式
```

---

## 8. Demo 数据

演示赛 ID：`race_jumbotron_demo`，比赛时间：2026-06-10 至 2026-06-20。

执行 `npm run db:seed` 后可用以下账号访问演示赛事：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| `organizer_demo` | `organizer123` | Organizer | 同时管理排序演示赛和 Jumbotron 演示赛 |
| `jt_rider_1` | `rider123` | Rider | AlphaBot 战队，进度 88 |
| `jt_rider_2` | `rider123` | Rider | BetaRun 快攻，进度 74 |
| `jt_rider_3` | `rider123` | Rider | GammaAI 突破，进度 67 |
| `jt_rider_4` | `rider123` | Rider | DeltaCraft 稳进，进度 52 |
| `jt_rider_5` | `rider123` | Rider | EpsilonDev 新锐，进度 41 |
| `jt_rider_6` | `rider123` | Rider | ZetaForce 违规（antiCheatPenalty=15），进度 75 |
| `jt_rider_7` | `rider123` | Rider | EtaLab 跟跑，进度 22 |
| `jt_rider_8` | `rider123` | Rider | ThetaSync 起步，进度 8，无提交 |
