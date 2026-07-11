# GRS004 / Race Publish System Scope Alignment Implementation Plan

## 目标

把当前缺失的 `Race.publish` 生命周期动作，对齐到 `docs/grs004/ary-permission-matrix.md` 与领域文档要求的 `draft -> published -> registration -> running -> completed` 最小闭环。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.race-publish-system-scope.test.ts`
- [ ] 新增 `src/lib/services/race-publish-scope.test.ts`
- [ ] 扩展 `src/lib/services/public-routes.test.ts`
- [ ] 扩展 `src/lib/public-site.test.ts`
- [ ] 覆盖：
  - create 默认 draft
  - draft 不进入公开端
  - publish 按 `managed race | system` 工作
  - published phase 的 CTA / 分组符合公开语义

### Task 2: 对齐状态与公开端

- [ ] 修改 `src/lib/services/races.ts`
- [ ] 修改 `src/lib/race-phase.ts`
- [ ] 修改 `src/lib/services/public-routes.ts`
- [ ] 修改 `src/lib/public-site.ts`
- [ ] 修改 `src/app/_components/public/race-page.tsx`

### Task 3: 对齐 action 与主办方 UI

- [ ] 修改 `src/app/actions.ts`
- [ ] 修改 `src/app/_components/console/organizer-console-page.tsx`
- [ ] 新增 `publishRaceAction()` 与最小发布入口

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.race-publish-system-scope.test.ts src/lib/services/race-publish-scope.test.ts src/lib/services/public-routes.test.ts src/lib/public-site.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.race-publish-system-scope.test.ts src/lib/services/race-publish-scope.test.ts src/lib/services/public-routes.test.ts src/lib/public-site.test.ts
```

## 完成标准

- create 默认 draft
- draft 不进入公开端
- `publishRaceAction()` / `publishRace()` 已按 `managed race | system` 工作
- 发布后赛事进入公开端并按时间自动推进
- 聚焦测试和构建通过
