# GRS004 / Race Publish System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.1 Race`
    - `publish`
    - Organizer: `managed race`
    - Admin: `system`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Race Status`
    - `draft、published、registration、running、submitting、judging、completed、archived`
  - `Race Lifecycle`
    - `draft -> published -> registration -> running -> submitting -> judging -> completed -> archived`
  - `Race Publishing Flow`
    - 创建、编辑、发布、撤回或归档赛事
- `docs/grs004/ary-mvp.ia.md`
  - `Race | draft | 不进入 Public Site；Organizer 可编辑`
  - `Race | published / registration | Race Page 公开；报名 CTA 优先`

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - 没有 `publishRaceAction()`
- `src/lib/services/races.ts`
  - 没有 `publishRace()`，`createRace()` 也没有默认进入 `draft`
- `src/lib/services/public-routes.ts`
  - 当前会把所有 Race 都读到公开端
- `src/lib/race-phase.ts`
  - 当前 `status` 一旦存在就直接返回，不会让 `published` 随时间进入 `registration / running / completed`

这意味着当前 `Race.publish` 不只是权限没对齐，而是生命周期动作本身缺失，且 `draft` 也没有真正从公开端隔离。

## 范围

### 本轮纳入

- `createRace()` 默认创建 `draft`
- 新增 `publishRaceAction()` / `publishRace()`
- `draft` 不进入公开端
- `published` 进入公开端，并按时间自动推进为：
  - `registration`
  - `running`
  - `completed`
- 主办方设置页增加最小发布入口

### 本轮不纳入

- 不实现完整的手动 `registration / running / judging / completed` 控制台推进器
- 不新增“撤回发布”动作
- 不重做完整 8 状态调度系统

## 约束

### 文档约束

- draft 不进入 Public Site
- published / registration 进入公开赛事页
- publish 权限是 `managed race | system`

### 当前实现约束

- 已有 `Race.status` 字段
- 已有 `getRacePhase()` 与 `isValidPhaseTransition()`
- 现有大量逻辑仍依赖时间窗口推导 phase

因此本轮应遵循：

1. **保留时间驱动的自动推进**
2. **只把 `draft` 与“已发布后进入公开端”补起来**
3. **publish 只负责 `draft -> published` 这一跳**

## 方案选择

### 方案 A：create 默认 draft，publish 把 draft 推到 published，phase 再按时间自动推进

做法：

- `createRace()` 写入 `status = "draft"`
- `publishRace()` 仅允许 `draft -> published`
- `getRacePhase()` 对以下状态做混合推导：
  - `draft` 直接返回 draft
  - `archived / submitting / judging / completed` 直接返回
  - `published / registration / running / null` 按时间窗口自动映射
- `listPublicRaces()` 过滤掉 phase = `draft`

优点：

- 与文档最贴近
- 不需要一次性实现完整手动状态机
- 不会让新建赛事在未发布前泄露到公开端

缺点：

- 需要同步更新 public CTA 语义

### 方案 B：只补 publish action，不改 create 默认状态与 public 可见性

优点：

- 改动小

缺点：

- draft 仍会出现在公开端
- publish 语义仍然不成立

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. 新创建赛事默认是 draft，不会直接出现在公开端
2. Organizer / Admin 可在设置页正式发布赛事
3. 发布后赛事进入公开页；未到报名时间时显示为 published，报名开始后自动进入 registration

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.race-publish-system-scope.test.ts`
  - `publishRaceAction()` 已按 `ADMIN | ORGANIZER`
- 新增 `src/lib/services/race-publish-scope.test.ts`
  - organizer 成功
  - foreign organizer 拒绝
  - admin/system 成功
  - publish 后 status 为 `published`
  - create 后默认 status 为 `draft`
- 扩展 `src/lib/services/public-routes.test.ts`
  - draft race 不进入公开路由
- 扩展 `src/lib/public-site.test.ts`
  - published phase 的 CTA 和分组符合公开语义

验证命令：

```bash
node --import tsx --test src/app/actions.race-publish-system-scope.test.ts src/lib/services/race-publish-scope.test.ts src/lib/services/public-routes.test.ts src/lib/public-site.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Race.publish` 已按 `managed race | system` 工作
2. 新创建赛事默认是 `draft`
3. `draft` 不进入公开端
4. 发布后赛事进入公开端并按时间自动推进
5. 聚焦测试通过

## 一句话结论

这一轮要修的是 `Race.publish` 的真实生命周期闭环：不仅要补发布权限，还要把 `draft` 从公开端隔离，并把“发布后自动进入公开阶段”这条链路补完整。
