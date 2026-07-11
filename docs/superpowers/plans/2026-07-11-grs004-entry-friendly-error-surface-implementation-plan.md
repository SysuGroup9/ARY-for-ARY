# GRS004 / Entry Friendly Error Surface Implementation Plan

## 实施步骤

- [x] 核对 `docs/grs004` 中身份入口与正式用户体验面的要求
- [x] 确认 `login / register / profile` 目前仍会直接暴露原始异常
- [x] 补设计文档
- [x] 新增统一错误码与跳转 helper `entry-feedback.ts`
- [x] 将 `users.ts` 登录 / 注册错误改成结构化 `EntryFeedbackError`
- [x] 为 `registerAction` / `loginAction` / `completeProfileAction` 补友好错误跳转
- [x] 为 `/login` 补共享错误提示界面
- [x] 为 `/profile` 补共享错误提示界面
- [x] 新增 `app/error.tsx` 与 `app/global-error.tsx` 全局兜底
- [x] 新增 / 更新回归测试
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`
- [x] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/entry-feedback.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/app/profile/page.test.tsx src/app/actions.return-to.test.ts src/app/error-boundary.test.tsx
npm run build
```

## 本轮结果

- 身份入口主链路不再把账号密码错误、用户名冲突、资料补全验证错误直接炸给用户
- 未接住的异常现在至少会落到统一错误页
- 这一轮还没有把同样模式扩展到全部 organizer / rider / judge 表单动作
