# GRS004 / Work Create Submit Materialization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Work` 是作品资产，不是提交记录本身
  - `Work Creation Flow | Registration, Work`
  - `Work Status`: `draft / submitted / locked / hidden`
- `docs/grs004/ary-permission-matrix.md`
  - `Work.create`: Rider `own registration`
  - `Work.submit`: Rider `own registration`
  - `Work.publish`: Organizer `managed race`, Admin `system`
  - `Work.hide`: Rider `own if draft`
- `docs/grs004/ary-mvp.ia.md`
  - Rider View 应存在 `Work Submission`
  - Work Submission 不受 CA 接入状态硬门禁控制，但应形成正式作品资产

当前显式缺口：

- `src/lib/services/submissions.ts` 只创建 `Submission / SubmissionArtifact`，不会落地 `Work`
- Rider `submission` 页面没有正式 `Work` 草稿或当前资产视图
- `publish / hide / lock` 已有最小 lifecycle，但 Rider 仍没有对应的 `create / submit` 起点

## 范围

### 本轮纳入

- Rider 保存 `Work draft`
- Rider `submit entry / final entry` 时同步创建或更新正式 `Work`
- `locked` work 不允许再被 rider draft / submit 覆盖
- Rider submission 页补 `当前作品资产` 与 `隐藏当前草稿`
- Submission forms 补齐最小 `Work` 字段：
  - `workTitle`
  - `workSummary`
  - `demoUrl`
  - `repoUrl`
  - `videoUrl`
  - `techNotes`

### 本轮不纳入

- 不新增独立 Work 编辑页
- 不扩多作品模型
- 不把 Demo / Video / Repo 改成强业务必填
- 不重做 Work Page 展示结构

## 状态与可见性规则

### draft

- Rider 保存草稿时落地：
  - `status = DRAFT`
  - `visibility = PRIVATE`

### submit

- Rider 正式提交时落地：
  - `status = SUBMITTED`
  - `visibility = PRIVATE`

这样做的原因是：

- `submit` 不等于 `publish`
- Public Site 继续只读 `visibility === PUBLIC`
- Organizer / Admin 仍保有显式 `publish` 动作

### lock

- 现有 `LOCKED` work 一旦存在：
  - Rider draft 不可继续覆盖
  - Rider submit 不可继续覆盖

## 数据落地规则

- 一个 `Registration` 仍最多一个主 `Work`
- `Submission / SubmissionArtifact` 继续保留为提交事实
- `Work` 作为展示、评审、榜单与公开链路的作品资产
- 若 `repoUrl` 为空，最小回填 `registration.raceProject.githubRepoUrl`
- `contentHash` 与 `sourceRefJson` 继续按当前 material integrity helper 生成

## Rider View 行为

- `Work Submission` 里新增当前作品资产卡片
- 当前存在 draft 时，Rider 可直接执行 `隐藏当前草稿`
- 提交表单现在同时收集作品资产字段与代码材料字段
- `保存作品草稿` 与 `提交代码 / 提交赛后代码与 Riding Record` 共用同一组最小作品字段

## 测试对齐

- 新增 `src/lib/services/submissions-work-materialization.test.ts`
- 新增 `src/app/actions.work-create-submit-scope.test.ts`
- 扩展：
  - `src/app/_components/submission-form-client.test.tsx`
  - `src/app/_components/final-submission-form-client.test.tsx`
  - `src/app/_components/console/rider-console-page.test.tsx`
  - `src/lib/services/submissions.test.ts`
  - `src/lib/services/material-integrity-submissions.test.ts`

验证命令：

```bash
node --test-concurrency=1 --import tsx --test src/lib/services/submissions-work-materialization.test.ts src/app/actions.work-create-submit-scope.test.ts src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions.test.ts src/lib/services/material-integrity-submissions.test.ts
```

## 一句话结论

这一轮把 `Work.create / Work.submit` 正式接回 Rider 提交流程，让作品资产不再只存在于 seed 或手工 fixture 里，而是由真实 Rider 提交动作产生。
