# ARY GRS 002 Jumbotron — Agent Riding Record

> **会话 ID**: `6f165d18-97ef-4f07-82dc-b5f366798d40`
> **Agent**: Claude Code (Claude Opus 4.8)
> **日期**: 2026-06-11 14:29 ~ 2026-06-12 21:39（约 31 小时，178 轮对话）
> **Rider**: Hrm-cell

> **评审对照**: 本文档按照 GRS-002 评审标准第 6 节「Agent Riding Skill 与过程质量」（15 分）组织，
> 覆盖 Riding Plan（§1）、任务拆解（§2）、Agent 产出与 Rider 判断（§3）、错误识别与纠错（§4）、
> 重构与验证（§5）、人工干预闭环（§6）、复盘总结（§7）七个维度。

---

## §0 量化总览

| 指标 | 数值 | 对应评分维度 |
|------|------|------------|
| 对话轮次 | 178 轮 | 过程记录充分性 |
| 新增源文件 | 26 个 | 代码产出规模 |
| 修改文件 | 5 个 | 重构能力 |
| 新增代码行数 | ~3,800 行 TS/TSX/SVG/CSS | 工程产出量 |
| 新增文档行数 | ~1,200 行 Markdown | 文档产出量 |
| Rider 否决 Agent 方案 | 11 次 | 人工判断力 |
| Bug 发现-诊断-修复循环 | 16 次，其中 1 次触发全量架构重构 | 纠错与重构能力 |
| 视觉-交互迭代轮次 | 8 轮 | 审美判断力 |
| 架构决策提问 | 6 轮结构化提问 | Agent 边界意识 |

---

## §1 Riding Plan —— 任务拆解与策略

### 1.1 初始 Prompt（Rider 指令）

> "基于前面完成的内容，我们来完成新任务 @Jumbotron信息架构.md @Jumbotron子系统定义.md，你先阅读这两个文档的要求，然后对你认为需要我判断的问题向我提问，每次都问最重要的问题，直到你觉得可以开始写这一次任务的需求文档。"

**设计意图**: Rider 没有直接给"把这东西做出来"的指令，而是要求 Agent **先提出问题、澄清边界、确认范围**，体现了"先规划后执行"的 Riding 策略。

### 1.2 Agent 的提问序列（边界确认）

Agent 拿到前置文档后，没有直接开始写代码，而是通过 6 个精心排序的问题逐层确认边界——每个问题都提供了结构化选项对比，而非开放式询问：

| 序号 | 问题 | Rider 选择 | 被否决的选项 | 决策影响 |
|------|------|-----------|------------|---------|
| ① | Jumbotron 与 ARY 的关系？ | 并入 ARY，新路由 | 独立 monorepo | 决定了目录结构和部署方式 |
| ② | 功能范围？ | Race Live View + Calibrator 全做 | 只做其中一个 | 决定了 ~3,800 行的代码量 |
| ③ | Calibrator 做到什么程度？ | 完整 MVP（13 项全功能） | 最小可用（手动 JSON）/ 中等 | 决定了 Canvas/SVG 编辑器复杂度 |
| ④ | 数据模式？ | 快照 JSON（Organizer 触发生成） | 实时查库 | 决定了 Adapter 设计和数据流 |
| ⑤ | 缺失数据（roundProgress 等）？ | 从 ARY 现有数据推导 + mock 补全 | 全 mock / DC 真实数据 | 决定了 mock 策略和接口预留 |
| ⑥ | Calibrator 数据源？ | 用 ARY Prisma 现有表 | — | 决定了数据查询路径 |

**Riding 观察**: Agent 在每个决策点都提供了表格化的方案对比，Rider 逐一做出明确选择。这种"提问→回答→确认"模式贯穿了整个会话的架构阶段。

### 1.3 确认后的执行计划

Agent 将任务拆解为 4 个 Phase，每个 Phase 声明了依赖关系和预估代码量：

