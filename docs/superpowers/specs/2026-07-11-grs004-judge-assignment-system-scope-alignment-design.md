# GRS004 / Judge Assignment System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.6 JudgeAssignment`
    - `create / update / remove`
    - Organizer: `managed race`
    - Admin: `system`
  - `4. 测试要求`
    - Organizer 只能管理自己负责的 Race 及其相关资源
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `JudgeAssignment`
    - 连接拥有 judge role 的 User 与 Work
  - `4.4 MVP 领域不变量`
    - `JudgeAssignment.assignedByUserId` 记录分配动作的操作者
    - 分配人应拥有 organizer 或 admin role

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `assignJudgeToWorkAction()` 当前还是 `requireRole("ORGANIZER")`
  - Admin/system 无法进入
- `src/lib/services/judging.ts`
  - `assignJudgeToWork()` 当前只是直接 `upsert`
  - 没有验证：
    - `assignedByUserId` 是否真有 organizer/admin 角色
    - 当前 Organizer 是否真的是这场比赛的 organizer
    - Admin/system 是否可跨赛事执行

这意味着当前不仅没有对齐 `managed race | system`，还存在“任意 Organizer 只要知道 workId 就能给别人的赛事分配 Judge”的边界缺口。

## 范围

### 本轮纳入

- 对齐 `JudgeAssignment.create/update` 的 server action 准入
- 对齐 `assignJudgeToWork()` 的 `managed race | system` scope
- 给 service 增加最小 assigner role 校验
- 补最小测试覆盖：
  - race organizer 成功
  - foreign organizer 拒绝
  - admin/system 成功
  - action wiring 不再是 Organizer-only

### 本轮不纳入

- 不新增 `JudgeAssignment.remove`
- 不重构 Judge Console 或 Organizer Console UI
- 不扩到 `JudgingRecord` 私有读取或公开展示

## 约束

### 文档约束

- Organizer 只能管理 `managed race`
- Admin 具有 `system` 范围
- `assignedByUserId` 应保留真实操作者
- 分配人应拥有 organizer 或 admin role

### 当前实现约束

- 现有 `ScreenDisplay`、`Award / Report / Announcement` 已使用 `allowSystem?: boolean` 语义
- 本轮优先复用同样的 service scope 表达

因此本轮应遵循：

1. **沿用 `allowSystem?: boolean`**
2. **只补 action 与 service 边界**
3. **不顺手扩 UI 或 read model**

## 方案选择

### 方案 A：在 `assignJudgeToWork()` 内补 scope 和 actor role 校验

做法：

- `assignJudgeToWorkAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- `assignJudgeToWork()` 输入新增：
  - `allowSystem?: boolean`
- service 内先读取：
  - `work -> registration -> race`
  - `assignedByUser.rolesJson`
- 校验：
  - assigner 必须有 `ORGANIZER` 或 `ADMIN`
  - 若不是当前 race organizer，则必须 `allowSystem=true`

优点：

- 直接修在真实边界上
- 与既有 `allowSystem` 模式一致
- 可以同时覆盖 create 与 upsert update

缺点：

- 多一次用户读取

### 方案 B：只改 action，不改 service

优点：

- 改动更小

缺点：

- 不能阻止 service 被其他调用点绕过
- 仍然不满足 domain analysis 对 `assignedByUserId` 角色约束

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. 正常 Organizer 使用评审分配表单不会有倒退
2. 非本赛事 Organizer 即使知道 `workId`，也不能再跨赛事分配 Judge
3. Admin 可以按 system scope 执行同样的分配动作

## 测试对齐

需要覆盖：

- 新增 `src/lib/services/judging-assignment-scope.test.ts`
  - race organizer 成功
  - foreign organizer 拒绝
  - admin/system 成功
- 新增 `src/app/actions.judge-assignment-scope.test.ts`
  - `assignJudgeToWorkAction()` 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - service 调用已传 `allowSystem`

验证命令：

```bash
node --import tsx --test src/app/actions.judge-assignment-scope.test.ts src/lib/services/judging-assignment-scope.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `JudgeAssignment.create/update` 已对齐 `managed race | system`
2. foreign organizer 无法跨赛事分配 Judge
3. Admin/system 可以分配 Judge
4. `assignedByUserId` 仍记录真实操作者
5. 聚焦测试通过

## 一句话结论

这一轮要修的是 `JudgeAssignment` 的真实写入边界：当前不能只限制“有 organizer 角色”，还必须限制“是不是这场比赛的 organizer”，同时保留 Admin 的 system 范围入口。
