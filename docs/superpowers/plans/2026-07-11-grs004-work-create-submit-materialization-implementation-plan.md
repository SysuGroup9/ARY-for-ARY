# GRS004 / Work Create Submit Materialization Implementation Plan

## 实施步骤

- [x] 补设计文档
- [x] 为 Work draft / submit 增加 validation schema
- [x] 在 `src/lib/services/works.ts` 新增 Rider draft 保存与 Work asset upsert helper
- [x] 在 `src/lib/services/submissions.ts` 接入 `Submission -> Work` 物化
- [x] 在 `src/app/actions.ts` 新增 `saveWorkDraftAction()`，并补 rider submit revalidate
- [x] 更新 Rider submission forms
- [x] 更新 Rider submission page 的当前作品资产视图
- [x] 补 action / service / UI / submission integrity tests
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --test-concurrency=1 --import tsx --test src/lib/services/submissions-work-materialization.test.ts src/app/actions.work-create-submit-scope.test.ts src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions.test.ts src/lib/services/material-integrity-submissions.test.ts
npm run build
```

## 本轮结果

- Rider 现在可以先保存 `Work draft`
- Rider 正式提交代码时会同步物化 `Work`
- `LOCKED` work 不再允许被后续提交覆盖
- Rider submission 页现在能看到当前作品资产，并直接隐藏自己的草稿
