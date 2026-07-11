# GRS004 / Organizer Runner Compatibility Copy Demotion Implementation Plan

## 目标

把 Organizer 页面上仍然把 Runner 评估写成主流程的文案降级为“兼容工具”。

## 任务拆分

### Task 1: 先补失败测试

- [ ] `src/app/_components/console/organizer-console-page.test.tsx`
  - 不再出现 `Process Evaluation`
  - 不再出现 `Published Skill Signals`
  - 新增：
    - `兼容 Runner 工具`
    - `兼容 Skill Signals`
    - `正式榜单发布应基于 Award / Leaderboard`

### Task 2: 修改 Organizer 页面文案

- [ ] `src/app/_components/console/organizer-console-page.tsx`
  - `judging` section 的 Runner 面板改成兼容链路表述
  - `awards` section 的 skill signals 改成兼容命名
  - 空状态中文化

### Task 3: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-organizer-runner-compatibility-copy-demotion-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-organizer-runner-compatibility-copy-demotion-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 完成标准

- Organizer 页面不再把 Runner 评估写成主流程
- 兼容 Runner 与兼容 Skill Signals 都有明确定位
- 测试与构建通过
