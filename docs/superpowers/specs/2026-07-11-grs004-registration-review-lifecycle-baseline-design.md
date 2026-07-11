# GRS004 / Registration Review Lifecycle Baseline Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.2 Registration`
    - `submit`: Rider `own`
    - `approve`: Organizer `managed race`, Admin `system`
    - `reject`: Organizer `managed race`, Admin `system`
    - `withdraw`: 后续再补
- `docs/grs004/ary-mvp.prd.md`
  - `Registration Status`：`submitted / approved / rejected / withdrawn`
  - `Registration approved 后由 ARY 自动生成 RaceProject`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Registration Flow`：报名、审核、确认参赛、退赛
  - `已批准 Registration 应有且仅有一个 RaceProject`

当前真实缺口：

- `src/lib/services/registrations.ts`
  - `registerForRace()` 目前会把新报名直接写成 `APPROVED`
  - 同时直接创建 `RaceProject` 与兼容 `Team`
- `src/app/actions.ts`
  - 当前没有 `approveRegistrationAction()` / `rejectRegistrationAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - 报名列表当前只有只读状态，没有审核动作
- `src/app/_components/public/race-register-page.tsx`
  - 文案仍把点击报名解释成“直接生成后续参赛上下文”
- `src/app/_components/console/rider-console-page.tsx`
  - 当前逻辑主要靠 “是否存在 RaceProject / Team” 判断是否解锁后续入口

这与 GRS004 文档中的 `submitted -> approved / rejected` 正式审核流不一致。

## 范围

### 本轮纳入

- 把公开报名入口从“直接 approved”改回“先 submitted”
- 新增 Organizer/Admin 的 `approve / reject` 动作
- 仅在 `approved` 后生成：
  - `RaceProject`
  - 兼容 `Team`
- Rider 侧同步状态收口：
  - `submitted` 显示等待审核
  - `rejected` 显示未通过
  - 只有 `approved` 才解锁后续参赛上下文

### 本轮不纳入

- `withdraw` 正式闭环后续单独切片补
- 不重做 Organizer Console IA
- 不重做 Registration 数据模型
- 不删除兼容 `Team` 层

## 约束

- `RaceProject` 只能在 `Registration.status === APPROVED` 后创建
- `registerForRace()` 必须保持幂等，不得重复创建 `Registration`
- 审批动作要走 `managed race | system`
- 兼容 `Team` 仍保留，但只能在 approved 后创建

## 方案

### 方案 A：在现有 `registerForRace()` 基础上收口正式审核流

做法：

- 修改 `planRegistrationBridgeFlow()`
  - 新报名默认状态改成 `SUBMITTED`
  - 只有 `APPROVED` 才 `ensureRaceProject / ensureCompatibilityTeam`
- 在 `registrations.ts` 新增：
  - `approveRegistrationForRace()`
  - `rejectRegistrationForRace()`
  - 以及对应 managed helper
- 在 `actions.ts` 新增：
  - `approveRegistrationAction()`
  - `rejectRegistrationAction()`
- Organizer 报名列表为 `SUBMITTED` 项显示审核按钮
- Rider / Public 报名页改为状态化展示

优点：

- 改动面可控
- 最大程度复用现有 Registration / RaceProject / Team 结构
- 与文档语义直接对齐

缺点：

- `withdraw` 还留在下一轮

### 推荐方案

采用 **方案 A：先补正式审核基线**。

## 用户可见变化

本轮落地后：

1. Rider 点击“报名参赛”后不再直接进入 approved，而是先进入 `submitted`
2. Organizer 在报名列表里可以对待审核报名执行 `approve / reject`
3. 只有审核通过后：
   - Rider 才看到正式 `RaceProject`
   - `CA setup`
   - 作品提交入口
4. 被拒绝的报名会明确显示状态，不再伪装成已进入正式参赛上下文

## 测试对齐

需要覆盖：

- `src/lib/registration-helpers.test.ts`
  - 新报名默认 `SUBMITTED`
- 新增 `src/lib/services/registration-review-flow.test.ts`
  - submit -> submitted
  - approve -> approved + RaceProject + Team
  - reject -> rejected + no RaceProject
  - foreign organizer 拒绝
  - admin/system 成功
- 新增 `src/app/actions.registration-review-system-scope.test.ts`
  - approve / reject action 为 `ADMIN | ORGANIZER` 双入口
- 更新：
  - `src/app/_components/public/race-register-page.test.tsx`
  - `src/app/_components/console/rider-console-page.test.tsx`
  - `src/app/_components/console/organizer-console-page.test.tsx`

验证命令：

```bash
node --import tsx --test src/lib/registration-helpers.test.ts src/lib/services/registration-review-flow.test.ts src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx
```

## 验收对齐

本轮完成后，需要能证明：

1. 新报名默认进入 `SUBMITTED`
2. `APPROVED` 才生成 `RaceProject`
3. Organizer/Admin 能按 `managed race | system` 审核报名
4. Rider 侧不会再把未审核报名误显示为正式参赛上下文

## 一句话结论

这一轮不是扩张报名功能，而是把 `Registration` 从“公开页一按就直接 approved”的兼容流，收口回 GRS004 文档要求的最小正式审核闭环。
