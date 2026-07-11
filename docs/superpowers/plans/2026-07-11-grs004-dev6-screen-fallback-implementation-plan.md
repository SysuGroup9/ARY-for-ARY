# GRS004 / DEV-6 大屏 fallback 机制 Implementation Plan

## 目标

让 `Live Hall`、`Screen Console` 的 Jumbotron 预览和 `/jumbotron/[raceId]` 不再直接硬依赖实时 snapshot：读取失败时优先回退到最近一次稳定 snapshot，无稳定 snapshot 时继续回退到静态公告 / 榜单 / 公开作品入口。

## 任务拆分

### Task 1: 统一 snapshot fallback helper

- [ ] 在 `src/lib/services/race-snapshot.ts` 增加：
  - `resolveRaceSnapshotForDisplay()`
- [ ] 规则：
  - 先尝试 live snapshot
  - 成功时刷新稳定 snapshot 文件
  - 失败时读稳定 snapshot
  - 再失败时返回 static fallback
- [ ] 增加 `src/lib/services/race-snapshot.test.ts`

### Task 2: 接入 Live Hall

- [ ] `src/app/races/[raceSlug]/live/page.tsx`
  - 改为使用统一 fallback helper
- [ ] `src/app/_components/public/live-hall.tsx`
  - 增加：
    - 稳定 snapshot 提示
    - 静态 fallback 展示
- [ ] `src/app/_components/public/live-hall.test.tsx`
  - 覆盖静态 fallback 输出

### Task 3: 接入 Screen Console 预览

- [ ] `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
  - Jumbotron 预览改为使用统一 fallback helper
- [ ] `src/app/_components/console/screen-console-page.tsx`
  - 增加：
    - 稳定 snapshot 提示
    - 静态 fallback 提示
    - `announcement / leaderboard` 快速切换入口
- [ ] `src/app/_components/console/console-copy.test.tsx`
  - 覆盖新的 fallback copy

### Task 4: 接入 `/jumbotron/[raceId]`

- [ ] `src/app/jumbotron/[raceId]/page.tsx`
  - 目标赛事 snapshot 不可用时切到全屏静态 fallback
- [ ] `src/app/JumbotronBanner.tsx`
  - 稳定 snapshot 条目标记为 `稳定快照 fallback`

### Task 5: 文档同步

- [ ] 新增 design:
  - `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-fallback-design.md`
- [ ] 新增 implementation plan:
  - `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-fallback-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/services/race-snapshot.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx
npm run build
```

## 完成标准

- 统一 fallback helper 已落地
- Live Hall / Screen Console / Jumbotron 已接入统一 fallback 读取
- 稳定 snapshot 与静态 fallback 两种降级路径都能被用户直接感知
- fallback 不读取原始 CA Session，不改核心事实数据
- 定向测试与构建通过
