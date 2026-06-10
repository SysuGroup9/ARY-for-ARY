# ROADMAP

## 任务背景

目标是把 `PRD.md` 中的 ARY 产品方案做成一个可运行演示，并且从“前端假状态 PoC”升级到“真实账号与真实数据库”的全栈版本。

## 当前实现方向

最终实现采用：

- Next.js 16 App Router
- Prisma 7
- SQLite
- Server Actions + API Routes

原因：

- 能快速落地真实注册登录和共享数据
- 仍然能严格控制 ARY 的数据边界
- 后续若需要改成 Postgres，只需要切 Prisma datasource 和部署方式

## 数据边界决策

ARY 持久化：

- 用户、赛事、队伍
- 反馈、通知
- 提交状态
- 公开榜单投影
- 最佳归档与赛后展示

ARY 不持久化：

- Organizer 私有评测代码
- Organizer 私有 Runner 逻辑
- 私有完整评测过程

折中实现：

- Rider 提交进入 ARY 数据库中的临时字段
- Runner 评分后，提交正文被清空
- 仅保留最佳归档用于赛后公开展示

## 当前能力

- 真实注册 / 登录
- Organizer 创建赛事
- Rider 报名参赛
- Rider 提交代码与 Riding Record
- Rider 与 Organizer 的反馈线程
- Runner 拉取任务与回传评分
- Organizer 同步公开榜单
- Organizer 发布赛后展示
- Audience 无登录浏览公开页面

## 临时部署策略

为了让临时域名也能真实写库：

- 构建阶段生成并填充 `prisma/dev.db`
- 运行时在生产环境把该数据库复制到 `/tmp/ary-runtime/runtime.db`
- 预览实例上的写入是真实 SQLite 写入，但不保证长期持久

## 已知限制

- 临时域名上的 SQLite 数据会随实例重建丢失
- 还没有接入 Postgres 等持久数据库
- 还没有接入真实外部 Agent API
- 目前 Runner 鉴权仍是简单 bearer token

## 迭代记录

### Iteration 0

- 阅读 PRD
- 产出实现计划与路线

### Iteration 1

- 接入 GitHub 组织仓库 `SysuGroup9/ARY-for-ARY`
- 完成前端 localStorage PoC
- 部署首个临时预览

### Iteration 2

- 用户指出注册登录是假的，只是 localStorage
- 决定整体重构为 Next.js + Prisma + SQLite

### Iteration 3

- 新建 Prisma schema 与鉴权基础能力
- 重写服务层：users / races / teams / submissions / feedback
- 新建首页、Server Actions、Runner API
- 加入 seed 数据与临时部署 SQLite 方案
- 完成 `tsc`、`lint`、`build` 验证

### Iteration 4 — Jumbotron 进度可视化子系统

新增独立子系统 `Jumbotron/`，实现赛马跑马场形式的进度可视化。

**三维数据模型：**

| 维度 | 来源 | 字段 |
|------|------|------|
| 进度 | `PROGRESS_EVAL` → `LeaderboardEntry.totalScore` | `progressScore`，除以 100 得 `roundProgress` 映射赛道位置 |
| 质量 | `SUBMISSION_TEST` → 最新 `Submission.totalScore` | `qualityScore`，无提交默认 0 |
| 风险 | 综合推导 | `antiCheatPenalty > 0` → 直接高风险；否则 `min(progressScore, qualityScore)` 按阈值分档 |

**赛道控制点：** 只有一个默认椭圆赛道；Organizer 创赛时可在表单中粘贴自定义控制点 JSON（`Race.trackCenterlineJson`，留空使用默认）。无预设模板选择。

**车道分配：** 按队伍总数动态均分 ±75 单位宽度，无 8 队上限。

**检查点数量：** Organizer 创赛时设置 `checkpointCount`（等于赛事阶段数），客户端均匀生成。

**题目修改重置：** Organizer 修改题目后榜单清空 → `progressScore = 0` → `roundProgress = 0` → 马匹自动回到起跑线。

**违规：** `TeamArchive.antiCheatPenalty > 0`，涵盖代码抄袭、恶意提交（含攻击 ARY 平台）。

**新增文件：**
```
Jumbotron/
  types.ts                   — 核心接口（TrackProfile, RacingEntrySnapshot 含 progressScore/qualityScore, HorsePose 等）
  track-runtime.ts           — Catmull-Rom 样条路径运行时，计算马匹位置/方向/法向量
  adapter.ts                 — LeaderboardEntry + Submission + TeamArchive → RaceSnapshot 适配层
  tracks/track.profile.json  — 唯一默认赛道（标准椭圆，默认12 个控制点）

src/app/jumbotron/
  page.tsx                  — Server Component，同时查询三个数据来源
  race-live-view.tsx        — Client Component，SVG 赛道渲染 + 马匹/排名/违规标记
  jumbotron.module.css      — 全屏大屏样式

prisma/migrations/20260610000000_jumbotron_track/migration.sql
  — 为 Race 表新增 trackId / checkpointCount 两列
```

