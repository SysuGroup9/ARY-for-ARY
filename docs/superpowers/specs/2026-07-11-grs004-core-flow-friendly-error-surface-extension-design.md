# GRS004 / Core Flow Friendly Error Surface Extension Design

## 目的

本设计承接已有的 `Entry friendly error surface`，继续把统一友好报错从身份入口扩展到当前 GRS004 最核心的真实操作链路：

- public 公开报名页
- rider 报名 / CA 接入 / 作品提交
- organizer 报名审核 / 作品公开控制

目标不是引入新的交互系统，而是保持现有页面风格不变，把“原始异常 / 技术错误文案”收口成页内统一错误卡片。

## 依据

- `docs/grs004/ary-mvp.prd.md`
  - 用户应能完成正式报名、提交、评审和公开展示链路
  - 页面不应把底层异常直接暴露给用户
- `docs/grs004/ary-mvp.ia.md`
  - `Race Register`
  - `Rider Console`
  - `Organizer Console`
- 当前仓库已有实现
  - `src/lib/entry-feedback.ts`
  - `src/app/error.tsx`
  - `src/app/global-error.tsx`
  - `src/app/_components/ary-shared.tsx` 中的 `ErrorNotice`

## 本轮范围

### 纳入

- `public register` 页读 `feedbackScope / feedbackMessage`
- `rider console` 页读 `feedbackScope / feedbackMessage`
- `organizer console` 页读 `feedbackScope / feedbackMessage`
- `registerForRaceAction`
- `withdrawRegistrationAction`
- `registerCAConnectionAction`
- `fetchCASnapshotAction`
- `rotateCAConnectionSecretAction`
- `submitEntryAction`
- `submitFinalEntryAction`
- `saveWorkDraftAction`
- `approveRegistrationAction`
- `rejectRegistrationAction`
- `publishWorkAction`
- `hideWorkAction`
- `lockWorkAction`

### 不纳入

- 本轮不把所有 organizer / judge / admin action 全部一次性收口
- 不引入 toast、modal 或新的全局通知系统
- 不重写 service 层错误建模，只对高频主链路做最小映射

## 设计

### 1. 统一 action feedback helper

新增 / 扩展 `src/lib/action-feedback.ts`：

- `ActionFeedbackScope`
  - `public_register`
  - `rider_registration`
  - `rider_ca_setup`
  - `rider_submission`
  - `organizer_registration`
  - `organizer_works`
- `buildActionFeedbackHref()`
- `getActionFeedbackContent()`
- `shouldRethrowActionFeedback()`

原则：

- redirect error 继续原样抛出
- 技术错误映射为用户可理解的中文提示
- 已经是可读中文业务错误时，允许直接透传
- scope 决定错误卡片标题

### 2. 页面层接线

三个页面读取 query 参数并渲染统一错误卡片：

- `src/app/races/[raceSlug]/register/page.tsx`
- `src/app/console/races/[raceSlug]/rider/[section]/page.tsx`
- `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx`

页面只负责：

- 读取 `feedbackScope / feedbackMessage`
- 调 `getActionFeedbackContent()`
- 把结果传给对应 view 组件

view 组件只负责：

- 通过 `ErrorNotice` 渲染页内错误卡片
- 保持与原有页面风格一致

### 3. 表单回跳规则

为相关表单补隐藏字段，确保失败后回到正确页面：

- public register
  - `feedbackReturnTo=/races/{raceSlug}/register`
- rider registration
  - `feedbackReturnTo=/console/races/{raceSlug}/rider/registration`
- rider CA setup
  - `returnTo=/console/races/{raceSlug}/rider/ca-setup`
- rider submission
  - `returnTo=/console/races/{raceSlug}/rider/submission`
- organizer registrations
  - `returnTo=/console/races/{raceSlug}/organizer/registrations`
  - organizer withdraw 用 `feedbackReturnTo`
- organizer works
  - `returnTo=/console/races/{raceSlug}/organizer/works`

### 4. action 行为

这些 action 改为：

- 成功：
  - 继续 `revalidatePath(...)`
  - 然后 `redirect(returnTo)`
- 失败：
  - 对 redirect error 直接 rethrow
  - 其它错误 redirect 到 `buildActionFeedbackHref(...)`

### 5. 最小错误映射

本轮补的高频映射包括：

- 报名阶段不合法
- 无权限处理报名
- 报名已撤回 / 已拒绝 / 已通过导致的状态冲突
- CA 快照抓取失败 / 签名问题 / 配置问题
- 无权限处理作品
- 草稿作品不能直接公开
- 已锁定作品不能继续修改

## 用户可见结果

- public 报名失败时，用户会留在公开报名页，并看到页内错误卡片
- rider 在报名、CA 接入、提交失败时，会留在当前 console 分区，并看到统一错误卡片
- organizer 在审核报名或控制作品失败时，也会留在当前 console 分区，并看到统一错误卡片
- 所有这些提示都复用现有 `ErrorNotice` 样式，不引入新的视觉系统

## 验证

聚焦验证：

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/races/[raceSlug]/register/page.test.ts" "src/app/console/races/[raceSlug]/rider/[section]/page.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/_components/public/race-register-page.test.tsx" "src/app/_components/console/rider-console-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 一句话结论

本轮把统一友好报错从身份入口推进到了当前 GRS004 的核心操作链路，覆盖 public register、rider console 和 organizer 核心流，重点解决“失败时直接炸原始异常”的问题，同时保持原有页面风格不变。
