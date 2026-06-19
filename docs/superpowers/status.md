# ARY 状态

本文记录当前工作区已经完成的 `grs003` 对齐进展、验证证据，以及尚未收口的方向。本文档统一使用 UTF-8 编码和中文维护。

## 当前状态

- 当前代码库已经从单页混合模式推进到分层结构，核心分区包括公开站、赛事控制台、管理控制台、大屏控制台和大屏展示层。
- 公开页面主路线已经落到 `/races`、`/works`、`/riders`、`/cooperation`、`/console/*` 这一组 `grs003` 推荐路径上。
- 控制台入口、评委视图、骑手视图、主办方视图，以及公开页中的大部分用户可见文案，已经收口到中文。
- Jumbotron 与大屏赛道渲染样式仍以“尽量保留最早样式”为原则，这几轮中文化收口没有改动赛道视觉结构。
- 项目尚未完成全部 `grs003` 要求，尤其是 GitHub OAuth、运行时路径、CA 接入，以及部分深层语义迁移仍在进行中。

## 已完成收口

## 2026-06-19 公开端与过程投影收口

- `src/lib/jumbotron/adapter.ts`
  - 去掉了在没有真实来源时伪造的骑行消息。
  - 去掉了在没有真实风险来源时伪造的低风险提醒项。
  - 活跃骑手和控制台 KPI 优先读取 `Registration / RaceProject`。
- `src/lib/services/projections.ts`
  - 增加 `EVENT_STREAM_READ_MODEL` 投影输出。
- `src/app/_components/public/live-hall.tsx`
  - 过程榜单改为读取 `CURRENT_LEADERBOARD`。
  - 事件流改为读取 `EVENT_STREAM_READ_MODEL`。
  - 不再回退到旧的 `leaderboardEntries`。
- 验证
  - `node --import tsx --test src/lib/jumbotron-adapter.test.ts src/app/_components/public/live-hall.test.tsx`

## 2026-06-19 公开结果链收口

- `src/lib/services/results.ts`
  - 增加 `buildPublicResultsModel()`。
  - 结果页开始按 `Award / Report / Work` 聚合公开赛果模型。
- `src/lib/services/review.ts`
  - 增加 `buildPublicReviewModel()`。
  - 复盘页开始按 `review_summary / Award / Evidence` 聚合。
- `src/lib/services/public-routes.ts`
  - 公开作品页和骑手页补齐 `techNotes`、`judgeComments`、`skillTags`、`performanceSummary`。
- 对应公开组件
  - `results-page.tsx`
  - `review-page.tsx`
  - `work-page.tsx`
  - `rider-profile-page.tsx`
  - `works-page.tsx`
- 验证
  - `node --import tsx --test src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts`

## 2026-06-19 控制台基础路线收口

- 新增控制台路由与壳层：
  - `src/app/console/layout.tsx`
  - `src/app/console/page.tsx`
  - `src/app/console/races/page.tsx`
  - `src/app/console/screen/page.tsx`
  - `src/app/_components/console/console-shell.tsx`
  - `src/app/_components/console/console-home.tsx`
  - `src/app/_components/console/console-races-page.tsx`
- `src/lib/viewer-access.ts`
  - 增加 `admin / judge / organizer / rider / screen` 入口控制。
- `src/lib/services/console-routes.ts`
  - 增加赛事控制台列表、大屏控制台列表，以及按 slug 取赛事上下文的逻辑。
- 验证
  - `node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts src/app/_components/console/console-copy.test.tsx`

## 2026-06-19 Judge 范围收口

- `src/lib/services/console-routes.ts`
  - `judge` 赛事列表改为只展示当前评委被分配作品所在的赛事。
- `src/lib/viewer-access.ts`
  - `judge` 赛事视图准入改为显式依赖 `isRaceJudge`。
- `src/app/console/races/[raceSlug]/page.tsx`
  - 进入赛事工作台时，评委只会在有 assignment 的赛事中跳转到 `judge/assigned`。
- `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`
  - 路由层显式按 assignment 数量控制评委准入。
- 验证
  - `node --import tsx --test src/lib/services/console-routes.test.ts src/lib/viewer-access.test.ts`

## 2026-06-19 submission 服务 registration-first 收口

- `src/lib/services/submissions.ts`
  - `createSubmission()` 和 `createFinalSubmission()` 先查 `Registration`，再查兼容 `team` 容器。
  - 对外错误语义统一回到“个人报名 / 可用提交容器 / 比赛阶段”。
- `src/lib/services/rider-bridge.ts`
  - 新增 `getCompatibilityContainerForRegistration()`，集中兼容层查询。
- 验证
  - `node --import tsx --test src/lib/services/submissions.test.ts`

## 2026-06-19 Rider Console 语义收口

- `src/lib/services/rider-console.ts`
  - 增加 `buildRiderConsoleReportModel()`。
