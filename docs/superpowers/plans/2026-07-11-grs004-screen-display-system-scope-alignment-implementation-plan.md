# GRS004 / ScreenDisplay System Scope Alignment Implementation Plan

## 实施步骤

- [x] 先补 `ScreenDisplay` system-scope 对齐设计文档
- [x] 新增 `src/app/actions.screen-display-system-scope.test.ts`
- [x] 扩展 `src/lib/services/screen-display.test.ts`
  - foreign organizer + `allowSystem: true` 拒绝
  - admin/system 跨赛事成功
- [x] 更新 `src/lib/services/screen-display.ts`
  - 本地补真实 Admin role 校验
  - 不再把裸 `allowSystem` 视作 system scope
- [x] 运行聚焦测试
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.screen-display-system-scope.test.ts src/lib/services/screen-display.test.ts
npm run build
```

## 本轮结果

- `ScreenDisplay` 4 个内部维护动作现已在 service 层按真实 `managed race | system` 收口
- 新增 action wiring test 与 service scope test 均已通过
- `npm run build` 已通过，仍保留同一个既有 Turbopack/NFT warning

## 完成标准

- `ScreenDisplay` 4 个动作的 service 边界符合 `managed race | system`
- foreign organizer 无法伪造 `allowSystem` 越权
- admin/system 可以跨赛事修改 screen display 状态
- 文档、测试、实现、状态记录同步完成