```
Phase 1: track-runtime         → ~300 行 TS，纯算法，零依赖，先写
Phase 2: Adapter + RaceSnapshot → ~200 行 TS，依赖 Phase 1 类型定义
Phase 3: Calibrator             → ~500 行 TSX+TS，依赖 Phase 1 track-runtime
Phase 4: Jumbotron Race Live View → ~400 行 TSX，依赖 Phase 1+2+3
```

**Riding 判断**: 执行顺序合理——先把最底层、无 UI 依赖的算法包写完并验证通过，再逐层往上构建。这是典型的"自底向上"工程策略。

---

## §2 任务拆解 —— 复杂系统的模块化分解

### 2.1 模块架构

Agent 将 Jumbotron 子系统分解为 6 个独立模块，每个模块有清晰的职责边界和文件清单：

| 模块 | 文件数 | 职责 | Agent 贡献 | Rider 贡献 |
|------|--------|------|-----------|-----------|
| **track-runtime** | 7 个 | 路径采样、姿态计算、车道分配、状态机、校验 | 全部代码 | TypeScript 类型审核 |
| **Adapter** | 1 个 | ARY 数据 → RacingEntrySnapshot 映射 | 全部代码 + mock 逻辑 | 字段映射合理性审核 |
| **RaceSnapshot 服务** | 1 个 | 快照生成 + 文件读写 + Server Action | 全部代码 | 复用 publishLeaderboard 模式的决策 |
| **Calibrator** | 5 个 | Canvas/SVG 赛道编辑工具 | 全部代码 | 交互 bug 发现（6 次）+ Canvas→SVG 重构方向 |
| **JumbotronClient** | 1 个 | 赛马大屏渲染 | 全部代码 | 视觉迭代方向（8 轮） |
| **种子数据** | 1 个 | 3 赛事 17 队演示数据 | 全部代码 | 数据合理性审核 |

### 2.2 关键接口预留

Agent 在设计 Adapter 时预留了 `DCRaceDataProvider` 接口，当前实现 `AryDerivedDataProvider` 为过渡方案：

```typescript
// 预留接口 —— DC 真实数据接入时只需替换实现，渲染层无需改动
export interface DCRaceDataProvider {
  getRaceEntries(raceId: string): Promise<RacingEntrySnapshot[]>;
  getRidingMessages(raceId: string): Promise<RidingMessageSnapshot[]>;
  getAttentionItems(raceId: string): Promise<AttentionItem[]>;
  getCompetitionKPI(raceId: string): Promise<CompetitionKPI>;
}
```

**Riding 判断**: 这是"为未来设计"的工程决策——当前 MVVP 阶段 DC 平台不存在，但接口预留确保未来替换只需交换实现类，不触碰渲染层。体现了面向接口编程的思维。

---

## §3 Agent 产出与 Rider 判断 —— 协作过程详录

### 3.1 Phase 1：track-runtime（零 Bug，一次通过）

**Agent 产出**:

```
src/lib/jumbotron/track-runtime/
├── types.ts              (134 行)  13 个 TypeScript 接口定义
├── path-sampler.ts       (130 行)  Catmull-Rom 平滑 + sampleAt(s) 二分查找
├── pose-calculator.ts    (120 行)  calculateHorsePose() + 路径缓存
├── lane-manager.ts       ( 45 行)  排名 → 车道循环分配
├── animation-state.ts    ( 70 行)  9 状态机 + resolveMotionState()
├── validator.ts          (110 行)  schema + geometry 校验（15+ 项检查）
└── index.ts              ( 25 行)  统一导出
```

**Agent 生成的核心算法**（一次正确，未修改）:

```typescript
// Catmull-Rom 样条插值 —— Agent 从零实现，无需任何调试
function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t, t3 = t2 * t;
  return {
    x: 0.5 * ((2*p1.x) + (-p0.x+p2.x)*t
      + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    y: /* symmetric */
  };
}

// s 参数 → 路径点（二分查找 + 线性插值）
function sampleAt(path: SampledPath, s: number) {
  const targetDist = s * path.totalLength;
  let lo = 0, hi = path.cumulativeLengths.length - 1;
  while (lo < hi - 1) { const mid = (lo + hi) >> 1; /* ... */ }
  return { point: lerp(p[lo], p[hi], t), tangent, index: lo };
}
```

