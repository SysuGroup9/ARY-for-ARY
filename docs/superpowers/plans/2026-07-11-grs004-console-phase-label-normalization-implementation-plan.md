# GRS004 / Console Phase Label Normalization Implementation Plan

## 实施步骤

✅ 定位 console 中仍直接显示 raw phase 的剩余点
✅ 补设计文档
✅ Organizer console 接入 `getRacePhaseLabel()`
✅ Rider console 接入 `getRacePhaseLabel()`
✅ Screen console 接入 `getRacePhaseLabel()`
✅ 在 Rider submission / Screen selected-race header 补显式阶段文案
✅ 更新 focused regression tests
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/screen-console-controls.test.tsx
npm run build
```

## 本轮结果

- Organizer / Rider / Screen Console 不再直接显示 raw phase key
- console 内部阶段表达已和 public / screen 展示端收口到同一套中文标签
