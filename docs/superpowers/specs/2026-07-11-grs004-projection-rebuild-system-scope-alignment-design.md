# GRS004 / Projection Rebuild System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.9 Projection`
    - `rebuild`
    - Organizer: `managed race`
    - Admin: `system`
  - `4. 测试要求`
    - Organizer 只能管理自己负责的 Race 及其相关资源
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Projection Rebuild Flow`
    - 将过程数据转换为大屏和实时展示可读数据
  - `Internal Data Maintenance`
    - 手动重算属于 organizer/admin 的内部维护职责

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `rebuildProcessModelsAction()` 当前还是 `requireRole("ORGANIZER")`
  - Admin/system 无法进入
  - 也没有按 `raceId` 校验当前 Organizer 是否真的管理该赛事
- `src/lib/services/evidence.ts`
  - `rebuildSessionSummaryEvidenceForRace(raceId)` 只接收 `raceId`
- `src/lib/services/projections.ts`
  - `rebuildRaceProcessProjections(raceId)` 只接收 `raceId`

这意味着当前不仅没有对齐 `managed race | system`，还存在“任意 Organizer 只要知道 `raceId` 就能重算别人的赛事 Projection / Evidence”的边界缺口。

## 范围

### 本轮纳入

- 对齐 `Projection.rebuild` 的 server action 准入
- 补一个最小的 managed-race helper，复用到：
  - `rebuildProcessModelsAction()`
  - `updateRaceTrackCalibration()`
- 补最小测试覆盖：
  - action wiring 不再是 Organizer-only
  - foreign organizer 不能借 `allowSystem` 越权
  - admin/system 可以跨赛事执行同类 managed-race 动作

### 本轮不纳入

- 不改 `rebuildSessionSummaryEvidenceForRace()` / `rebuildRaceProcessProjections()` 的 service 签名
- 不重构 Projection 读取模型
- 不顺手扩到 `generateRaceSnapshotAction()`、兼容 Runner eval 或 CA Connection 其他 action

## 约束

### 文档约束

- Projection 是过程展示数据，可以重建，但不是最终事实源
- `rebuild` 权限是 `managed race | system`
- 手动重算属于 organizer/admin 的内部维护职责

### 当前实现约束

- Projection/Evidence rebuild helper 目前有多条非 Console 调用链复用
- 本轮优先在 action 边界收口，避免把 service 签名扩散到所有调用点
- 已有 managed-race 动作广泛使用 `allowSystem?: boolean` 语义

因此本轮应遵循：

1. **先在 action 入口完成 scope 收口**
2. **抽最小 helper 复用现有 managed-race 判定**
3. **不扩大到 Projection service 全面重构**

## 方案选择

### 方案 A：在 action 前增加 managed-race helper，并允许 Admin/system 进入

做法：

- `rebuildProcessModelsAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- 在真正执行 rebuild 前先校验：
  - 当前用户是否是该 Race 的 organizer
  - 或者当前用户是否真的是 admin 且以 `allowSystem` 进入
- helper 复用到 `updateRaceTrackCalibration()`，避免继续保留“传 `allowSystem: true` 即可绕过”的弱边界

优点：

- 直接修复当前越权入口
- 不改 Projection/Evidence rebuild service 签名
- 顺手把现有一个同类 managed-race helper 提升到“真 admin 才能走 system”

缺点：

- 需要多一次用户角色读取

### 方案 B：只把 action 改成 `ADMIN | ORGANIZER`

优点：

- 改动最少

缺点：

- foreign organizer 仍可凭 `raceId` 重算别人的赛事
- `allowSystem` 语义仍停留在“调用者自报为 system 即放行”

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可重算自己负责赛事的 Projection / Evidence
2. 非本赛事 Organizer 即使知道 `raceId`，也不能再跨赛事手动重算
3. Admin 可以按 system scope 执行同样的重算动作

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.projection-rebuild-scope.test.ts`
  - `rebuildProcessModelsAction()` 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - 调用 rebuild 前已走 managed-race helper
- 扩展 `src/lib/services/race-track-calibration.test.ts`
  - foreign organizer 即使传 `allowSystem: true` 也会被拒绝
  - admin/system 可以跨赛事保存校准

验证命令：

```bash
node --import tsx --test src/app/actions.projection-rebuild-scope.test.ts src/lib/services/race-track-calibration.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Projection.rebuild` 已对齐 `managed race | system`
2. foreign organizer 无法跨赛事重算 Projection
3. Admin/system 可以重算 Projection
4. 既有 managed-race helper 不再只靠裸 `allowSystem` 绕过
5. 聚焦测试通过

## 一句话结论

这一轮要修的是 `Projection.rebuild` 的真实入口边界：不能只限制“有 organizer 角色”，还必须限制“是不是这场比赛的 organizer”，同时保留 Admin 的 system scope。
