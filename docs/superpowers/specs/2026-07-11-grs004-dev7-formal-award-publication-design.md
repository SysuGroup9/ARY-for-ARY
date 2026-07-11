# GRS004 / DEV-7 Formal Award Publication and Public Result Gating Design

## 目的

本设计直接承接：

- `docs/grs004/ary.plan.md`
  - `DEV-7 Report / Review / Results`
  - `Organizer 可以发布榜单`
- `docs/grs004/ary-qa-plan.md`
  - `Organizer：创建赛事、管理报名、分配评委、发布榜单、生成和发布报告`
  - `Public 不能访问未发布 Award / Leaderboard draft`
- `docs/grs004/ary-permission-matrix.md`
  - `3.7 JudgingRecord`
  - `3.8 Award / Leaderboard`
- 当前代码现状
  - `publishLeaderboardAction()` 仍在触发兼容 Runner 评估，而不是正式 Award 发布
  - Public `Results / Review / Rider / Work` 链路的文案已经写成“只读已发布结果”，但服务层还没有统一按 `Award.publishedAt` 和 `JudgingRecord.submittedAt` 收口

本轮目标是：**补一个最小正式 Award 发布动作，并把公开结果链路真正收口为“只读已发布 Award / 已提交 JudgingRecord 摘要”。**

## 范围

### 本轮纳入

- Organizer 正式发布 Award / Leaderboard
  - 复用现有 `JudgingRecord`
  - 复用现有 `Award`
  - 复用现有 `publishedAt`
- Public 结果链路门禁收口
  - Public Results 只读已发布 Award
  - Public Review 只读已发布 Award + 已提交 JudgingRecord
  - Public Rider / Work / Race read model 不再泄露未发布 Award draft

### 本轮不纳入

- 不新增 schema
- 不新增独立 `leaderboard_read_model` 存储表
- 不做 Award draft 编辑器
- 不做 Award 撤回/撤销发布
- 不做 Report generator 重构
- 不删除兼容 Runner route 或兼容 Runner 触发入口

## 约束

1. 正式 Award 发布必须基于现有 `JudgingRecord`，不能再走 Runner 评分主路径。
2. Public 侧不能继续读取未发布 Award。
3. Public 侧不能继续把未提交的 `JudgingRecord` 草稿当成公开评语来源。
4. 继续复用现有 `Award.sourceRefJson / sourceDigest`，不引入新的结果冻结模型。

## 方案

### 方案 A：最小正式发布服务 + 公开门禁收口

做法：

- 在 `src/lib/services/awards.ts` 新增正式发布服务
  - 只读取当前 race 下 `submittedAt != null` 的 `JudgingRecord`
  - 生成 3 个正式奖项：
    - `Best Overall`
    - `Best Work`
    - `Best Agent Rider`
  - 奖项来源规则：
    - `Best Overall`：`scoreResult + scoreRiding` 总分最高
    - `Best Work`：`scoreResult` 最高
    - `Best Agent Rider`：`scoreRiding` 最高
  - 用现有 `buildAwardSourceRef()` 冻结 registration / work / evidence 引用
  - 用 `publishedAt=now()` 写入正式发布事实
  - 重复发布时按同名 award upsert，不扩散到其它历史兼容奖项

- 在公开读取链路统一加门禁
  - `Award`：只读 `publishedAt != null`
  - `JudgingRecord`：公开摘要只读 `submittedAt != null`

- 在 Organizer Console 的 `awards` section 增加正式发布按钮
  - 文案明确是“按 JudgingRecord 发布正式榜单”
  - 兼容 Runner 按钮继续保留在 `judging` section，且继续明确是兼容链路

### 推荐方案

采用方案 A。

原因：

- 直接命中 `DEV-7` 文档要求
- 不引入新 schema
- 不把本轮扩大成 Report 全链路重构
- 能同时修掉“动作错位”和“公开门禁不一致”两个显式缺口

## 用户可见变化

本轮落地后，用户能直接看到的是：

1. Organizer 在 `awards` section 会看到正式发布按钮，而不再只能看到兼容 Runner 产物。
2. Public Results / Review / Rider / Work 不再提前暴露未发布 Award draft。
3. Public Review / Work 不再把未提交的 `JudgingRecord` 草稿评论泄露到公开页面。

## 测试对齐

需要覆盖：

- `src/lib/services/awards-publication.test.ts`
  - 正式发布服务会按已提交 `JudgingRecord` 生成正式 Award
- `src/lib/services/results.test.ts`
  - Public Results 不暴露未发布 Award
  - riding highlights 不读取未提交 `JudgingRecord`
- `src/lib/services/review.test.ts`
  - Public Review 不暴露未发布 Award
  - Public Review 不暴露未提交 `JudgingRecord` 草稿评论
- `src/lib/services/public-routes.test.ts`
  - Public Rider / Work / Race read model 不暴露未发布 Award
  - Public Work 不暴露未提交 `JudgingRecord` 评论
- `src/app/_components/console/organizer-console-page.test.tsx`
  - Organizer awards section 出现正式发布入口

验证命令：

```bash
node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts src/app/_components/console/organizer-console-page.test.tsx
npm run build
```

## 一句话结论

这轮补的是 `DEV-7` 里的“正式 Award 发布 + 公开端已发布门禁”，不扩大到 Report 全链路或 Runner 全量退场。
