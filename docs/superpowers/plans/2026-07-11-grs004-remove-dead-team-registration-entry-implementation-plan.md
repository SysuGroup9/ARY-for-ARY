# GRS004 / Remove Dead Team Registration Entry Implementation Plan

## 实施步骤

✅ 补设计文档
✅ 删除 `registerTeamAction / registerTeam / registerTeamSchema`
✅ 更新依赖旧 action 边界的测试
✅ 跑聚焦验证
✅ 跑 `npm run qa:p0`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
node --test-concurrency=1 --import tsx --test src/app/actions.registration-review-system-scope.test.ts src/app/actions.race-archive-system-scope.test.ts src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions-work-materialization.test.ts
npm run qa:p0
```

## 本轮结果

- 个人参赛正式入口只剩 Registration-first 路径
- 旧 Team 报名入口不再残留在 actions / service / validation 层
