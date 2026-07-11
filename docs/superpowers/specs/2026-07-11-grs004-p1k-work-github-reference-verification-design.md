# GRS004 / P1-K Work GitHub 引用快照校验 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`
    - `GitHub commit SHA / tag / release digest`
  - `§8 验收标准`
    - `Work / 题目材料 hash 能记录并在读取时校验（待实现）`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `GitHub Repo 只作为作品代码入口或 Evidence 外部材料引用`
  - `Commit / PR 可通过 Evidence.sourceRef 引用`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-11-grs004-p1i-work-public-read-verification-design.md`

当前仓库已经具备：

- `Work`
  - `sourceRefJson`
  - `contentHash`
- `P1-I`
  - 公开读取时已经会校验 `contentHash / sourceRefJson`

但当前 `Work.repoUrl` 仍只有最小 URL 引用，没有 GitHub 版本快照：

- 没有 commit SHA
- 没有 tag 对应的 resolved commit
- 没有 release 对应的 resolved commit

本轮目标是：**在不新增 schema 的前提下，为 `Work.repoUrl` 的 GitHub commit/tag/release 引用增加可写入到 `sourceRefJson` 的快照元数据，并在公开读取时校验这份快照是否仍与当前 URL 指向一致。**

## 范围

### 本轮纳入

- 只覆盖 `Work.repoUrl`
- 只覆盖 GitHub URL
- 只支持以下 GitHub 引用形态：
  - commit URL
  - tag URL
  - release tag URL
- 只收口公开读取服务层：
  - `listRaces()`
  - `getWorkForPublicSlug()`
  - `getWorkForLegacyTeamSlug()`
  - `getRiderBySlug()`
  - `listAwardsForRace()`
- `sourceRefJson` 允许带一个可选 `githubRef`

### 本轮不纳入

- 不新增 schema
- 不扩展到 plain repo root / branch URL 的真实性校验
- 不扩展到 demo/video 远端内容抓取校验
- 不扩展到 judge/private 读取
- 不新增 GitHub OAuth 权限依赖

## 约束

### 当前代码现实

- `Work` 当前没有独立 create/update service
- `Work` 主要仍通过：
  - `buildWorkSeedRecord()`
  - 现有 seed/helper 路径
  进入数据库
- 因此本轮不能假设“所有 Work 写路径都能立刻拿到远端 GitHub 快照”

本轮应遵循：

1. **不新增表**
2. **把 GitHub 快照塞进现有 `sourceRefJson`**
3. **公开读取时只在 `sourceRefJson.githubRef` 存在时才做 GitHub 快照校验**

## 方案选择

### 方案 A：把 GitHub 快照写进 `sourceRefJson.githubRef`，公开读取时校验

做法：

- 新增 GitHub URL 解析 helper
- 新增 GitHub reference snapshot capture / verify helper
- `sourceRefJson` 允许保存：
  - `owner`
  - `repo`
  - `refKind`
  - `ref`
  - `resolvedCommitSha`
  - `referenceDigest`
- 公开读取时：
  - 先走现有 `contentHash / sourceRefJson` 校验
  - 再校验 `githubRef`

优点：

- 命中 `§5.3` 的 `commit/tag/release digest`
- 不需要新 schema
- 直接复用现有 `Work` 读取校验链路

缺点：

- 当前旧数据如果没有 `githubRef`，不会自动获得远端校验能力

### 方案 B：新增独立 `MaterialIntegrityRecord`

优点：

- 结构更清晰

缺点：

- 超出当前最小偏移方案
- 不符合“尽量贴现有模型”的收口方向

### 推荐方案

采用 **方案 A：把 GitHub 快照写进 `sourceRefJson.githubRef`，公开读取时校验**。

## 数据结构

### `sourceRefJson.githubRef`

最小结构：

```json
{
  "provider": "github",
  "owner": "demo",
  "repo": "work-1",
  "refKind": "commit",
  "ref": "abc123...",
  "resolvedCommitSha": "abc123...",
  "referenceDigest": "sha256..."
}
```

说明：

- `refKind`
  - `commit`
  - `tag`
  - `release`
- `ref`
  - commit sha 或 tag/release tag 名
- `resolvedCommitSha`
  - 当前引用实际落到的 commit sha
- `referenceDigest`
  - 对上述关键字段做稳定 digest

## 运行时规则

### 1. GitHub URL 解析

支持：

- `https://github.com/{owner}/{repo}/commit/{sha}`
- `https://github.com/{owner}/{repo}/tree/{tag}`
- `https://github.com/{owner}/{repo}/releases/tag/{tag}`