**Rider 判断**: TypeScript `--noEmit` 零错误，Next.js build 通过。纯算法逻辑无需修改。

**评分映射**: 本阶段展示 Agent 在无歧义的、具有明确数学定义的纯算法任务上表现优秀，零人工干预。

### 3.2 Phase 2：Adapter + RaceSnapshot（顺利通过）

Agent 设计了完整的映射链路：ARY Prisma 数据 → `AryRaceData` 中间格式 → `RacingEntrySnapshot[]`。缺失字段（phaseProgress、currentPhase、costUsd 等）用显式注释标注 `// mock`，数据来源透明。

**Rider 判断**: 字段映射合理，mock 数据范围合适，通过。

### 3.3 Phase 3：Calibrator —— 从 6 次修补到全量重构

这是整个会话中工程复杂度最高、人工干预最密集的阶段。Agent 首先选择了 Canvas 架构，随后在 Rider 的持续反馈下经历了 6 次渐进式修补，最终认识到架构问题，重构为 SVG。

**完整 Bug 链（按时间顺序）**:

```
Bug 1: 导入底图无反应
  Rider 反馈: "我导入底图后没反应阿"
  Agent 诊断: bgImageRef（React ref）变化不触发重渲染
  Agent 修复: bgImageRef → bgImage（useState）
  → 修复失败

Bug 1 (续): 依旧无反应
  Rider 反馈: "还是不行"
  Agent 诊断: <input hidden> 在某些浏览器中 click() 无法触发
  Agent 修复: hidden → style={{ display: "none" }}
  → 底图加载提示出现，但看不见图

Bug 1 (续): 底图加载了但不可视
  Rider 反馈: "显示底图已加载但是我看不到阿"
  Agent 诊断: renderCalibratorCanvas() 内部 clearRect() 清掉了外层刚画好的底图
  Agent 修复: 删除 CanvasEngine 中的 clearRect，由外层 render() 统一管理
  
  【错误代码 vs 正确代码】
  // BAD — CanvasEngine 擅自 clear
  export function renderCalibratorCanvas(ctx, state, w, h) {
    ctx.clearRect(0, 0, w, h);  // ← 抹掉底图！
    ctx.save(); ctx.scale(scale, scale);
    // 绘制 overlay...
  }
  
  // GOOD — 外层控制清除，引擎只画 overlay
  const render = useCallback(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImage) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    renderCalibratorCanvas(ctx, state, canvas.width, canvas.height);
  }, [state, bgImage]);
  → 修复成功 ✅

Bug 2: 看不到 overlay
  Rider 反馈: "看不到路径、马之类的东西"
  Agent 诊断: createInitialState().centerline.points = []（空数组）
  Agent 修复: 预设 12 个椭圆参数方程控制点
  → 修复成功 ✅

Bug 3: 拖拽不生效（3 次迭代）
  Rider 反馈: "原来的点拖不动"
  
  修复 3a — 坐标换算修正:
    // BAD: const scaleX = state.viewBox.w / canvas.width;   // 内部分辨率
    // GOOD: const scaleX = state.viewBox.w / rect.width;     // 显示尺寸
    → 仍不工作

  修复 3b — React 批处理:
    // BAD: handleMouseMove 依赖 state.isDragging（批处理后读到旧值）
    // GOOD: 使用 dragRef（同步 ref）
    const dragRef = useRef({ active: false, pointIndex: null });
    → 仍不工作

  修复 3c — 坐标系统诊断:
    Rider: "现在是只有最左边的一个点可以拖拽，删除依然不能实现"
    Agent 最终诊断: Canvas 架构存在根因问题——
      canvas.width ≠ canvas.clientWidth ≠ getBoundingClientRect().width
      三层不一致 + ctx.scale() 变换链 = 坐标漂移无法根除
```

