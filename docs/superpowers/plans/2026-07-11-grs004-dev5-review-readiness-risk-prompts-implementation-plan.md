# GRS004 / DEV-5 Review Readiness 风险提示 Implementation Plan

## 目标

把 `Review Flag / Review Readiness` 从文档约束推进成真实界面输出：Organizer 和 Judge 在评审前都能看到基于现有字段合成的最小风险提示。

## 任务拆分

### Task 1: 抽出统一 helper

- [ ] 新增 `src/lib/review-readiness-helpers.ts`
- [ ] 输出：
  - `status`
  - `reasons`
  - `evidenceFlagCodes`
  - evidence 计数
- [ ] 规则先覆盖：
  - `aggregateIngestionStatus`
  - `Evidence.reviewFlagJson`
  - `Evidence.integrityStatus`
  - `Evidence.confidenceLevel`
  - `Work.title / Work.summary`
- [ ] 增加 `src/lib/review-readiness-helpers.test.ts`

### Task 2: 补统一渲染卡片

- [ ] 新增 `src/app/_components/console/review-readiness-card.tsx`
- [ ] 使用统一文案输出：
  - `评审前风险提示`
  - `Status Badge`
  - `Review Reason`
  - `Review Flag`

### Task 3: 接入 Organizer

- [ ] `src/app/_components/console/organizer-console-page.tsx`
  - 在 `registrations` section 接入 `ReviewReadinessCard`
- [ ] `src/app/_components/console/organizer-console-page.test.tsx`
  - 覆盖 Organizer 视图中的风险提示输出

### Task 4: 接入 Judge

- [ ] `src/lib/services/judging.ts`
  - Judge assignment 查询补 `registration.raceProject`
- [ ] `src/app/_components/console/judge-console-page.tsx`
  - 在 assignment 卡片中接入 `ReviewReadinessCard`
- [ ] 新增 `src/app/_components/console/judge-console-page.test.tsx`

### Task 5: 文档同步

- [ ] 新增 design：
  - `docs/superpowers/specs/2026-07-11-grs004-dev5-review-readiness-risk-prompts-design.md`
- [ ] 新增 implementation plan：
  - `docs/superpowers/plans/2026-07-11-grs004-dev5-review-readiness-risk-prompts-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/review-readiness-helpers.test.ts src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/console-copy.test.tsx
npm run build
```

## 完成标准

- Review Readiness helper 已落地
- Organizer 和 Judge 都能看到风险提示
- 风险提示不暴露原始 CA Session
- 风险提示不阻断评审、不自动替代人工评分
- 聚焦测试与构建通过
