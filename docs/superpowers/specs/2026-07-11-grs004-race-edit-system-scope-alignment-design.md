# GRS004 / Race Edit System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.1 Race`
    - `edit`
    - Organizer: `managed race`
    - Admin: `system`
  - `4. 测试要求`
    - Organizer 只能管理自己负责的 Race 及其相关资源

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `updateRaceAction()`
  - `updateOrganizerCommentAction()`
  - `updateDisplayOptionsAction()`
  - 以上 3 个 action 当前都还是纯 `requireRole("ORGANIZER")`
- `src/lib/services/races.ts`
  - `updateRaceContent()`
  - `updateOrganizerComment()`
  - `updateRaceDisplayOptions()`
  - 当前都只接受“`race.organizerId === organizerId`”

这意味着 `Race.edit` 仍未对齐文档要求的 `managed race | system`。

## 范围

### 本轮纳入

- 对齐 `Race.edit` 对应的 3 个 action：
  - `updateRaceAction()`
  - `updateOrganizerCommentAction()`
  - `updateDisplayOptionsAction()`
- 对齐对应 service 的 `managed race | system`
- 补最小测试覆盖：
  - action wiring 不再是 Organizer-only
  - foreign organizer 即使传 `allowSystem` 也不能越权
  - admin/system 可以跨赛事执行同类编辑

### 本轮不纳入

- 不改 `createRaceAction()` 的 create 语义
- 不改 `clearRaceAction()` 的 destructive 语义
- 不扩到赛道校准、ScreenDisplay 或 Runner 兼容动作

## 约束

### 文档约束

- Organizer 只能编辑自己负责的 Race
- Admin 具有 `system` 范围

### 当前实现约束

- `src/lib/services/races.ts` 已有 `assertManagedRaceActionAccess()`
- `updateRaceContent()` 仍需保留“比赛结束后不能再修改题目与训练数据”的现有业务规则

因此本轮应遵循：

1. **复用现有 `assertManagedRaceActionAccess()`**
2. **只补 action 与 service scope**
3. **不改变 finished race 的现有编辑禁令**

## 方案选择

### 方案 A：action 和 service 同时补 `ADMIN | ORGANIZER` + `allowSystem`

做法：

- 3 个 action 全部改为 `ADMIN | ORGANIZER`
- 3 个 service 输入新增：
  - `allowSystem?: boolean`
- service 内统一复用 `assertManagedRaceActionAccess()`

优点：

- 与最近几轮的 scope 收口模式一致
- 可直接复用已有 helper
- foreign organizer 不能靠裸 `allowSystem` 越权

缺点：

- 需要补一组新的 action/source 测试和 service 测试

### 方案 B：只改 action

优点：

- 改动小

缺点：

- service 仍可能被其他调用点绕过

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可编辑自己负责赛事的题目内容、主办方备注和公开展示选项
2. 非本赛事 Organizer 即使知道 `raceId`，也不能再跨赛事修改这些字段
3. Admin 可以按 system scope 执行同类编辑

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.race-edit-system-scope.test.ts`
  - 3 个 action 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - service 调用已传 `allowSystem`
- 新增 `src/lib/services/race-edit-scope.test.ts`
  - foreign organizer 即使传 `allowSystem: true` 也会被拒绝
  - admin/system 可跨赛事修改 race content / organizer comment / display options

验证命令：

```bash
node --import tsx --test src/app/actions.race-edit-system-scope.test.ts src/lib/services/race-edit-scope.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Race.edit` 已对齐 `managed race | system`
2. foreign organizer 无法跨赛事修改 race 内容
3. admin/system 可以执行同类编辑
4. 聚焦测试通过

## 一句话结论

这一轮要修的是 `Race.edit` 的真实写边界：当前不能只允许“本赛事 organizer”，还必须保留 Admin 的 system 范围，同时继续阻止 foreign organizer 越权。
