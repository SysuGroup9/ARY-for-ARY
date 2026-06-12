# ARY GRS 002 Jumbotron — 短视频脚本

## 基本信息

- 时长：3-5 分钟
- 格式：录屏 + 旁白
- 工具建议：OBS / QuickTime 录屏 + 手机或电脑麦克风录音

---

## 分镜表（7 个镜头）

### 镜头 1：开场 & 问题定位（30 秒）

| 画面 | 旁白要点 |
|------|---------|
| 展示 Jumbotron-PRD 首页或关键词截图 | "ARY GRS 002 的核心命题是：一块赛事大屏能否由 RaceSnapshot、Track Profile 和 Riding Message 驱动，而非手写坐标或静态贴图？" |
| 切换到 Jumbotron 运行画面 | "我们实现了一个可运行的 Jumbotron 子系统，包含 Race Live View 和 Track Profile Calibrator。" |

### 镜头 2：Jumbotron Race Live View（60 秒）

| 画面 | 旁白要点 |
|------|---------|
| 主页顶部横幅，自动轮播 | "Jumbotron 嵌入在 ARY 主页顶部，自动轮播多个赛事的赛马大屏。" |
| 特写 Header（LIVE 徽章、计时） | "顶部展示赛事标题、LIVE 状态、Round 和已用时间。" |
| 特写 KPI Strip | "中间是赛事级 KPI：完成度、总 Tokens、Codex/Claude 使用比例。点击任意 KPI 可展开各队明细。" |
| 特写赛道上的 8 匹马 | "赛道主画面展示 8 个 Racing Entry。每匹马的位置由 roundProgress 经中心线采样和车道偏移计算得出，不写死 x/y。" |
| 特写 TOP3 + Legend | "左侧 TOP3 卡片显示排名变化（↑↓）、分数和 CA 类型。下方图例帮助观众识别队伍。" |
| 特写底部 Ticker | "底部 Ticker 滚动显示风险、违规和 Riding Message。" |

### 镜头 3：Drill-down + Debug（30 秒）

| 画面 | 旁白要点 |
|------|---------|
| 点击一匹马 → 弹出详情面板 | "点击任意马匹或 TOP3 卡片，弹出 drill-down 面板，展示该队的完整数据：排名、分数、进度、Token 消耗、风险等级和最新留言。" |
| 按 D 键 → 显示 Debug 覆盖层 | "按 D 键进入 Debug Mode，显示中心线、采样点、每匹马的 s 值和状态标签，评委可以直观验证位置计算。" |

### 镜头 4：Calibrator（60 秒）

| 画面 | 旁白要点 |
|------|---------|
| 打开 /calibrator | "Track Profile Calibrator 是设计时赛道校准工具。" |
| 导入底图 | "导入一张 AI 生成或手绘的赛道底图。" |
| 拖拽控制点对齐赛道 | "沿赛道拖拽控制点编辑中心线。左键拖拽移动，双击添加，右键删除。蓝色曲线是 Catmull-Rom 平滑后的采样路径。" |
| 展示车道虚线、起跑线、检查点 | "虚线显示三条车道偏移，红色线标记起跑位置，菱形标记检查点。" |
| 底部进度条拖动 | "拖动进度条预览单马从 0% 到 100% 沿赛道移动。" |
| 多马预览 8 匹 | "切换为 8 匹马预览，验证车道偏移不重叠。" |
| Validate → Export | "点击 Validate 运行 schema 和 geometry 校验，通过后导出 track.profile.json。" |

### 镜头 5：赛道资产与数据流（30 秒）

| 画面 | 旁白要点 |
|------|---------|
| 在编辑器打开 track.profile.json | "导出的 track.profile.json 包含 schemaVersion、中心线点集、车道配置、检查点等，是 Jumbotron 运行时的事实来源。" |
| 在编辑器打开 race_active.json | "RaceSnapshot 由 ARY 数据库经 Adapter 映射生成。roundProgress 从 LeaderboardEntry 排名推导，phaseProgress 和部分 Riding Message 为 mock。" |
| 展示数据流图 | "数据流：ARY DB → Adapter → RaceSnapshot → track-runtime → HorsePose → Jumbotron。Calibrator 和 Jumbotron 共用同一套 track-runtime 进行位置计算。" |

### 镜头 6：关键架构亮点（20 秒）

| 画面 | 旁白要点 |
|------|---------|
| 代码截图：path-sampler.ts | "位置补间在 s 轴上进行，避免弯道穿越。" |
| 代码截图：animation-state.ts | "动画由状态机驱动：idle / running / sprinting / stale 等 9 种状态。" |
| 代码截图：validator.ts | "Track Profile 导出前经过 15+ 项自动校验。" |

### 镜头 7：PoC 边界 & 收尾（20 秒）

| 画面 | 旁白要点 |
|------|---------|
| 回到 Jumbotron 全景 | "当前 MVVP 阶段，DC 侧实时数据尚未接入，部分字段为 mock。但 Jumbotron Adapter、track-runtime、Calibrator 的核心链路已经打通，DCRaceDataProvider 接口预留给未来 DC 数据源。" |
| 展示提交物清单 | "提交物包括：Jumbotron-PRD、可运行 Demo、两条赛道资产、数据样例、Riding Record 和本视频。" |

---

## 旁白节奏建议

- 开头 30 秒：慢一点，讲清楚"为什么做"
- 中间 3 分钟：中等语速，画面跟旁白同步
- 结尾 30 秒：总结 + PoC 边界，诚实但自信
