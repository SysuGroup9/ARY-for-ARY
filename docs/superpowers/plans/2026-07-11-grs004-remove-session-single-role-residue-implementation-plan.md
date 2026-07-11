# GRS004 / Remove Session Single Role Residue Implementation Plan

## 实施步骤

- [x] 核对 `docs/grs004` 中的多角色集合语义与当前 session 残留
- [x] 补设计文档
- [x] 新增 session roles-only 守护测试
- [x] 移除 `SessionUser` / `DatabaseSessionUser` 的单值 `role`
- [x] 更新本地登录与 GitHub OAuth 的 session 创建调用
- [x] 更新受影响测试夹具
- [x] 跑聚焦验证
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`
- [x] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/auth-session-roles-only.test.ts src/app/_components/public/race-register-page.test.tsx
npm run build
```

## 本轮结果

- session 登录态已不再暴露单值 `role`
- 登录、本地注册、GitHub OAuth 三条 session 创建路径已统一只写 `roles`
- 公开报名页等消费 `SessionUser` 的夹具不再依赖虚假的单角色字段
