# GRS004 / Remove Session Single Role Residue Design

## 目的

本设计直接承接：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `User` 持有 `roles` 集合
  - MVP 不再以单一 `role` 字段表达身份
- `docs/grs004/ary-permission-matrix.md`
  - 后台访问与资源动作都应基于 `User.roles`
- `docs/grs004/grs003-gap-analysis.md`
  - 已明确记录 `role + rolesJson` 双轨仍未完全收口
  - 已明确要求清理 `role` 单值残留

当前显式缺口：

- Prisma `User` 主模型已经只剩 `rolesJson`
- 但 `src/lib/auth.ts` 仍对外暴露 `SessionUser.role`
- 本地登录与 GitHub OAuth 创建 session 时仍会显式写入 `role: getDefaultActiveRole(roles)`
- 一部分测试夹具仍被迫构造 `role: "RIDER"`

这会让运行时继续保留“单值 role 仍然是正式模型”的错觉，与 `docs/grs004` 的 `User.roles` 集合语义不一致。

## 范围

### 本轮纳入

- 移除 `SessionUser` / `DatabaseSessionUser` 中的单值 `role`
- 移除本地登录与 GitHub OAuth session 创建路径中的 `role` 传递
- 更新受影响的测试夹具
- 新增最小守护测试，防止 session 层重新引入单值 `role`

### 本轮不纳入

- 不删除 `getDefaultActiveRole()` helper
- 不改 `demo-credentials.ts` 里的展示文案字段 `role: string`
- 不引入“当前激活角色切换”之类新的产品语义

## 落地规则

### Session 模型

- `SessionUser` 只保留：
  - `id`
  - `username`
  - `roles`
  - 可选资料补全字段
- `DatabaseSessionUser` 同样只保留 `roles` 集合，不再派生 `role`

### Session 写入

- `createSession()` 继续只把 `roles`、`username`、`sub` 写入 JWT
- `registerUser()`、`loginUser()`、`finishGitHubOAuth()` 传入 `createSession()` 时不再构造单值 `role`

### Session 读取

- `getSessionUser()` 与 `loadDatabaseUser()` 读取后只返回 `roles`
- 权限判断继续统一使用 `hasRole(user.roles, targetRole)`

### 测试

- 新增 `src/lib/auth-session-roles-only.test.ts`
- 更新 `src/app/_components/public/race-register-page.test.tsx`

验证命令：

```bash
node --import tsx --test src/lib/auth-session-roles-only.test.ts src/app/_components/public/race-register-page.test.tsx
npm run build
```

## 一句话结论

这一轮不是做新功能，而是把登录态模型从“看起来还支持单角色”收口到真正的 `User.roles` 集合语义，避免领域模型和运行时会话继续双轨。
