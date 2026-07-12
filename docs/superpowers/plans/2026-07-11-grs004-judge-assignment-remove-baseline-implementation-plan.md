# GRS004 / JudgeAssignment Remove Baseline Implementation Plan

## 实施步骤

✅ 补设计文档
✅ 更新 `src/lib/services/judging.ts`
✅ 更新 `src/app/actions.ts`
✅ 更新 Organizer judges UI
✅ 补 action/service/UI 测试
✅ 跑聚焦验证
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.judge-assignment-remove-scope.test.ts src/lib/services/judging-assignment-scope.test.ts src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 本轮结果

- `JudgeAssignment.remove` 已具备 service / action / Organizer UI 最小闭环
- Organizer/Admin 现在可以正式移除评委分配
- 聚焦测试与构建已通过
