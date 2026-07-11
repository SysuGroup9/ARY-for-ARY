# GRS004 / DEV-7 Formal Award Publication Implementation Plan

## 目标

把 Organizer 正式发布榜单这条链路从兼容 Runner 评估切回 `JudgingRecord -> Award`，并把 Public 结果链路真正收口为“只读已发布 Award / 已提交 JudgingRecord”。

## 任务拆分

### Task 1: 先补失败测试

- [ ] `src/lib/services/awards-publication.test.ts`
  - 新增：正式发布服务会基于已提交 `JudgingRecord` 生成 `Best Overall / Best Work / Best Agent Rider`
  - 新增：Award 会写入 `publishedAt / sourceRefJson / sourceDigest`
- [ ] `src/lib/services/results.test.ts`
  - 新增：Public Results 不暴露 `publishedAt=null` 的 Award
  - 新增：riding highlights 不读取 `submittedAt=null` 的 `JudgingRecord`
- [ ] `src/lib/services/review.test.ts`
  - 新增：Public Review 不暴露 `publishedAt=null` 的 Award
  - 新增：Public Review 不暴露 `submittedAt=null` 的 `JudgingRecord`
- [ ] `src/lib/services/public-routes.test.ts`
  - 新增：Public Rider / Work / Race read model 不暴露未发布 Award
  - 新增：Public Work 不暴露未提交 `JudgingRecord` 评论
- [ ] `src/app/_components/console/organizer-console-page.test.tsx`
  - 新增：`awards` section 出现正式发布按钮

### Task 2: 实现正式 Award 发布服务

- [ ] `src/lib/services/awards.ts`
  - 新增正式发布服务
  - 只消费 `submittedAt != null` 的 `JudgingRecord`
  - 生成并 upsert：
    - `Best Overall`
    - `Best Work`
    - `Best Agent Rider`
  - 冻结 `registration / work / evidence` 引用
- [ ] `src/lib/judging-helpers.ts`
  - 视需要补 Judging score 读取 helper，避免在 service 里散写 JSON 解析

### Task 3: 收口 Public 已发布门禁

- [ ] `src/lib/services/awards.ts`
  - 区分 internal `listAwardsForRace()` 和 public `listPublishedAwardsForRace()`
- [ ] `src/lib/services/judging.ts`
  - 支持 public 侧只读取 `submittedAt != null` 的记录
- [ ] `src/lib/services/results.ts`
  - 改为只读已发布 Award 和已提交 JudgingRecord
- [ ] `src/lib/services/review.ts`
  - 改为只读已发布 Award 和已提交 JudgingRecord
- [ ] `src/lib/services/public-routes.ts`
  - Public race / rider / work 读取链路加上 Award 已发布门禁
- [ ] `src/lib/services/works.ts`
  - Public Work 读取链路过滤未发布 Award 和未提交 JudgingRecord

### Task 4: 接入 Organizer 页面与 action

- [ ] `src/app/actions.ts`
  - `publishLeaderboardAction()` 改回正式 Award 发布语义
  - 兼容 Runner 评估动作拆到单独 action
- [ ] `src/app/_components/console/organizer-console-page.tsx`
  - `awards` section 新增正式发布按钮
  - `judging` section 兼容 Runner 按钮接到新的兼容 action

### Task 5: 文档同步

- [ ] 新增 design
  - `docs/superpowers/specs/2026-07-11-grs004-dev7-formal-award-publication-design.md`
- [ ] 新增 implementation plan
  - `docs/superpowers/plans/2026-07-11-grs004-dev7-formal-award-publication-implementation-plan.md`
- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 完成标准

- Organizer 可以按 `JudgingRecord` 正式发布榜单
- Public 侧不再暴露未发布 Award
- Public 侧不再暴露未提交 `JudgingRecord` 草稿评论
- 测试与构建通过
