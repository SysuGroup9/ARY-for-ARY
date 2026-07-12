# GRS004 / Works Display Copy Localization Implementation Plan

## 实施步骤

✅ 从 `docs/grs004` 核对 `Works Display` 的目标口径
✅ 识别 `works-display.tsx` 中的用户可见英文残留
✅ 补设计文档
✅ 收口页面标签 `Works / Showcase`
✅ 收口精选标签 `Featured Work`
✅ 收口 `aria-label` 文案 `Works filter and sort`
✅ 更新 `src/app/_components/public/works-display.test.tsx`
✅ 回归 `src/app/_components/public/public-phase-label-regression.test.tsx`
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/public/works-display.test.tsx src/app/_components/public/public-phase-label-regression.test.tsx
npm run build
```

## 本轮结果

- `Works Display` 不再混用 `Works / Showcase` 和 `Featured Work`
- 作品展示大屏与前面已经完成的公共 / 大屏中文化方向保持一致
- 本轮没有改变任何展示逻辑或数据规则
