# GRS004 / Screen Console Managed Race Scope Implementation Plan

## 目标

让 `Screen Console` 详情页与列表页共用同一套 `managed race` 过滤，避免 Organizer 通过手工改 slug 进入他并不负责的赛事大屏控制页。

## 任务拆分

### Task 1: 先补 service 级失败用例

- [ ] 修改 `src/lib/services/console-routes.test.ts`
- [ ] 覆盖：
  - Organizer screen list 返回自己负责的赛事
  - Organizer 读取非自己赛事的 screen slug 返回 `null`
  - Admin 读取 screen slug 成功

### Task 2: 增加 scoped helper

- [ ] 修改 `src/lib/services/console-routes.ts`
- [ ] 新增：
  - `getScreenConsoleRaceBySlugForUser()`
- [ ] 复用现有 `listScreenConsoleRacesForUser()` 过滤逻辑

### Task 3: 接入 Screen Console 详情页

- [ ] 修改 `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
- [ ] 改为使用 scoped helper

### Task 4: 验证与状态同步

- [ ] 运行：
  - `node --import tsx --test src/lib/services/console-routes.test.ts`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/lib/services/console-routes.test.ts
```

## 完成标准

- Screen Console 详情页查询已按 `managed race` 过滤
- Organizer 不能读取别人的 screen race
- Admin 仍可读取全部 screen race
- 聚焦测试通过
