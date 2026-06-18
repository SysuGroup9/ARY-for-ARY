# Jumbotron Status

本文记录 Jumbotron 子系统在当前仓库中的真实状态。它不是产品 PRD，不是路线图，也不是开发计划。

## 当前结论

- 当前仓库已经实现一套可运行的 Jumbotron PoC。
- 当前子系统由 `Jumbotron / Race Live View`、`Track Profile Calibrator`、`track-runtime` 三部分组成。
- 当前实现已经并入 ARY Next.js 项目，不是独立仓库或独立部署产物。
- 当前数据链路以 ARY 本地数据和生成后的 RaceSnapshot 为主，不是独立 DevCompass 平台实时输入。
- 当前赛马位置以 `roundProgress → centerline → HorsePose` 为核心几何链路。

## 已实现事实

基于 `docs/grs002/Jumbotron-PRD.md` 当前可确认：

- 公开首页 Jumbotron 横幅
- 公开 `/jumbotron/[raceId]` 全屏大屏
- `/calibrator` 设计时校准工具
- `track-runtime` 共享几何与姿态计算
- `RaceSnapshot` 生成与读取链路
- 基于赛道中心线与 lane offset 的位置推导
- 基本的 KPI / TOP3 / ticker / message / debug mode 展示

## 当前 PoC 边界

当前仍应视为 PoC 或集成态能力的部分：

- DCR / DevCompass 真实平台未接入
- 一部分展示字段仍是推导字段，而非完整真实源字段
- 快照仍是文件化发布链路，不是完整实时流
- 多大屏模式和更复杂屏幕编排不在当前范围
- Calibrator 仍主要服务赛道资产生产，不是通用图形编辑平台

## 已知表述风险

后续文档和实现讨论中，最容易被说过头的点有：

- 把“信息架构中的目标字段”说成“当前代码已全部真实接入”
- 把“RaceSnapshot 快照驱动”说成“实时流式驱动”
- 把“DCRaceDataProvider 预留接口”说成“已经接入 DCR”
- 把“PoC 设计时工具”说成“生产级资产平台”

## 同步触发规则

出现以下变化时，必须同步本文：

- 新增或删除 Jumbotron 页面入口
- 新增或删除 Calibrator MVP 能力
- 数据源从 mock / 推导变成真实实现
- 快照发布方式改变
- 关键 PoC 边界被消除或新增

## 当前维护优先级

当前最重要的不是扩写愿景，而是持续保持 3 类信息一致：

1. `docs/grs002` 中的产品/作品说明
2. 当前代码里的真实实现
3. `docs/superpowers` 中给后续 Agent 的上下文与状态

## 最近修正

- 已修正 active race 在 `LeaderboardEntry.progress` 缺失时把所有队伍 `roundProgress` 压回 `0` 的问题。
- 当前 adapter 在显式 `progress` 缺失、但存在 leaderboard score 时，会临时退回到 `overallProgress` 作为赛道位置来源。
- 这符合 `Jumbotron子系统定义.md` 中“只有 `overallProgress` 时显式标记临时映射”的要求，也避免大屏所有队伍都停在起点。
- 已补充第二层保护：当 active race 的 leaderboard `progress` 被整批写成 `0`、但各队 `overallProgress` 明显分散时，adapter 不再把这批 `0` 当成可信赛道进度。
- 已扩展到 finished race：当已排名队伍的 `progress` 整批为占位 `0`、但最终分数明显分散时，adapter 同样回退到 `overallProgress`，避免赛后大屏所有队伍堆在终点线同一位置。
- signup / 未开赛赛事当前仍按文档约定停在起点，直到出现真实过程进度或比赛正式开始。

## 最近一次基线来源

当前状态基于以下文档收敛：

- `docs/grs002/Jumbotron信息架构.md`
- `docs/grs002/Jumbotron子系统定义.md`
- `docs/grs002/Jumbotron-PRD.md`

## GRS003 Public IA 当前进度

- 第 1 片区 `Public Information Architecture` 已启动并进入可运行骨架阶段。
- 首页已经开始从单页混合仪表盘收口为 `Race Gallery` 入口层。
- 公开端路由骨架已落地：
  - `/`
  - `/races/[raceSlug]`
  - `/races/[raceSlug]/live`
  - `/races/[raceSlug]/works`
  - `/races/[raceSlug]/results`
  - `/races/[raceSlug]/review`
  - `/works/[workSlug]`
  - `/riders/[riderSlug]`
  - `/cooperation`
- 顶层 `Public Header` 已对齐为：
  - `Races`
  - `Works`
  - `Riders`
  - `Cooperation`
  - `Login / Console Entry`
- `Console Entry` 已从公开首页主内容中剥离，并使用独立 `/console` 入口页承接登录用户后续工作台入口。
- `/races` 已从首页中拆成独立的 `All Races` 列表页，而不是继续复用首页完整内容。
- `/races` 已补入按阶段分组的公开赛事列表（进行中 / 封榜中、报名中 / 准备中、已结束赛事）。
- `Race Page` 已补入 `Overview / Public Entry / Riders / Works-Results-Review` 的最小公开分区。
- `Race Page` 已进一步补入 `Rules / Schedule / Next Step` 分区。
- `Results` 已补入 `Award Leaderboard / Winning Works / Review Entry` 分区。
- `Results` 已补入 `Riding Skill Highlights` 分区。
- `Works` 已补入最小排序语义，并展示作者和作品卡片的公开信息。
- `/works` 已补入 `Race Context / Filter / Sort / Work Cards` 的最小页面分区。
- `/works` 已补入 `Featured Works` 分区，并显示作者、所属赛事和评审结果摘要。
- `Rider Profile` 已补入代表赛事、代表作品和公开能力概览。
- `/riders` 已补入更明确的公开骑手资产列表，展示代表赛事、代表作品和公开作品数量。
- 首页已补入 `Past Races` 与 `报名 / 办赛 / 赞助 / 合作` CTA 分区。
- 首页 `Hero / Featured Races` 已补入当前状态、赛事时间、参赛人数、作品数量和主 CTA。
- 首页已去掉独立 `JumbotronBanner` 主视觉，当前首屏主结构已收口为 `Public Header + Hero / Featured Races`。
- `Review` 已补入 `Review Summary / Featured Cases / Award Rationale / Judge Comments / Next Race Suggestion` 分区。
- `Rider Profile` 已补入 `Agent Riding Skill` 摘要，以及 `Race Records / Judge Comments / Evidence` 分区。
- `Race Page` 已补入按赛事状态变化的主 CTA（如报名中显示 `立即报名`）。
- `Works` 已补入最小筛选/排序语义提示（当前按分数降序、仅显示公开作品）。
- 当前这些页面仍主要复用现有 read model / highlight / leaderboard 数据，属于“公开端结构先到位，数据语义后续继续收口”的阶段。

## 下一步默认检查项

后续 Agent 在做 Jumbotron 任务收尾时，默认复核：

- 是否新增了真实数据字段或删掉了推导字段
- 是否修改了 `RaceSnapshot` / Adapter / track-runtime 的责任边界
- 是否需要把新的实现偏差写回本文
