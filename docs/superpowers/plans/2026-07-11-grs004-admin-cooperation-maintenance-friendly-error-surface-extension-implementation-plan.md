# GRS004 / Admin Cooperation Maintenance Friendly Error Surface Extension Implementation Plan

## 实施步骤

- [x] 审计 admin / create race / cooperation / ca-status / maintenance 现有报错暴露点
- [x] 扩展 `src/lib/action-feedback.ts`
  - [x] 新增 `admin_roles / create_race / cooperation_request / admin_race_requests / organizer_ca_status / organizer_maintenance`
  - [x] 修复 `screen_console` 归一化漏项
  - [x] 补齐合作附件校验、CA operator 等英文技术错误映射
- [x] 改造 `src/app/actions.ts`
  - [x] `updateUserRolesAction`
  - [x] `createRaceAction`
  - [x] `cooperationRequestAction`
  - [x] `approveCooperationRequestAction`
  - [x] `rejectCooperationRequestAction`
  - [x] `disableCAConnectionAction`
  - [x] `enableCAConnectionAction`
  - [x] `rebuildProcessModelsAction`
  - [x] `generateRaceSnapshotAction`
  - [x] `archiveRaceAction`
- [x] 给 admin / create race / cooperation 页面接入 `ErrorNotice`
- [x] 给对应表单补齐 `returnTo`
- [x] 修复 cooperation 附件字段名与 server action 不一致
- [x] 让 `/cooperation?submitted=1` 真正驱动成功态显示
- [x] 新增/更新聚焦测试
- [x] 跑聚焦测试
- [x] 跑 `npm run build`
- [x] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/new/page.test.tsx" "src/app/console/admin/[section]/page.test.ts" "src/app/cooperation/page.test.ts" "src/app/_components/create-race-form-client.test.tsx" "src/app/_components/cooperation-form.test.tsx" "src/app/_components/console/admin-console-page.test.tsx" "src/app/_components/console/race-requests-page.test.tsx"
node --import tsx --test "src/app/_components/console/organizer-console-page.test.tsx"
npm run build
```

## 本轮结果

- Admin 角色维护动作现在有统一错误界面
- 新建赛事动作现在有统一错误界面，成功后直接进入新赛事 organizer overview
- Cooperation 页现在真正支持成功态与失败态
- Cooperation 附件字段现在能正确传进后端 action
- Organizer `ca-status` 和 `maintenance` 动作现在失败时会留在当前分区显示错误卡片
- judging 里的兼容 runner 按钮、feedback 线程动作和 runner API 仍待后续继续收口
