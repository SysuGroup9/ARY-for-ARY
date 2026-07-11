# GRS004 / Rider Snapshot Fetch Own Scope Implementation Plan

## 实施步骤

- [x] 补设计文档
- [x] 更新 `src/lib/services/ca-fetch.ts`
- [x] 更新 `src/app/actions.ts`
- [x] 新增 action wiring test
- [x] 新增 service scope test
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.rider-snapshot-own-scope.test.ts src/lib/services/ca-fetch-rider-scope.test.ts
npm run build
```

## 本轮结果

- Rider 触发的 snapshot fetch 现已显式传入 `userId`
- service 已收口为 own `CAConnection` + `APPROVED Registration` 双条件
- 聚焦测试与构建均已通过
