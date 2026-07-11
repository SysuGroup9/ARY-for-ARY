# GRS004 / P1-K Work GitHub 引用快照校验 Implementation Plan

## 目标

在不新增 schema 的前提下，为 `Work.sourceRefJson` 增加可选 `githubRef` 快照结构，并在公开读取链路中校验 `Work.repoUrl` 的 GitHub commit/tag/release 引用是否仍与已记录快照一致。

## 任务拆分

### Task 1: 补 GitHub 引用解析与快照 helper

- [ ] 在 `src/lib/material-integrity-helpers.ts` 增加：
  - GitHub URL 解析 helper
  - GitHub reference digest helper
  - GitHub reference snapshot capture helper
  - GitHub reference snapshot verify helper
- [ ] `buildWorkSourceRef()` 允许附带可选 `githubRef`

### Task 2: 把 GitHub 快照校验接到公开读取链路

- [ ] 新增异步 `Work` 读取完整性校验 helper
- [ ] 更新：
  - `src/lib/services/works.ts`
  - `src/lib/services/awards.ts`
  - `src/lib/services/races.ts`
  - `src/lib/services/public-routes.ts`
- [ ] 规则：
  - 没有 `githubRef` 的 Work 保持现状
  - 有 `githubRef` 的 Work 追加 GitHub 快照校验

### Task 3: 补测试

- [ ] `src/lib/material-integrity-helpers.test.ts`
  - commit/tag/release URL helper coverage
  - `githubRef` digest coverage
- [ ] `src/lib/services/public-routes.test.ts`
  - `githubRef` 与 `repoUrl` 不一致时，公开读取隐藏 work
  - 无 `githubRef` 的旧数据继续可读

### Task 4: 文档同步

- [ ] 更新 `docs/superpowers/status.md`
- [ ] 更新设计文档里的“已落地实现补记”
- [ ] 更新 `grs004readme.md`

## 验证命令

```bash
node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts
npm run build
```

## 完成标准

- `sourceRefJson.githubRef` 结构与 helper 已落地
- 公开读取会校验已保存的 GitHub 快照
- `githubRef` 不一致时 work 会从公开读取链路中被过滤
- 无 `githubRef` 的旧数据继续兼容
- 构建与聚焦测试通过
