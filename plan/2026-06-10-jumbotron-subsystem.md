# Jumbotron 进度可视化子系统实现说明

> 实施日期：2026-06-10  
> 分支：ruan/jumbotron

---

## 做了什么

在项目根目录新建了独立子系统文件夹 `Jumbotron/`，并在 `src/app/jumbotron/` 新增了 Next.js 页面，实现了以赛马跑马场形式展示 Agent Racing 进度的可视化系统。

---

## 文件结构

```
Jumbotron/
├── types.ts                  核心 TypeScript 接口
├── track-runtime.ts          Catmull-Rom 样条路径计算引擎
├── adapter.ts                数据库数据 → RaceSnapshot 适配器
└── tracks/
    ├── track.profile.json    标准椭圆赛道（oval-standard，12 个控制点）
    └── rect.profile.json     标准方形赛道（rect-standard，12 个控制点）

src/app/jumbotron/
├── page.tsx                  Server Component（数据获取）
├── race-live-view.tsx        Client Component（SVG 渲染）
└── jumbotron.module.css      全屏样式
```

---

## 三维数据模型（澄清后确定）

Jumbotron 展示三个维度，数据来源完全不同：

| 维度 | 数据来源 | 字段 | 说明 |
|------|----------|------|------|
| 进度 | `PROGRESS_EVAL` 任务结果 | `LeaderboardEntry.totalScore` | Runner 按 ARY 颗粒度自动拉取，回传分数（0–100）；ARY 除以 100 得 `roundProgress` 映射到赛道位置 |
| 质量 | `SUBMISSION_TEST` 任务结果 | 最新 `Submission.totalScore`（status=SCORED） | Rider 主动提交代码后由 Runner 评测回传；无提交则默认 0 |
| 风险 | 综合推导 | — | `antiCheatPenalty > 0` → 直接高风险；否则 `min(progressScore, qualityScore)` 按阈值分档 |

---

## 架构决策

### 赛道几何

使用 Catmull-Rom 样条曲线（`track-runtime.ts` 的 `TrackRuntime` 类）：
- 从 `TrackProfile.centerline.points` 读取控制点
- 构建弧长查找表（每段 80 个采样点）
- 给定 `s ∈ [0,1]`，通过二分查找 + 线性插值精确计算位置、切线和法向量
- 基于法向量 + 车道偏移量计算马匹坐标和旋转角

### 马匹位置与车道分配

```
PROGRESS_EVAL Runner 回传 score（0–100）
  → 存入 LeaderboardEntry.totalScore（progressScore）
  → page.tsx 读取，adapter 计算 roundProgress = progressScore / 100
  → TrackRuntime.sampleAt(roundProgress)
  → pos + laneOffset * normal
  → HorsePose { x, y, rotation }
```

车道偏移按队伍总数 N 动态计算（无上限，不再绑定固定 8 车道）：
```typescript
laneOffset(idx, N) = -75 + 150/(N+1) * (idx+1)
// N=1: 0；N=8: 约 -58,-42,-25,-8,+8,+25,+42,+58；N=20: 自动均匀分布
```

### 赛道选择（预设 + 自定义）

- **两条预设赛道**：
  - `oval-standard`（默认）：`track.profile.json`，标准椭圆，12 个控制点，左 x=320、右 x=1600
  - `rect-standard`：`rect.profile.json`，标准方形，12 个控制点，左 x=340、右 x=1580、顶 y=250、底 y=830
- Organizer 创赛时通过「赛道类型」下拉选择（`Race.trackId`，默认 `"oval-standard"`）
- 若填写「自定义控制点 JSON」（`Race.trackCenterlineJson`），则覆盖所选预设的 centerline.points，其余属性继承预设值
- `buildProfile(trackId, centerlineJson)` 在 `race-live-view.tsx` 中执行选择逻辑

### 检查点配置

Organizer 创赛时设置 `checkpointCount`（1–10，默认 3）。  
阶段数 = 检查点个数，由 Organizer 根据比赛规划设置。  
Jumbotron 客户端按 `s = i/(n+1)` 均匀生成，不依赖 track profile 中的静态定义。

### 题目修改后的重置逻辑

当 Organizer 修改题目、重新评测后，`LeaderboardEntry` 被清空或重新更新：
- `progressScore = 0` → `roundProgress = 0/100 = 0` → 马匹自动回到 `s=0`（起跑线）
- 不需要额外的"重置赛道"逻辑，数据驱动天然支持

### 风险模型

| 条件 | 风险等级 | 说明 |
|------|----------|------|
| `antiCheatPenalty > 0` | `high` | 违规（抄袭/恶意提交），无论分数多少 |
| `min(progress, quality) < 20` | `high` | 进度或质量极差 |
| `min(progress, quality) < 40` | `medium` | 进度或质量偏低 |
| `min(progress, quality) < 60` | `low` | 进度或质量一般 |
| 否则 | `none` | — |

