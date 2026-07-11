# GRS004 / Award Report Announcement System Scope Service Hardening Implementation Plan

## 实施步骤

- [x] 补 hardening 设计文档
- [x] 更新 `src/lib/services/awards.ts`
- [x] 更新 `src/lib/services/reports.ts`
- [x] 更新 `src/lib/services/announcements.ts`
- [x] 扩展 `awards-draft-withdraw.test.ts`
- [x] 扩展 `reports-generation.test.ts`
- [x] 扩展 `announcements.test.ts`
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts
npm run build
```

## 完成标准

- `Award / Report / Announcement` service helper 只允许真实 Admin 使用 `system` 范围
- foreign organizer + `allowSystem: true` 被明确拒绝
- admin/system 聚焦测试与构建全部通过

## 本轮结果

- `Award / Report / Announcement` service 层不再信任裸 `allowSystem`
- foreign organizer 越权路径已被测试锁住
- 现有 action 双入口未回退，聚焦测试与构建都已通过
