# GRS004 / DEV-6 Screen Console Preview + Fullscreen Output Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `Display Control`
    - `Fullscreen Output`
  - `Screen Console 必须清晰展示当前 Race 和当前 Display Mode`
  - `Screen Console | 当前 Race、当前 Display Mode | Jumbotron、Billboard、Live、Leaderboard、Works、Announcement | Theme、Calibration、Fallback | 全屏展示 / 切换模式`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Console`
    - `Race 选择`
    - `Display Mode`
    - `预览`
    - `全屏输出`
    - `fallback`
  - `Screen Console 是控制面，Screen Display 是展示输出面`

当前代码已经有：

- `当前 ScreenDisplay`
- `当前公开播放入口`
- `切到模式 / Theme / fallback`
- `jumbotron` 专用 inline preview

但当前缺口是：

- 非 `jumbotron` 模式没有真正的当前输出预览
- `Fullscreen Output` 没有被明确表达成当前输出的一键动作

## 范围

### 本轮纳入

- 在 `Screen Console` 中明确新增：
  - `全屏展示当前输出`
  - `当前输出预览`
- 对非 `jumbotron` 模式使用 iframe 预览当前输出
- 保留 `jumbotron` 现有 inline preview / static fallback 逻辑

### 本轮不纳入

- 不重写各 mode display 本身
- 不新增浏览器 fullscreen API
- 不把控制按钮放到观众大屏上

## 当前缺口

### 1. 文档要求有 preview，但当前只有 jumbotron 真正可预览

`Screen Console` 文档里已经明确有：

- 预览
- Fullscreen Output

当前实现里：

- `jumbotron` 有 inline preview
- 其他模式只有链接，没有预览

### 2. Fullscreen Output 语义还不够明确

当前页面虽然有：

- `打开当前 Screen Display`

但没有明显收口为“当前输出的一键全屏展示”。

## 方案选择

### 方案 A：继续只保留链接

优点：

- 无需改动

缺点：

- 不满足文档里的 `预览`
- `Fullscreen Output` 语义仍然弱

### 方案 B：保留 jumbotron inline preview，其他模式用 iframe 预览

优点：

- 最贴近当前实现结构
- 不重复渲染各 display 组件
- 真正把 preview 补齐

缺点：

- iframe 预览是浏览器层预览，不是 SSR 内联组件级预览

### 推荐方案

采用 **方案 B：保留 jumbotron inline preview，其他模式用 iframe 预览**。

## 页面结构

### 当前 ScreenDisplay 状态卡

- 继续显示：
  - 当前模式
  - 当前 Theme
  - 当前 Fallback
  - 当前公开播放入口
- 主要动作按钮改为：
  - `全屏展示当前输出`

### 输出目标面板

- 保留：
  - 打开大屏
  - 打开独立校准器
  - 打开公开赛事页
- 新增：
  - `当前输出预览`

### 预览规则

- `mode === "jumbotron"`
  - 继续使用现有：
    - `JumbotronInline`
    - `StaticDisplayFallback`
- 其他模式
  - 使用 `<iframe src={currentPublicHref}>`

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. Screen Console 里有明确的 `全屏展示当前输出`
2. 非 jumbotron 模式也能直接看到当前输出预览
3. 当前 Race / 当前 Display Mode / 预览 / 全屏输出之间的关系更清楚

## 测试对齐

需要覆盖：

- `src/app/_components/console/screen-console-controls.test.tsx`
  - `全屏展示当前输出`
  - 非 jumbotron 模式出现 iframe 预览
- `src/app/_components/console/console-copy.test.tsx`
  - 中文文案同步

## 验收对齐

本轮完成后，需要能证明：

1. Screen Console 已具备 preview + fullscreen output
2. 控制面和展示面仍然分离
3. 非 jumbotron 模式不再只有跳转链接

## 一句话结论

这一刀要解决的不是“还有没有按钮”，而是：既然文档已经明确写了 `预览 + Fullscreen Output`，那 `Screen Console` 就不能只有模式链接，必须让当前输出可预览、可一键全屏。
