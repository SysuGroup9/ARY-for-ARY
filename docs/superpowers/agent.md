# Jumbotron Agent Guide

本文是后续 Agent 在处理 Jumbotron 子系统相关任务时的默认入口文档。

## 适用范围

当任务涉及以下任一内容时，先读本文：

- Jumbotron / Race Live View
- Track Profile Calibrator
- track-runtime
- RaceSnapshot / Jumbotron Adapter
- GRS-002 相关文档同步
- `docs/superpowers` 下 Jumbotron 专用文档维护

## 必读顺序

开始任何 Jumbotron 任务前，按以下顺序阅读：

1. `docs/grs002/Jumbotron信息架构.md`
2. `docs/grs002/Jumbotron子系统定义.md`
3. `docs/grs002/Jumbotron-PRD.md`
4. `docs/superpowers/specs/2026-06-18-jumbotron-context-spec.md`
5. `docs/superpowers/status.md`

不要只从代码或旧 commit 反推 Jumbotron 的产品边界。

## 后续 Agent 的工作基线

后续 Agent 必须默认接受以下事实：

- Jumbotron 是公开大屏容器，不是完整 Session 查看器。
- Jumbotron 子系统由运行时 `Jumbotron / Race Live View`、设计时 `Track Profile Calibrator`、共享 `track-runtime` 三部分组成。
- 赛马位置必须由进度与赛道几何推导，而不是手写 `x / y`。
- Calibrator 预览必须复用 `track-runtime`，不能维护第二套独立几何逻辑。
- 当前实现是 ARY 内部 PoC 集成，而不是独立 DevCompass 平台产品。
- 当前快照链路是 `ARY DB → Adapter → RaceSnapshot JSON → track-runtime → JumbotronClient`。

## 禁止误述

后续 Agent 不得直接声称以下内容，除非代码和文档都已经同步验证：

- “Jumbotron 展示真实企业侧实时流数据”
- “Jumbotron 已接入独立 DCR 平台”
- “所有展示字段都来自真实评测源”
- “Calibrator 与运行时完全生产就绪”
- “Jumbotron 已具备多大屏模式或完整屏幕编排系统”

必须明确区分：

- 信息架构目标
- 子系统定义
- 当前 PRD/作品说明
- 当前仓库真实实现

## 文档维护规则

这是本目录的默认维护纪律。后续 Agent 完成 Jumbotron 相关任务后，必须检查是否需要同步以下文件：

### 更新 `spec`

当以下内容变化时，更新 `docs/superpowers/specs/2026-06-18-jumbotron-context-spec.md`：

- Jumbotron 的子系统边界变化
- 运行时 / 设计时模块职责变化
- 数据链路变化
- 展示边界变化
- 源文档 `Jumbotron信息架构.md`、`Jumbotron子系统定义.md`、`Jumbotron-PRD.md` 的关键定义变化

### 更新 `status.md`

当以下内容变化时，更新 `docs/superpowers/status.md`：

- 当前实现状态变化
- 新增真实能力或移除 mock 能力
- 发现新的 PoC 边界或实现偏差
- 已知风险关闭或新增
- 近期下一步发生变化

### 更新 `agent.md`

当以下内容变化时，更新本文：

- 阅读顺序变化
- 维护纪律变化
- 明确新增禁止误述项
- `docs/superpowers` 的文档分工变化

## 默认收尾动作

每次完成 Jumbotron 相关任务时，默认做这 3 件事：

1. 检查 `docs/grs002` 是否已经与当前实现保持一致
2. 检查 `docs/superpowers/status.md` 是否需要反映新的真实状态
3. 检查 `docs/superpowers/specs/2026-06-18-jumbotron-context-spec.md` 是否需要吸收新的结构性变化

如果没有变化，也要明确判断“不需要同步”。
