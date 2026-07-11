# GRS004 / P1-L Work Demo/视频远端内容抓取校验 Implementation Plan

## 目标

在不新增 schema 的前提下，为 `Work.sourceRefJson` 增加可选 `demoRef / videoRef` 结构，并在公开读取链路中校验 `demoUrl / videoUrl` 的远端内容是否仍与已记录快照一致。

## 任务拆分

### Task 1: 补远端资源快照 helper

- [ ] 在 `src/lib/material-integrity-helpers.ts` 增加：
  - 远端资源 digest helper
  - 远端资源 snapshot capture helper
  - 远端资源 snapshot verify helper
- [ ] `buildWorkSourceRef()` 允许附带可选：
  - `demoRef`
  - `videoRef`

### Task 2: 把远端内容校验接到公开读取链路

- [ ] 更新 `verifyWorkReadIntegrity()`
- [ ] 更新：
  - `src/lib/services/works.ts`
  - `src/lib/services/awards.ts`
  - `src/lib/services/races.ts`
  - `src/lib/services/public-routes.ts`
- [ ] 规则：
  - 无 `demoRef/videoRef` 的 Work 保持兼容
  - 有快照的 Work 追加远端内容抓取校验

### Task 3: 补测试

- [ ] `src/lib/material-integrity-helpers.test.ts`
  - capture/verify remote asset snapshot
  - digest mismatch / url mismatch
- [ ] `src/lib/services/public-routes.test.ts`
  - stale demo snapshot 使 work page 返回 `null`
- [ ] `src/lib/services/results.test.ts`
  - stale video snapshot 使公开赛果中的 `award.work` 被过滤

### Task 4: 文档同步

- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新设计文档里的“已落地实现补记”
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts
npm run build
```

## 完成标准

- `demoRef / videoRef` 结构与 helper 已落地
- 公开读取会校验已保存的远端内容快照
- stale demo/video 快照会让 Work 从公开读取链路中被过滤
- 无快照旧数据继续兼容
- 构建与聚焦测试通过
