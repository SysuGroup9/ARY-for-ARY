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

## 2026-06-19 公开入口 / Live Hall / 大屏在线态收口

- `src/lib/viewer-access.ts`
  - 首页顶部公开入口改为 public-first：未登录用户仍走 `/login`，已登录用户不再把主入口直接替换成泛化的“进入控制台”。
  - `Console` 入口改为按实际可访问分区显示，只对有可用 Console section 的用户保留次级入口。
- `src/app/_components/public/public-header.tsx`
  - 改成公开入口与 Console 次级入口并存的结构。
- `src/app/login/page.tsx`
  - 移除登录页中的 seed/demo 账号展示面板。
- `src/app/_components/public/live-hall.tsx`
  - 大屏改为直接出现在 Live Hall 顶部。
  - 公开页不再直接暴露“打开大屏控制台”链接给普通观众。
- `src/app/JumbotronInline.tsx`
  - 从点击展开式预览改为直接内嵌展示大屏。
- `src/lib/services/race-snapshot.ts`
  - 补齐 session 的 `lastActiveAt` / `updatedAt` 数据供大屏 freshness 使用。
- `src/lib/jumbotron/adapter.ts`
  - 大屏在线态不再优先依赖旧 leaderboard 时间戳，而是优先读取最近 session 活动时间，避免选手在线时马匹刚进场就显示 `zzz`。
- `src/app/jumbotron/[raceId]/JumbotronClient.tsx`
  - 右上角在线数改为和赛道上实际参与状态判定使用同一套 freshness 口径，避免出现马匹数和 `在线 x/x` 不一致。
- `src/app/jumbotron/[raceId]/page.tsx`
  - 全屏大屏恢复为可在多场 live race 之间滚动切换的入口，不再只固定单场渲染。
- `src/lib/viewer-access.ts`
  - 首页顶部登录主入口文案改回可理解的登录入口，不再显示误导性的“返回公开站”。
- 验证
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/_components/public/live-hall.test.tsx`

## 2026-06-19 登录入口 / 报名入口 / 控制台入口收口

- `src/lib/viewer-access.ts`
  - 公开站主入口回到身份入口语义，不再把已登录用户默认导向 `/console`。
  - `Console` 入口继续只按可访问分区单独显示。
- `src/app/_components/public/public-header.tsx`
  - 保持公开入口与控制台入口双轨显示，避免把两者混成同一个按钮。
- `src/app/login/page.tsx`
  - 登录页改成公开身份入口说明，明确区分骑手注册与角色控制台权限。
- `src/app/_components/ary-shared.tsx`
  - 登录 / 注册 tab 与 auth hero 文案改成中文并对齐 `grs003` 角色语义。
- `src/app/_components/public/home-gallery.tsx`
  - 首页行动入口改成“骑手注册 / 登录”与“查看赛事并报名”的两步路径。
- `src/app/_components/public/race-page.tsx`
  - 报名阶段 CTA 改成真实的公开报名页入口，不再只是把按钮文案改成“登录后报名”。
- `src/app/_components/public/race-register-page.tsx`
  - 新增公开报名页视图，按未登录 / 非 Rider / 已报名 / 可直接报名四种状态给出真实承接。
  - 比赛开始后优先放行“赛前已报名”的 Rider 继续进入工作台，不再被统一挡成“当前不可报名”。
- `src/app/races/[raceSlug]/register/page.tsx`
  - 新增赛事公开报名路由，真正承接公开站报名按钮。
- `src/app/actions.ts`
  - 登录 / 注册动作支持 `returnTo` 回跳，未登录用户可在身份入口完成后返回原赛事报名页继续流程。
- `src/app/login/page.tsx`
  - `/login` 支持接收 `returnTo`，用于从公开报名页跳转到身份入口后再回到原页面继续流程。
- `src/app/_components/ary-shared.tsx`
  - `AuthTabsPanel` / `AuthForm` 支持透传 `returnTo`，登录与骑手注册都能回跳到来源页面。
- `src/app/_components/public/home-gallery.tsx`
  - 首页公开 CTA 从泛化的“查看赛事并报名”收口为通向真实报名链路的“查看赛事报名页”。
- `src/app/_components/public/race-page.tsx`
  - 报名阶段 CTA 改成真实的公开报名页入口，不再只是把按钮文案改成“登录后报名”。
- `src/app/_components/public/race-register-page.tsx`
  - 新增公开报名页视图，按未登录 / 非 Rider / 已报名 / 可直接报名四种状态给出真实承接。
  - 比赛开始后优先放行“赛前已报名”的 Rider 继续进入工作台，不再被统一挡成“当前不可报名”。
  - 比赛开始后未报名用户明确显示“报名已截止”，同时说明赛前已报名骑手仍可继续进入自己的工作台。
- `src/app/races/[raceSlug]/register/page.tsx`
  - 新增赛事公开报名路由，真正承接公开站报名按钮。
- `src/app/_components/console/rider-console-page.tsx`
  - Rider 未报名态明确为第二步：进入工作台后再对当前赛事提交正式报名。
- `src/lib/viewer-access.test.ts`
  - 更新公开身份入口与控制台入口分离后的断言。
- `src/app/_components/public/race-register-page.test.tsx`
  - 新增公开报名页测试，覆盖匿名用户回跳、Rider 直接报名、已报名用户继续进入工作台、比赛中阻止新报名等路径。
- 运行期核对
  - `GET /login` 返回 `200 OK`，服务端已输出完整页面 HTML，不是空路由也不是 404。
- 验证
  - `node --import tsx --test src/lib/viewer-access.test.ts`
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/_components/public/race-page.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx src/app/_components/console/rider-console-page.test.tsx`
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/_components/public/race-page.test.tsx src/app/_components/public/race-register-page.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx src/app/_components/console/rider-console-page.test.tsx`
  - `node --import tsx --test src/app/_components/public/race-register-page.test.tsx src/app/_components/public/race-page.test.tsx src/app/_components/console/rider-console-page.test.tsx`

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
