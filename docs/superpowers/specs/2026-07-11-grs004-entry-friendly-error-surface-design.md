# GRS004 / Entry Friendly Error Surface Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.prd.md`
  - 登录后进入报名、提交和评审流程
  - Public Site 与 Console 是正式用户体验面，不应让用户直接面对原始异常
- `docs/grs004/ary-mvp.ia.md`
  - `/login` 是正式身份入口
  - `Profile Setup` 是资料补全入口
- `docs/grs004/ux-hifi.taskbook.md`
  - 页面应具备可理解性，不把后台/技术实现直接暴露给用户

当前代码现状：

- `loginAction`、`registerAction`、`completeProfileAction` 直接调用 service
- `users.ts` 与 `completeUserProfile()` 的异常会直接向上抛出
- 用户输入错误账号密码、用户名重复或资料补全字段无效时，缺少统一友好提示
- 应用根目录也没有统一的 `app/error.tsx` / `global-error.tsx` 兜底

## 范围

### 本轮纳入

- `login / register / profile` 三条身份入口链路的友好错误展示
- 全局错误兜底页面
- 统一错误码与提示映射 helper

### 本轮不纳入

- 不一次性改造所有 organizer / rider / judge form action
- 不改业务 service 的成功路径
- 不引入新的 toast 系统
- 不改 GitHub OAuth 成功路径

## 落地规则

### 统一错误码层

新增 `src/lib/entry-feedback.ts`，提供：

- `EntryFeedbackError`
- `buildEntryFeedbackHref()`
- `resolveEntryFeedbackCode()`
- `getEntryFeedbackContent()`

错误码最小集合：

- `invalid_credentials`
- `username_taken`
- `local_auth_disabled`
- `validation_failed`
- `profile_validation_failed`
- `unexpected`

### 身份入口 action

- `registerAction`
  - service 报错后不再把原始异常直接抛给用户
  - 改为重定向回 `/login?feedbackCode=...&feedbackMode=register`
- `loginAction`
  - 错误账号 / 密码时返回 `/login?feedbackCode=invalid_credentials&feedbackMode=login`
- `completeProfileAction`
  - 表单验证失败时返回 `/profile?feedbackCode=profile_validation_failed`

### service 侧最小结构化错误

- `registerUser()` / `loginUser()` 不再依赖原始中文异常文本给页面判断
- 改为抛 `EntryFeedbackError`

### 页面展示

- `/login`
  - 读取 `feedbackCode / feedbackMode`
  - 使用共享 `ErrorNotice` 展示友好提示
  - 注册失败时默认切回注册 tab
- `/profile`
  - 读取 `feedbackCode`
  - 使用同一套 `ErrorNotice` 展示资料补全失败提示

### 全局兜底

新增：

- `src/app/error.tsx`
- `src/app/global-error.tsx`

作用：

- 对未被页面主动接住的异常提供统一错误界面
- 不再把默认原始异常界面直接暴露给用户
- 提供重试和返回公开首页入口

## 用户可见结果

- 账号或密码错误时，用户看到的是“账号或密码错误，请检查后重试。”
- 用户名重复时，用户看到的是“该用户名已被占用，请更换后重试。”
- 资料补全字段不合法时，用户看到的是统一错误卡片，而不是原始异常
- 未接住的页面异常也会落到统一错误页

## 测试对齐

- 新增：
  - `src/lib/entry-feedback.test.ts`
  - `src/app/error-boundary.test.tsx`
- 更新：
  - `src/app/_components/public/public-auth-entry-regression.test.tsx`
  - `src/app/_components/public/public-copy-cleanup.test.tsx`
  - `src/app/profile/page.test.tsx`
  - `src/app/actions.return-to.test.ts`

验证命令：

```bash
node --import tsx --test src/lib/entry-feedback.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/app/profile/page.test.tsx src/app/actions.return-to.test.ts src/app/error-boundary.test.tsx
npm run build
```

## 一句话结论

这一轮先把“身份入口主链路 + 全局错误兜底”收口成统一的友好错误界面，为后续把同样模式扩展到其他表单动作打基础。
