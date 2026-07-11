# GRS004 / Race Archive System Scope Alignment Implementation Plan

## 目标

把当前对外暴露的 `clearRaceAction()` / `clearRace()` 删除语义，对齐到 `docs/grs004/ary-permission-matrix.md` 与领域文档要求的 `Race.archive` 语义。

## 任务拆分

### Task 1: 先补失败测试

- [ ] 新增 `src/app/actions.race-archive-system-scope.test.ts`
- [ ] 新增 `src/lib/services/race-archive-scope.test.ts`
- [ ] 扩展 `src/lib/public-site.test.ts`
- [ ] 覆盖：
  - action wiring 已是 `ADMIN | ORGANIZER`
  - foreign organizer 拒绝
  - admin/system 成功归档
  - 非赛后阶段拒绝
  - `archived` 继续进入赛后公开入口

### Task 2: 对齐 action、service 与 UI

- [ ] 修改 `src/app/actions.ts`
- [ ] 修改 `src/lib/services/races.ts`
- [ ] 修改 `src/app/_components/console/organizer-console-page.tsx`
- [ ] 用 `archiveRaceAction()` / `archiveRace()` 替代当前清空入口

### Task 3: 对齐 public-site 赛后入口

- [ ] 修改 `src/lib/public-site.ts`
- [ ] 将 `finished/completed/archived` 一起视作赛后赛事

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/app/actions.race-archive-system-scope.test.ts src/lib/services/race-archive-scope.test.ts src/lib/public-site.test.ts`
- [ ] 补跑：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.race-archive-system-scope.test.ts src/lib/services/race-archive-scope.test.ts src/lib/public-site.test.ts
```

## 完成标准

- 当前对外入口不再删除赛事而是归档赛事
- `Race.archive` 已按 `managed race | system` 工作
- 归档只能发生在赛后
- `archived` 继续出现在赛后公开入口
- 聚焦测试和构建通过
