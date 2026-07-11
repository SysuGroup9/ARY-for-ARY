# GRS004 / Race Archive System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.1 Race`
    - `archive`
    - Organizer: `managed race`
    - Admin: `system`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Race Status`
    - `draft、published、registration、running、submitting、judging、completed、archived`
  - `Race Lifecycle`
    - `completed -> archived`
  - `Race Publishing Flow`
    - 创建、编辑、发布、撤回或归档赛事
- `docs/grs004/ary-release-ops-plan.md`
  - `3.3 赛后归档`
  - 归档属于赛后动作

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - 现有是 `clearRaceAction()`
- `src/lib/services/races.ts`
  - 现有是 `clearRace()`，直接删除整场赛事
- `src/app/_components/console/organizer-console-page.tsx`
  - 当前维护面板仍显示“清空赛事”

这与文档要求的“归档”不一致：文档要求的是赛后保留关键数据并进入 `archived` 生命周期，不是直接删除赛事事实。

## 范围

### 本轮纳入

- 用 `archiveRaceAction()` / `archiveRace()` 取代当前对外暴露的 delete-like 路径
- 对齐 `managed race | system`
- 限制归档只能发生在赛后
- 补最小公开端对齐：
  - `archived` 继续进入最新赛果 / 往届赛事 / 精选作品等赛后入口

### 本轮不纳入

- 不做独立“恢复归档赛事”流程
- 不重构完整 8 状态推进器
- 不删除内部遗留 `clearRace()` 的所有痕迹之外的更大范围历史逻辑

## 约束

### 文档约束

- 归档是 Race 生命周期的一部分
- 归档发生在赛后
- 归档后赛事仍应保留为赛后资产

### 当前实现约束

- `Race.status` 字段已存在
- `getRacePhase()` 已支持 `archived`
- public-site 目前仍主要把 `finished` 当作赛后赛事

因此本轮应遵循：

1. **归档改写 `Race.status`，不删除赛事**
2. **仅允许赛后归档**
3. **公开端继续把 `archived` 当作赛后赛事看待**

## 方案选择

### 方案 A：新增 archive action/service，最小修补 public-site 的赛后入口

做法：

- 新增 `archiveRaceAction()` / `archiveRace()`
- UI 按钮从“清空赛事”改为“归档赛事”
- service 内：
  - 先走 `assertManagedRaceActionAccess()`
  - 再要求 phase 已是 `completed` / `finished` / `archived`
  - 最后写 `status = "archived"`
- public-site 里把 `finished/completed/archived` 一起视作赛后赛事

优点：

- 最直接贴合文档
- 不需要新 schema
- 避免赛后资产被删除

缺点：

- 需要同步 public-site 的 phase 识别

### 方案 B：保留 clear/delete，只在文档层解释为 archive

优点：

- 改动小

缺点：

- 与文档事实直接冲突
- 会丢失赛后资产

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. 主办方维护面板不再显示“清空赛事”，而是“归档赛事”
2. 已归档赛事仍会继续出现在赛后公开入口里
3. 非赛后阶段不能提前归档

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.race-archive-system-scope.test.ts`
  - `archiveRaceAction()` 已允许 `ADMIN | ORGANIZER`
- 新增 `src/lib/services/race-archive-scope.test.ts`
  - foreign organizer 拒绝
  - admin/system 成功
  - 非赛后阶段拒绝
- 扩展 `src/lib/public-site.test.ts`
  - `archived` 仍进入赛后公开入口

验证命令：

```bash
node --import tsx --test src/app/actions.race-archive-system-scope.test.ts src/lib/services/race-archive-scope.test.ts src/lib/public-site.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `Race.archive` 已按 `managed race | system` 工作
2. 当前对外入口不再删除赛事而是归档赛事
3. 归档只能发生在赛后
4. `archived` 仍保留赛后公开可见性
5. 聚焦测试通过

## 一句话结论

这一轮要修的是 `Race.archive` 的真实生命周期语义：文档要求的是赛后归档，而不是直接删除赛事；代码应改为写入 `status="archived"` 并保留赛后公开资产。
