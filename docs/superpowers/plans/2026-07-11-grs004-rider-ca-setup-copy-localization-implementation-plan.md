# GRS004 / Rider CA Setup Copy Localization Implementation Plan

## 实施步骤

- [x] 从 `docs/grs004` 核对 Rider View / CA Ingestion Status 的目标口径
- [x] 扫描 `rider-console-page.tsx` 中 `ca-setup` 的英文残留
- [x] 补设计文档
- [x] 为 Rider 视图眉标补中文化收口
- [x] 为报名状态和聚合接入状态补状态值映射
- [x] 为 CA 接入表单与 CA 连接卡补中文标签
- [x] 为握手、禁用、轮换提示补中文映射
- [x] 更新 `src/app/_components/console/rider-console-page.test.tsx`
- [x] 回归 `src/app/_components/console/review-readiness-card.test.tsx`
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`
- [x] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/review-readiness-card.test.tsx
npm run build
```

## 本轮结果

- Rider 的 CA 接入区不再混用英文后台词
- Rider 报名状态、接入状态和连接器状态表达与前面已完成的 console 中文化方向保持一致
- 本轮没有改变任何 CA 服务或权限逻辑