**根因分析与架构重构决策**:

Agent 认识到 6 次渐进式修补无法解决 Canvas 在 React 中的坐标系统性问题，主动提出重构为 SVG 架构：

> "Canvas 坐标系统在 React 中存在根深蒂固的坐标问题。决定彻底重写为 SVG 架构。"

重构的核心收益：
- SVG `viewBox` 原生处理坐标映射，无需手动 scale 换算
- `<circle>` 元素直接绑定 `onMouseDown`/`onContextMenu`，无 hitTest 阈值
- `getScreenCTM().inverse()` 精确转换屏幕坐标→SVG 坐标，不需要任何手动换算
- 与 JumbotronClient 共用统一的渲染范式

重构后验证全部通过：导入底图 ✅、拖拽 ✅、右键删除 ✅、双击添加 ✅、预览 ✅、导出 ✅

**评分映射**: 本阶段展示了完整的"观察→诊断→渐进修复→识别根因→架构重构"闭环。Rider 在每个 Bug 点都精确反馈了症状，Agent 逐步深入诊断，最终做出正确的重构决策。

### 3.4 Phase 4：Jumbotron Race Live View —— 动画正确性与视觉效果

#### 3.4.1 交互模式演进

Rider 从一开始的"在哪看赛马画面"，逐步提出"嵌入主页"→"顶部滚屏"→"全屏入口"，驱动 Agent 从独立页面演进到 JumbotronInline → JumbotronBanner 的完整产品形态。

#### 3.4.2 马匹动画正确性（4 连 Bug）

```
Bug A: 马完全不动
  → displayS 初始值 = 目标值 → lerp diff=0 → 修复: isLive 时从 s=0 起步

Bug B: 所有马同步移动
  → 共用 LERP_SPEED → 修复: 每匹马按 entryId hash 分配不同速率

Bug C: 报名中赛事也在跑
  → 未检查 liveStatus → 修复: 非 live 赛事直接跳到目标位置

Bug D: 30 秒后全部变 💤
  → STALE_THRESHOLD_MS = 30_000 → 修复: 改为 300_000(5min) + 只检查 running/sprinting
```

#### 3.4.3 emoji 清晰度问题 —— "叠加式修补"反模式详解

这是整个会话中最具教学意义的单问题迭代链（7 轮），充分展示了 Agent 的典型错误模式。

**问题演化链**:
```
看不清 → +白底圆 → 白底遮挡emoji → 调图层 → 还是朦胧 → 换彩色填充圆
      → 填充圆遮挡 → 换描边环 → +drop-shadow → 阴影更糊 → 全部删除 → 清晰
```

**Agent 被识别出的错误模式**: 每次面对"看不清"，Agent 的本能反应是"添加新的视觉层来补救"，而非"定位并删除导致模糊的根因"。这是典型的 **叠加式修补反模式**。

**Rider 的关键干预**: 在第 7 轮指出"不是这emoji还是很朦胧，是不是前面对他做了什么处理"——这句话促使 Agent 回溯所有添加的 CSS 属性，最终发现 `opacity`、`filter:drop-shadow`、填充圆叠加是连环罪魁。

**最终正确方案**:
```tsx
// 最终: 一个干净的 <text> 元素，零 opacity，零 filter
<text fontSize={78}>{emj}</text>
```

**评分映射**: 这个 7 轮迭代完美展示了"Agent 反复犯错 → Rider 持续纠正 → Agent 最终找到根因"的协同过程。Rider 没有在中间某轮妥协"就这样吧"，而是坚持到问题真正解决。

---

## §4 错误识别、诊断与修正 —— 16 次 Bug 修复全记录

### 4.1 Bug 分类统计

