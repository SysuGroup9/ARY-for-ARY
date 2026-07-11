# GRS004 / Registration Withdraw And Approved Participation Gating Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.2 Registration`
    - `withdraw`
    - Rider: `own before locked`
    - Organizer: `managed race exception`
    - Admin: `system exception`
- `docs/grs004/ary-permission-matrix.md`
  - `3.3 RaceProject`
    - `register_ca_connection`: own approved registration during race participation
    - `manage_ca_connection`: own connection metadata
    - `sync_status`: own status
- `docs/grs004/ary-mvp.prd.md`
  - `Registration approved 后由 ARY 自动生成 RaceProject`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Registration Flow`: 报名、审核、确认参赛、退赛

上一轮已经补了 `submitted -> approved / rejected` 审核基线，但仍有两个显式缺口：

1. `withdraw` 还没有正式动作闭环
2. Rider 侧正式参赛上下文虽然 UI 已按 `APPROVED` 隐藏，但 service 层仍有部分入口没有强制要求 `APPROVED`
   - `createCAConnectionForRaceProject()`
   - `rotateCAConnectionSecretForRider()`

## 范围

### 本轮纳入

- 新增 `withdrawRegistrationAction()` 与 `withdrawRegistrationForRace()`
- Rider 允许在“报名锁定前”自行撤回
- Organizer/Admin 允许按 exception 撤回
- 将已批准参赛上下文的关键 Rider service 统一收口为 `APPROVED`
  - `createCAConnectionForRaceProject()`
  - `rotateCAConnectionSecretForRider()`
  - 与上一轮已补的：
    - `fetchCASessionSnapshotForConnection(userId)`
    - `createSubmission() / createFinalSubmission()`

### 本轮不纳入

- 不做 withdrawn 后重新报名 / 恢复报名
- 不删除历史 `RaceProject` / `Team`
- 不重做 console route 访问模型

## 关键约束

### 关于 “before locked”

文档里没有独立 `registrationLockedAt` 或 `registrationLockStatus`。

因此本轮采用当前项目里最小且可验证的映射：

- `own before locked` = `Race.phase === "registration"` 时，Rider 可自行撤回

这不是额外扩张规则，而是基于现有时间窗口状态机对文档词义做的最小落地。

### 关于正式参赛上下文

一旦 `Registration.status !== APPROVED`：

- 不应再继续开放新的 `CAConnection` 登记
- 不应允许轮换 connector secret
- 不应允许 snapshot fetch
- 不应允许作品提交

## 方案

- `withdrawRegistrationForRace()` 统一处理：
  - `RIDER own`
  - `ORGANIZER managed race exception`
  - `ADMIN system exception`
- Rider own 路径增加 `registration phase` 限制
- UI 上：
  - Public register page
  - Rider console registration
  - Organizer registrations
  - 同步补最小 withdraw 入口或状态展示
- `ca-connections.ts` 中 Rider self-service 路径统一补 `registration.status === "APPROVED"`

## 测试对齐

- 扩展 `src/lib/services/registration-review-flow.test.ts`
  - rider own withdraw during registration
  - organizer exception withdraw approved registration
  - rider own withdraw after lock rejected
- 扩展：
  - `src/app/actions.registration-review-system-scope.test.ts`
  - `src/app/_components/public/race-register-page.test.tsx`
  - `src/app/_components/console/rider-console-page.test.tsx`
  - `src/app/_components/console/organizer-console-page.test.tsx`
- 扩展：
  - `src/lib/services/ca-connection-audit.test.ts`
  - `src/lib/services/ca-rotation-disable.test.ts`

验证命令：

```bash
node --import tsx --test src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx
node --test-concurrency=1 --import tsx --test src/lib/services/registration-review-flow.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-rotation-disable.test.ts
```

## 一句话结论

这一轮是在报名审核基线之上，把 `withdraw` 和“只有 approved 才能继续使用正式参赛上下文”这两件事补完整。
