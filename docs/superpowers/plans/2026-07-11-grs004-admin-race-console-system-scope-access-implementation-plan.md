# GRS004 / Admin Race Console System Scope Access Implementation Plan

## 实施步骤

✅ 补设计文档
✅ 更新 console access helpers
✅ 更新 race list query 让 Admin 获得 organizer route 入口
✅ 调整 race console 空状态文案
✅ 补 Admin race console scope tests
✅ 跑聚焦验证
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --test-concurrency=1 --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts
npm run build
```

## 本轮结果

- Admin 现在可以进入 `赛事控制台`
- Admin 现在可以进入任意 race 的 organizer route，作为 system scope 入口
- `/console` 默认落点仍保持 `Admin Console`
