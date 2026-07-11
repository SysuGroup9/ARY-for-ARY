# GRS004 / DEV-6 Screen Console Calibration Integration Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `Theme / Calibration`
    - `Fallback Control`
    - `Fullscreen Output`
  - `核心任务`
    - `配置大屏主题`
    - `完成现场屏幕校准`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Console`
    - `Race 选择`
    - `Display Mode`
    - `预览`
    - `全屏输出`
    - `fallback`
  - `Screen Console 是控制面，Screen Display 是展示输出面`

当前代码已经有：

- `/console/screen/{raceSlug}/calibration`
- `/calibrator`
- `CalibratorClient`
- `ScreenDisplay` 的 `theme / fallback / public href`

但当前 `calibration` 模式仍只是：

- Screen Console 的占位说明
- 一个跳到 `/calibrator` 的链接

这与 IA 中已经明确写出的 `Theme / Calibration` 和 `完成现场屏幕校准` 不够一致。

## 范围

### 本轮纳入

- 让 `Screen Console / calibration` 直接承载校准工作区
- 复用现有 `CalibratorClient`
- 保留现有独立 `/calibrator` 路由

### 本轮不纳入

- 不新建新的校准数据模型
- 不把校准结果持久化到 `ScreenDisplay`
- 不重写 `CalibratorState`
- 不顺手扩展到 `Jumbotron / Billboard` 高级配置

## 当前缺口

### 1. 现有 calibration 模式仍是占位路由

当前 `screen-console-page.tsx` 里：

- `calibration` 仍显示“后续再完全并入大屏控制台”
- 用户仍需跳出当前上下文去 `/calibrator`

这说明 `Screen Console` 还没有真正把 `Calibration` 纳入控制面。

### 2. 现有校准器已经存在，但没有接进 Screen Console

仓库里已经有：

- `src/app/calibrator/page.tsx`
- `src/app/calibrator/CalibratorClient.tsx`

因此当前问题不是“缺少校准器”，而是“已有校准器没有进入 Screen Console 的工作流”。

## 方案选择

### 方案 A：继续保持占位文案 + 外链

优点：

- 不需要改动校准器

缺点：

- 与文档里 `Theme / Calibration` 的控制面要求不一致
- `calibration` 模式仍只是空壳

### 方案 B：把现有 `CalibratorClient` 直接嵌入 `calibration` 模式

优点：

- 最贴近文档要求
- 不需要发明新事实层
- 可以保留 `/calibrator` 作为独立入口

缺点：

- 需要给现有校准器补一个可嵌入布局

### 推荐方案

采用 **方案 B：把现有 `CalibratorClient` 直接嵌入 `Screen Console / calibration` 模式**。

## 页面结构

### 保留已有 Screen Console 状态卡

- 当前 `ScreenDisplay`
- 当前 Theme
- 当前 Fallback
- 当前公开播放入口

### 在 calibration 模式下新增校准工作区

- `校准工作区`
- 直接渲染现有 `CalibratorClient`
- 保留：
  - 导入底图
  - 导入 Profile
  - 校验
  - 导出当前 Profile
  - 路径 / 车道 / 检查点 / 起终点预览

### 输出目标

- 继续保留：
  - 打开大屏
  - 打开独立校准器
  - 打开公开赛事页

## 运行时规则

- `calibration` 仍然是 Screen Console 的控制面，不进入 public display
- 现有 `ScreenDisplay.mode` 不新增 `calibration`
- `calibration` 继续视为对当前大屏输出的辅助控制，而不是新的展示模式

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `/console/screen/{raceSlug}/calibration`
   - 不再只是占位说明
2. 页面中会直接出现校准工作区
3. 用户可以在 Screen Console 里直接完成底图导入、路径校验和 Profile 导出

## 测试对齐

需要覆盖：

- `src/app/_components/console/screen-console-controls.test.tsx`
  - `校准工作区`
  - `导入底图`
  - `导出当前 Profile`
  - 不再出现“后续再完全并入大屏控制台”

## 验收对齐

本轮完成后，需要能证明：

1. `calibration` 模式已不再只是占位文案
2. 现有校准器已进入 Screen Console 工作流
3. 没有新增新的校准事实模型或持久化层

## 一句话结论

这一刀要解决的不是“有没有校准器”，而是：既然 `Screen Console` 文档里已经明确有 `Theme / Calibration`，那 `calibration` 模式就不能继续只是跳转链接，至少要先把现有校准器真正接进来。
