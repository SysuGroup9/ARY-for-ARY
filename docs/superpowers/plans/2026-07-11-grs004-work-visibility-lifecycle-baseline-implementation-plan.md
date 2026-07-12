# GRS004 / Work Visibility Lifecycle Baseline Implementation Plan

## 实施步骤

✅ 补设计文档
✅ 更新 `src/lib/services/works.ts`
✅ 更新 `src/app/actions.ts`
✅ 更新 `src/lib/services/public-routes.ts`
✅ 更新 Organizer works UI
✅ 补 service / action / public route / UI tests
✅ 跑聚焦验证
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --test-concurrency=1 --import tsx --test src/app/actions.work-visibility-lifecycle-scope.test.ts src/lib/services/work-visibility-lifecycle-scope.test.ts src/lib/services/public-routes.test.ts src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 本轮结果

- Work 已具备 `publish / hide / lock` 最小 lifecycle 动作
- Public routes 现在只暴露真正公开作品
- Organizer works section 已出现最小公开/隐藏/锁定控制
