# GRS004 / JudgeAssignment Remove Baseline Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.6 JudgeAssignment`
    - `create`: Organizer `managed race`, Admin `system`
    - `update`: Organizer `managed race`, Admin `system`
    - `remove`: Organizer `managed race`, Admin `system`

当前代码已经覆盖：

- `assignJudgeToWorkAction()`
- `assignJudgeToWork()`

也就是 `create / update` 共享一条 upsert 路径。

但显式缺口仍然存在：

- 没有 `removeJudgeAssignmentAction()`
- `src/lib/services/judging.ts` 没有 remove service
- Organizer `judges` 页面只有“保存分配”，没有移除入口

## 范围

### 本轮纳入

- 新增 `removeJudgeAssignment()` service
- 新增 `removeJudgeAssignmentAction()`
- Organizer judges section 出现最小移除入口
- 补 service scope test / action wiring test / UI test

### 本轮不纳入

- 不重做 Judge View
- 不改评分模型
- 不扩审计模型

## 方案

- 复用 `assignJudgeToWork()` 当前的 managed race | system 边界模式
- `removeJudgeAssignment()` 按 `assignmentId` 删除
- 由于 schema 中 `JudgingRecord.judgeAssignmentId` 对 `JudgeAssignment` 是 `onDelete: Cascade`
  - 删除 assignment 时，其绑定 judging record 会同步删除
  - 本轮不额外增加保护门槛，保持 schema 当前事实

## 测试对齐

- 新增 `src/app/actions.judge-assignment-remove-scope.test.ts`
- 扩展 `src/lib/services/judging-assignment-scope.test.ts`
- 扩展 `src/app/_components/console/organizer-console-page.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/actions.judge-assignment-remove-scope.test.ts src/lib/services/judging-assignment-scope.test.ts src/app/_components/console/organizer-console-page.test.tsx
```

## 一句话结论

这一轮不是改评审模型，而是把 `JudgeAssignment.remove` 这个权限矩阵里明确存在、但当前代码还缺的动作补齐。