- `src/app/_components/console/rider-console-page.tsx`
  - 视图语义改为 `报名 / 作品提交 / 评审结果 / 骑手报告`。
  - 不再直接暴露 compatibility 层概念。
- 验证
  - `node --import tsx --test src/lib/services/rider-console.test.ts src/app/_components/console/rider-console-page.test.tsx`

## 2026-06-19 Admin Console 最小账号治理中文化收口

- `src/app/_components/console/admin-console-page.tsx`
  - 收口为 `用户列表 / 资料补全 / 角色维护` 三个最小账号治理区块。
  - 角色标签改为：
  - `管理员`
  - `评委`
  - `主办方`
  - `骑手`
- `src/app/console/admin/[section]/page.tsx`
  - breadcrumb、title、description 和 section 标签改为中文。
- `src/app/_components/console/admin-console-page.test.tsx`
  - 新增 Admin Console 中文化测试。
- 验证
  - `node --import tsx --test src/app/_components/console/admin-console-page.test.tsx src/app/_components/console/console-copy.test.tsx`

## 2026-06-19 Live Hall 与 Race Page 公开入口中文化收口

- `src/app/_components/public/live-hall.tsx`
  - 改为中文公开标题、分区标题、按钮和空态：
  - `实况大厅`
  - `赛事状态`
  - `过程总览`
  - `过程指标`
  - `大屏入口`
  - `当前输出`
  - `骑手动态`
  - `报名状态`
  - `当前榜单`
  - `过程榜单`
  - `事件流`
  - `最近事件`
- `src/app/_components/public/race-page.tsx`
  - 改为中文公开入口和下一步入口：
  - `公开入口`
  - `查看作品`
  - `查看赛果`
  - `查看复盘`
  - `查看合作`
  - `返回赛事列表`
- 对应测试
  - `src/app/_components/public/live-hall.test.tsx`
  - `src/app/_components/public/race-page.test.tsx`
- 验证
  - `node --import tsx --test src/app/_components/public/live-hall.test.tsx src/app/_components/public/race-page.test.tsx`

## 2026-06-19 Organizer Console 与创建赛事页中文化收口

- `src/app/_components/console/organizer-console-page.tsx`
  - 收口 `overview / settings` 最显眼的英文界面：
  - `主办方视图`
  - `赛事概览`
  - `下一步入口`
  - `赛事内容`
  - `显示选项`
  - `保存赛事内容`
  - `保存显示选项`
- `src/app/console/races/new/page.tsx`
  - 创建赛事页改为中文：
  - `控制台`
  - `赛事控制台`
  - `创建赛事`
  - `返回赛事控制台`
  - `赛事表单`
- 对应测试
  - `src/app/_components/console/organizer-console-page.test.tsx`
  - `src/app/console/races/new/page.test.tsx`
- 验证
  - `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/console/races/new/page.test.tsx`

## 当前验证证据

- 公开页相关
  - `node --import tsx --test src/app/_components/public/live-hall.test.tsx src/app/_components/public/race-page.test.tsx src/app/_components/public/results-page.test.tsx src/app/_components/public/review-page.test.tsx src/app/_components/public/work-page.test.tsx src/app/_components/public/rider-profile-page.test.tsx src/app/_components/public/works-page.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx`
- 控制台相关
  - `node --import tsx --test src/app/_components/console/admin-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/console-copy.test.tsx src/app/console/races/new/page.test.tsx`
- 权限与服务相关
  - `node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts src/lib/services/submissions.test.ts src/lib/services/rider-console.test.ts`

## 当前阻塞 / 未完成项

- `docs/grs003` 的全部要求尚未完全完成，当前只是在持续推进收口。
- GitHub OAuth 仍未接入，当前仍是本地账号 / 密码会话。
- `Team` 兼容层仍然存在，深层 `teamId -> registrationId` 迁移尚未完成。
- `runner` 路径和 `CA Push + Fetch` 目标之间仍有差距。
- 除 `status.md` 之外，仓库中仍有不少旧文件或旧字符串可能带有历史编码问题。
- 构建阶段存在独立环境问题：
  - `src/lib/prisma.ts` 在 `production` 分支里硬编码写入 `/tmp/ary-runtime`。
  - 在当前 Windows 环境下会映射到 `C:\\tmp\\ary-runtime`，导致 `next build` 的某些场景出现 `EPERM: operation not permitted, mkdir 'C:\\tmp\\ary-runtime'`。
  - 这不是本次 `status.md` 编码修复引入的问题，但会影响后续完整构建验证。

## 下一步建议

- 先修 `src/lib/prisma.ts` 的运行时目录策略，把生产态 SQLite 运行目录收口到当前平台可写位置。
- 继续扫描用户可见英文残留，优先公开页和 Organizer Console 其他 section。
- 继续推进 `grs003` 深层语义迁移：GitHub OAuth、CA 接入链，以及兼容 `team` 退场。
