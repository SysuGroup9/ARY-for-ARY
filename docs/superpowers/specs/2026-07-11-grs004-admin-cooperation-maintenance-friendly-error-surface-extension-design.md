# GRS004 / Admin Cooperation Maintenance Friendly Error Surface Extension Design

## 目的

继续按 `docs/grs004` 的 P0 核心链路补齐统一友好报错，这一轮覆盖仍然直接面向用户和运营动作的剩余入口：

- Admin `User.roles` 维护
- Console 新建赛事
- Cooperation 办赛申请
- Admin 办赛申请审批
- Organizer `CA Status`
- Organizer `Maintenance`

同时修复一个真实核心功能缺口：合作申请页的附件字段名与 server action 读取字段不一致，导致题目包和方案文档无法正确进入后端。

## 依据

- `docs/grs004/ary-mvp.prd.md`
  - `Admin Console` 需要支持最小账号治理
  - `Race Console / Organizer View` 需要支持创建赛事、维护 CA 状态、维护赛事
  - `Cooperation` 仍是 P0 公开入口的一部分
- `docs/grs004/ary.plan.md`
  - `DEV-3` 包含角色治理与 Race Console 入口
  - `DEV-4` 包含赛事创建
  - `DEV-5` 包含 CA 接入状态与重建
  - `DEV-2` 包含 Cooperation 公开入口
- 当前仓库已存在统一错误表面基础设施
  - `src/lib/action-feedback.ts`
  - `ErrorNotice`
  - route-level `feedbackScope / feedbackMessage`

## 本轮范围

### 纳入

- `updateUserRolesAction`
- `createRaceAction`
- `cooperationRequestAction`
- `approveCooperationRequestAction`
- `rejectCooperationRequestAction`
- `disableCAConnectionAction`
- `enableCAConnectionAction`
- `rebuildProcessModelsAction`
- `generateRaceSnapshotAction`
- `archiveRaceAction`

### 同轮修复

- `src/app/_components/cooperation-form.tsx`
  - `taskPackageFile`
  - `proposalFile`
  两个文件字段名与后端 action 对齐

### 暂不纳入

- `sendFeedbackAction`
- `replyFeedbackAction`
- judging 分区里的兼容 runner 按钮
- runner callback / API 层

这些动作依然需要后续继续收口，但本轮优先仍然是 `docs/grs004` 里更核心、更高频的创建、治理、申请、CA 状态和维护入口。

## 设计

### 1. 扩展 action feedback scopes

扩展 `src/lib/action-feedback.ts`：

- `admin_roles`
- `create_race`
- `cooperation_request`
- `admin_race_requests`
- `organizer_ca_status`
- `organizer_maintenance`

并补齐：

- 对应标题
- 典型英文技术错误到中文提示的映射
- 对应 scope 的 fallback 文案
- `screen_console` 归一化漏项修复

### 2. 页面级反馈承载

给以下页面接入 route-level feedback：

- `src/app/console/admin/[section]/page.tsx`
- `src/app/console/races/new/page.tsx`
- `src/app/cooperation/page.tsx`

页面职责保持一致：

- 读取 `feedbackScope / feedbackMessage`
- 调 `getActionFeedbackContent()`
- 用既有 `ErrorNotice` 呈现

### 3. 表单 returnTo 链路

为以下表单补齐 `returnTo`：

- admin roles 表单
- create race 表单
- cooperation 表单
- cooperation request approve / reject 表单
- organizer `ca-status` disable / enable / rebuild 表单
- organizer `maintenance` snapshot / archive 表单

要求是：

- 失败时留在当前页面
- 成功时也回到当前合理工作流，而不是掉回 `/`

### 4. action 行为

统一改成：

- 成功
  - `revalidatePath(...)`
  - `redirect(returnTo)` 或跳到新赛事的 organizer overview
- 失败
  - redirect error 继续 rethrow
  - 其他错误统一走 `buildActionFeedbackHref(...)`

create race 是本轮唯一特例：

- 失败时回 `/console/races/new`
- 成功时跳到新赛事 `/console/races/{slug}/organizer/overview`

### 5. cooperation 成功态修复

`cooperationRequestAction` 本来就会 redirect 到 `/cooperation?submitted=1`，但页面并没有真正消费这个 query state。

本轮同时把 `submitted=1` 接回页面，让成功态由 route state 驱动，而不是依赖 client 侧 `setSubmitted(true)`。

## 用户可见结果

- Admin 改角色失败时，会留在 `/console/admin/roles` 显示页内错误卡片
- Organizer 创建赛事失败时，会留在 `/console/races/new` 显示页内错误卡片
- 创建赛事成功后，会直接进入新赛事 organizer workspace
- Cooperation 申请失败时，会留在 `/cooperation` 显示页内错误卡片
- Cooperation 申请成功后，`/cooperation?submitted=1` 会真正显示成功态
- Cooperation 附件字段现在会正确进入 server action
- Admin 审批办赛申请失败时，会留在 `/console/admin/race-requests`
- Organizer 在 `ca-status / maintenance` 里的失败不再暴露原始异常

## 验证

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/new/page.test.tsx" "src/app/console/admin/[section]/page.test.ts" "src/app/cooperation/page.test.ts" "src/app/_components/create-race-form-client.test.tsx" "src/app/_components/cooperation-form.test.tsx" "src/app/_components/console/admin-console-page.test.tsx" "src/app/_components/console/race-requests-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 一句话结论

本轮把 admin、create race、cooperation、CA status、maintenance 这些还没收口的核心入口接进统一友好报错体系，并顺手修掉了 cooperation 附件字段失配这个真实功能缺口。
