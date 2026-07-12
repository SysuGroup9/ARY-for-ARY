# GRS004 / P0 One-Click Regression Runner Implementation Plan

## 实施步骤

✅ 补设计文档
✅ 盘点现有可复用的 P0 聚焦测试
✅ 新增 `scripts/grs004-p0-regression.mjs`
✅ 在 `package.json` 增加 `test:p0 / qa:p0`
✅ 补 `Admin 分配 roles` action wiring 回归
✅ 修复 `race-archive-scope.test.ts` 的日期漂移问题
✅ 跑 `npm run qa:p0`
✅ 更新 `docs/superpowers/status.md`
✅ 更新 `grs004readme.md`

## 验证命令

```bash
npm run qa:p0
```

## 本轮结果

- `qa:p0` 现在是仓库里的正式一键回归入口
- 数据库相关分组会在执行前自动 `db:seed`
- 脚本末尾会附带一次生产构建校验
