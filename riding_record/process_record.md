# GRS 002 Jumbotron 子系统 — 过程记录

> 记录 Jumbotron 子系统与 Calibrator 工具从任务拆解到最终验收的完整开发过程。
> 时间范围：2026-06-10 至 2026-06-12

---

## 1. 任务背景与初始目标

GRS 002 评审要求新增 Jumbotron 可视化子系统，主要评分项：
- Jumbotron 大屏实时展示赛马状态
- Calibrator 赛道校准工具（20 分 + 硬性入场门槛）
- 数据模型正确性（进度 vs 质量严格分离）
- 代码工程质量（TypeScript 编译通过、ESLint 无错误）

**Riding Plan（初始）：**

| 子任务 | 负责方 | 预计工作量 |
|--------|--------|-----------|
| TrackRuntime 引擎（Catmull-Rom + 弧长参数化） | Agent | 高 |
| TrackProfile JSON 资产（椭圆 + 方形） | Agent + 人工校准 | 中 |
| Adapter（DB rows → RaceSnapshot） | Agent | 中 |
| Jumbotron SVG 渲染（race-live-view.tsx） | Agent | 高 |
| Calibrator UI（calibrator-ui.tsx） | Agent | 高 |
| 赛道参数（trackDirection/trackStartFinishS） | Agent | 低 |
| Prisma 迁移 | Agent | 低 |
| 视觉设计（底图、配色、护栏） | 人工决策 + Agent 实现 | 中 |
| README / 文档 | Agent | 中 |
| 验收测试 | 人工 | 高 |

---

## 2. 阶段一：TrackRuntime + 基础渲染（Iteration 4）

**目标：** 搭建能驱动马匹移动的最小可行大屏。

**Agent 完成的内容：**
- `Jumbotron/track-runtime.ts`：完整 Catmull-Rom 样条实现，含弧长参数化（500 采样点）
- `Jumbotron/types.ts`：TrackProfile、RaceSnapshot、HorsePose 等核心接口
- `Jumbotron/adapter.ts`：DB 数据 → RaceSnapshot 适配，包括 deriveStatus / deriveRisk 推导
- `Jumbotron/tracks/track.profile.json`（v1）：12 控制点椭圆，但尺寸偏大
- `src/app/jumbotron/page.tsx`：Server Component，查询 4 个数据源
- `src/app/jumbotron/race-live-view.tsx`（v1）：初版深色科幻风格渲染

**人工决策点：**
- 确认三维数据模型（进度/质量/风险严格独立）不由 Agent 自行决定
- 明确 laneHalfWidth=75、vehicle offset 公式 `−halfWidth + 2×halfWidth/(N+1) × (i+1)`
- 指定演示种子数据（8 支队伍，各具特色的进度/风险状态）

**发现的问题：**
1. 初版渲染为深色科幻主题（深蓝/绿色渐变天空、赛道为荧光绿），与实际赛马场风格不符
2. 赛道控制点过大（左右各距画面边缘仅 320 px），视觉上赛道压到了看台区域

---

## 3. 阶段二：视觉改版（Iteration 6 前期）

**触发原因：** 用户提供了真实赛场底图（`public/jumbotron底图.jpg`），要求改为写实赛马风格。

**人工干预：**
- 提供底图文件，明确配色方向：土黄色赛道（`#c4924a`）、绿色内场、白色护栏
- 报告赛道有"裂缝"问题，要求修复

**Agent 实现：**
- 诊断裂缝根因：两层 fill 叠加时抗锯齿边界产生 1 px 间隙
- 采用 SVG `<mask>` 方案彻底解决（单次绘制，无间隙）
- 实现底图 + 晕影 + 土黄色赛道环 + 绿色内场 + 白色护栏 + 琥珀检查点

**交付物：**
- `race-live-view.tsx`（v3）：完全匹配设计的视觉效果

---

## 4. 阶段三：Calibrator 工具（Iteration 6 后期）

**目标：** 实现 `/jumbotron/calibrator` 独立赛道编辑工具。

**任务拆解（Agent 执行）：**

| 组件 | 实现细节 |
|------|----------|
| SVG 画布交互 | 鼠标点击/拖拽/双击，基于 SVG viewBox 坐标变换 |
| 控制点状态管理 | React useState，实时驱动 TrackRuntime 重建 |
| TrackRuntime 集成 | 直接复用 `Jumbotron/track-runtime.ts`，证明共享引擎 |
| 导出功能 | 完整 TrackProfile JSON + 仅控制点 JSON |
| 验证逻辑 | 点数、弧长、ID 非空、车道数检查 |
| 视觉预览 | 实时渲染赛道、车道、检查点、起终点、马匹 |

**人工干预：**
- 发现 Calibrator 椭圆预设与 Jumbotron 展示的赛道形状不一致（Agent 使用了不同的控制点数组）
- 发现操作面板字号过小（11–12 px）
- 发现 Calibrator 视觉风格与 Jumbotron 不统一（使用了深绿色而非土黄色）

**纠偏过程：**（详见人工干预记录）

---

## 5. 阶段四：赛道参数扩展

**新增字段：**
- `Race.trackDirection`（顺时针/逆时针）
- `Race.trackStartFinishS`（起/终点 S 值）

**过程：**
1. Prisma schema 新增字段
2. 运行 `npx prisma migrate dev`（SQLite 两列需分开 ALTER TABLE）
3. Zod validation 新增验证规则
4. 服务层读写
5. 创建比赛表单新增控件
6. Jumbotron `buildProfile()` 接收新参数
7. 运行 `npx prisma generate` 修复 TypeScript 类型错误

---

## 6. 阶段五：最终验收

**验收清单：**

| 项目 | 结果 |
|------|------|
| TypeScript `--noEmit` | ✅ 零错误 |
| ESLint | ✅ 无 error |
| Jumbotron 大屏可访问 | ✅ `/jumbotron?raceId=race_jumbotron_demo` |
| 马匹随进度移动 | ✅ 8 支队伍位置各异 |
| 排名变化显示 | ✅ 30s 刷新后对比快照 |
| 风险光环 / 违规徽章 | ✅ ZetaForce 显示红色违规 |
| Calibrator 可访问 | ✅ `/jumbotron/calibrator` |
| 椭圆与大屏一致 | ✅ 修复后控制点完全一致 |
| 字号可读 | ✅ 改为 13–15 px |
| 视觉风格统一 | ✅ 土黄色赛道 + 底图 + 白色护栏 |
| 赛道不压看台 | ✅ 0.80× 缩放后边距各 ~450 px |

---

## 7. 时间线

| 日期 | 里程碑 |
|------|--------|
| 2026-06-10 | TrackRuntime + 基础赛道渲染 PoC |
| 2026-06-10 | 种子数据 + 8 队演示场景 |
| 2026-06-11 | 方形赛道 + 计时器可读性 |
| 2026-06-12 上午 | 赛道参数扩展 + Prisma 迁移 |
| 2026-06-12 下午 | 底图导入 + 视觉改版 + 裂缝修复 |
| 2026-06-12 晚 | Calibrator 实现 |
| 2026-06-12 晚 | Calibrator 问题修复（控制点/字号/视觉）|
| 2026-06-12 晚 | 赛道缩放 + 文档整理 |
