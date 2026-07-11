# GRS004 / Organizer Runner Compatibility Copy Demotion Design

## 目的

本设计直接承接：

- `docs/grs004/grs003-gap-analysis.md`
  - `评分模式迁移 | 🔶`
  - `Runner API 废除 | 🔶`
- `docs/grs004/ary-mvp.prd.md`
  - Organizer 应发布 `Award / Leaderboard`
- 当前页面现状
  - Organizer `judging` section 仍把 Runner 按钮写成：
    - `Process Evaluation`
    - `运行过程评估`
    - `运行 Harness 评估`
  - `awards` section 仍把兼容产物写成：
    - `Published Skill Signals`

这会继续把兼容 Runner 链路伪装成主流程。当前主流程已经是：

- Judge 提交 `JudgingRecord`
- Organizer 发布 `Award / Leaderboard`

本轮目标是：**不改兼容功能是否存在，只把 Organizer 页面对 Runner 的表达降级成“兼容工具”。**

## 范围

### 本轮纳入

- Organizer `judging` section
  - `Process Evaluation` 改成中文兼容工具定位
  - 增加说明：正式榜单发布应基于 `Award / Leaderboard`
- Organizer `awards` section
  - `Published Skill Signals` 改成兼容命名
  - 空状态改成中文

### 本轮不纳入

- 不删除 `publishLeaderboardAction`
- 不删除 `publishShowcaseAction`
- 不删除 `/api/runner/tasks/*`
- 不新增正式 Award 发布服务

## 约束

1. 只做“文案与定位降级”，不在本轮扩大到完整结果发布重构。
2. 兼容 Runner 按钮仍可保留，但不能继续伪装为主裁决路径。

## 方案

### 方案 A：明确标成兼容链路

做法：

- `judging` section
  - Panel title -> `兼容 Runner 工具`
  - eyebrow -> `兼容链路`
  - 说明文案明确：
    - 正式榜单发布应基于 `Award / Leaderboard`
    - 以下按钮只保留给兼容 Runner 评估链路
- `awards` section
  - `Published Skill Signals` -> `兼容 Skill Signals`
  - 空状态中文化

### 推荐方案

采用方案 A。

## 用户可见变化

本轮落地后，Organizer 看到的是：

1. Runner 按钮仍在，但会被明确标成兼容工具
2. 页面不会再暗示 Runner 评估是正式榜单发布主路径
3. 奖项页里的 skill-signal 区域也会明确是兼容产物

## 测试对齐

需要覆盖：

- `src/app/_components/console/organizer-console-page.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 一句话结论

这轮补的是 Organizer 页面上对 Runner 的“定位降级”，不是功能删除。
