# GRS004 / Rider Work Submission Readiness Prompts Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.ia.md`
  - `Work Submission 不受 CA 接入状态硬门禁控制`
  - `CA 未配置、无 CA 数据或接入异常时，Work Submission 可继续，但必须展示证据缺口和评审风险提示`
  - `RaceProject 聚合 CA 接入 failed / not_configured 时， Rider View 展示接入异常或证据缺口`
- `docs/grs004/ary-qa-plan.md`
  - `not_configured / failed 时可以完成 Work Submission，但必须生成证据缺口或接入异常风险提示`

当前显式缺口：

- Organizer / Judge 已有 `ReviewReadinessCard`
- Rider `submission` section 只有表单和当前作品资产，没有把 CA 证据缺口显式提示给 Rider

## 范围

### 本轮纳入

- Rider `submission` section 接入现有 `buildReviewReadinessSummary()`
- 在提交表单前显示最小风险提示卡
- 不改变提交流程准入

### 本轮不纳入

- 不新增 Rider 专属风险模型
- 不扩新的后端字段
- 不把证据缺口升级为提交阻断

## 落地规则

- 当 `registration` 已存在时，Rider submission section 计算 readiness summary
- 输入沿用现有字段：
  - `registration.raceProject.aggregateIngestionStatus`
  - `registration.evidences`
  - `registration.work`
  - `race.phase`
- 当 `FAILED / NOT_CONFIGURED / no_internal_evidence / empty_work / missing_work` 命中时，Rider 能直接看到原因
- 即使存在风险提示，`保存作品草稿 / 提交代码 / 提交赛后代码与 Riding Record` 仍保持可用

## 测试对齐

- 扩展 `src/app/_components/console/rider-console-page.test.tsx`
- 复用 `src/lib/review-readiness-helpers.test.ts`

验证命令：

```bash
node --test-concurrency=1 --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/lib/review-readiness-helpers.test.ts
```

## 一句话结论

这一轮只把文档已明确要求的“提示但不阻断”真正接到 Rider 提交页，不扩新模型。
