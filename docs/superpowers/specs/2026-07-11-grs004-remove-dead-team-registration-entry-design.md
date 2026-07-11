# GRS004 / Remove Dead Team Registration Entry Design

## 目的

本设计直接承接：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - MVP 只支持个人参赛，不支持 Team
- `docs/grs004/grs003-gap-analysis.md`
  - `Team 实体删除` 仍未完全完成
- 当前代码现状
  - `registerTeamAction()` / `registerTeam()` / `registerTeamSchema` 仍残留
  - 但仓库里没有任何页面或真实用户路径再调用这套入口

当前显式缺口：

- 虽然用户界面已经按 Registration-first 运作，但代码里仍保留一套“骑手主动创建队伍报名”的死入口
- 这与 `docs/grs004` 的个人参赛基线直接冲突

## 范围

### 本轮纳入

- 删除 `registerTeamAction()`
- 删除 `registerTeam()`
- 删除 `registerTeamSchema`
- 修正依赖 `registerTeamAction` 作为源码切片边界的测试

### 本轮不纳入

- 不删除内部 compatibility `Team` 模型
- 不迁移 `RunnerTask / TeamArchive / LeaderboardEntry / HarnessEntry`
- 不重写 legacy compatibility 子系统

## 落地规则

- 用户产品面继续只保留 `registerForRace()` 这条正式报名路径
- compatibility `Team` 只允许作为内部兼容容器存在，不再暴露独立报名入口
- 删除动作后，不应影响：
  - 报名审核流
  - Rider 提交链路
  - `qa:p0`

## 测试对齐

- 更新：
  - `src/app/actions.registration-review-system-scope.test.ts`
  - `src/app/actions.race-archive-system-scope.test.ts`
- 回归：
  - `src/app/_components/console/rider-console-page.test.tsx`
  - `src/lib/services/submissions-work-materialization.test.ts`

验证命令：

```bash
node --test-concurrency=1 --import tsx --test src/app/actions.registration-review-system-scope.test.ts src/app/actions.race-archive-system-scope.test.ts src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions-work-materialization.test.ts
```

## 一句话结论

这一轮先删除已经无页面引用的 Team 报名死入口，让“个人参赛、不支持 Team”不只是产品口径，也体现在代码入口上。
