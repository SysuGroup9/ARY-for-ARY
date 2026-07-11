# GRS004 / DEV-7 Report Visibility and Publication Baseline Implementation Plan

## 目标

补最小 `Report` 主链路：Organizer 可以生成并发布 `race_report / review_summary`，Rider 可以私有读取自己的 `rider_report`，Public 不再越权读取 `rider_report`。

## 任务拆分

### Task 1: 先补失败测试

- [ ] `src/lib/services/reports-generation.test.ts`
  - 新增：生成当前 race 的 `rider_report / race_report / review_summary`
  - 新增：`subjectRegistrationId` 规则正确
  - 新增：`sourceRefJson / sourceDigest` 已冻结
- [ ] `src/lib/services/rider-console.test.ts`
  - 新增：Rider Console 可读当前 race 下未发布的私有 `rider_report`
- [ ] `src/lib/services/public-routes.test.ts`
  - 新增：Public Rider Profile 不再暴露 `rider_report`
- [ ] `src/app/_components/public/rider-profile-page.test.tsx`
  - 新增：不再渲染“已发布骑手报告”公开模块语义
- [ ] `src/app/_components/console/organizer-console-page.test.tsx`
  - 新增：`reports` section 出现生成/发布报告按钮

### Task 2: 实现报告服务

- [ ] `src/lib/services/reports.ts`
  - 新增 `listPrivateRiderReportsForUserInRace()`
  - 新增 `generateReportsForRace()`
  - 新增 `publishReportForRace()`
- [ ] 继续复用：
  - `buildReportSourceRef()`
  - `buildPayloadDigest()`

### Task 3: 收口 Public / private 报告可见性

- [ ] `src/lib/services/rider-console.ts`
  - 改为读取当前 race 下私有 `rider_report`
- [ ] `src/lib/services/public-routes.ts`
  - Public Rider Profile 不再读取 `rider_report`
- [ ] `src/app/riders/[riderSlug]/page.tsx`
  - 如需要，去掉 public rider profile 对 `rider_report` 的公开依赖
- [ ] `src/app/_components/public/rider-profile-page.tsx`
  - 移除公开 `rider_report` 语义

### Task 4: 接入 Organizer 页面与 action

- [ ] `src/app/actions.ts`
  - 新增：
    - `generateReportsAction()`
    - `publishReportAction()`
- [ ] `src/app/_components/console/organizer-console-page.tsx`
  - `reports` section 新增：
    - 生成报告草稿
    - 发布 `race_report`
    - 发布 `review_summary`

### Task 5: 文档同步

- [ ] 新增 design
  - `docs/superpowers/specs/2026-07-11-grs004-dev7-report-visibility-and-publication-baseline-design.md`
- [ ] 新增 implementation plan
  - `docs/superpowers/plans/2026-07-11-grs004-dev7-report-visibility-and-publication-baseline-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/services/reports-generation.test.ts src/lib/services/rider-console.test.ts src/lib/services/public-routes.test.ts src/app/_components/public/rider-profile-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 完成标准

- Organizer 可以生成当前 race 的报告草稿
- Organizer 可以发布 `race_report / review_summary`
- Rider 可以私有读取自己的 `rider_report`
- Public Rider Profile 不再暴露 `rider_report`
- 测试与构建通过
