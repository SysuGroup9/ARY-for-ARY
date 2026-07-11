# GRS004 / Rider Submission Legacy Team Gate Removal Implementation Plan

## 实施步骤

- [x] 补设计文档
- [x] 为 approved registration 新增 compatibility container 自愈 helper
- [x] 更新 draft/save 和 submission services
- [x] 更新 Rider submission section 去掉 `!riderTeam` 阻断
- [x] 补 service / UI 回归测试
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`
- [x] 更新 `grs004readme.md`

## 验证命令

```bash
node --test-concurrency=1 --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions-work-materialization.test.ts src/lib/services/submissions.test.ts
npm run build
```

## 本轮结果

- approved registration 不再因为缺失 legacy Team 容器而无法继续提交
- compatibility Team 现在改成提交链路内部自愈，而不是用户可见 gate
