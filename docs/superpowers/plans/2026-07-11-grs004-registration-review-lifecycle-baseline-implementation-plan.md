# GRS004 / Registration Review Lifecycle Baseline Implementation Plan

## 实施步骤

✅ 补设计文档
✅ 更新 `src/lib/registration-helpers.ts`
✅ 更新 `src/lib/services/registrations.ts`
✅ 新增 `approveRegistrationAction()` / `rejectRegistrationAction()`
✅ 更新 Organizer 报名列表 UI
✅ 更新 Public 报名页与 Rider Console 状态文案
✅ 补 / 改测试
✅ 跑聚焦验证
✅ 跑 `npm run build`
✅ 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/lib/registration-helpers.test.ts src/lib/services/registration-review-flow.test.ts src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 完成标准

- 新报名默认 `SUBMITTED`
- `approve / reject` 已具备 `managed race | system` 动作边界
- 只有 `APPROVED` 才生成 `RaceProject` 与兼容 `Team`
- UI、测试、状态文档同步完成

## 本轮结果

- 公开报名已从“直接 approved”收口为“先 submitted，等待主办方审核”
- Organizer 报名列表已出现 `批准报名 / 拒绝报名`
- `RaceProject` 与兼容 `Team` 只在 `approved` 后生成
- 聚焦测试与 `npm run build` 已通过
