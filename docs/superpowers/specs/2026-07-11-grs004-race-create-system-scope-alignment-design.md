# GRS004 / Race Create System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.1 Race`
    - `create`
    - Organizer: `yes`
    - Admin: `system`
  - `4. 测试要求`
    - Organizer 只能管理自己负责的 Race 及其相关资源
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - Organizer 是负责赛事的人
  - Admin 是系统管理角色，不等同于默认赛事主办方

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `createRaceAction()` 当前还是 `requireRole("ORGANIZER")`
- `src/lib/viewer-access.ts`
  - `getCreateRacePageAccess()` 当前只允许 Organizer 进入创建页
- `src/app/console/races/new/page.tsx`
  - 当前没有 Admin system create 的表单能力
- `src/lib/services/races.ts`
  - `createRace()` 当前只接受一个 `organizerId`
  - 没有区分“当前操作者”和“被指定为 organizer 的主办方账号”

这意味着 `Race.create` 仍未对齐文档里的 `Organizer yes | Admin system`。

## 范围

### 本轮纳入

- 对齐 `createRaceAction()` 的 `ADMIN | ORGANIZER` 准入
- 对齐创建页访问边界
- 为 Admin 补最小 organizer 选择能力
- 对齐 `createRace()` 的 system create 语义
- 补最小测试覆盖：
  - Admin 可进入创建页
  - Admin 可以代 Organizer 创建
  - foreign organizer 不能借 `allowSystem` 代别人创建
  - Admin 不能把赛事挂到非 organizer 账号下

### 本轮不纳入

- 不新增完整“赛事归属转移”流程
- 不改 `clearRaceAction()` / archive 语义
- 不扩到 Console 导航结构重做

## 约束

### 文档约束

- Organizer 可以创建赛事
- Admin 具有 `system` 范围
- Race 仍应有明确 organizer 归属

### 当前实现约束

- 当前 Race 模型只有单个 `organizerId`
- 项目没有独立 Organization 实体
- Admin 不应默认把赛事创建到一个纯 Admin 账号下，除非该账号同时拥有 Organizer role

因此本轮应遵循：

1. **Admin 创建时必须显式选择 Organizer 账号**
2. **Organizer 自己创建时仍沿用当前路径**
3. **不引入新的归属模型**

## 方案选择

### 方案 A：Admin system create 时显式选择 Organizer

做法：

- 创建页对 Admin 开放
- Admin 进入创建页后可选择一个 Organizer 账号
- `createRaceAction()` 传入：
  - 当前操作者 `actorUserId`
  - 目标 organizer `organizerId`
  - `allowSystem`
- `createRace()` 校验：
  - 目标 organizer 必须真实拥有 `ORGANIZER` role
  - 若操作者与目标 organizer 不同，则必须是 Admin/system

优点：

- 保持 Race 的 organizer 归属清晰
- 不会把比赛默认挂到纯 Admin 账号下
- 与文档口径一致

缺点：

- 需要在创建表单里增加一个最小的 organizer 选择字段

### 方案 B：只允许 Admin 直接把赛事创建到自己名下

优点：

- 改动更小

缺点：

- 与“Organizer 是负责赛事的人”语义冲突
- 会制造由纯 Admin 持有 organizerId 的赛事

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可正常创建自己的赛事
2. Admin 可以进入创建页并代某个 Organizer 创建赛事
3. Admin 不能把赛事挂到一个没有 Organizer role 的账号下

## 测试对齐

需要覆盖：

- 更新 `src/lib/viewer-access.test.ts`
  - Admin 可访问 create-race page
- 新增 `src/app/actions.race-create-system-scope.test.ts`
  - `createRaceAction()` 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - Admin 路径会读取 `organizerId`
- 新增 `src/lib/services/race-create-scope.test.ts`
  - organizer 自建成功
  - admin 代 organizer 创建成功
  - foreign organizer + `allowSystem` 拒绝
  - admin 指向非 organizer 账号拒绝

验证命令：

```bash
node --import tsx --test src/lib/viewer-access.test.ts src/app/actions.race-create-system-scope.test.ts src/lib/services/race-create-scope.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Race.create` 已对齐 `Organizer yes | Admin system`
2. Admin 可进入创建页并代 Organizer 创建
3. foreign organizer 不能代别人创建
4. 非 organizer 账号不能被选作赛事 organizer
5. 聚焦测试通过

## 一句话结论

这一轮要修的是 `Race.create` 的真实 system create 语义：Admin 不能只是“能点开 action”，还必须能代表一个真实 Organizer 创建赛事，同时保持赛事归属清晰。
