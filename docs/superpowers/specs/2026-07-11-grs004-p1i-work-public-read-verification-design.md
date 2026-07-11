# GRS004 / P1-I Work 公开读取校验 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§5.3 Work / 题目 / 外部材料缺少 hash 元数据`
  - `§8 验收标准`
    - `Work / 题目材料 hash 能记录并在读取时校验（待实现）`
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`

`P1-A` 已经给 `Work` 补上：

- `sourceRefJson`
- `contentHash`

但当前公开读取链路里，`Work` 仍会被直接读出并展示给用户，没有任何二次校验：

- 作品详情页
- 赛事作品列表
- 首页精选作品
- 骑手公开作品链接
- 赛果页中的 `award.work`

本轮目标是：**把 `Work.contentHash / sourceRefJson` 真正用于公开读取校验，阻断被篡改的 `Work` 继续进入公开结果链路。**

## 范围

### 本轮纳入

- 只收口公开读取相关服务层
- 校验字段：
  - `contentHash`
  - `sourceRefJson`
- 覆盖的真实公开链路：
  - `listRaces()` 返回的 `registration.work`
  - `listRaces()` 返回的 `awards[].work`
  - `getWorkForPublicSlug()`
  - `getWorkForLegacyTeamSlug()`
  - `getRiderBySlug()` 内部直查的 `registration.work / works`
  - `listAwardsForRace()`

### 本轮不纳入

- 不新增 schema
- 不新增文件级 Work 审计
- 不新增 judge / organizer 私有读取校验
- 不扩展到 GitHub repo 远端实际抓取校验
- 不新增下载页 / 预览页

## 约束

### 当前代码现实

- `src/lib/result-chain-helpers.ts`
  - `Work.contentHash` 当前基于：
    - `title`
    - `summary`
    - `demoUrl`
    - `repoUrl`
    - `techNotes`
    - `videoUrl`
  计算
- `src/lib/material-integrity-helpers.ts`
  - `buildWorkSourceRef()` 当前记录：
    - `demoUrl`
    - `repoUrl`
    - `videoUrl`
    - `techNotesIncluded`
- `listRaces()` 当前会把 `registration.work` 和 `awards[].work` 直接挂回 read model
- `getWorkBySlug()` / `getRiderBySlug()` 当前也会直接把 `Work` 暴露到公开页面模型

因此本轮应遵循：**不发明新的 Work 历史模型，只在公开读取服务层把现有 `contentHash / sourceRefJson` 用起来。**

## 方案选择

### 方案 A：在公开服务层校验，失败时不再返回该 Work

做法：

- 增加 `verifyWorkIntegrity()`
- 公开读取服务层在暴露 Work 前先校验：
  - `contentHash`
  - `sourceRefJson`
- 若失败：
  - `registration.work` 置 `null`
  - `awards[].work` 置 `null`
  - 作品详情页返回 `null`

优点：

- 直接命中“读取时校验”
- 不需要新增页面状态模型
- 可覆盖首页 / 赛事作品页 / 作品详情 / 赛果多个公开入口

缺点：

- 当前不会额外写统一审计

### 方案 B：只在作品详情页校验

优点：

- 改动最小

缺点：

- 首页、赛事作品页、赛果页仍会漏过去

### 推荐方案

采用 **方案 A：在公开服务层校验，失败时不再返回该 Work**。

原因：

- 最贴近验收标准里的“读取时校验”
- 不需要扩 UI，只需要在服务层统一收口

## 运行时规则

### 1. content hash 校验

按当前 `Work` 字段重算 hash：

- `title`
- `summary`
- `demoUrl`
- `repoUrl`
- `techNotes`
- `videoUrl`

必须等于 `contentHash`

### 2. source ref 校验

按当前字段重建：

- `demoUrl`
- `repoUrl`
- `videoUrl`
- `techNotesIncluded`

必须与存储的 `sourceRefJson` 一致

### 3. 失败时的行为

- 公开详情读取：
  - 返回 `null`
- 列表 / 聚合读取：
  - 对应 `work` 置 `null`
- 本轮不新增审计

## 测试对齐

需要扩展：

- `src/lib/material-integrity-helpers.test.ts`
- `src/lib/services/public-routes.test.ts`
- `src/lib/services/results.test.ts`

覆盖：

- `verifyWorkIntegrity()` 对正常 / 篡改 work 的判断
- 篡改后的 work 不再能通过 `getWorkBySlug()`
- 篡改后的 work 不再进入公开赛果 work link

## 验收对齐

本轮完成后，需要能证明：

1. `Work.contentHash / sourceRefJson` 已用于公开读取校验
2. 篡改后的 Work 不会继续进入公开详情 / 公开列表 / 公开赛果链路
3. 本轮没有新增 schema 或新 UI

## 一句话结论

`P1-I` 的目标是：*把 `Work` 已经写下来的 `contentHash / sourceRefJson` 真正用于公开读取校验，阻断被篡改作品继续进入公开结果链路。*

## 已落地实现补记（2026-07-11）

- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `verifyWorkIntegrity()`
  - 当前会同时校验：
    - `contentHash`
    - `sourceRefJson`
- `src/lib/services/races.ts`
  - `listRaces()` 现在会把无效：
    - `registration.work`
    - `awards[].work`
    置为 `null`
- `src/lib/services/works.ts`
  - `getWorkForPublicSlug()` / `getWorkForLegacyTeamSlug()` 现在会拦截篡改后的公开 work 详情读取
- `src/lib/services/awards.ts`
  - `listAwardsForRace()` 现在会过滤无效 `award.work`
- `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 里的 work 直查结果现在也会过滤无效记录
- `src/lib/material-integrity-helpers.test.ts`
  - 已补 `verifyWorkIntegrity()` 正常 / 篡改覆盖
- `src/lib/services/public-routes.test.ts`
  - 已补：
    - tampered work 不再能通过 `getWorkBySlug()`
    - race read model 不再暴露 tampered work
- `src/lib/services/results.test.ts`
  - 已补 tampered `award.work` 不再生成公开结果链路

### 本轮明确没有做的事

- 没有新增 judge/private 读取校验
- 没有新增 Work 读取拒绝审计
- 没有新增远端 repo/demo/video 实际抓取校验
- 没有新增 schema

### 新鲜验证证据

- `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
- `npm run build`
