# GRS004 / DEV-7 Report Visibility and Publication Baseline Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-7 Report / Review / Results`
  - `rider_report、race_report、review_summary`
  - `Report 生成、编辑、发布`
- `docs/grs004/ary-qa-plan.md`
  - `rider_report 生成、查看`
  - `race_report 生成、编辑`
  - `review_summary 生成、编辑、发布`
  - `未发布 Report 不出现在 Public Site`
- `docs/grs004/ary-permission-matrix.md`
  - `rider_report` 默认只允许对应 Rider、managed race Organizer 和 Admin 查看
  - Public 只能查看已发布的 `race_report / review_summary`
- 当前代码现状
  - Public Rider Profile 仍在读取 `published rider_report` 摘要
  - Rider Console 只读取 `published rider_report`，而不是“自己的私有 rider_report”
  - Organizer 侧还没有正式 `Report` 生成 / 发布入口

本轮目标是：**先补最小 Report 主链路基线，并把 `rider_report` 从 Public 侧彻底收回到私有可读边界。**

## 范围

### 本轮纳入

- Public / private 报告可见性收口
  - Public 不再读取 `rider_report`
  - Rider Console 改读当前 race 下自己的私有 `rider_report`
- Organizer 最小报告动作
  - 生成当前 race 的报告草稿：
    - `rider_report`
    - `race_report`
    - `review_summary`
  - 发布：
    - `race_report`
    - `review_summary`
- 继续复用现有 `Report.status / publishedAt / sourceRefJson / sourceDigest`

### 本轮不纳入

- 不新增 schema
- 不做完整报告编辑器
- 不做 `rider_report` 公开发布能力
- 不做独立 Report 后台页面重构
- 不把本轮扩大到 AI 自动写报告

## 约束

1. `rider_report` 默认必须保持私有，不得继续进入 Public Rider Profile。
2. Public Review 只能来自已发布 `review_summary`。
3. Public Results 只能来自已发布 `race_report` 与已发布 Award。
4. `rider_report` 必须带 `subjectRegistrationId`；`race_report / review_summary` 的 `subjectRegistrationId` 必须为 `null`。
5. 报告生成时必须继续冻结 `work / evidence / projection / award` 引用。

## 方案

### 方案 A：最小生成 + 有限发布 + 私有可见性收口

做法：

- 在 `src/lib/services/reports.ts` 新增：
  - `listPrivateRiderReportsForUserInRace()`
  - `generateReportsForRace()`
  - `publishReportForRace()`
- 生成逻辑：
  - 为当前 race 的每个 registration upsert 一个 `rider_report`
  - 为当前 race upsert 一个 `race_report`
  - 为当前 race upsert 一个 `review_summary`
  - 默认生成状态为 `GENERATED`
  - `rider_report` 保持 `publishedAt=null`
  - `race_report / review_summary` 由 Organizer 再手动发布
- Public 可见性：
  - Public Rider Profile 不再消费 `rider_report`
  - Rider Console 改消费“当前 race 下自己的 rider_report”，不再要求它已发布
- Organizer 页面：
  - `reports` section 增加：
    - `生成报告草稿`
    - `发布 race_report`
    - `发布 review_summary`

### 推荐方案

采用方案 A。

原因：

- 直接命中文档中最明确的权限边界
- 不需要新 schema
- 能先恢复 P0 闭环里的 `Award -> Report -> Public Review/Results`
- 可以把“编辑器”留到下一轮，不阻塞当前主链路

## 用户可见变化

本轮落地后，用户能直接看到的是：

1. Organizer 在 `reports` section 可以生成报告草稿，并发布 `race_report / review_summary`。
2. Rider Console 的 `report` section 会优先显示当前 race 下自己的私有 `rider_report`。
3. Public Rider Profile 不再暴露 `rider_report` 摘要。
4. Public Review / Results 继续只读取已发布报告。

## 测试对齐

需要覆盖：

- `src/lib/services/reports-generation.test.ts`
  - 生成当前 race 的三类报告
  - `subjectRegistrationId` 规则正确
  - `sourceRefJson / sourceDigest` 已写入
- `src/lib/services/rider-console.test.ts`
  - Rider Console 现在可读当前 race 下未发布的私有 `rider_report`
- `src/lib/services/public-routes.test.ts`
  - Public Rider Profile 不再暴露 `rider_report`
- `src/app/_components/public/rider-profile-page.test.tsx`
  - Public Rider Profile 不再以“已发布骑手报告”作为公开模块
- `src/app/_components/console/organizer-console-page.test.tsx`
  - `reports` section 出现生成/发布报告入口

验证命令：

```bash
node --import tsx --test src/lib/services/reports-generation.test.ts src/lib/services/rider-console.test.ts src/lib/services/public-routes.test.ts src/app/_components/public/rider-profile-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 一句话结论

这轮补的是 `DEV-7` 里最小可用的 Report 主链路基线和 `rider_report` 权限边界，不扩大到完整报告编辑后台。
