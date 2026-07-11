# GRS004 / P1-L Work Demo/视频远端内容抓取校验 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`
    - `Demo 附件 hash`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Demo URL`
  - `Video URL`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-11-grs004-p1i-work-public-read-verification-design.md`
- `docs/superpowers/specs/2026-07-11-grs004-p1k-work-github-reference-verification-design.md`

当前仓库已经具备：

- `Work`
  - `sourceRefJson`
  - `contentHash`
- `P1-I`
  - 公开读取时已经会校验 `contentHash / sourceRefJson`
- `P1-K`
  - `sourceRefJson` 可带可选 `githubRef`
  - 公开读取时会校验 GitHub 快照

但 `demoUrl / videoUrl` 仍只有 URL，没有远端内容快照：

- 没有 demo 内容 hash
- 没有 video 内容 hash
- 没有远端资源抓取后的 reference digest

本轮目标是：**在不新增 schema 的前提下，为 `Work.demoUrl / videoUrl` 增加可写入 `sourceRefJson` 的远端内容快照，并在公开读取时校验这份快照与当前远端资源是否仍一致。**

## 范围

### 本轮纳入

- 只覆盖 `Work.demoUrl`
- 只覆盖 `Work.videoUrl`
- 只收口公开读取服务层：
  - `listRaces()`
  - `getWorkForPublicSlug()`
  - `getWorkForLegacyTeamSlug()`
  - `getRiderBySlug()`
  - `listAwardsForRace()`
- `sourceRefJson` 允许带可选：
  - `demoRef`
  - `videoRef`

### 本轮不纳入

- 不新增 schema
- 不扩 judge/private 读取
- 不扩下载页 / 预览页
- 不做 GitHub 以外的代码材料方案
- 不做 response header-only 弱校验，直接抓取内容做 digest

## 约束

### 当前代码现实

- `Work` 当前没有独立 create/update service
- `Work` 主要仍通过 seed/helper 进入数据库
- 因此本轮不能假设“所有 Work 写路径都能立刻写入远端快照”

本轮应遵循：

1. **不新增表**
2. **把远端内容快照塞进现有 `sourceRefJson`**
3. **公开读取时只在 `demoRef / videoRef` 存在时才做远端内容抓取校验**
4. **无快照旧数据保持兼容**

## 方案选择

### 方案 A：把 demo/video 快照写进 `sourceRefJson`，公开读取时抓取远端内容并校验

做法：

- 新增远端资源快照 capture helper
- 新增远端资源快照 verify helper
- `sourceRefJson` 允许保存：
  - `assetKind`
  - `url`
  - `contentDigest`
  - `contentType`
  - `contentLength`
  - `referenceDigest`
- 公开读取时：
  - 先走现有 `contentHash / sourceRefJson` 校验
  - 再校验 `demoRef / videoRef`

优点：

- 直接命中 `§5.3` 的 `Demo 附件 hash`
- 不需要新 schema
- 直接复用现有公开读取校验链路

缺点：

- 若存在很多带快照的公开 Work，读取时会有额外远端 fetch 成本

### 方案 B：只校验 URL 变化，不抓远端内容

优点：

- 成本更低

缺点：

- 对应不了文档里的 `hash`

### 推荐方案

采用 **方案 A：把 demo/video 快照写进 `sourceRefJson`，公开读取时抓取远端内容并校验**。

## 数据结构

### `sourceRefJson.demoRef / videoRef`

最小结构：

```json
{
  "provider": "remote",
  "assetKind": "demo",
  "url": "https://demo.example/work-1",
  "contentDigest": "sha256...",
  "contentType": "text/html",
  "contentLength": 1234,
  "referenceDigest": "sha256..."
}
```

说明：

- `assetKind`
  - `demo`
  - `video`
- `contentDigest`
  - 对远端响应 body 字节做 `sha256`
- `referenceDigest`
  - 对 `assetKind / url / contentDigest / contentType / contentLength` 做稳定 digest

## 运行时规则

### 1. 快照写入

当外部有显式写路径时，可选抓取：

- `demoUrl`
- `videoUrl`

并写入：

- `demoRef`
- `videoRef`

当前没有快照时：

- 不强制失败
- 旧数据继续兼容

### 2. 公开读取校验

若 `sourceRefJson.demoRef` 存在：

1. 当前 `demoUrl` 必须等于 `demoRef.url`
2. 重新抓取 `demoUrl`
3. 对响应 body 计算 `contentDigest`
4. 必须等于 `demoRef.contentDigest`
5. 重算 `referenceDigest`
6. 必须等于 `demoRef.referenceDigest`

`videoRef` 同理。

### 3. 失败时行为

- 该 `Work` 视为不可信
- 公开读取链路中该 `Work` 置 `null` 或直接返回 `null`

## 测试对齐

需要扩展：

- `src/lib/material-integrity-helpers.test.ts`
- `src/lib/services/public-routes.test.ts`
- `src/lib/services/results.test.ts`

覆盖：

1. demo/video 远端快照 capture
2. 远端 body digest mismatch
3. `demoRef/videoRef` 的 URL mismatch
4. 旧数据无快照继续兼容
5. stale demo/video 快照会把公开 Work 过滤掉

## 验收对齐

本轮完成后，需要能证明：

1. `Work.demoUrl / videoUrl` 可选带远端内容快照
2. 快照写入不需要新增 schema
3. 公开读取时会校验已保存的远端内容快照
4. stale demo/video 引用不会继续进入公开 `Work` 链路
5. 现有无 `demoRef/videoRef` 旧数据保持兼容

## 一句话结论

`P1-L` 的目标是：*把 `Work.demoUrl / videoUrl` 从“只有 URL”推进到“URL + 远端内容 digest”，并在公开读取时真正校验这份快照。*

## 已落地实现补记（2026-07-11）

- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `buildRemoteAssetReferenceDigest()`
    - `captureRemoteAssetSnapshot()`
    - `verifyRemoteAssetSnapshot()`
  - `buildWorkSourceRef()` 现在允许附带可选：
    - `demoRef`
    - `videoRef`
  - `verifyWorkReadIntegrity()` 现在会在 `demoRef/videoRef` 存在时继续校验远端内容快照
- `src/lib/services/works.ts`
  - `listWorksForRace()`、`getWorkForPublicSlug()`、`getWorkForLegacyTeamSlug()` 现在都会在公开读取前复用远端内容快照校验
- `src/lib/services/awards.ts`
  - `listAwardsForRace()` 现在会对带 `demoRef/videoRef` 的 Work 追加远端内容快照校验
- `src/lib/services/races.ts`
  - `listRaces()` 现在会在 `registration.work` 与 `awards[].work` 上执行异步远端内容快照校验
- `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 里的公开 work 链路现在也会复用远端内容快照校验
- `src/lib/material-integrity-helpers.test.ts`
  - 已补：
    - remote asset snapshot capture
    - remote body digest mismatch
    - stale demo/video snapshot 校验
- `src/lib/services/public-routes.test.ts`
  - 已补：
    - stale demo snapshot 会让公开 work route 返回 `null`
- `src/lib/services/results.test.ts`
  - 已补：
    - stale video snapshot 会让公开赛果中的 `award.work` 被过滤

### 本轮明确没有做的事

- 没有扩 judge/private 读取
- 没有新增下载页 / 预览页
- 没有新增 schema
- 没有把无快照旧数据一刀切判成失败

### 新鲜验证证据

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
- `npm run build`
