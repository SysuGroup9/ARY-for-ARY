# ARY GRS 002 Jumbotron — 作品说明文档

> **版本**: 2.0 | **日期**: 2026-06-12
> **对应赛题**: ARY GRS 002 — Jumbotron 赛马大屏子系统
> **项目**: ARY for ARY（Next.js 16 + Prisma + SQLite）

---

## 目录

1. [赛题理解与系统定位](#1-赛题理解与系统定位)
2. [系统架构](#2-系统架构)
3. [功能实现清单](#3-功能实现清单)
4. [数据契约与映射规则](#4-数据契约与映射规则)
5. [关键设计决策](#5-关键设计决策)
6. [赛道资产生产流程](#6-赛道资产生产流程)
7. [验收状态](#7-验收状态)
8. [运行说明](#8-运行说明)
9. [PoC 边界与限制](#9-poc-边界与限制)
10. [提交物清单](#10-提交物清单)

---

## 1. 赛题理解与系统定位

### 1.1 核心命题回应

GRS-002 的核心命题是：

> 一块赛事大屏是否可以由可信数据、可信赛道几何和可维护资产流程驱动，而不是靠手写位置、静态贴图或一次性动画伪装出来？

**我们的回答：可以。** Jumbotron 子系统的每匹马的位置都由 `roundProgress → centerline → HorsePose` 这条计算链路产生；赛道几何由 `track.profile.json` 显式描述，由 Calibrator 校准；数据来自 ARY 数据库经 Adapter 映射入 RaceSnapshot。没有一匹马的位置是手写的 x/y，没有一个排名是从图片推断的。

### 1.2 子系统定位

Jumbotron 是 ARY 平台内的一个子系统，由三个协同部分构成：

| 组件                               | 阶段   | 核心职责                        | 路由                                 |
| ---------------------------------- | ------ | ------------------------------- | ------------------------------------ |
| **Jumbotron Race Live View** | 运行时 | 赛马大屏可视化，面向观众/组织者 | `/jumbotron/[raceId]`（公开）      |
| **Track Profile Calibrator** | 设计时 | SVG 编辑器，校准赛道语义资产    | `/calibrator`（Organizer 登录）    |
| **track-runtime**            | 共享   | 位置计算包，两个组件共用        | `src/lib/jumbotron/track-runtime/` |

### 1.3 数据流

```
ARY 数据库 (Race / Team / Submission / TeamArchive / LeaderboardEntry)
  │
  ├─→ [Organizer 触发] generateRaceSnapshot()
  │     └─→ Adapter: AryDerivedDataProvider
  │           ├─→ RacingEntrySnapshot[]  （映射 + 真实 progress 投影）
  │           ├─→ Competition + CompetitionKPI
  │           ├─→ RidingMessageSnapshot[]
  │           └─→ AttentionItem[]
  │                 │
  │                 └─→ 写入 public/assets/snapshots/<raceId>.json
  │
  └─→ Jumbotron 页面 读取 RaceSnapshot JSON
        └─→ track-runtime
              ├─→ samplePath() → sampleAt(s) → tangent → normal → laneOffset
              └─→ HorsePose { x, y, rotation, s, laneId, state }
                    └─→ JumbotronClient SVG 渲染
```

**数据主权说明**：MVVP 阶段 DC（DevCompass）平台不存在，ARY 使用自身数据库生成快照。Adapter 预留 `DCRaceDataProvider` 接口，DC 接入后只需替换实现类，渲染层无需改动。

### 1.4 与现有 ARY 项目的关系

Jumbotron **并入** ARY Next.js 项目：

- 复用现有的 Prisma ORM、认证系统（JWT Cookie）、Server Action 模式
- 复用 `publishLeaderboard` 的快照生成交互范式
- 新增路由独立于现有页面，不影响原有功能

---

## 2. 系统架构

### 2.1 工程结构

```
src/
├── app/
│   ├── jumbotron/
│   │   └── [raceId]/
│   │       ├── page.tsx                    # 服务端：加载快照 + TrackProfile
│   │       └── JumbotronClient.tsx         # 客户端：赛马大屏 SVG 渲染
│   ├── calibrator/
│   │   ├── page.tsx                        # 服务端：权限校验
│   │   └── CalibratorClient.tsx            # 客户端：SVG 编辑器
│   ├── JumbotronBanner.tsx                 # 主页顶部轮播横幅
│   ├── JumbotronInline.tsx                 # 主页内嵌展开组件
│   ├── page.tsx（修改）                    # 加「生成 Jumbotron 快照」按钮
│   └── actions.ts（修改）                  # 加 generateRaceSnapshotAction
│
├── lib/
│   ├── services/
│   │   └── race-snapshot.ts                # 快照生成 + 读写
│   └── jumbotron/
│       ├── track-runtime/
│       │   ├── types.ts                    # 13 个核心 interface
│       │   ├── path-sampler.ts             # Catmull-Rom 平滑 + s→点采样
│       │   ├── pose-calculator.ts          # progress → HorsePose
│       │   ├── lane-manager.ts             # 排名 → 车道循环分配
│       │   ├── animation-state.ts          # 9 状态机 + staleness 检测
│       │   ├── validator.ts                # schema + geometry 校验（15+ 项）
│       │   └── index.ts                    # 统一导出
│       ├── adapter.ts                      # ARY 数据 → RacingEntrySnapshot
│       └── calibrator/
│           └── CalibratorState.ts          # useReducer + 20 种 action
│
└── public/assets/
    ├── tracks/
    │   ├── oval-track/   (background.svg + track.profile.json + notes.md + source.prompt.md)
    │   └── circuit-track/ (background.svg + track.profile.json + notes.md + source.prompt.md)
    └── snapshots/        (race_active.json / race_signup.json / race_finished.json)
```

### 2.2 技术选型

| 层              | 选型                              | 理由                                                                                                   |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 框架            | Next.js 16 App Router             | 并入现有 ARY 项目                                                                                      |
| 数据库          | Prisma 7 + SQLite                 | 复用现有数据层                                                                                         |
| Calibrator 编辑 | **SVG** + React 事件        | 经 Canvas→SVG 重构后确定。SVG viewBox 原生坐标映射，getScreenCTM() 精确转换，无 Canvas 分辨率漂移问题 |
| 赛道渲染        | SVG overlay + DOM                 | SVG 适合路径和马匹定位，DOM 适合卡片/文字 UI                                                           |
| 动画            | requestAnimationFrame + s 轴 lerp | 马匹位置在弧长轴上补间，弯道不穿越赛道内侧                                                             |
| 快照            | JSON 文件                         | 可离线查看、Git diff、手工编辑调试                                                                     |
| 快照生成        | Server Action                     | 复用现有 publishLeaderboard 交互模式                                                                   |

### 2.3 代码量级

| 模块                  | 文件数       | 行数（估）       |
| --------------------- | ------------ | ---------------- |
| track-runtime         | 7            | ~630             |
| Adapter               | 1            | ~380             |
| RaceSnapshot 服务     | 1            | ~120             |
| Calibrator            | 2            | ~500             |
| JumbotronClient       | 1            | ~550             |
| 组件（Banner/Inline） | 2            | ~200             |
| 种子数据              | 1            | ~280             |
| 赛道资产              | 8            | ~400             |
| 文档（PRD/UML/Notes） | 8            | ~1,200           |
| **合计**        | **31** | **~4,260** |

---

## 3. 功能实现清单

### 3.1 Jumbotron Race Live View

**已实现的 P0 功能**:

| 功能                                                           | 实现方式                                    |
| -------------------------------------------------------------- | ------------------------------------------- |
| Header：赛事标题、LIVE 徽章（脉冲动画）、Round/Phase、已用时间 | JumbotronClient Header 区域                 |
| 在线选手数（动态：总数 - stale）                               | 从 KPI 读取，stale 队伍不计入               |
| KPI Strip：完成度、总 Tokens、Codex/Claude 比例、风险数        | 可点击展开各队明细表                        |
| 赛道底图渲染                                                   | `<img>` 加载 + SVG `<image>` overlay    |
| 马匹位置：roundProgress → centerline → HorsePose             | track-runtime 全链路计算                    |
| 每匹马：排名 badge（金/银/铜/灰）+ 队名标签 + 彩色环 + emoji   | SVG `<g>` 分组渲染                        |
| 12 种队伍颜色 + 12 种 emoji 循环分配                           | `teamColors[]` / `teamEmoji[]`          |
| TOP3 展示：分数、CA 类型                                       | 左侧 150px 面板                             |
| 活跃骑手 TOP3（按 submission count）                           | TOP3 下方独立面板                           |
| Entry Legend（颜色/emoji → 队名对应）                         | 活跃骑手下方图例条                          |
| 小地图 Minimap                                                | 赛道右下角缩略总览                          |
| 底部 Ticker：风险/违规/消息滚动                                | CSS `@keyframes scroll` 30s               |
| Footer：Theme / Organizer / Phase / Time                       | 固定底部                                    |
| Debug Mode（D 键）：中心线、采样点、s 值                       | SVG overlay 切换                            |
| 全屏入口                                                       | 🔲 按钮 → 新标签页 `/jumbotron/[raceId]` |
| drill-down：点击马匹/TOP3 → 详情 panel                        | 12 字段 modal                               |

**已实现的 P1 功能**:

| 功能                               | 实现方式                                  |
| ---------------------------------- | ----------------------------------------- |
| 9 种动画状态                       | animation-state.ts 状态机                 |
| s 轴补间（非 x/y 直接补间）        | requestAnimationFrame + displayS lerp     |
| 每匹马不同速度                     | entryId hash → LERP_SPEED 0.021~0.048    |
| 起跑效果（Live 赛事马从 s=0 出发） | displayS 初始化逻辑                       |
| Riding Message 气泡                | 每 Entry 最多 1 条，全局 3 条，自适应宽度 |
| 降噪策略                           | §7 详述                                  |
| 风险/违规标记                      | 底部 Ticker 红色分类 + drill-down 面板    |

### 3.2 Track Profile Calibrator

**已实现的 MVP 功能**（全部 13 项）：

| #  | 功能                 | 实现方式                                                       |
| -- | -------------------- | -------------------------------------------------------------- |
| 1  | 导入底图             | `<input type="file">` → FileReader → SVG `<image>`       |
| 2  | 创建/加载 Profile    | 新建空白 / 导入 JSON（dispatch LOAD_PROFILE）                  |
| 3  | 添加/删除/拖拽控制点 | SVG `<circle>` + onMouseDown + onContextMenu + onDoubleClick |
| 4  | 平滑路径预览         | Catmull-Rom 采样 → SVG `<polyline>`                         |
| 5  | 闭合路径切换         | Inspector checkbox                                             |
| 6  | 一键反转方向         | 翻转 points 数组 + direction toggle                            |
| 7  | 设置起点             | startFinish.s range slider                                     |
| 8  | 配置车道             | Inspector 中 name/offset 编辑 + 添加/删除                      |
| 9  | 配置检查点           | Inspector 中 name/s 编辑 + 添加/删除                           |
| 10 | 单马预览             | Preview Bar scrubber 0%→100%                                  |
| 11 | 多马预览             | previewHorseCount 1~12                                         |
| 12 | Validate             | validator.ts 15+ 项检查                                        |
| 13 | Export JSON          | toTrackProfile() → Blob → download                           |

### 3.3 track-runtime（共享包）

Calibrator 的马匹预览与 Jumbotron 的马匹渲染**使用同一套 track-runtime 函数**（`samplePath` / `sampleAt` / `normal` / `tangentAngle`），满足子系统定义中 "Calibrator 预览必须复用 track-runtime" 的硬性要求。

---

## 4. 数据契约与映射规则

### 4.1 TrackProfile 语义赛道

Track Profile 是赛道的唯一运行时事实来源。它描述画布尺寸、底图路径、中心线控制点集、路径方向、起终点、车道偏移和检查点。格式为 `polyline + Catmull-Rom smoothing`，便于人工拖拽、Git diff、异常校验和路径反转。

### 4.2 ARY → RacingEntrySnapshot 映射

| Jumbotron 字段                                                     | ARY 数据来源                 | 映射方式                                | 数据状态                 |
| ------------------------------------------------------------------ | ---------------------------- | --------------------------------------- | ------------------------ |
| entryId / riderName / projectName                                  | Team                         | 直接映射                                | 真实                     |
| rank / score                                                       | LeaderboardEntry             | 排序                                    | 真实                     |
| roundProgress                                                      | LeaderboardEntry.progress    | 优先消费 Runner 回传的 0~1 progress      | 真实/缺失时按阶段兜底    |
| overallProgress                                                    | score / maxScore             | 线性映射                                | 推导                     |
| submissionCount                                                    | Submission                   | 按 teamId 计数                           | 真实                     |
| caProvider                                                         | TeamArchive.agentType        | CLAUDE→claude, COPILOT→codex            | 真实                     |
| costTokens                                                         | TeamArchive.tokenUsed        | 直接映射                                | 真实                     |
| riskLevel / violationCount                                         | antiCheatPenalty             | >0→medium/low, >0→1/0                   | 推导                     |
| status                                                             | progress + racePhase         | 见下方                                  | 推导                     |
| lastMessage                                                        | FeedbackThread               | 截取 50 字，无消息则不展示               | 真实                     |
| phaseProgress / currentPhase / costUsd / obstacleCount / cockpitId | —                           | currentPhase 由 submissionCount 弱推导等 | 部分推导 / 部分待接入    |

**roundProgress 当前规则**:

- 若 `LeaderboardEntry.progress` 存在：直接裁剪到 `0~1`
- 已结束赛事且缺失 progress：兜底为 `1`
- 未开赛赛事：`0`
- 进行中但暂缺 progress：`0`

**status 当前规则**:

- `now >= raceEnd` → `"finished"`
- 无 leaderboard entry → `"idle"`
- `roundProgress >= 0.95` → `"sprinting"`
- `roundProgress > 0` → `"running"`
- 其余 → `"idle"`

### 4.3 DCRaceDataProvider 预留接口

```typescript
interface DCRaceDataProvider {
  getRaceEntries(raceId: string): Promise<RacingEntrySnapshot[]>;
  getRidingMessages(raceId: string): Promise<RidingMessageSnapshot[]>;
  getAttentionItems(raceId: string): Promise<AttentionItem[]>;
  getCompetitionKPI(raceId: string): Promise<CompetitionKPI>;
}
```

当前实现 `AryDerivedDataProvider`，DC 接入后替换为 `DCDataProvider`。渲染层零改动。

---

## 5. 关键设计决策

### 5.1 为什么位置计算用 s 轴补间而非 x/y 补间？

在弯道处，两点之间的最短路径（直线）穿越赛道内侧。在 s 轴上补间保证位置始终落在 centerline 上：

```
s0 → s1 → sampleAt(s(t)) → 保证点在路径上
x0→x1 直接补间 → 弯道处马匹穿越赛道内侧
```

### 5.2 为什么 Calibrator 用 SVG 而非 Canvas？

Calibrator 最初使用 Canvas 实现，经历了 6 次渐进式修补（坐标换算、React 批处理同步、分辨率对齐等）后，发现 Canvas 架构在 React 中存在根因问题：

- `canvas.width`（内部分辨率）≠ `canvas.clientWidth`（CSS 显示尺寸）≠ `getBoundingClientRect().width`（布局后尺寸）
- 加 `ctx.scale()` 变换链后坐标调试极其困难

重构为 SVG 后：

- `viewBox` 原生处理坐标映射
- `<circle>` 直接绑定 DOM 事件，无需手动 hitTest
- `getScreenCTM().inverse()` 精确转换鼠标位置
- 与 JumbotronClient 共享统一的渲染范式

### 5.3 为什么用快照 JSON 而非实时查库？

- 快照可离线查看、Git diff、手工编辑调试
- 降低 Jumbotron 对数据库的运行时依赖
- 与现有 `publishLeaderboard` 交互模式一致，降低学习成本

---

## 6. 赛道资产生产流程

### 6.1 AI-assisted Pipeline

```
1. 编写 Prompt → AI 生成 16:9 赛道底图
2. 导入 Calibrator → 人工编辑 centerline 控制点对齐视觉赛道线
3. 配置车道 / checkpoints / startFinish
4. Preview 单马 0%→100% → 多马 8 匹
5. Validate → 通过 15+ 项校验
6. Export track.profile.json
7. 冻结到 assets/tracks/<track-id>/
```

### 6.2 当前可用资产

| 赛道          | 控制点             | 车道 | 底图来源                 |
| ------------- | ------------------ | ---- | ------------------------ |
| oval-track    | 12（椭圆参数方程） | 3    | SVG 手绘（Morandi 暖调） |
| circuit-track | 16（矩形+圆角）    | 3    | SVG 手绘（蓝灰冷调）     |

两条赛道均通过 schema + geometry validation，可直接被 Jumbotron 加载运行。

---

## 7. 验收状态

### 7.1 Jumbotron Race Live View

- [X] 页面可公开访问
- [X] 完整五个区域：Header / KPI / 赛道 / TOP3+Legend / Ticker+Footer
- [X] 多 Racing Entry：8 队同屏，每队独立颜色+emoji
- [X] 马匹位置由 roundProgress → s → centerline → HorsePose 全链路计算
- [X] s 轴补间，非 x/y 直接补间
- [X] 9 种动画状态可区分
- [X] Debug Mode（D 键）：中心线 / 采样点 / s 值
- [X] drill-down 面板（12 字段）
- [X] KPI 点击展开各队明细表
- [X] 降噪策略：气泡 ≤1/entry, ≤3 全局, ticker fallback
- [X] 嵌入式横幅 + 全屏页

### 7.2 Calibrator

- [X] 导入底图（SVG/PNG）
- [X] 拖拽 / 右键删除 / 双击添加控制点
- [X] 路径反转 / 闭合切换
- [X] 车道 + checkpoint 配置
- [X] 单马 0%→100% 预览
- [X] 多马 1~12 预览
- [X] Validate（schema + geometry）
- [X] Export JSON
- [X] 导出的 profile 被 Jumbotron 直接加载

### 7.3 track-runtime

- [X] Calibrator 和 Jumbotron 共用同一套 path-sampler
- [X] 路径采样无 NaN/Infinity
- [X] 弯道处马匹方向自然
- [X] Runtime 防御校验

### 7.4 资产

- [X] 2 条可用赛道（oval + circuit）
- [X] 每条 ≥3 车道
- [X] ≥8 匹马多马预览验证通过

---

## 8. 运行说明

### 环境准备

```bash
npm install
npm run db:seed
npm run dev
```

### Demo 入口

| 入口       | URL                                             | 说明                       |
| ---------- | ----------------------------------------------- | -------------------------- |
| 主页横幅   | `http://localhost:3000`                       | 自动轮播三个赛事 Jumbotron |
| 全屏页     | `http://localhost:3000/jumbotron/race_active` | 满屏 16:9                  |
| Calibrator | `http://localhost:3000/calibrator`            | Organizer 登录             |

### 演示账号

| 角色      | 用户名范围                                                | 密码         |
| --------- | --------------------------------------------------------- | ------------ |
| Organizer | organizer_demo                                            | organizer123 |
| Rider     | rider_alice ~ rider_olivia                                | rider123     |
| Rider     | rider_active_assistant_01 ~ rider_active_assistant_08     | rider123     |
| Rider     | rider_signup_member_01 ~ rider_signup_member_03           | rider123     |
| Rider     | rider_finished_member_01 ~ rider_finished_member_06       | rider123     |

### Debug 操作

| 操作            | 效果                       |
| --------------- | -------------------------- |
| 按 D 键         | 显示中心线 / 采样点 / s 值 |
| 点击 KPI 项     | 展开各队明细表             |
| 点击马匹 / TOP3 | 弹出 drill-down 面板       |
| 点击 🔲 全屏    | 新标签页打开满屏           |
| 底部进度条拖动  | Calibrator 预览马匹移动    |

---

## 9. PoC 边界与限制

### 9.1 已知限制

| 限制                      | 影响范围                                              | 解决方向                          |
| ------------------------- | ----------------------------------------------------- | --------------------------------- |
| DC 侧数据未接入           | 少量展示字段仍为推导值，未接入企业侧实时源             | DCRaceDataProvider 接口已预留     |
| 快照为静态 JSON           | 不实时更新                                            | 未来可用 WebSocket 推送或定时轮询 |
| Calibrator 无消息区域编辑 | no-bubble-zone / message-zone 未实现                  | P1 功能                           |
| 气泡避让简化              | 多气泡可能重叠                                        | P2 增强                           |
| 未接入真实 Remote Cockpit | drill-down targetUrl 暂无跳转                         | 预留字段                          |

### 9.2 诚实声明

- ARY 侧真实数据：entryId / riderName / projectName / rank / score / progress / submissionCount / caProvider / costTokens / riskLevel / violationCount
- ARY 侧推导数据：overallProgress / status / currentPhase（弱推导）
- 仍属 PoC 推导或待接入字段：phaseProgress / costUsd / obstacleCount / cockpitId
- **数据链路已打通的**：ARY DB → Adapter → RaceSnapshot → track-runtime → HorsePose → JumbotronClient
- **待 DC 接通的**：DCRaceDataProvider 接口替换实现

---

## 10. 提交物清单

| #  | 提交物        | 路径                                                                                         |
| -- | ------------- | -------------------------------------------------------------------------------------------- |
| 1  | 作品说明文档  | `Jumbotron-PRD.md`（本文档）                                                               |
| 2  | 可运行 Demo   | `npm run db:seed && npm run dev` → `/` 或 `/jumbotron/race_active`                    |
| 3  | 短视频        | `https://www.bilibili.com/video/BV1GYJ561Eb1/?vd_source=1b134e71774d2264b0206c4267e3e406`  |
| 4  | 赛道资产 ×2  | `public/assets/tracks/oval-track/` `public/assets/tracks/circuit-track/`                 |
| 5  | 数据样例 ×3  | `public/assets/snapshots/race_active.json` `.signup.json` `.finished.json`             |
| 6  | Riding Record | `GRS-002-riding-record.md`                                                                 |
| 7  | 信息架构文档  | `Jumbotron信息架构.md` `Jumbotron子系统定义.md`（前置参考）                              |
| 8  | UML 建模图    | `../grs001/uml/`（用例图/状态机/时序图 PNG）                                               |
| 9  | Demo 演示指南 | `DEMO-GUIDE.md`                                                                            |
| 10 | 视频分镜脚本  | `VIDEO-SCRIPT.md`                                                                          |

---

*文档版本 2.0 | 2026-06-12*
*基于 GRS-002 评审标准组织，覆盖第 1-5 节及第 7 节评分要点*
