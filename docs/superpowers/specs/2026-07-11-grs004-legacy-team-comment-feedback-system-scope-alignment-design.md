# GRS004 / Legacy Team Comment And Feedback System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `4. 测试要求`
    - Organizer 只能管理自己负责的 Race 及其相关资源
- `docs/grs004/grs003-gap-analysis.md`
  - 当前 schema 仍保留：
    - `FeedbackThread`
    - `FeedbackMessage`
    - `TeamComment`
  - `Team` 兼容层仍未完全删除
- 当前实现中的 UI / 文案：
  - `Organizer Console -> 报告 -> 团队评语`
  - Rider / Organizer 间的 legacy feedback thread

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `updateTeamCommentAction()` 仍是纯 `requireRole("ORGANIZER")`
  - `replyFeedbackAction()` 仍是纯 `requireRole("ORGANIZER")`
- `src/lib/services/teams.ts`
  - `updateTeamComment()` 只接受当前 race.organizerId
- `src/lib/services/feedback.ts`
  - `replyFeedback()` 只接受当前 race.organizerId

这些对象在 `grs004` 正式领域模型里都不是一等核心资源动作，但它们都已经真实存在于仓库和 UI 中。因此本轮不重新建模它们，而是先把它们收口到与 race 绑定的一致权限边界：`managed race | system`。

## 范围

### 本轮纳入

- `updateTeamCommentAction()` / `updateTeamComment()`
- `replyFeedbackAction()` / `replyFeedback()`
- 文档中明确标注这两条是 `legacy compatibility path`
- 补最小测试覆盖：
  - foreign organizer 即使传 `allowSystem` 也不能越权
  - admin/system 可以跨赛事执行

### 本轮不纳入

- 不把 `TeamComment` 重命名成新的正式领域对象
- 不重构 `FeedbackThread` 为新的工单 / discussion 模型
- 不扩到 rider feedback send path

## 约束

### 文档约束

- Organizer 只能管理自己负责的 Race 及其相关资源
- Admin 可执行必要系统异常处理

### 当前实现约束

- `TeamComment` 与 `FeedbackThread` 都真实绑定到具体 race
- 这两条链路仍是兼容层，不应在本轮扩张产品语义

因此本轮应遵循：

1. **明确它们是兼容层**
2. **权限边界按 race 归属统一收口**
3. **不借机扩大兼容模型职责**

## 方案选择

### 方案 A：按兼容层处理，但统一补 `managed race | system`

做法：

- 两条 action 全部改为：
  - `loadDatabaseUser()`
  - `ADMIN | ORGANIZER`
  - 传 `allowSystem`
- `updateTeamComment()` 复用 `assertManagedRaceActionAccess()`
- `replyFeedback()` 先读 thread，再基于 `thread.raceId` 复用 `assertManagedRaceActionAccess()`

优点：

- 与最近几轮的 scope 收口模式一致
- 不必重做兼容层建模

缺点：

- 只能解决边界，不解决兼容层长期保留的问题

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可管理自己赛事下的团队评语和反馈回复
2. 非本赛事 Organizer 即使知道 raceId / threadId，也不能再跨赛事写入
3. Admin 可以按 system scope 执行同类兼容维护动作

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.legacy-compatibility-system-scope.test.ts`
  - 两条 action 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - service 调用已传 `allowSystem`
- 新增 `src/lib/services/legacy-compatibility-scope.test.ts`
  - team comment：foreign organizer 拒绝，admin 成功
  - feedback reply：foreign organizer 拒绝，admin 成功

验证命令：

```bash
node --import tsx --test src/app/actions.legacy-compatibility-system-scope.test.ts src/lib/services/legacy-compatibility-scope.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. 这两条兼容路径已按 `managed race | system` 工作
2. foreign organizer 无法跨赛事写入
3. admin/system 可以写入
4. 聚焦测试通过

## 一句话结论

这一轮要修的是两条仍然存在于仓库里的兼容写路径：不重新发明新的正式领域对象，先把它们按 race 归属统一收口到 `managed race | system`。
