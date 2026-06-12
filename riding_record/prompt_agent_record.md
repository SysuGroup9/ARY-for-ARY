# GRS 002 — Prompt / Agent 操作记录

> 记录主要 Prompt 指令、Agent 任务分配与产出内容。
> 格式：用户指令 → Agent 理解 → 具体产出 → 质量评估

---

## 任务分配原则

本次开发遵循以下分工：

| 类别 | 由谁决定 |
|------|----------|
| 产品需求（做什么、做到什么程度） | 人 |
| 数据模型设计（三维分离原则） | 人 |
| 视觉风格（配色、底图选择） | 人 |
| 接口契约（TrackProfile 格式） | 人 + Agent 草稿 |
| 代码实现（算法、组件、样式） | Agent |
| 文档撰写（README、PRD、注释） | Agent（人工审校）|
| 错误诊断与修复 | Agent（人工验证）|

---

## Prompt 操作记录

### P-01：Jumbotron 子系统初始构建

**用户指令摘要：**
> "视频我最后会录，现在着重弄 Calibrator，并要可以展示，你把之前的底图找出然后导入放到目录下，起点/终点或方向也是企业创建比赛时可选择的功能之一，并在完成以后更新plan和ROADMAP里的文档，还要配置lane offsets"

**Agent 理解：**
- 实现 Calibrator 工具页面
- 找到并导入赛场底图
- 新增 trackDirection / trackStartFinishS 字段（Prisma + 表单 + 展示）
- 配置 lane offset 逻辑
- 更新文档

**Agent 产出：**
- `src/app/jumbotron/calibrator/page.tsx` — 页面入口（Server Component wrapper）
- `src/app/jumbotron/calibrator/calibrator-ui.tsx` — 完整 Calibrator Client Component（~420 行）
- `src/app/jumbotron/calibrator/calibrator.module.css` — 样式模块（~260 行）
- `prisma/migrations/20260612000000_add_track_direction/migration.sql`
- Prisma schema 更新
- `validation.ts` / `services/races.ts` 更新
- `ary-shared.tsx` 表单扩展
- `race-live-view.tsx` 接收新参数

**质量评估：**
- 代码逻辑正确，TypeScript 编译通过
- 初版视觉风格未与 Jumbotron 统一（深绿色）
- 控制点数组与大屏使用的 JSON 文件不一致（独立硬编码）
- 字号过小（11–12 px）

---

### P-02：底图导入与视觉改版

**用户指令摘要：**
> "是Jumbotron主大屏的赛道外观要改，我已经把底图放进去了[提供截图]，绿色草坪上可以加土黄色赛道，然后你原来椭圆型的怎么甚至都有裂缝"

**Agent 理解：**
- 使用用户提供的 `public/jumbotron底图.jpg` 为背景
- 赛道颜色改为土黄色 `#c4924a`
- 调查并修复赛道裂缝

**Agent 产出（关键代码片段）：**

裂缝根因分析：
```
问题：两层 fill 叠加（outerD fill + innerD fill 遮盖）
     抗锯齿处产生 1px 间隙

解决：SVG <mask>（单次绘制）
<mask id="m">
  <path d={outerD} fill="white" />  ← 允许绘制
  <path d={innerD} fill="black" />  ← 抠洞
</mask>
<rect fill="#c4924a" mask="url(#m)" />
```

**质量评估：**
- 裂缝完全消除
- 视觉风格达到设计预期
- SVG mask 方案工程上比 evenodd fill 更鲁棒

---

### P-03：Calibrator 问题修复

**用户指令摘要：**
> "你这Calibrator赛道校准工具怎么和我Jumbotron展示的好像不是同一个示例，而且操作部分的字都太小了"

**Agent 理解：**
- Calibrator 预设控制点需与 `track.profile.json` 完全一致
- 所有控制面板字号增大

**诊断过程（Agent 执行）：**
```bash
node -e "const t=require('./Jumbotron/tracks/track.profile.json'); console.log(JSON.stringify(t.centerline.points))"
# 输出：[[1600,540],[1514,395],[1280,289],[960,250],[640,289],[406,395],
#         [320,540],[406,685],[640,791],[960,830],[1280,791],[1514,685]]
```

发现 Calibrator 中的 OVAL_POINTS 为：
```typescript
// 错误的（平直两侧）
[1600, 540], [1600, 400], [1420, 280], ...  // 右侧 x 重复 1600
```

**Agent 修复：**
- 同步 OVAL_POINTS、RECT_POINTS 至 JSON 文件
- calibrator.module.css 全量字号提升（10–12px → 11–15px）
- SVG 视觉改为与 Jumbotron 一致风格（土黄色 + mask + 白色护栏）

---

### P-04：文档生成

**用户指令摘要：**
> "你要修改README文档告诉我和评审现在怎么使用以及回应本次任务的要求啊"

**Agent 产出：**
- README.md 全面重写（GRS 002 演示指南 + Calibrator 使用说明 + 账号表）
- PRD.md 追加第 10 章（GRS 002 扩展）
- POC.md 新建（作品说明文档）
- ROADMAP.md 追加 Iteration 6 节

---

### P-05：赛道缩放

**用户指令摘要：**
> "默认赛道缩小点，现在椭圆和方形赛道都冲上看台了"

**Agent 分析：**
- 当前椭圆：左右各距画面边缘 320 px，加上 laneHalfWidth 75 px，外侧护栏实际在 245 px 处
- 看台区域约从 x=0 到 x≈350 / x≈1570 到 x=1920
- 结论：需要整体内缩

**Agent 执行：**
```
中心锚点：(960, 540)
缩放系数：0.80

椭圆新尺寸：1024 × 464 px（原 1280 × 580）
方形新尺寸：992 × 464 px（原 1240 × 580）
左右边距：各 448–464 px（原 320–340 px）
```

同步更新三处：
1. `Jumbotron/tracks/track.profile.json`
2. `Jumbotron/tracks/rect.profile.json`
3. `calibrator-ui.tsx` OVAL_POINTS / RECT_POINTS

---

## Agent 能力边界观察

| 能力 | 表现 |
|------|------|
| 复杂算法实现（样条、弧长参数化） | 强：一次性正确实现 TrackRuntime |
| 多文件联动修改 | 强：Prisma → validation → service → form → component 链式修改无遗漏 |
| 自我一致性（预设数据） | 弱：Calibrator 控制点与 JSON 文件不一致，需人工发现 |
| 视觉判断 | 弱：初版使用深色科幻风格，需人工提供参考图才能正确实现 |
| 尺寸感知（像素是否压到看台） | 弱：无法主动判断 320 px 边距是否合适，需人工指出 |
| 代码可读性 | 中：逻辑正确但 CSS 字号偏小，需明确要求才能调整 |
