# GRS004 / Organizer CA Status Copy Localization Implementation Plan

## 实施步骤

✅ 从 `docs/grs004` 核对 Organizer View / CA Ingestion Status 的目标口径
✅ 识别 `organizer-console-page.tsx` 中 `ca-status` 区的英文残留
✅ 补设计文档
✅ 为信任 / 风险摘要卡补状态、接入状态、风险等级和原因的中文映射
✅ 为连接器控制卡补标签和握手/禁用状态中文映射
✅ 为连接器审计摘要卡补标签和审计结果中文映射
✅ 同步更新 `src/app/_components/console/organizer-console-page.test.tsx`
✅ 回归 `judge-console-page.test.tsx` 与 `review-readiness-card.test.tsx`
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/review-readiness-card.test.tsx
npm run build
```

## 本轮结果

- Organizer 的 `CA 状态` 区不再混用英文调试词
- 风险表达、连接器控制和审计摘要与前面已经完成的 console 中文化方向保持一致
- 本轮没有改变任何权限、接入或审计逻辑
