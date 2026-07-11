# GRS004 / ScreenDisplay System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.13 ScreenDisplay`
    - `configure`
    - `switch_mode`
    - `fallback_to_stable_projection`
    - `fallback_to_static_notice`
    - Organizer: `managed race`
    - Admin: `system`
  - `4. 测试要求`
    - `大屏 fallback 等内部维护动作只能由 Organizer 管理赛事范围或 Admin 系统范围执行`

当前显式缺口不在 action 层，而在 service 层：

- `src/app/actions.ts`
  - `updateScreenDisplayModeAction()`
  - `updateScreenDisplayThemeAction()`
  - `fallbackScreenDisplayToStableAction()`
  - `fallbackScreenDisplayToStaticAction()`
  - 这 4 个 action 现在已经是 `ADMIN | ORGANIZER` 双入口，并且会传 `allowSystem`
- `src/lib/services/screen-display.ts`
  - `getRaceForManagedScreenDisplayAction()` 当前仍使用：
    - `race.organizerId !== organizerId && !allowSystem`
  - 这意味着 foreign organizer 如果直接调用 service 并伪造 `allowSystem: true`，仍可能越过真实 `managed race | system` 边界

这与前面已经完成的 `Race.edit / Projection.rebuild / CAConnection manage / JudgeAssignment` 收口模式不一致。

## 范围

### 本轮纳入

- 收口 `ScreenDisplay` service 层的真实 `managed race | system` 边界
- 补 action wiring test，锁定这 4 个 action 仍为 `ADMIN | ORGANIZER` 双入口
- 扩展 `src/lib/services/screen-display.test.ts`
  - foreign organizer + `allowSystem: true` 被拒绝
  - admin/system 对非自己组织赛事的 screen display 动作成功

### 本轮不纳入

- 不改 Screen Console UI
- 不新增 Admin 导航
- 不改公开端 screen page 路由与 read model
- 不把 `ScreenDisplay` service 重构成新的通用权限中台

## 约束

- Organizer 权限仍是 `managed race`
- Admin 权限仍是 `system`
- 本轮只修正 service 边界，不扩大产品行为
- 由于 `races.ts` 已依赖 `screen-display.ts`，本轮不把 helper 强行抽到会引入循环依赖的位置

## 方案

### 方案 A：在 `screen-display.ts` 本地补真实 Admin 校验

做法：

- 在 `getRaceForManagedScreenDisplayAction()` 中同时读取：
  - `Race`
  - `User.rolesJson`
- 仅当：
  - 当前用户就是该赛事 organizer
  - 或 `allowSystem === true` 且当前用户真实拥有 `ADMIN`
  - 才允许继续执行

优点：

- 改动最小
- 不引入 `screen-display.ts <-> races.ts` 循环依赖
- 语义上与 `assertManagedRaceActionAccess()` 保持一致

缺点：

- 会有一小段与 `races.ts` 类似的权限判断逻辑

### 方案 B：抽公共 helper

优点：

- 复用更彻底

缺点：

- 当前 `races.ts` 已导入 `normalizeScreenDisplayState`
- 反向再导入 `assertManagedRaceActionAccess()` 会形成循环依赖风险
- 超出本轮最小修复面

### 推荐方案

采用 **方案 A：在 `screen-display.ts` 本地补真实 Admin 校验**。

## 用户可见变化

本轮对正常用户的直接 UI 变化极小，但会修正一类真实权限边界：

1. Organizer 继续可以管理自己赛事的大屏模式、主题和 fallback
2. Admin 继续可以按 system scope 管理非自己组织赛事的大屏状态
3. foreign organizer 即使能直接调 service，也不能再伪造 `allowSystem` 越权

## 测试对齐

需要覆盖：

- `src/app/actions.screen-display-system-scope.test.ts`
  - 4 个 screen display action 不再退回 Organizer-only
  - 调 service 时仍显式传 `allowSystem: hasRole(user.roles, "ADMIN")`
- `src/lib/services/screen-display.test.ts`
  - foreign organizer + `allowSystem: true` 被拒绝
  - admin/system 能对非自己组织赛事执行：
    - `updateScreenDisplayThemeForRace()`
    - `updateScreenDisplayModeForRace()`
    - `fallbackScreenDisplayToStableProjection()`
    - `fallbackScreenDisplayToStaticNotice()`

验证命令：

```bash
node --import tsx --test src/app/actions.screen-display-system-scope.test.ts src/lib/services/screen-display.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `ScreenDisplay` 4 个内部维护动作满足 `managed race | system`
2. foreign organizer 不能靠 `allowSystem: true` 越权
3. Admin system 路径可用
4. 聚焦测试与构建通过

## 一句话结论

这一轮不是增加新大屏功能，而是把 `ScreenDisplay` 这组内部维护动作，从“service 层还能裸用 allowSystem 越权”收口成文档要求的 `Organizer managed-race / Admin system` 真边界。
