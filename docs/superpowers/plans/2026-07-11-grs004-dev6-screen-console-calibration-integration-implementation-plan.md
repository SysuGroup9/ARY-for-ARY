# GRS004 / DEV-6 Screen Console Calibration Integration Implementation Plan

**Goal:** 把 `/console/screen/{raceSlug}/calibration` 从占位说明收口成真正可用的校准工作区。

**Architecture:** 继续复用现有 `CalibratorClient` 和独立 `/calibrator` 路由，只为校准器补一个可嵌入布局，然后在 `ScreenConsolePageView` 的 `calibration` 模式中直接渲染。

**Tech Stack:** Next.js App Router、React Client Component、TypeScript、Node test (`tsx`)

---

## Task 1: TDD - Screen Console calibration 测试

- [ ] 扩展 `src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 覆盖：
  - `校准工作区`
  - `导入底图`
  - `导出当前 Profile`
  - 不再出现旧占位文案
- [ ] 运行测试确认失败

## Task 2: 让校准器支持嵌入

- [ ] 更新 `src/app/calibrator/CalibratorClient.tsx`
- [ ] 新增可选 `embedded` 布局模式
- [ ] 保持独立 `/calibrator` 路由行为不变

## Task 3: 接入 Screen Console calibration 模式

- [ ] 更新 `src/app/_components/console/screen-console-page.tsx`
  - `mode === "calibration"` 时渲染 `CalibratorClient`
  - 校准模式文案从占位说明改为真实工作区说明

## Task 4: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- `/console/screen/{raceSlug}/calibration` 已不再只是占位说明
- 现有校准器已进入 Screen Console 工作流
- 没有新增新的校准持久化模型
- 测试与构建全部通过
