# GRS004 / Race Snapshot System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-qa-plan.md`
  - 大屏测试与 fallback 场景
- `docs/grs004/ary-release-ops-plan.md`
  - 赛时值守、Projection 最近一次稳定版本、赛后归档
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - Screen Display Flow
  - Projection Rebuild Flow
- `docs/grs004/ary-permission-matrix.md`
  - `4. 测试要求`
    - Projection 重建、Report 生成、大屏 fallback 等内部维护动作只能由 Organizer 管理赛事范围或 Admin 系统范围执行

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `generateRaceSnapshotAction()` 当前还是 `requireRole("ORGANIZER")`
  - 也没有按 `raceId` 校验当前 Organizer 是否真的管理该赛事

虽然权限矩阵没有单独列出 `snapshot` 动作，但基于文档可直接推出：

- 快照生成属于大屏 / fallback / 赛时维护链路
- 因此它应遵守与 Projection rebuild、Screen fallback 同一层级的 `managed race | system` 约束

## 范围

### 本轮纳入

- 对齐 `generateRaceSnapshotAction()` 的 `ADMIN | ORGANIZER` 准入
- 在 action 执行前增加 managed-race helper 校验
- 补最小 action/source 测试

### 本轮不纳入

- 不改 `generateRaceSnapshot()` service 签名
- 不重构 snapshot 文件格式
- 不顺手扩到兼容 Runner eval 动作

## 约束

### 文档约束

- 大屏 / fallback 属于内部维护动作
- 内部维护动作应由 Organizer 管理赛事范围或 Admin 系统范围执行

### 当前实现约束

- 已有 `assertManagedRaceActionAccess()`
- 快照 service 被设计成按 raceId 直接生成，不适合在本轮扩散签名

因此本轮应遵循：

1. **只在 action 边界收口**
2. **复用现有 managed-race helper**
3. **不扩大到 snapshot service 重构**

## 方案选择

### 方案 A：在 action 前补 `ADMIN | ORGANIZER` 与 managed-race helper

做法：

- `generateRaceSnapshotAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- 先走 `assertManagedRaceActionAccess()`
- 再调用 `generateRaceSnapshot(raceId)`

优点：

- 改动最小
- 与最近几轮的 scope 收口模式一致

缺点：

- service 本身仍是裸 `raceId`

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可为自己赛事生成大屏快照
2. 非本赛事 Organizer 即使知道 `raceId`，也不能再跨赛事生成快照
3. Admin 可以按 system scope 执行同类维护动作

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.race-snapshot-system-scope.test.ts`
  - `generateRaceSnapshotAction()` 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - 调用前已执行 `assertManagedRaceActionAccess()`

验证命令：

```bash
node --import tsx --test src/app/actions.race-snapshot-system-scope.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. 快照生成动作已按内部维护动作的 `managed race | system` 工作
2. foreign organizer 无法跨赛事生成快照
3. admin/system 可以执行快照生成
4. 聚焦测试通过

## 一句话结论

这一轮要修的是大屏快照生成的入口边界：它虽然没有在矩阵里单列，但按文档语义属于内部维护动作，应与 Projection rebuild 和 Screen fallback 同样遵守 `managed race | system`。
