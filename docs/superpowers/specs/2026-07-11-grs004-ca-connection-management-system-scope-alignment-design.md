# GRS004 / CA Connection Management System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.3 RaceProject`
    - `manage_ca_connection`
    - Organizer: `managed race exception`
    - Admin: `system exception`
  - `4. 测试要求`
    - Organizer 只能管理自己负责的 Race 及其相关资源
- `docs/grs004/ary-ca-integration-spec.md`
  - 已登记、已握手、归属正确且未禁用的 `CAConnection` 后续数据才能进入有效证据链
  - 未登记、未握手、归属错误或被禁用的连接数据不得进入有效 Projection、Evidence 或 Report 输入

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `disableCAConnectionAction()` / `enableCAConnectionAction()` 当前还是 `requireRole("ORGANIZER")`
  - Admin/system 无法进入
- `src/lib/services/ca-connections.ts`
  - `disableCAConnectionForOrganizer()` / `enableCAConnectionForOrganizer()` 当前只接受“当前 `organizerId` 必须等于 race.organizerId”
  - 只要进入 action 层，也没有显式的真实 Admin/system 例外校验

这意味着当前 `manage_ca_connection` 仍是 Organizer-only，未对齐文档里的 `managed race exception | system exception`。

## 范围

### 本轮纳入

- 对齐 `CAConnection.disable / enable` 的 server action 准入
- 对齐 `disableCAConnectionForOrganizer()` / `enableCAConnectionForOrganizer()` 的 `managed race exception | system exception`
- 补最小测试覆盖：
  - action wiring 不再是 Organizer-only
  - foreign organizer 即使传 `allowSystem` 也不能越权
  - admin/system 可以跨赛事 disable / enable

### 本轮不纳入

- 不改 Rider 的 `register_ca_connection` / `rotate secret` 入口
- 不重构 CA Status 页面结构
- 不扩到 handshake / signal / snapshot fetch 运行时边界

## 约束

### 文档约束

- Organizer 只能管理 `managed race`
- Admin 具有 `system exception` 入口
- 被禁用的 `CAConnection` 后续数据不得进入有效证据链

### 当前实现约束

- 现有 action 已在 disable / enable 后重建 Projection
- 现有 service 命名仍沿用 `ForOrganizer`
- 本轮优先补边界，不扩大到 UI 或 CA 协议层重构

因此本轮应遵循：

1. **沿用现有 disable / enable 调用链**
2. **只补 action 和 service scope**
3. **Admin/system 例外必须是“真实 Admin”，不能靠裸 `allowSystem` 自报通过**

## 方案选择

### 方案 A：在 action 和 service 两层都补 `ADMIN | ORGANIZER` + `allowSystem`

做法：

- `disableCAConnectionAction()` / `enableCAConnectionAction()` 从 `requireRole("ORGANIZER")` 改为 `ADMIN | ORGANIZER`
- service 输入新增：
  - `allowSystem?: boolean`
- service 内校验：
  - 当前 connection 必须存在
  - 当前用户要么是该赛事 organizer
  - 要么在 `allowSystem=true` 且真实拥有 `ADMIN` role 时按 system exception 放行

优点：

- 与 Award / Report / Announcement / Projection rebuild 的收口方式一致
- 真正把 system exception 落到写边界
- foreign organizer 不能靠伪造 `allowSystem` 越权

缺点：

- service 内多一次用户角色读取

### 方案 B：只改 action，不改 service

优点：

- 改动更小

缺点：

- service 仍没有真正 system exception 语义
- 其他调用点仍可能绕过

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可禁用/恢复自己赛事下的 CAConnection
2. 非本赛事 Organizer 即使知道 `caConnectionId`，也不能再跨赛事禁用/恢复
3. Admin 可以按 system exception 执行同类维护动作

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.ca-connection-system-scope.test.ts`
  - `disableCAConnectionAction()` / `enableCAConnectionAction()` 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - service 调用已传 `allowSystem`
- 扩展 `src/lib/services/ca-rotation-disable.test.ts`
  - foreign organizer 即使传 `allowSystem: true` 也会被拒绝
  - admin/system 可跨赛事 disable / enable

验证命令：

```bash
node --import tsx --test src/app/actions.ca-connection-system-scope.test.ts src/lib/services/ca-rotation-disable.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `manage_ca_connection` 已对齐 `managed race exception | system exception`
2. foreign organizer 无法跨赛事禁用/恢复 CAConnection
3. Admin/system 可以执行 disable / enable
4. 聚焦测试通过

## 一句话结论

这一轮要修的是 `CAConnection.disable / enable` 的真实异常处理边界：当前不能只允许“本赛事 organizer”，还必须保留 Admin 的 system exception，同时阻止 foreign organizer 靠 `allowSystem` 伪装越权。
