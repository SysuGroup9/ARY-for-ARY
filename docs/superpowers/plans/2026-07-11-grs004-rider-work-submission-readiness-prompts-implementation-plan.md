# GRS004 / Rider Work Submission Readiness Prompts Implementation Plan

## 实施步骤

- [x] 补设计文档
- [x] 在 Rider submission section 接入现有 readiness helper
- [x] 补 Rider submission 风险提示回归测试
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --test-concurrency=1 --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/lib/review-readiness-helpers.test.ts
npm run build
```

## 本轮结果

- Rider 在 `Work Submission` 里现在能看到证据缺口和接入异常提示
- 风险提示不会阻断草稿保存或正式提交
