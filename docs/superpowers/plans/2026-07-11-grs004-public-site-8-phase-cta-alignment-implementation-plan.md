# GRS004 / Public Site 8-Phase CTA Alignment Implementation Plan

## 实施步骤

- [x] 核对 `race-phase.ts` 与 `public-site.ts` 的 phase 语义偏差
- [x] 补设计文档
- [x] 更新 `src/lib/public-site.ts` 的 live race 判定、phase 分组和 CTA 规则
- [x] 更新首页和赛事列表页，统一复用 `getRacePrimaryCta()`
- [x] 更新 `src/lib/public-site.test.ts`
- [x] 新增 `src/app/_components/public/public-phase-cta-regression.test.tsx`
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`
- [x] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/public-site.test.ts src/app/_components/public/public-phase-cta-regression.test.tsx
npm run build
```

## 本轮结果

- 公开站首页和赛事列表页已不再只识别 legacy `active / finished`
- `running / submitting / judging / completed / archived` 的 CTA 现在都有明确公开入口
- phase 分组和页面按钮已收口到同一套 helper 逻辑