**访问方式：** `/jumbotron?raceId=<id>`，Organizer 每次拉取确认进度后刷新此页面即可。加 `?debug=1` 可进入调试模式。

**气泡（Riding Message Bubble）：** 用 `sessionStorage` 跨刷新对比，检测进度阈值越过（25/50/75/100%）和排名变化，随机从短句池选句，4 秒 CSS 动画淡出。里程碑优先于排名变化，全局最多 3 条，noBubbleZones 过滤。无需改 schema。

**赛道小地图：** 左侧面板独立 SVG，复用 `TrackRuntime` 路径，缩放显示赛道轮廓 + 带排名数字的彩色圆点。

**活跃骑手 TOP3：** 活跃骑手定义为主动提交次数（`Submission` 表，非 Runner 自动评测）最多的前 3 支队伍，展示在左侧面板；KPI 栏「活跃骑手」显示有提交记录的队伍总数。两条数据流严格区分：进度 = Runner 按颗粒度自动拉取（PROGRESS_EVAL → LeaderboardEntry）；主动提交 = 参赛者触发（SUBMISSION_TEST → Submission）。

**KPI 总 Token：** 来自 `TeamArchive.tokenUsed` 聚合，KPI 栏「总 Token」显示。已去掉 Codex/Claude 分布（ARY 无需监测 CA 类型）。

**Debug mode（`?debug=1`）：** 激活后 SVG 叠加层显示：中心线点阵（青色）、±75 车道边界虚线（绿色）、8 条车道导引线（白色半透明）、每匹马当前 `s` 值标注、碰撞框虚线圆（r=26）、stale 马匹的 STALE 橙色标签。

### Iteration 5 — Jumbotron 完善：方形赛道 + 计时器可读性 + 视觉优化

**计时器与可读性改进：**

- `embeddedElapsed`（嵌入头部计时器）：颜色 `#64748b` → `#cbd5e1`、字号 12 → 13px、加半透明深色背景，确保在深色 UI 上清晰可读
- `elapsed`（全屏头部计时器）：颜色 `#94a3b8` → `#e2e8f0`、字重加粗 600
- `liveBadge`：加红色边框 + 半透明背景，视觉更突出
- `riders` 计数器颜色加亮

**方形赛道资产（Condition 10 满足）：**

- 新增 `Jumbotron/tracks/rect.profile.json`（标准方形赛道，12 个控制点，1920×1080，`trackId: "rect-standard"`）
- 赛道形状：左 x=340、右 x=1580、顶 y=250、底 y=830，四角各一对控制点形成圆角方形，与椭圆赛道视觉差异明显

**赛道选择（Race 创建表单）：**

- `Race.trackId String @default("oval-standard")` 重新加入 Prisma schema（该列已在 migration 20260610000000 中存在，本次仅补齐 schema 定义）
- 创建比赛表单新增「赛道类型」下拉：`oval-standard`（标准椭圆） / `rect-standard`（标准方形）
- 自定义 JSON 移为"高级选项"，填写后覆盖下拉选择
- `validation.ts` 新增 `trackId` 字段；`services/races.ts` 写入 DB
- `race-live-view.tsx`：`buildProfile(trackId, centerlineJson)` 根据 `trackId` 选择基础 profile，`trackCenterlineJson` 作覆盖

**MVP 满足情况小结（截至 Iteration 5）：**

| # | 条件 | 状态 |
|---|------|------|
| 1 | track.profile.json 能描述完整赛道 | ✅ |
| 2 | Calibrator 微调赛道 | 暂缓（需单独工具） |
| 3 | Calibrator 导出 → Preview | 暂缓 |
| 4 | Calibrator / Preview 共用 track-runtime | 暂缓 |
| 5 | 单马 0%→100% 移动 | ✅ |
| 6 | 多马 lane offset | ✅ |
| 7 | 弯道方向自然 | ✅ |
| 8 | 所有马匹状态可表达 | ✅ |
| 9 | Riding Message 降噪展示 | ✅ |
| 10 | ≥2 条示例赛道资产 | ✅（oval + rect） |
| 11 | RaceSnapshot → Adapter → runtime | ✅ |

**文档整理：**

- `Jumbotron/README.md` 内容合并入主 `README.md` 的「Jumbotron 大屏」章节，随后删除
- 主 README 新增演示账号表、`?debug=1` 用法说明、数据维度表

## 错误复盘

- 早期从旧 PoC 迁移时有编码损坏的中文文本混入新实现。
- 改进措施：不再从旧损坏文件复制中文字面量，所有中文文案重新手写并在最终构建前做人工检查。
