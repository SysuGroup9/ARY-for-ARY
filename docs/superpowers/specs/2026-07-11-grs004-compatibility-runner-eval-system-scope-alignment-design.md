# GRS004 / Compatibility Runner Eval System Scope Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `4. 测试要求`
    - Projection 重建、Report 生成、大屏 fallback 等内部维护动作只能由 Organizer 管理赛事范围或 Admin 系统范围执行
- `docs/grs004/防伪与防篡改计划.md`
  - `Runner 已从核心裁决链路降级为辅助处理或兼容链路`
  - `Runner 若保留，必须消费已经有来源引用和完整性元数据的 Work / Evidence`
- `src/app/_components/console/organizer-console-page.tsx`
  - 当前文案已明确：
    - `以下按钮只保留给兼容 Runner 评估链路，不是当前主裁决路径`

当前代码里的显式缺口是：

- `src/app/actions.ts`
  - `runCompatibilityProgressEvalAction()`
  - `runCompatibilityHarnessEvalAction()`
  - 这 2 个 action 当前都还是纯 `requireRole("ORGANIZER")`
  - 也没有按 `raceId` 校验当前 Organizer 是否真的管理该赛事

虽然权限矩阵没有单独列出 compatibility runner eval，但按文档语义它们属于：

- 兼容链路
- 内部维护动作
- 非正式主裁决路径

因此应遵守与 Projection rebuild、Race snapshot、大屏 fallback 相同的 `managed race | system` 边界。

## 范围

### 本轮纳入

- 对齐 `runCompatibilityProgressEvalAction()`
- 对齐 `runCompatibilityHarnessEvalAction()`
- 补最小 action/source 测试

### 本轮不纳入

- 不改 `enqueueProgressEvalTasks()` / `enqueueHarnessEvalTasks()` service 签名
- 不扩到 Runner API 路由废除
- 不重构兼容 Runner UI 文案之外的更大范围兼容链路

## 约束

### 文档约束

- Runner 是兼容链路，不是正式主裁决路径
- 兼容链路相关维护动作应按内部维护边界处理

### 当前实现约束

- `runner.ts` 已自行校验阶段：
  - progress eval 仅限进行中 / 封榜 / 提交中
  - harness eval 仅限赛后
- 本轮优先只收 action 入口边界

因此本轮应遵循：

1. **只在 action 前增加 managed-race helper**
2. **不扩大到 runner service 重构**
3. **保持现有 phase 规则不变**

## 方案选择

### 方案 A：将两条 action 从 Organizer-only 改为 `ADMIN | ORGANIZER`，并在调用前走 managed-race helper

做法：

- 两条 action 全部改为：
  - `loadDatabaseUser()`
  - `ADMIN | ORGANIZER`
  - `assertManagedRaceActionAccess()`
- 之后再分别调用：
  - `enqueueProgressEvalTasks(raceId)`
  - `enqueueHarnessEvalTasks(raceId)`

优点：

- 改动最小
- 与最近几轮的内部维护动作收口方式一致

缺点：

- Admin 目前未必能直接从 Organizer Console 看到这些按钮，但 action 边界先被收口

### 推荐方案

采用 **方案 A**。

## 用户可见变化

本轮落地后：

1. Organizer 仍可对自己赛事运行兼容 progress / harness 评估
2. 非本赛事 Organizer 即使知道 `raceId`，也不能再跨赛事触发这两条兼容链路
3. Admin 可以按 system scope 执行同类维护动作

## 测试对齐

需要覆盖：

- 新增 `src/app/actions.compatibility-runner-system-scope.test.ts`
  - 两条 action 已从 Organizer-only 改为 `ADMIN | ORGANIZER`
  - 调用前已执行 `assertManagedRaceActionAccess()`

验证命令：

```bash
node --import tsx --test src/app/actions.compatibility-runner-system-scope.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. compatibility runner eval 已按内部维护动作的 `managed race | system` 工作
2. foreign organizer 无法跨赛事触发这两条动作
3. admin/system 可以触发这两条动作
4. 聚焦测试通过

## 一句话结论

这一轮要修的是兼容 Runner 评估入口的边界：它虽然不是正式主链路，但文档已经明确它只是兼容 / 维护链路，因此不应继续停留在“任何 Organizer 角色都可触发”的入口状态。
