# ARY for ARY — 作品说明文档

> Agent Racing Yard · GRS 001 + GRS 002 · 全栈 PoC

---

## 一、赛题理解

### 1.1 核心命题

ARY GRS 001 要解决的核心问题是：

> 在 Race 数据存留于 Organizer 侧、ARY 不持久化 Race 数据的前提下，ARY 如何完成赛事的创建、披露、组织与展示？

这个命题的关键张力是：**去中心化（数据主权归 Organizer）** 与 **平台服务（ARY 能完整运转赛事）** 之间的矛盾。PoC 需要同时证明这两点不互斥。

**GRS 002 扩展：**
在核心命题之上，新增可视化要求——以赛马跑马场为视觉形式，将参赛队伍的进度数据实时渲染为大屏动态展示，并配套 Calibrator 工具让 Organizer 可自定义赛道。

### 1.2 四项核心证明

| 证明项 | PoC 实现方式 |
|--------|-------------|
| Organizer 数据留在 Organizer 侧 | 测试代码不上传 ARY；Runner 在 Organizer 本地运行 |
| ARY 不需要持久化完整 Race 数据 | 提交代码评测后清空；仅保留最优归档用于赛后展示 |
| ARY 仍然可以运作赛事 | 完整的创建/报名/提交/反馈/榜单/展示闭环 |
| 展示内容来自 Organizer 主动披露 | 榜单 = Runner 回传；公告 = Organizer 推送 |

### 1.3 GRS 002 评审要点理解

- **Jumbotron 大屏**：不只是数字榜单，要以赛马场为比喻，让评审一眼看出哪支队伍在领跑、哪支有风险
- **Calibrator**：体现工具链完整性——Organizer 可以自定义赛场，而不是只能用固定赛道
- **数据模型正确性**：马匹位置 = 进度分（PROGRESS_EVAL），严禁与主动提交分（SUBMISSION_TEST）混淆
- **Agent Riding 评分**：重点考察人机协作过程，包括任务拆解、Agent 产出审查、错误纠偏和验收闭环

---

## 二、系统组成

### 2.1 架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                       ARY Web App                            │
│              Next.js 15 App Router + TypeScript              │
│                                                              │
│  用户界面层              业务逻辑层             数据层        │
│  ─────────────          ─────────────         ─────────     │
│  /races                 services/races        Prisma ORM    │
│  /organizer             services/submissions  SQLite        │
│  /rider                 services/scoring                    │
│  /audience              services/teams                      │
│  /jumbotron ──────────→ Jumbotron/adapter.ts               │
│  /jumbotron/calibrator  Jumbotron/track-runtime.ts          │
│                         (共享引擎)                           │
└────────────────────────────┬─────────────────────────────────┘
                             │
              Runner API (Bearer Token)
              ┌──────────────┴────────────────┐
              │                               │
    GET /api/runner/tasks/pull    POST /api/runner/tasks/result
              │                               │
              ▼                               │
   ┌──────────────────────┐                  │
   │  Organizer 私有 Runner│ ─────────────────┘
   │  (本地运行，不进 ARY) │
   └──────────────────────┘