不支持：

- plain repo root
- branch URL
- PR URL

不支持时：

- 不写 `githubRef`
- 公开读取也不做 GitHub 快照校验

### 2. 快照写入

- commit URL
  - 直接从 URL 提取 `sha`
- tag / release tag URL
  - 通过 GitHub API 解析到当前 commit sha

### 3. 公开读取校验

若 `sourceRefJson.githubRef` 存在：

1. 当前 `repoUrl` 必须还能解析出相同：
   - `owner`
   - `repo`
   - `refKind`
   - `ref`
2. 当前引用解析出的 commit sha 必须等于：
   - `resolvedCommitSha`
3. 当前关键字段重算 digest 必须等于：
   - `referenceDigest`

失败时：

- `Work` 视为不可信
- 公开读取链路中该 `Work` 置 `null` 或直接返回 `null`

## 测试对齐

需要扩展：

- `src/lib/material-integrity-helpers.test.ts`
- `src/lib/services/public-routes.test.ts`

覆盖：

1. commit URL 解析与 digest 生成
2. tag / release URL 在 mocked GitHub API 下解析到 commit sha
3. `githubRef` 快照与当前 `repoUrl` 不一致时公开读取被过滤
4. 没有 `githubRef` 的现有 Work 继续兼容

## 验收对齐

本轮完成后，需要能证明：

1. `Work.repoUrl` 可选带 GitHub `commit/tag/release` 快照
2. 快照写入不需要新增 schema
3. 公开读取时会校验已保存的 `githubRef`
4. 篡改后的 GitHub 引用不会继续进入公开 `Work` 链路
5. 现有无 `githubRef` 旧数据保持兼容

## 一句话结论

`P1-K` 的目标是：*把 `Work.repoUrl` 中的 GitHub commit/tag/release 引用从“只有 URL”推进到“URL + 快照 digest”，并在公开读取时真正校验这份快照。*

## 已落地实现补记（2026-07-11）

- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `parseGitHubReferenceUrl()`
    - `buildGitHubReferenceDigest()`
    - `captureGitHubReferenceSnapshot()`
    - `verifyGitHubReferenceSnapshot()`
    - `verifyWorkReadIntegrity()`
  - `buildWorkSourceRef()` 现在允许附带可选：
    - `githubRef`
- `src/lib/services/works.ts`
  - `listWorksForRace()`、`getWorkForPublicSlug()`、`getWorkForLegacyTeamSlug()` 现在都会在公开读取前执行异步 `Work` 读取完整性校验
- `src/lib/services/awards.ts`
  - `listAwardsForRace()` 现在会对带 `githubRef` 的 Work 追加 GitHub 快照校验
- `src/lib/services/races.ts`
  - `listRaces()` 现在会在 `registration.work` 与 `awards[].work` 上执行异步 GitHub 快照校验
- `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 里的公开 work 链路现在也会复用异步 GitHub 快照校验
- `src/lib/material-integrity-helpers.test.ts`
  - 已补：
    - commit/tag/release URL 解析
    - tag/release mocked GitHub API 解析
    - stale github snapshot 校验
- `src/lib/services/public-routes.test.ts`
  - 已补：
    - stale github commit snapshot 会让公开 work route 返回 `null`

### 本轮明确没有做的事

- 没有扩展到 plain repo root / branch URL 的真实性校验
- 没有扩展到 demo/video 远端内容抓取校验
- 没有扩展到 judge/private 读取
- 没有新增 Work create/update service

### 新鲜验证证据

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
- `npm run build`