违规涵盖：代码抄袭、恶意提交（诱导评分 / 攻击 ARY 平台）。

### 数据获取（page.tsx）

两条数据流来源不同，绝对不能混淆：

| 数据流 | 触发者 | 任务类型 | 存储位置 |
|--------|--------|----------|----------|
| 进度 | ARY 调度 → 企业 Runner 按颗粒度自动拉取 | PROGRESS_EVAL | `LeaderboardEntry.totalScore` |
| 主动提交 | 参赛者自己触发 | SUBMISSION_TEST | `Submission.totalScore` |

```ts
// 同时查询三个数据来源
leaderboardEntries = prisma.leaderboardEntry.findMany({ where: { raceId }, include: { team } })
archives           = prisma.teamArchive.findMany({ where: { raceId }, select: { teamId, antiCheatPenalty, tokenUsed } })
scoredSubmissions  = prisma.submission.findMany({ where: { raceId, status: "SCORED" }, orderBy: { scoredAt: "desc" } })

// qualityMap：每队取最新一条 SCORED 提交的分数
// submissionCountMap：每队的 SCORED 提交总次数（主动提交次数，用于活跃骑手排名）
qualityMap = new Map<teamId, totalScore>()
submissionCountMap = new Map<teamId, count>()

// 构建 rows，明确区分字段来源
rows = ranked.map(e => ({
  progressScore: e.totalScore,                          // 进度分（PROGRESS_EVAL，Runner 自动）
  qualityScore: qualityMap.get(e.teamId) ?? 0,          // 质量分（SUBMISSION_TEST，Rider 主动）
  submissionCount: submissionCountMap.get(e.teamId) ?? 0, // 主动提交次数
  antiCheatPenalty: archiveMap.get(e.teamId)?.antiCheatPenalty ?? 0,
  tokenUsed: archiveMap.get(e.teamId)?.tokenUsed ?? 0,
}))
```

**活跃骑手**：主动提交次数前 3 名（submissionCount 降序），展示在左侧「活跃骑手 TOP3」面板中，不是一个计数 KPI。

---

## 访问方式

```
/jumbotron                  → 选择比赛页面（列出所有比赛）
/jumbotron?raceId=<id>      → 该比赛的跑马场大屏
```

Organizer 在每次"发起进度评测"并收到 Runner 回传结果后，刷新或重新打开 `/jumbotron?raceId=<id>` 即可看到最新马匹位置。

---

## SVG 渲染说明

赛道 SVG 使用 `viewBox="0 0 1920 1080"`（16:9），响应式缩放：

- 深绿色背景草地
- 棕黄色椭圆/方形赛道表面（外偏移路径填充）
- 内部绿色草坪（内偏移路径覆盖）
- 白色边界线
- 黄色虚线检查点
- 黑白棋格起跑线
- 马匹标记：彩色圆圈 + 排名数字 + 队伍名称 + 进度%
- 底部 ticker：违规条目（红）+ 风险条目（橙，显示进度分和质量分）

---

## 已实现 vs 未实现

| 功能 | 状态 | 备注 |
|------|------|------|
| 赛道路径渲染（Catmull-Rom） | ✅ 已实现 | |
| 马匹位置（progressScore 驱动） | ✅ 已实现 | |
| 风险环（三维综合推导） | ✅ 已实现 | |
| 违规徽章 | ✅ 已实现 | |
| 底部 ticker | ✅ 已实现 | |
| 检查点（动态按 checkpointCount） | ✅ 已实现 | |
| 赛道选择（oval/rect 下拉 + 自定义 JSON） | ✅ 已实现 | Race.trackId + trackCenterlineJson 双层选择 |
| Riding Message 气泡 | ✅ 已实现（合成 + MVP降噪） | sessionStorage 跨刷新对比，里程碑优先于排名变化，全局最多 3 条，noBubbleZones 过滤，4 秒后淡出 |
| 小地图 | ✅ 已实现 | 左侧面板 SVG，与主赛道共用 TrackRuntime，缩放显示赛道轮廓 + 带排名数字的彩色圆点 |
| KPI 总 Token | ✅ 已实现 | 来自 TeamArchive.tokenUsed 聚合，KPI 栏显示 |
| 活跃骑手 TOP3 | ✅ 已实现 | 按主动提交次数（Submission 表）排名前 3，展示在左侧面板，KPI 栏显示有提交记录的队伍总数 |
| rankDelta 排名变化箭头 | ✅ 已实现 | 触发源：Runner 回传 PROGRESS_EVAL → DB 更新 → 30s 轮询取新快照 → 与 sessionStorage 上次快照比较 → 排名变化显示 ↑绿/↓红；首次加载无历史不显示 |
| Debug mode | ✅ 已实现 | URL 加 `?debug=1` 激活：中心线点阵、车道边界线、各车道导引线、每匹马 s 值标注、碰撞框虚线轮廓、STALE 文字标注 |
