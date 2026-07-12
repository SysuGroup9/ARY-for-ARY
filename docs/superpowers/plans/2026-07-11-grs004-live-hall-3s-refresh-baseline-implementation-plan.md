# GRS004 / Live Hall 3s Refresh Baseline Implementation Plan

## 实施步骤

✅ 核对 `docs/grs004` 中关于 Live Hall 刷新的明确要求
✅ 补设计文档
✅ 新增最小 `LiveAutoRefresh` client 组件
✅ 为 `Live Hall` 与 `Screen Live Display` page 层接入 3 秒刷新
✅ 通过 phase gating 限定刷新只在实时阶段启用
✅ 补纯函数 / source 回归测试
✅ 回归现有 `live-hall` / `live-display` 视图测试
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/public/live-auto-refresh.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/public/live-display.test.tsx
npm run build
```

## 本轮结果

- `Live Hall` 在实时阶段已具备 3 秒自动刷新基线
- `Screen Live Display` 同步具备相同刷新能力
- 现有纯渲染视图测试未被 client hook 边界污染
