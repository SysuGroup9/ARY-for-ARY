# GRS004 / DEV-5 Review Readiness 风险提示 Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-5 CA 接入 / Projection / Live Hall`
  - 验收：`RaceProject` 聚合接入 `failed / not_configured` 的 Registration 仍可进入提交、评审和 Award 流程，但必须生成评审前风险提示
- `docs/grs004/ary-qa-plan.md`
  - `§2.4 CA 接入测试`
  - `§2.2 角色路径测试`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Review Flag / Review Readiness`
  - `Organizer View 和 Judge View 应展示评审前风险提示`
- `docs/grs004/grs003-gap-analysis.md`
  - `评审前风险提示 | ❌ 未解决`

当前代码里已经有：

- `RaceProject.aggregateIngestionStatus`
- `Evidence.reviewFlagJson`
- `Evidence.integrityStatus`
- `Evidence.confidenceLevel`
- Organizer `ca-status` 中的 `Trust / Risk Summary`

但仍然缺少一个**明确叫做“评审前风险提示”并真正出现在 Organizer / Judge 评审上下文里的统一输出**：

- `JudgeConsolePageView` 当前只展示作品、证据摘要和评分表单
- `OrganizerConsolePageView` 的 `registrations` 区只展示报名、RaceProject 和兼容容器信息
- 风险判断逻辑仍散落在 `Organizer Console / ca-status` 内部，没有一个统一 helper 供 Judge / Organizer 共用

本轮目标是：**基于现有字段补一层最小的 Review Readiness 风险提示，让 Organizer 和 Judge 在评审前真正看到“哪些 Registration / Work 需要额外复核”。**

## 范围

### 本轮纳入

- 新增纯 helper：
  - `buildReviewReadinessSummary()`
- 风险来源只使用现有事实字段：
  - `RaceProject.aggregateIngestionStatus`
  - `Evidence.reviewFlagJson`
  - `Evidence.integrityStatus`
  - `Evidence.confidenceLevel`
  - `Work.title / Work.summary`
- 页面接入：
  - Organizer `registrations`
  - Judge assignment 卡片

### 本轮不纳入

- 不新增数据库 schema
- 不新增独立 `ReviewFlag` / `ReviewReadinessCheck` 表
- 不做自动封禁、自动退赛或自动 DQ
- 不改变 Judge 提交流程和评分模型
- 不新增“风险提示已确认 / 已关闭”的工作流

## 约束

### 文档约束

- 风险提示用于**提示 Organizer / Judge**，不自动替代人工评审
- `failed / not_configured` 只表达证据缺口或接入异常，不改变参赛资格
- 原始 CA Session 默认不公开，因此风险提示必须基于摘要 / Evidence / 聚合状态，而不是直接暴露 Session

### 当前代码现实

- `Evidence` 已具备 `reviewFlagJson / integrityStatus / confidenceLevel`
- `JudgeAssignment` 已能读取 `registration.evidences`
- Organizer `ca-status` 已经局部复用了这些字段

因此本轮应遵循：

1. **不引入新表**
2. **先把风险判断抽成纯 helper**
3. **先接 Judge / Organizer 两个最直接的评审上下文**

## 方案选择

### 方案 A：用现有字段合成 Review Readiness 摘要

做法：

- `buildReviewReadinessSummary()`
  - 输入 phase、aggregate status、evidences、work 简要信息
  - 输出：
    - `status`
    - `reasons`
    - `evidenceFlagCodes`
    - evidence 计数
- 页面渲染统一 `ReviewReadinessCard`

优点：

- 直接命中文档里的 Review Flag / Review Readiness
- 与现有 schema 一致
- 改动最小，利于先把 Judge / Organizer 视图补齐

缺点：

- 还不是独立持久化对象
- 风险原因仍来自现有字段，覆盖面有限

### 方案 B：新增持久化 ReviewFlag 实体

优点：

- 可以把每次检查结果、确认状态和责任人完整建模

缺点：

- 超出当前最小缺口修复范围
- 需要新的 schema、迁移和流程设计

### 推荐方案

采用 **方案 A：用现有字段合成 Review Readiness 摘要**。

## 风险规则

### 1. 骑行 / 证据风险

在需要骑行证据的 phase 中（`active/running/frozen/submitting/judging/completed/finished/archived`）：

- `aggregateIngestionStatus = FAILED`
  - 风险：`CA 接入失败`
- `aggregateIngestionStatus = NOT_CONFIGURED`
  - 风险：`未接入 CA`
- 没有 internal evidence
  - 风险：`缺少内部证据`

### 2. 证据复核风险

- 有 `reviewFlagJson`
  - 风险：`存在证据复核标记`
- 有 `integrityStatus != OK`
  - 同样进入 `存在证据复核标记`
- 有 `confidenceLevel = MEDIUM`
  - 风险：`存在中可信度证据`

### 3. 作品风险

在要求已有作品的 phase 中（`submitting/judging/completed/finished/archived/frozen`）：

- 没有 work
  - 风险：`缺少作品`
- work 标题或摘要为空
  - 风险：`作品内容为空`

## 页面接入

### 1. Organizer

- 在 `registrations` section 里新增 `评审前风险提示`
- 让 Organizer 不必切到 `ca-status` 才能看到哪些报名记录需要复核

### 2. Judge

- 在每个 assignment 卡片里新增 `评审前风险提示`
- 让 Judge 在评分前就能看到：
  - CA 接入是否失败
  - 是否缺少内部证据
  - 是否有 review flag
  - 是否存在中可信度证据
  - 作品是否为空

## 用户可见变化

本轮落地后，用户现在能直接看到：

1. `Organizer Console -> registrations`
   - 每个报名记录下方会出现 `评审前风险提示`
2. `Judge Console -> assigned / reviewing / submitted`
   - 每个作品任务卡片都会显示 `评审前风险提示`
3. 风险提示不会阻断评审表单，但会明确告诉 Judge / Organizer：
   - 未接入 CA
   - CA 接入失败
   - 缺少内部证据
   - 存在证据复核标记
   - 存在中可信度证据
   - 缺少作品或作品内容为空

## 测试对齐

需要覆盖：

- `src/lib/review-readiness-helpers.test.ts`
  - helper 的风险推导规则
- `src/app/_components/console/judge-console-page.test.tsx`
  - Judge 任务卡片显示风险提示
- `src/app/_components/console/organizer-console-page.test.tsx`
  - Organizer `registrations` 显示风险提示

验证命令：

```bash
node --import tsx --test src/lib/review-readiness-helpers.test.ts src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/console-copy.test.tsx
npm run build
```

## 验收对齐

本轮完成后，需要能证明：

1. Organizer / Judge 都能在实际评审上下文中看到风险提示
2. 风险提示只基于现有摘要 / Evidence / 聚合状态，不暴露原始 CA Session
3. `failed / not_configured` 不自动退赛，只进入风险提示
4. 风险提示不自动替代人工评分
5. 聚焦测试和构建通过

## 一句话结论

这轮不是在做新的“风控系统”，而是把文档里已经定义好的 `Review Flag / Review Readiness`，真正挂到 Organizer 和 Judge 的评审视图上。

## 已落地实现补记（2026-07-11）

- `src/lib/review-readiness-helpers.ts`
  - 已新增 `buildReviewReadinessSummary()`
- `src/app/_components/console/review-readiness-card.tsx`
  - 已新增统一 `评审前风险提示` 渲染卡片
- `src/app/_components/console/organizer-console-page.tsx`
  - `registrations` section 已接入 Review Readiness
- `src/app/_components/console/judge-console-page.tsx`
  - assignment 卡片已接入 Review Readiness
- `src/lib/services/judging.ts`
  - Judge assignment 读取已补 `registration.raceProject`
- 本轮聚焦验证已通过：
  - `node --import tsx --test src/lib/review-readiness-helpers.test.ts src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/console-copy.test.tsx`
  - `npm run build`