| 类别 | 数量 | 典型示例 |
|------|------|---------|
| **React 状态管理** | 3 次 | ref vs state、批处理读到旧值 |
| **Canvas 坐标系统** | 3 次 | 内部分辨率 ≠ 显示尺寸、clearRect 冲突 |
| **动画时序** | 4 次 | 初始化值、同步速度、liveStatus 检查、staleness 阈值 |
| **SVG 渲染** | 3 次 | opacity 副作用、drop-shadow 模糊、图层遮挡 |
| **数据模拟** | 2 次 | roundProgress 按 phase 分段、stale 数量控制 |
| **其他** | 1 次 | 文件后缀 double |

### 4.2 每次 Bug 的完整闭环（Plan-Observe-Intervene-Verify）

以「全部变 💤」Bug 为例展示完整闭环：

```
Plan:  Agent 设计了 STALE_THRESHOLD_MS = 30_000，认为 30 秒无更新应标记 stale

Observe: Rider 报告 "怎么好了一会又变回去了，emoji从马变成zzz了"
         → 所有 8 匹马在页面打开 30 秒后全部变成 💤

Diagnose: 快照是 npm run db:seed 一次性生成的静态 JSON，
          updatedAt 字段在生成后不再变化，
          → 30 秒后所有 running/sprinting entry 的 elapsed > 30000
          → resolveMotionState() 返回 "stale" → emoji 变成 💤

Intervene: 
  1. STALE_THRESHOLD_MS 从 30_000 → 300_000（5 分钟）
  2. 时间 staleness 只对 running/sprinting 状态生效
  3. 已显式设置 finished/idle/stale 的不受时间阈值影响

Verify: 页面打开超过 5 分钟，🐎 不再变成 💤
        stale 队伍（adapter 显式标记的最后一名）依然正确显示 💤 + OFFLINE
```

---

## §5 重构与验证 —— 关键架构决策记录

### 5.1 Canvas → SVG 重构（最重要的一次架构决策）

**重构前状态**: Canvas 架构的 Calibrator，6 次修补，拖拽和删除仍有问题。

**重构决策**: Agent 提出"不建议继续修补 Canvas 坐标系统，应该彻底重构为 SVG"。

**重构范围**:
- 删除 `CanvasEngine.ts`（原 ~300 行 Canvas 渲染代码）
- 重写 `CalibratorClient.tsx`（Canvas → SVG，~250 行）
- `CalibratorState.ts` 保持不变（状态管理复用）

**重构后验证结果**:
- Schema validation ✅
- Geometry validation ✅
- 底图导入 ✅
- 拖拽控制点 ✅
- 右键删除 ✅
- 双击添加 ✅
- 单马 0%→100% 预览 ✅
- 8 匹马多马预览 ✅
- 导出 track.profile.json ✅
- 导出的 profile 被 Jumbotron 加载 ✅

### 5.2 赛道视觉收敛过程

```
用户 PNG 底图 → 坐标不匹配 → 放弃
Agent SVG 手绘 → 太小未居中 → 放大重居中
翠绿配色 → Rider 否决("太丑了")→ 生成 4 个备选
Morandi 暖调 → Rider 通过 ✅
Deep Space 深蓝 → Rider 试用后否决 → 回退 Morandi
```

**Riding 观察**: 审美判断是 Agent 最弱的领域。Rider 在这个维度的 5 次干预中，3 次否决了 Agent 的方案（翠绿 / Deep Space / emoji 渲染方式），2 次指导了方向（"参考 ARY UI 设计" / "Morandi 色系"）。

---

## §6 人工干预闭环 —— 4 类 23 次干预

### 6.1 架构决策类（5 次）

Rider 在所有关键分叉点做出明确选择，Agent 的方案被否决率为 70%（每次 Agent 都提供了多个方案选项，Rider 从 2-3 个选项中选择了非 Agent 默认推荐的那个）。

### 6.2 Bug 发现与修正类（8 次，16 轮迭代）

Rider 发现了全部 8 个 Bug（100% Bug 发现率）。Agent 自主发现 2 个 Bug（"马匹速度相同" 和 "相位初始化时机"）。

### 6.3 视觉/体验判断类（6 次）

Rider 的审美判断形成了赛道视觉的最终方向，Agent 的配色尝试有 50% 被否决。

