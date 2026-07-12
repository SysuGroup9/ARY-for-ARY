# GRS004 / Review Readiness Card Localization Implementation Plan

## 实施步骤

✅ 确认 `ReviewReadinessCard` 是当前 Organizer / Rider / Judge 共用的风险提示组件
✅ 补设计文档
✅ 新增组件级 regression test
✅ 收口卡片标签、状态、CA 接入状态和严重度到中文显示
✅ 更新 Judge / Organizer focused tests
✅ 回归 Rider focused tests
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/console/review-readiness-card.test.tsx src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/rider-console-page.test.tsx
npm run build
```

## 本轮结果

- Organizer / Rider / Judge 共用的评审前风险提示卡已完全中文化
- 风险判定逻辑不变，只收口用户可见表达
