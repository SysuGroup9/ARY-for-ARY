# GRS004 / DEV-6 Screen Calibration Track Config Persistence Implementation Plan

**Goal:** 让 `Screen Console / calibration` 可以把当前校准结果保存回当前赛事的 `trackConfigJson`。

**Architecture:** 新增最小服务层更新函数，继续沿用现有 `Race.trackConfigJson` 结构；校准器嵌入模式下新增“保存到当前赛事”表单，并用当前赛事有效赛道配置作为初始值。

**Tech Stack:** Next.js Server Actions、React Client Component、TypeScript、现有 `track-config` helper、Node test (`tsx`)

---

## Task 1: TDD - 保存入口与服务层测试

- [ ] 扩展 `src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 新增 `src/lib/services/race-track-calibration.test.ts`
- [ ] 覆盖：
  - 校准模式出现 `保存到当前赛事`
  - organizer 可更新 `trackConfigJson`
  - 未授权用户被拒绝
- [ ] 运行测试确认失败

## Task 2: 服务层实现

- [ ] 在 `src/lib/services/races.ts` 新增最小 track calibration 更新函数
- [ ] 只保存：
  - `startFinish`
  - `checkpoints`
- [ ] 保存后清除稳定 snapshot

## Task 3: Screen Console 接入

- [ ] 在 `src/app/actions.ts` 新增对应 action
- [ ] 更新 `CalibratorState` / `CalibratorClient`
  - 支持从当前赛事有效配置初始化
  - 支持提交保存到当前赛事
- [ ] 更新 `screen-console-page.tsx`
  - 向嵌入校准器传入初始 profile 与保存 action

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/console/screen-console-controls.test.tsx src/lib/services/race-track-calibration.test.ts`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `Screen Console / calibration` 已能保存到当前赛事
- `Race.trackConfigJson` 成为该保存动作的正式持久化入口
- 没有新增新模型
- 测试与构建全部通过
