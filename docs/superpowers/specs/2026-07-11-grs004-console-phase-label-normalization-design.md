# GRS004 / Console Phase Label Normalization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console 必须清晰展示当前 Race 和当前 Display Mode`
  - `Organizer Overview`、`Rider View` 等 console 视图都属于用户可直接操作的工作台
- `docs/grs004/ux-hifi.taskbook.md`
  - Console 应稳定、清晰、可操作
- 当前代码现状
  - 上一轮已把 public / screen 公开展示端的 phase key 收口为中文标签
  - 但 `OrganizerConsolePageView`、`RiderConsolePageView`、`ScreenConsolePageView` 仍有几处直接显示 `race.phase`

当前显式缺口：

- Organizer overview / settings 仍可能显示 `active / running / judging`
- Rider riding / submission 视图仍可能显示 raw phase
- Screen Console 赛事选择卡片和已选赛事页仍可能显示 raw phase

这会导致同一个系统里，公开端已经显示中文阶段，而 console 内部还在裸露内部枚举值，体验割裂。

## 范围

### 本轮纳入

- `OrganizerConsolePageView`
  - overview
  - settings
- `RiderConsolePageView`
  - riding
  - submission
- `ScreenConsolePageView`
  - race selection list
  - selected race header

### 本轮不纳入

- 不做 console 全量 copy 重写
- 不改 phase 状态机
- 不扩展新的 phase label

## 落地规则

### 统一规则

- console 内部对用户可见的阶段文本统一走 `getRacePhaseLabel()`
- 不再直接输出：
  - `active`
  - `running`
  - `judging`
  - `archived`
  - 其他 raw phase key

### Organizer Console

- `赛事概览` 的 `阶段`
- `赛事发布` 的 `当前阶段`
都显示正式中文标签

### Rider Console

- `骑行状态` 的 `阶段`
- `作品提交` 顶部增加 `当前阶段`

### Screen Console

- 未选赛事时，赛事选择卡片显示中文阶段
- 已选赛事时，顶部说明区补 `当前阶段`

## 测试对齐

- 更新：
  - `src/app/_components/console/organizer-console-page.test.tsx`
  - `src/app/_components/console/rider-console-page.test.tsx`
  - `src/app/_components/console/screen-console-controls.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/screen-console-controls.test.tsx
npm run build
```

## 一句话结论

这一轮把上一轮的 public / screen phase 中文化继续推进到了 console 内部，让 organizer / rider / screen 三类工作台对当前阶段的表达保持一致。
