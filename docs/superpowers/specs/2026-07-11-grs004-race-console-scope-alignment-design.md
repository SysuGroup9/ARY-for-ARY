# GRS004 / Race Console Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `## 3.1 Race`
    - `view_private`
      - Rider: `own registered race`
      - Judge: `assigned race`
      - Organizer: `managed race`
      - Admin: `system`
  - `## 3.2 Registration`
    - Rider: `own`
    - Judge: `assigned work context`
    - Organizer: `managed race`
  - `## 3.3 RaceProject`
    - Rider: `own`
    - Judge: `assigned work summary`
    - Organizer: `managed race`
- `docs/grs004/grs003-gap-analysis.md`
  - `权限校验 | 🔶 部分解决`
  - `Organizer 范围 | 🔶 部分解决`

当前代码里已经有：

- `src/lib/services/console-routes.ts`
  - `listConsoleRacesForUser()`
    - 已按：
      - Organizer -> `race.organizerId === userId`
      - Rider -> race 内存在自己的 registration
      - Judge -> race 内存在自己的 assignment
- `src/app/console/races/[raceSlug]/*`
  - 详情页仍先直接调用：
    - `getConsoleRaceBySlug(raceSlug)`

这里的缺口是：

- 列表页已经按 `own / assigned / managed race` 过滤
- 但 `entry / organizer / rider / judge` 详情页没有复用相同 scope
- 因此用户理论上可以通过手工猜 slug 先读取未 scoped 的 race context，再由页面自己做后置判断

本轮目标是：**让 Race Console 的详情页读取与列表页使用同一套 scope 规则。**

## 范围

### 本轮纳入

- 新增 console race scoped detail helper
- 接入页面：
  - `/console/races/[raceSlug]`
  - `/console/races/[raceSlug]/organizer/[section]`
  - `/console/races/[raceSlug]/rider/[section]`
  - `/console/races/[raceSlug]/judge/[section]`
- 更新 `src/lib/services/console-routes.test.ts`

### 本轮不纳入

- 不重构 Admin Console
- 不重构 Screen Console 之外的其它 page scope helper
- 不修改 `managed race` 的数据模型定义
- 不补完整资源动作级 13×6 自动化矩阵

## 约束

### 文档约束

- Rider 只能进入自己的报名赛事上下文
- Judge 只能进入分配给自己的评审赛事上下文
- Organizer 只能进入自己负责的赛事上下文
- Admin 仍保留系统范围

### 当前代码现实

- `listConsoleRacesForUser()` 已经编码了最小 scope 规则
- 当前缺口主要是详情页未复用这套规则

因此本轮应遵循：

1. **优先复用 `listConsoleRacesForUser()` 现有 scope**
2. **只补详情页读取，不扩大到所有查询链重写**
3. **先让未 scoped 的 `getConsoleRaceBySlug()` 不再用于 Race Console route**

## 方案选择

### 方案 A：新增基于 `listConsoleRacesForUser()` 的 scoped helper

做法：

- 新增：
  - `getConsoleRaceEntriesBySlugForUser()`
  - `getConsoleRaceBySlugForAccess()`
- 用可见 race list 匹配：
  - slug
  - raceId fallback

优点：

- 与现有列表页 scope 完全一致
- 改动最小
- entry / organizer / rider / judge 都能共用

缺点：

- `getConsoleRaceBySlug()` 仍作为未 scoped helper 存在

### 方案 B：把 `getConsoleRaceBySlug()` 直接改成全局 scoped API

优点：

- API 更统一

缺点：

- 会影响所有现有调用点
- 超出本轮最小缺口

### 推荐方案

采用 **方案 A：新增 scoped helper，并让 Race Console route 改用它**。

## 用户可见变化

本轮落地后：

1. Rider 手工改 URL 不能进入不属于自己的赛事控制台详情
2. Judge 手工改 URL 不能进入未分配赛事的评审详情
3. Organizer 手工改 URL 不能进入不属于自己负责赛事的 Organizer 详情
4. Admin 行为保持不变

## 测试对齐

需要覆盖：

- `src/lib/services/console-routes.test.ts`
  - Rider / Judge / Organizer 各自的可见 race list
  - scoped detail helper 对不同 access 的允许 / 拒绝
  - entry helper 只返回当前用户真实可见的 access

验证命令：

```bash
node --import tsx --test src/lib/services/console-routes.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. Race Console 列表页与详情页 scope 一致
2. Rider / Judge / Organizer 都不能通过猜 slug 越权进入别人的 race console detail
3. Admin 仍可在系统范围读取
4. 聚焦测试通过

## 一句话结论

这轮要修的不是“谁能看到赛事控制台入口”，而是“拿到 slug 之后，Race Console 的详情页也必须严格按 `own / assigned / managed race / system` 读取”。
