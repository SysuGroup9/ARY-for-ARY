# GRS004 / Legacy Team Comment And Feedback System Scope Alignment Implementation Plan

## 目标

把 `updateTeamCommentAction()` / `replyFeedbackAction()` 及其 service，从当前的 Organizer-only，对齐到兼容层应遵守的 `managed race | system`。

## 任务拆分

### Task 1: 先补测试

- [ ] 新增 `src/app/actions.legacy-compatibility-system-scope.test.ts`
- [ ] 新增 `src/lib/services/legacy-compatibility-scope.test.ts`
- [ ] 覆盖：
  - 两条 action 不再只锁 `ORGANIZER`
  - foreign organizer 不能借 `allowSystem` 越权
  - admin/system 可以跨赛事写入

### Task 2: 对齐 action 与 service

- [ ] 修改 `src/app/actions.ts`
- [ ] 修改 `src/lib/services/teams.ts`
- [ ] 修改 `src/lib/services/feedback.ts`
- [ ] 两条 action 改为 `ADMIN | ORGANIZER`
- [ ] service 统一补 `allowSystem?: boolean`

### Task 3: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.legacy-compatibility-system-scope.test.ts src/lib/services/legacy-compatibility-scope.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.legacy-compatibility-system-scope.test.ts src/lib/services/legacy-compatibility-scope.test.ts
```

## 完成标准

- 两条兼容 action 已允许 `ADMIN | ORGANIZER`
- TeamComment / FeedbackReply 已按 `managed race | system` 工作
- foreign organizer 不再能跨赛事写入
- admin/system 可以写入
- 聚焦测试和构建通过
