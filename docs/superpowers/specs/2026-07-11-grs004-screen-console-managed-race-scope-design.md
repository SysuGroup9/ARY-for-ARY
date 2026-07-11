# GRS004 / Screen Console Managed Race Scope Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `ScreenDisplay.configure / switch_mode / fallback_*`
  - Organizer 范围为 `managed race`
- `docs/grs004/ary-mvp.prd.md`
  - `Screen Console：控制现场、课堂和直播大屏展示`
- `docs/grs004/grs003-gap-analysis.md`
  - `权限校验 | 🔶 部分解决`
  - `Organizer 范围 | 🔶 部分解决`

当前代码里已经有：

- `src/lib/services/console-routes.ts`
  - `listScreenConsoleRacesForUser()`
    - 已按 `ADMIN` 全量 / `ORGANIZER` 仅自己赛事过滤
- `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
  - 当前详情页会先做：
    - `getConsoleScreenAccess(sessionUser.roles)`
  - 然后直接：
    - `getConsoleRaceBySlug(raceSlug)`

这里的缺口是：

- 列表页已按 `managed race` 过滤
- 详情页却没有复用同一范围判断
- 因此任意具备 `ORGANIZER` role 的用户，理论上可以直接猜 slug 打开他并不负责的 `Screen Console` 详情页

本轮目标是：**让 Screen Console 的详情页读取和列表页保持同一套 `managed race` 范围规则。**

## 范围

### 本轮纳入

- 新增 screen-scope helper
- `Screen Console` 详情页改用 scoped helper
- 更新 `src/lib/services/console-routes.test.ts`
- 验证 Organizer 只能读取自己负责的 screen race

### 本轮不纳入

- 不重构 `getConsoleRaceBySlug()` 在所有 console 页的通用签名
- 不扩展到 Organizer / Rider / Judge 全部详情页查询重构
- 不调整 `managed race` 的底层数据模型定义

## 约束

### 文档约束

- Organizer 的 ScreenDisplay 控制权限只应作用于 `managed race`
- Admin 仍保留 `system` 范围
- Screen Console 是独立控制台，但不意味着 Organizer 可跨赛事越权

### 当前代码现实

- 列表页过滤逻辑已经存在
- 问题主要出在详情页没有复用同一过滤

因此本轮应遵循：

1. **优先复用现有列表级范围规则**
2. **只补 Screen Console 详情页这一条真实越权口子**
3. **不把本轮扩大成全 Console 查询层重构**

## 方案选择

### 方案 A：新增 `getScreenConsoleRaceBySlugForUser()`

做法：

- 先基于 `roles + userId` 得到可见 screen races
- 再在可见集合里匹配 slug / raceId fallback

优点：

- 与现有 `listScreenConsoleRacesForUser()` 口径完全一致
- 改动最小
- 直接修补当前越权口子

缺点：

- `getConsoleRaceBySlug()` 仍保持未 scoped 的通用读取

### 方案 B：把 `getConsoleRaceBySlug()` 重写成通用 scoped API

优点：

- 能顺手统一更多 console 详情页

缺点：

- 牵涉面更大
- 超出当前最小缺口

### 推荐方案

采用 **方案 A：新增 `getScreenConsoleRaceBySlugForUser()`**。

## 用户可见变化

本轮落地后：

1. Organizer 在 `Screen Console` 列表页仍只看到自己负责的赛事
2. 即使手工改 URL，也不能再打开别人的大屏控制详情页
3. Admin 仍可访问所有 `Screen Console` 赛事详情

## 测试对齐

需要覆盖：

- `src/lib/services/console-routes.test.ts`
  - Organizer screen list 返回自己负责的赛事
  - 非负责 Organizer 无法读取他人 screen race 详情
  - Admin 可读取任意 screen race 详情

验证命令：

```bash
node --import tsx --test src/lib/services/console-routes.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. Screen Console 列表页和详情页使用同一套 `managed race` 口径
2. Organizer 不能通过猜 slug 进入别人的 `Screen Console`
3. Admin 不受影响
4. 聚焦测试通过

## 一句话结论

这轮要修的不是“谁能看到 Screen Console 入口”，而是“拿到入口之后，Organizer 只能进自己那场 race 的大屏控制详情页”。