```

### 2.2 核心模块说明

| 模块 | 路径 | 职责 |
|------|------|------|
| TrackRuntime 引擎 | `Jumbotron/track-runtime.ts` | Catmull-Rom 样条 + 弧长参数化，计算马匹位置/方向/法向量 |
| Adapter | `Jumbotron/adapter.ts` | DB 数据 → RaceSnapshot 转换，推导马匹状态和风险等级 |
| 类型定义 | `Jumbotron/types.ts` | TrackProfile、RaceSnapshot、HorsePose 等核心接口 |
| Jumbotron 大屏 | `src/app/jumbotron/race-live-view.tsx` | SVG 赛道渲染 + 马匹动画 + 气泡消息 + 排名变化 |
| Calibrator | `src/app/jumbotron/calibrator/calibrator-ui.tsx` | 可视化赛道编辑 + 导出工具 |
| 赛道资产 | `Jumbotron/tracks/*.profile.json` | 预设赛道控制点数据 |
| Runner API | `src/app/api/runner/tasks/` | 任务拉取 + 结果回传端点 |
| 服务层 | `src/lib/services/` | 业务逻辑封装（无状态，可测试）|
| Seed 数据 | `prisma/seed.ts` | 8 支演示队伍 + 2 场赛事预置数据 |

### 2.3 技术选型

| 层 | 技术 | 选型理由 |
|----|------|----------|
| 框架 | Next.js 15 App Router | Server/Client 组件边界天然符合数据边界需求 |
| ORM | Prisma 7 + SQLite | 快速迭代；切 Postgres 只需改 datasource |
| 校验 | Zod | 运行时类型安全，统一前后端校验规则 |
| 认证 | bcryptjs + jose Cookie Session | 无外部依赖，可在本地完整运行 |
| 赛道渲染 | SVG + Catmull-Rom | 无依赖，精确控制每个像素，支持调试模式 |

---

## 三、Jumbotron 信息架构

### 3.1 数据流

```
PROGRESS_EVAL (Runner 自动)
        ↓
LeaderboardEntry.totalScore (0–100)
        ↓  ÷ 100 = s
TrackRuntime.sampleAt(s)
        ↓
HorsePose { x, y, rotation, laneOffset }
        ↓
SVG <g transform="translate(x,y) rotate(θ)">
        ↓
Jumbotron 大屏（30s 轮询刷新）
```

进度分和质量分（SUBMISSION_TEST）完全独立，互不影响马匹位置。

### 3.2 视觉层次（从底到顶）

| 层 | 内容 | 实现 |
|----|------|------|
| 1 | 赛场底图 | `<image>` + `preserveAspectRatio="xMidYMid slice"` |
| 2 | 径向晕影 | `<radialGradient>` + `<rect>` |
| 3 | 土黄色赛道环 | `<rect fill="#c4924a" mask="url(#trackMask)">` |
| 4 | 绿色内场 | `<rect fill="rgba(10,55,10,0.28)" clipPath="url(#innerClip)">` |
| 5 | 白色护栏 | 双层路径（柔光 sw6 + 锐边 sw2.5） |
| 6 | 车道导引线 | 白色半透明虚线 |
| 7 | 检查点 | 琥珀 `#f59e0b` 虚线 + 圆柱端头 |
| 8 | 起/终点线 | 白色 + 黑色棋格叠加 |
| 9 | 马匹 | 彩色圆形 + 排名数字 + 风险光环 + 违规徽章 |
| 10 | 气泡消息 | 里程碑/排名变化，4 秒淡出 |

**无裂缝赛道技术：**
使用 SVG `<mask>` 代替双层 fill，从根本上消除抗锯齿间隙问题：
```svg
<mask id="trackMask">
  <path d={outerD} fill="white" />  <!-- 允许绘制区域 -->
  <path d={innerD} fill="black" />  <!-- 抠空内圈 -->
</mask>
<rect fill="#c4924a" mask="url(#trackMask)" />
```

### 3.3 三维数据与视觉映射

| 数据维度 | 来源 | 视觉映射 |
|----------|------|----------|
| 进度（Progress） | `PROGRESS_EVAL` → `LeaderboardEntry.totalScore` | 马匹在赛道上的弧长位置 s = score/100 |
| 质量（Quality） | `SUBMISSION_TEST` → `Submission.totalScore` | 马匹下方质量参考数字（不影响位置）|
| 风险/违规（Risk） | `antiCheatPenalty` + 分数推导 | 橙/红光环 + 红色 `!` 违规徽章 |

### 3.4 左侧面板构成

```
┌─────────────────────┐
│  活跃骑手 TOP 3      │ ← 按提交次数，与进度 TOP3 独立
├─────────────────────┤
│  赛道小地图          │ ← 缩小版赛道 + 彩色圆点（复用 TrackRuntime）
├─────────────────────┤
│  KPI 区域            │
│  · 总 Token 使用量   │ ← TeamArchive.tokenUsed 聚合
│  · 活跃骑手数        │ ← 有 SCORED 提交的队伍数
│  · 总提交次数        │
└─────────────────────┘
```

### 3.5 路由与访问

| URL | 说明 |
|-----|------|
| `/jumbotron` | 赛事选择页（无需登录）|
| `/jumbotron?raceId=<id>` | 全屏大屏 |
| `/jumbotron?raceId=<id>&debug=1` | 调试模式（叠加几何信息）|
| `/jumbotron/calibrator` | Calibrator 编辑器（无需登录）|

---

## 四、Calibrator 使用流程

### 4.1 工具定位

Calibrator 是 Jumbotron 的配套工具，让 Organizer 在创建比赛前可视化地设计赛道。它与 Jumbotron 大屏**共用同一套 TrackRuntime 引擎**，所见即所得。

### 4.2 界面布局

```
┌────────────────────────────────────────┬─────────────────┐
│                                        │  Calibrator     │
│  SVG 画布（1920×1080 viewBox）         │  控制面板       │
│                                        │                 │
│  [赛场底图（默认 28% 透明）]           │  预设赛道       │
│  [赛道环（土黄色）]                    │  · 椭圆 / 方形  │
│  [控制点（青色圆点，可拖拽）]          │                 │
│  [Catmull-Rom 曲线预览]                │  车道配置       │
│  [马匹预览（Scrubber 控制）]           │  · 车道数       │
│                                        │  · 半宽         │
│                                        │                 │
│                                        │  方向 / S 值    │
│                                        │                 │
│                                        │  底图上传       │
│                                        │                 │
│                                        │  验证 + 导出    │
└────────────────────────────────────────┴─────────────────┘
```

### 4.3 操作步骤

1. **加载预设**
   - 点击「预设：椭圆」或「预设：方形」快速加载示例赛道
   - ≥ 4 个控制点后自动渲染完整赛道预览

2. **手动绘制**（可选）
   - 单击 SVG 画布空白处 → 添加控制点
   - 鼠标拖拽控制点 → 调整位置
   - 双击控制点 → 删除

3. **配置参数**
   - 车道数（建议与队伍数匹配）
   - laneHalfWidth（控制赛道宽度）
   - 方向（顺时针/逆时针）
   - 起/终点 S 值（0.0 = 右侧正中）

4. **验证马匹分布**
   - 拖动「位置 S」滑块（0.0–1.0）
   - 查看所有车道马匹是否均匀分布、不重叠、弯道朝向正确

5. **上传底图**（可选）
   - 上传实景赛场照片，调整透明度
   - 沿着赛道边线重新布置控制点

6. **验证并导出**
   - 点击「验证」：检查控制点数（≥4）、弧长（> 0）、车道 ID 合法
   - 「下载 profile.json」：完整 TrackProfile，放入 `Jumbotron/tracks/` 后注册 trackId
   - 「复制控制点」：仅复制 `[[x,y],...]`，粘贴到创建比赛表单

### 4.4 坐标系说明

所有控制点在 **1920 × 1080 坐标系**内定义，与 Jumbotron SVG viewBox 完全一致，无需任何缩放转换。

---

## 五、数据与资产说明

### 5.1 赛道资产文件结构

```
Jumbotron/
├── tracks/
│   ├── track.profile.json    标准椭圆赛道（oval-standard）
│   ├── rect.profile.json     标准方形赛道（rect-standard）
│   ├── notes.md              赛道参数与校准说明
│   └── source.prompt.md      底图来源说明
├── types.ts                  核心类型接口
├── track-runtime.ts          样条引擎
├── adapter.ts                DB → RaceSnapshot 适配
└── SUBSYSTEM.md              子系统文档

public/
└── jumbotron底图.jpg         赛场背景图（真实赛场照片）
```

### 5.2 TrackProfile 格式

```json
{
  "schemaVersion": "1.0",
  "trackId": "oval-standard",
  "viewBox": { "width": 1920, "height": 1080 },
  "centerline": {
    "smoothing": "catmull-rom",
    "points": [[1472, 540], [1403, 424], ...]
  },
  "direction": "counterclockwise",
  "startFinish": { "s": 0.0 },
  "lanes": [
    { "laneId": "lane-0", "offset": -66 },
    ...
  ],
  "laneHalfWidth": 75
}
```

### 5.3 三类数据存储规则

| 类别 | 示例 | ARY 是否持久化 |
|------|------|----------------|
| 公开投影 | 榜单、赛事描述、赛后展示 | ✅ 长期保存 |
| 流程元数据 | 账号、队伍、提交状态、反馈 | ✅ 流程需要 |
| Rider 提交物 | 代码内容、Riding Record | ⚠ 临时中转，评测后清空 |
| Organizer 私有 | 测试代码、Runner 逻辑 | ❌ 不进 ARY |

### 5.4 Race 数据库字段（Jumbotron 相关）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trackId` | String | `oval-standard` | 预设赛道 ID |
| `trackCenterlineJson` | String? | null | 自定义控制点，覆盖 trackId |
| `trackDirection` | String | `counterclockwise` | 顺时针/逆时针 |
| `trackStartFinishS` | Float | 0.0 | 起/终点弧长比例 0–1 |
| `checkpointCount` | Int | 3 | 赛事阶段数 = 检查点数 |

---

## 六、PoC 边界与未实现部分

### 6.1 已实现的核心功能

| 功能 | 状态 |
|------|------|
| Organizer 创建/管理赛事 | ✅ |
| Rider 报名/提交/反馈 | ✅ |
| Runner API（拉取/回传） | ✅ |
| 提交代码评测后清空 | ✅ |
| 公开榜单 + 赛后展示 | ✅ |
| Jumbotron 大屏（全部 15 项 GRS 002 验收） | ✅ |
| Calibrator 赛道编辑器 | ✅ |
| 两条预设赛道（椭圆 + 方形） | ✅ |
| 赛道参数（方向/起终点/checkpoints） | ✅ |

### 6.2 已知 PoC 边界

| 限制 | 说明 | 生产解法 |
|------|------|----------|
| SQLite（部署不持久） | 实例重建后数据丢失 | 换 Postgres + 持久卷 |
| Runner 鉴权简单 | 静态 Bearer Token | HMAC 签名 / mTLS |
| Jumbotron 30s 轮询 | 非真实推送 | WebSocket / SSE |
| TeamArchive 保留代码 | PRD 原则上不存储 Rider 代码 | 赛后公开期过后彻底删除 |
| 题目无实际上传 | 仅文件名字符串 | S3 + 预签名 URL |
| Calibrator 独立页面 | 未与赛事管理集成 | 嵌入 Organizer 创赛表单 |

### 6.3 GRS 001 遗留的未实现项

| 功能 | 说明 |
|------|------|
| 完整组队流程 | 当前仅报名时填写组员信息 |
| Reviewer/Contributor 角色 | 未实现代码审核子流程 |
| 异常 UI 反馈 | Runner 超时/失败时 Rider 侧无明确提示 |
| 公开榜单自动化节奏 | 当前依赖 Organizer 手动触发 PROGRESS_EVAL |

---

## 七、快速运行

```bash
npm install
npx prisma migrate deploy && npx prisma generate
npm run db:seed
npm run dev
```

| URL | 账号 |
|-----|------|
| `http://localhost:3000/jumbotron?raceId=race_jumbotron_demo` | 无需登录 |
| `http://localhost:3000/jumbotron/calibrator` | 无需登录 |
| `http://localhost:3000` | `organizer_demo / organizer123` |

完整演示流程见 `README.md`。
