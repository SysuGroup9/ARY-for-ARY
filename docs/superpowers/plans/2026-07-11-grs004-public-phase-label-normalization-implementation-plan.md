# GRS004 / Public Phase Label Normalization Implementation Plan

## 实施步骤

- [x] 识别仍直接显示 `race.phase` 的 public / screen 视图
- [x] 补设计文档
- [x] 放宽 `getRacePhaseLabel()` 的输入类型
- [x] 收口首页 Hero / 首页赛事卡 / 赛事列表的 phase badge
- [x] 收口 `Race Page`、报名页、`Live Hall`、`Live Display`
- [x] 收口 `Billboard`、`Leaderboard`、`Announcement Display`
- [x] 调整 `Race Page` 的 `公开入口 / 下一步入口` 文案结构
- [x] 补 focused regression tests
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`
- [x] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/public/public-phase-cta-regression.test.tsx src/app/_components/public/public-phase-label-regression.test.tsx src/app/_components/public/billboard-display.test.tsx src/app/_components/public/race-page.test.tsx src/lib/public-site.test.ts
npm run build
```

## 本轮结果

- 公开端和展示端用户不再直接看到内部 `running / judging / archived` 等 phase key
- `Race Page` 的状态 CTA 区重新具备更清晰的公开入口与下一步入口结构