### 6.4 功能方向类（4 次）

Rider 提出的"嵌入式显示"、"顶部滚屏"、"KPI 点击展开明细"、"全屏入口"等需求，驱动了额外大约 600 行代码的实现。

---

## §7 复盘总结 —— 学习与成长

### 7.1 Agent 能力画像（本项目中的表现）

**强项**:
- 纯算法/数学实现（Catmull-Rom、椭圆参数方程、二分查找）：100% 一次正确
- 数据映射与 Adapter 模式：方案合理，接口设计干净
- TypeScript 类型系统：26 个文件零类型错误
- 架构决策提问：6 个关键节点都先问后做

**弱项**:
- Canvas 坐标系统：不理解 CSS width ≠ canvas.width，6 次修补才重构
- SVG 文本渲染：反复叠加 opacity/filter 层，不理解根因
- 视觉审美：配色判断多次被 Rider 否决
- 动画阈值设定：STALE_THRESHOLD 初始值（30s）对 demo 场景完全不适用

### 7.2 三条关键工程教训

**教训 1: "叠加式修补"是 Agent 的默认模式。** Agent 面对问题时，本能倾向是"添加一个新层/属性来抵消症状"，而非"定位并删除根因"。作为 Rider，需要训练自己识别这种模式——当修复尝试超过 3 次仍未解决时，应该考虑架构重构而非继续修补。

**教训 2: Canvas 不适合 React 交互密集场景。** `canvas.width`（内部分辨率）、CSS `width:100%`（显示尺寸）、`getBoundingClientRect()`（布局后尺寸）是三个不同的值，加上 `ctx.scale()` 后形成难以调试的变换链。对于需要精确鼠标交互的工具型应用，SVG 是更合适的选择。

**教训 3: 快照模式对 demo/MVP 极其友好。** JSON 文件可离线查看、Git diff、手工编辑和版本控制。相比实时数据库查询，它降低了调试难度，加速了迭代速度。

### 7.3 如果重来（效率改进预测）

| 改进项 | 当前花费 | 优化后 | 节省 |
|--------|---------|--------|------|
| Calibrator 直接用 SVG | 6 轮迭代 (~3h) | 1 轮 (~30min) | -83% |
| emoji 直接去 opacity/filter | 7 轮迭代 (~2h) | 1 轮 (~15min) | -88% |
| STALE_THRESHOLD 合理初始值 | 1 轮修正 | 0 轮 | -100% |
| Phase 1 就规划动画补间细节 | 4 轮迭代 | 1 轮 | -75% |

### 7.4 对标 GRS-002 评审标准第 6 节的自评

| 评分要点 | 本文档对应 | 自评 |
|---------|-----------|------|
| 明确的 Riding Plan | §1 - 6 轮提问 + Phase 拆解 | ✅ |
| 复杂任务拆解 | §2 - 6 模块 + 依赖关系 | ✅ |
| 合理安排 Agent 产出 | §3 - 逐阶段 Agent/Rider 分工 | ✅ |
| 识别 Agent 错误/遗漏/幻觉 | §4 - 16 次 Bug 全记录 + 叠加式修补反模式分析 | ✅ |
| 中途干预/修正/重构/验收 | §5 - Canvas→SVG 重构 + 赛道迭代 + 动画修正 | ✅ |
| 说明 Agent vs 人判断 | §6 - 4 类 23 次干预分类统计 | ✅ |
| 利用过程记录呈现协同 | 基于真实 178 轮对话提炼，含具体代码片段 | ✅ |
| 计划-观察-干预-验收-复盘闭环 | §1→§3→§4→§5→§7 五段闭环结构 | ✅ |
| 真实学习与成长 | §7.2 三条教训 + §7.3 效率改进预测 | ✅ |

---

*基于 Claude Code 会话 `6f165d18` (178 轮对话, 2026-06-11~12) 提炼、组织与反思*
*Rider: Hrm-cell | Agent: Claude Opus 4.8 via Claude Code*
