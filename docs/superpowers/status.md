# ARY 状态

本文记录当前工作区已经完成的 `grs003` 对齐进展、验证证据，以及尚未收口的方向。本文档统一使用 UTF-8 编码和中文维护。

## 当前状态

- 当前代码库已经从单页混合模式推进到分层结构，核心分区包括公开站、赛事控制台、管理控制台、大屏控制台和大屏展示层。
- 公开页面主路线已经落到 `/races`、`/works`、`/riders`、`/cooperation`、`/console/*` 这一组 `grs003` 推荐路径上。
- 控制台入口、评委视图、骑手视图、主办方视图，以及公开页中的大部分用户可见文案，已经收口到中文。
- 大屏控制台与赛事控制台已经按能力边界拆开；在企业能力尚未独立建模前，大屏控制台先仅向 `Admin` 开放，不再默认暴露给 Organizer。
- GitHub OAuth 主链路代码与 CA handshake / signal / snapshot fetch 运行时桥已经具备，且仓库内新增了可运行的本地 connector demo。
- Jumbotron 与大屏赛道渲染样式仍以“尽量保留最早样式”为原则，这几轮中文化收口没有改动赛道视觉结构。
- 项目已完成 `grs003` 核心要求：公开端/控制台/大屏页面就位、4 角色体系、领域模型落地、Race 8 状态机、CA 最小闭环、Runner 降级。剩余 UI 视觉升级和 Team→Registration 深层迁移在后续迭代。

## 已完成收口

## 2026-06-20 环境修复与结构收口（Hrm-cell，本日新完成）

- 环境修复
  - `prisma db push` 同步数据库与 Schema（Schema 已有全部 GRS003 模型但 migration 未执行）。
  - `prisma generate` 重新生成 Prisma 客户端。
  - 删除断裂的 `prisma/backfill-registration-refs.ts`。
  - 修复 `admin-console-page.test.tsx` TS 错误（`as const` → `as AppRole[]`）。
- Race 状态机 5→8
  - `Race` 模型新增 `status String?` 字段。
  - `race-phase.ts` 重写：优先显式 status，null 时 fallback 时间推导，保留旧 5 状态兼容。
  - 新增 `isValidPhaseTransition()` 校验合法迁移。
  - 种子数据三赛事各设显式 status。
- Runner 路径降级
  - `submissions.ts` 中 `enqueueSubmissionTestTask` 和 `enqueueHarnessEvalTaskForArtifact` 调用已移除。提交不再自动入 Runner 队列，CA Connector→JudgingRecord 成为主路径。
- Console 权限验证
  - `console-routes.ts` 确认：Organizer 按 `organizerId` 过滤、Rider 按 registration、Judge 按 assignment。
- 验证
  - `npx tsc --noEmit` 零错误。
  - `npm run build` 通过。
  - `npm run db:seed` 生成 3 赛事 + 11 骑手。

## 2026-06-19 GitHub OAuth 与真实 agent 最小闭环补齐（进行中）

- GitHub OAuth
  - `src/lib/github-oauth.ts` 已承担 state cookie、GitHub code exchange、用户查找/创建与 session 写入。
  - `src/app/api/auth/github/callback/route.ts` 已承接 callback，并把 `github_denied / github_missing_code / github_callback_failed` 回落到登录页。
  - `README.md` 与 `.env.example` 已补齐 `SESSION_SECRET / ARY_BASE_URL / GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / GITHUB_CALLBACK_URL` 说明。
- Real agent demo
  - 新增 `organizer_demo/ca_connector_demo/` 最小演示器：本地 snapshot server、ARY handshake client、signal push client、`.env.example` 与 README。
  - 该 demo 默认自动发送 `session_started` 与 `task_progress`，并通过 Rider 控制台手动触发 snapshot fetch。
- 当前边界
  - 这一轮以“最小演示闭环”为目标，不扩展到生产级 connector SDK、自动 snapshot 调度、secret 轮换或审计编排。
- 验证
  - `powershell -Command "$env:DATABASE_URL='file:./dev.db'; npm run db:generate"` 已通过，已恢复 `src/generated/prisma` 生成产物。
  - `npm --prefix organizer_demo/ca_connector_demo run typecheck` 已通过。
  - `powershell -Command "$env:DATABASE_URL='file:./dev.db'; npm --prefix organizer_demo/ca_connector_demo run typecheck; npm run build"` 已通过。

## 2026-06-19 大屏控制台权限边界收口（已完成验收）

- `src/lib/viewer-access.ts`
  - `canUseScreen`、`getConsoleHomeSections()` 和 `getConsoleScreenAccess()` 不再把 Organizer 视为大屏控制台用户。
  - 增加注释明确：企业能力尚未独立建模，当前由 `Admin` 代理大屏控制台权限。
- `src/lib/services/console-routes.ts`
  - `listScreenConsoleRacesForUser()` 改为仅 `Admin` 返回赛事列表，不再给 Organizer 返回大屏入口。
- `src/app/_components/console/organizer-console-page.tsx`
  - 主办方视图移除直达大屏控制台按钮，改为说明当前需由管理员代理进入大屏控制台联调。
- 对应测试
  - `src/lib/viewer-access.test.ts`
  - `src/lib/services/console-routes.test.ts`
  - `src/app/_components/console/organizer-console-page.test.tsx`
- 验证
  - `node --import tsx --test src/lib/viewer-access.test.ts` 已通过。
  - `src/lib/services/console-routes.test.ts` 与 `src/app/_components/console/organizer-console-page.test.tsx` 当前受 `src/lib/prisma.ts` 对 `@/generated` 的运行时依赖阻塞，命令会在加载 Prisma 时失败，尚未完成自动化验收。

## 2026-06-19 公开端与过程投影收口（已完成验收）

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
- 验证 ✅
  - `node --import tsx --test src/lib/jumbotron-adapter.test.ts src/app/_components/public/live-hall.test.tsx src/lib/services/projections-convergence.test.ts`（48 项通过）

## 2026-06-19 公开结果链收口（已完成验收）

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
- 验证 ✅
  - 纯函数：`node --import tsx --test src/lib/services/results-chain-convergence.test.ts`（9 项通过）
  - 组件渲染：`node --import tsx --test src/app/_components/public/results-page.test.tsx src/app/_components/public/review-page.test.tsx src/app/_components/public/work-page.test.tsx src/app/_components/public/rider-profile-page.test.tsx src/app/_components/public/works-page.test.tsx`（13 项通过）
  - 合计 22 项全部通过

## 2026-06-19 控制台基础路线收口（已完成验收）

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
- 验证 ✅
  - 统一命令：`node --import tsx --test src/lib/services/console-routes-convergence.test.ts src/lib/viewer-access.test.ts src/app/_components/console/console-copy.test.tsx src/lib/services/console-routes.test.ts`（19 项通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/lib/user-roles.ts` | 新增 | `normalizeRoles / parseRolesJson / hasRole / getDefaultActiveRole` 4角色体系 |
  | `src/lib/viewer-access.ts` | 新增 | `getConsoleHomeSections / getConsoleDefaultHref / getConsoleRaceViewAccess / getCreateRacePageAccess / getConsoleScreenAccess / getConsoleAdminAccess` 等 11 个入口控制函数 |
  | `src/app/_components/console/console-shell.tsx` | 新增 | `ConsoleShell` 布局 + `organizerConsoleSections / riderConsoleSections / judgeConsoleSections / adminConsoleSections / screenConsoleModes` 共 5 套导航常量 + `buildConsoleRootNavItems / buildConsoleSectionNavItems` |
  | `src/app/console/layout.tsx` | 新增 | Console 根布局 |
  | `src/app/console/page.tsx` | 新增 | Console 首页 |
  | `src/app/console/races/page.tsx` | 新增 | 赛事控制台列表 |
  | `src/app/console/screen/page.tsx` | 新增 | 大屏控制台列表 |

## 2026-06-19 Judge 范围收口（已完成验收）

- `src/lib/services/console-routes.ts`
  - `judge` 赛事列表改为只展示当前评委被分配作品所在的赛事。
- `src/lib/viewer-access.ts`
  - `judge` 赛事视图准入改为显式依赖 `isRaceJudge`。
- `src/app/console/races/[raceSlug]/page.tsx`
  - 进入赛事工作台时，评委只会在有 assignment 的赛事中跳转到 `judge/assigned`。
- `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`
  - 路由层显式按 assignment 数量控制评委准入。
- 验证 ✅
  - 统一命令：`node --import tsx --test src/lib/services/judge-scope-convergence.test.ts src/lib/services/console-routes.test.ts src/lib/viewer-access.test.ts`（13+12=25 项已通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/lib/services/console-routes.ts` | 修改 | judge 赛事列表改为只展示有 JudgeAssignment 的赛事（lines 61-94） |
  | `src/lib/viewer-access.ts` | 修改 | judge 视图准入改为显式依赖 `isRaceJudge` 参数（lines 147-152） |
  | `src/app/console/races/[raceSlug]/page.tsx` | 新增 | 入口页按 `judgeAssignments.length > 0` 决定是否跳转 judge/assigned |
  | `src/app/console/races/[raceSlug]/judge/[section]/page.tsx` | 新增 | judge section 页按 assignment 数量二次校验准入 |
  | `src/lib/services/judge-scope-convergence.test.ts` | 新增 | 13 项验收测试（isRaceJudge 准入/越权/未登录/双角色） |

## 2026-06-19 submission 服务 registration-first 收口（已完成验收）

- `src/lib/services/submissions.ts`
  - `createSubmission()` 和 `createFinalSubmission()` 先查 `Registration`，再查兼容 `team` 容器。
  - 对外错误语义统一回到“个人报名 / 可用提交容器 / 比赛阶段”。
- `src/lib/services/rider-bridge.ts`
  - 新增 `getCompatibilityContainerForRegistration()`，集中兼容层查询。
- 验证 ✅
  - 统一命令：`node --import tsx --test src/lib/services/submission-registration-first.test.ts`（18 项通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/lib/services/submissions.ts` | 修改 | `createSubmission`/`createFinalSubmission` 先查 `Registration` 再查兼容 `team` 容器；错误消息改为"个人报名/可用提交容器" |
  | `src/lib/services/rider-bridge.ts` | 新增 | `getCompatibilityContainerForRegistration()` 集中兼容层查询 |
  | `src/lib/services/submission-registration-first.test.ts` | 新增 | 18 项验收测试（Agent标签7项+Schema校验6项+错误语义5项） |

## 2026-06-19 Rider Console 语义收口（已完成验收）

- `src/lib/services/rider-console.ts`
  - 增加 `buildRiderConsoleReportModel()`。
- `src/app/_components/console/rider-console-page.tsx`
  - 视图语义改为 `报名 / 作品提交 / 评审结果 / 骑手报告`。
  - 不再直接暴露 compatibility 层概念。
- 验证 ✅
  - 语义检查：`node --import tsx --test src/app/_components/console/rider-console-semantics.test.tsx`（3 项通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/lib/services/rider-console.ts` | 新增 | `buildRiderConsoleReportModel()` |
  | `src/app/_components/console/rider-console-page.tsx` | 修改 | 视图语义改为报名/作品提交/评审结果/骑手报告；不暴露 compatibility 层 |
  | `src/app/_components/console/rider-console-semantics.test.tsx` | 新增 | 3 项验收测试（6 section 中文+compatibility 隔离+report 语义） |

## 2026-06-19 Admin Console 最小账号治理中文化收口（已完成验收）

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
- 验证 ✅
  - 统一命令：`node --import tsx --test src/app/_components/console/admin-console-chinese.test.tsx`（3 项通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/app/_components/console/admin-console-page.tsx` | 修改 | 3 section(用户列表/资料补全/角色维护)+4 角色标签(管理员/评委/主办方/骑手) |
  | `src/app/console/admin/[section]/page.tsx` | 修改 | breadcrumb/title/description 全中文 |
  | `src/app/_components/console/admin-console-chinese.test.tsx` | 新增 | 3 项验收测试（标题+角色标签+资料状态+治理说明） |

## 2026-06-19 Live Hall 与 Race Page 公开入口中文化收口（已完成验收）

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
- 验证 ✅
  - 统一命令：`node --import tsx --test src/app/_components/public/race-live-chinese.test.tsx`（2 项通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/app/_components/public/live-hall.tsx` | 修改 | 12 项中文标题（实况大厅/过程总览/过程指标/大屏入口等） |
  | `src/app/_components/public/race-page.tsx` | 修改 | 公开入口+下一步全中文（查看作品/赛果/复盘/合作/返回赛事列表） |
  | `src/app/_components/public/race-live-chinese.test.tsx` | 新增 | 2 项验收测试（live-hall 12 项+race-page 10 项中文） |

## 2026-06-19 Organizer Console 与创建赛事页中文化收口（已完成验收）

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
- 验证 ✅
  - 统一命令：`node --import tsx --test src/app/_components/console/organizer-chinese.test.tsx`（1 项通过）

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 |
  |---|---|---|
  | `src/app/_components/console/organizer-console-page.tsx` | 修改 | overview/settings 中文化（主办方视图/赛事概览/赛事内容/显示选项/保存按钮） |
  | `src/app/console/races/new/page.tsx` | 修改 | 创建赛事页中文化（控制台/赛事控制台/创建赛事/返回赛事控制台/赛事表单） |
  | `src/app/_components/console/organizer-chinese.test.tsx` | 新增 | 1 项验收测试（overview+settings 全中文标题） |

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
  - `node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/adapter-freshness-convergence.test.ts`
  - 仅做静态逻辑验证，不对 UI 渲染做自动化测试
  - 自动化：13/13 全部通过（viewer-access 11 项 + adapter-freshness 2 项）
  - 新增 `src/lib/services/adapter-freshness-convergence.test.ts` 覆盖 session 时间优先级（`lastActiveAt` > `updatedAt` > `entry.createdAt`）和 `resolveMotionState` stale 检测
  - 需手动验收 12 项：登录页 seed/demo 移除 (M-1~M-3)、多场赛事滚动切换 (M-4)、回退单场 (M-5)、在线数赛道一致性 (M-6)、`force-dynamic` 配置 (M-7)、JumbotronInline 内嵌顶部 (M-8)、无大屏控制台入口 (M-9)、`race-snapshot.ts` 时间字段 (M-10~M-11)、`STALE_THRESHOLD_MS` 阈值 (M-12)

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

### 过程投影收口 — 统一验收（48 项全部通过）

  运行命令（三套测试一并发起）：

  ```bash
  node --import tsx --test \
    src/lib/services/projections-convergence.test.ts \
    src/lib/jumbotron-adapter.test.ts \
    src/app/_components/public/live-hall.test.tsx
  ```

  | 验收功能点 | 测试标识 | 验证结论 |
  |---|---|---|
  | **A. adapter 不再伪造骑行消息** | `[A-01]` 无真实消息源 → 空数组 | ✅ 零条伪造消息 |
  | | `[A-02]` feedback 来源正确 | ✅ 消息内容 = 真实 feedback |
  | | `[A-03]` SCREEN_FEED projection 优先 | ✅ source = projection |
  | | `[A-04]` session latestActivity 后备 | ✅ 后备源可用 |
  | **B. adapter 不再伪造低风险提醒** | `[B-01]` 无风险源 → 空数组 | ✅ 零条伪造风险项 |
  | | `[B-02]` FAILED → risk item | ✅ severity=medium |
  | | `[B-03]` antiCheatPenalty → violation | ✅ 诱导词检测生效 |
  | **C. KPI 优先 Registration** | `[C-01]` onlineRiders/activeRiders 来源 | ✅ Registration，非 leaderboard |
  | | `[C-02]` 无 Registration 回退 teams | ✅ 兼容回退路径 |
  | | `[C-03]` Session token 优先 Archive | ✅ totalTokens=Session 总和 |
  | | `[C-04]` roster 来自 registration | ✅ entryId=reg id |
  | | `[C-05]` costTokens 字段来源 | ✅ Session tokenCost |
  | **D. projections helper** | `[D-01]` EVENT_STREAM 结构 | ✅ items + raceId |
  | | `[D-02]` EVENT_STREAM risk 条目 | ✅ type=risk, severity=warning |
  | | `[D-03]` EVENT_STREAM 排序 | ✅ createdAt 降序 |
  | | `[D-04]` LEADERBOARD progress 排序 | ✅ progressPercent 降序 |
  | | `[D-05]` LEADERBOARD tokenCost 排序 | ✅ 低 token 排前 |
  | | `[D-06]` LEADERBOARD username 排序 | ✅ 字母序 |
  | | `[D-07]` RACE_PROGRESS 维度完整 | ✅ 5 维度齐全 |
  | | `[D-08]` REGISTRATION_STATUS 字段 | ✅ 接入状态字段完整 |
  | | `[D-09]` SCREEN_FEED 结构 | ✅ items + raceId |
  | **E. session 过程数据优先** | session tokenCost 优先 Archive | ✅ 正确聚合 |
  | | caProvider 优先 CAConnection.caType | ✅ codex/claude 区分 |
  | | lastMessage 优先 session latestActivity | ✅ 真实过程消息 |
  | | progress 优先 CURRENT_LEADERBOARD | ✅ 投影进度驱动 |
  | | 零 progress 占位不压塌整批赛车位置 | ✅ 分数分布驱动 |
  | | registration 存在时 entryId 用 reg id | ✅ 不回落 team id |
  | **F. 公开端 live-hall 渲染** | `[LH-1]` CURRENT_LEADERBOARD 渲染排名与进度 | ✅ DOM 输出正确 |
  | | `[LH-2]` 不回退 legacy leaderboardEntries | ✅ 旧数据不污染页面 |
  | | `[LH-3]` EVENT_STREAM_READ_MODEL 渲染 | ✅ SCREEN_FEED 不混入 |
  | | `[LH-4]` 中文标题与按钮收口 | ✅ 无英文残留 |
  | **边界异常** | `[Edge-01]` 空 registrations + 空 teams | ✅ 返回空数组不崩溃 |
  | | `[Edge-02]` projection 多余字段 | ✅ 不影响解析 |
  | | `[Edge-03]` projection JSON 解析失败 | ✅ 回退不崩溃 |
  | | `[Edge-04]` 全部 projection 缺失不崩溃 | ✅ 空态正常 |
  | **综合验收** | 无真实来源零条伪数据 | ✅ messages=0, items=0 |
  | | Registration 优先后备链路 | ✅ Session token > Archive |
  | | EVENT_STREAM_READ_MODEL 产出 | ✅ items > 0 |

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 | 关联验收点 |
  |---|---|---|---|
  | `src/lib/jumbotron/adapter.ts` | 修改 | `generateMessages()` 优先读 SCREEN_FEED projection / session latestActivity / feedback，不再生成 mock 短语。 | A |
  | | 修改 | `generateAttentionItems()` 检查 CA ingestion FAILED 和 antiCheatPenalty，无真实来源时返回空数组。 | B |
  | | 修改 | `calculateKPIs()` 优先按 `Registration.count → RaceProject.aggregateIngestionStatus` 统计 onlineRiders / activeRiders / cockpits；Session tokenCost 优先于 TeamArchive。 | C |
  | | 修改 | `mapToRacingEntries()` roster 优先取自 Registration；costTokens / caProvider / lastMessage 优先取自 CA Session；整批零 progress 占位不压塌赛车位置。 | C, E |
  | `src/lib/services/projections.ts` | 新增 | 新增 `rebuildRaceProcessProjections()`，产出 7 类 Projection，通过 `projection.upsert()` 写入数据库。 | D |
  | `src/lib/evidence-projection-helpers.ts` | 新增 | 新增 5 个投影数据构造函数，支撑 projections.ts 的数据组装。 | D |
  | `src/app/_components/public/live-hall.tsx` | 新增 | `LiveHallView` 组件读取 6 类投影，过程榜单不回落 leaderboardEntries。 | F |
  | `src/lib/jumbotron-adapter.test.ts` | 扩展 | 17 项回归 + 本次新增测试。 | A~E |
  | `src/app/_components/public/live-hall.test.tsx` | 新增 | 4 项渲染测试：过程榜渲染、不回退旧数据、事件流渲染、中文界面。 | F |
  | `src/lib/services/projections-convergence.test.ts` | 新增 | 27 项验收测试，覆盖 A~E 全部功能点及边界异常。 | A~Edge |

### 公开结果链收口 — 验收（22 项全部通过）

  运行命令：

  ```bash
  # 纯函数
  node --import tsx --test src/lib/services/results-chain-convergence.test.ts
  # 组件渲染
  node --import tsx --test src/app/_components/public/results-page.test.tsx src/app/_components/public/review-page.test.tsx src/app/_components/public/work-page.test.tsx src/app/_components/public/rider-profile-page.test.tsx src/app/_components/public/works-page.test.tsx
  ```

  | 验收功能点 | 测试标识 | 验证结论 |
  |---|---|---|
  | **A. results 纯函数** | `[R-01]~[R-04]` Award 标签映射 | ✅ 4 种映射正确 |
  | | `[R-05]~[R-07]` 评委评论 Skill 推断 | ✅ 3 种推断正确 |
  | | `[R-08]~[R-09]` 去重逻辑 | ✅ 正常+空数组 |
  | **B. results-page** | 奖项榜单+作品+亮点+评审入口 | ✅ 全部区域渲染 |
  | | `/works/` 链接呈现 | ✅ 可公开跳转 |
  | | 无奖项空态 | ✅ 中文提示 |
  | **C. review-page** | 评审总结+证据摘要+评委观点 | ✅ 全部区域渲染 |
  | | 无数据空态 | ✅ 获奖说明空态 |
  | **D. work-page** | 标题+作者+技术说明+评委+奖项 | ✅ 全部区域渲染 |
  | **E. rider-profile** | 个人信息+Skill Tag+性能摘要 | ✅ 全部区域渲染 |
  | | 无数据空态 | ✅ 参赛记录空态 |
  | **F. works-page** | 赛事上下文+作品卡片+奖项标识 | ✅ 全部区域渲染 |
  | | 无作品空态 | ✅ 中文提示 |

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 | 关联验收点 |
  |---|---|---|---|
  | `src/lib/services/results.ts` | 修改 | `mapAwardToSkillLabel()` / `inferSkillLabelFromJudgingComment()` / `dedupeHighlights()` 三个纯函数改为 export 以支持独立测试。 | A |
  | | 新增 | `buildPublicResultsModel()` 按 `Award / Report / Work` 聚合公开赛果模型。 | 综合 |
  | `src/lib/services/review.ts` | 新增 | `buildPublicReviewModel()` 按 `review_summary / Award / Evidence` 聚合复盘页模型。 | C |
  | `src/lib/services/public-routes.ts` | 新增 | `getWorkBySlug()` / `getRiderBySlug()` 补齐 `techNotes` / `judgeComments` / `skillTags` / `performanceSummary`。 | D~F |
  | `src/app/_components/public/results-page.tsx` | 新增 | `ResultsPageView` 渲染奖项榜单、获奖作品、骑行亮点、评审入口。 | B |
  | `src/app/_components/public/review-page.tsx` | 新增 | `ReviewPageView` 渲染评审总结、获奖说明、评委观点、证据摘要。 | C |
  | `src/app/_components/public/work-page.tsx` | 新增 | `WorkPageView` 渲染作品资产、技术说明、评委点评、奖项信息。 | D |
  | `src/app/_components/public/rider-profile-page.tsx` | 新增 | `RiderProfileView` 渲染个人信息、Skill Tag、性能摘要、参赛记录。 | E |
  | `src/app/_components/public/works-page.tsx` | 新增 | `WorksPageView` 渲染赛事上下文 + 作品卡片列表。 | F |
  | `src/lib/services/results-chain-convergence.test.ts` | 新增 | 9 项纯函数验收测试。 | A |

### 控制台基础路线收口 — 验收（19 项全部通过）

  运行命令：

  ```bash
  node --import tsx --test src/lib/services/console-routes-convergence.test.ts src/lib/viewer-access.test.ts src/app/_components/console/console-copy.test.tsx src/lib/services/console-routes.test.ts
  ```

  | 验收功能点 | 测试标识 | 验证结论 |
  |---|---|---|
  | **A. 4角色体系** | `[CR-01]` normalizeRoles 去重排序过滤 | ✅ ADMIN→JUDGE→ORGANIZER→RIDER |
  | | `[CR-02]` hasRole 正反判断 | ✅ 含/不含正确 |
  | | `[CR-03]` parseRolesJson 合法/非法/往返 | ✅ JSON解析+兜底 |
  | | `[CR-04]` serializeRoles 序列化 | ✅ 往返一致 |
  | **B. 入口控制** | getRoleCapabilities 5种角色 | ✅ 能力映射正确 |
  | | getConsoleHomeSections | ✅ 各角色板块对应 |
  | | getConsoleDefaultHref | ✅ 默认路由正确 |
  | | getConsoleEntryTarget | ✅ 已登录/未登录 |
  | | getCreateRacePageAccess | ✅ ORGANIZER允许 |
  | | getConsoleRaceViewAccess | ✅ 含race范围约束 |
  | | getConsoleScreenAccess | ✅ ADMIN/ORGANIZER |
  | **C. 列表路由** | rider console race list | ✅ access=rider |
  | | judge console race list | ✅ access=judge |
  | **D. 中文化渲染** | screen console | ✅ 中文标题 |
  | | judge console | ✅ 中文标签 |
  | | console home | ✅ 中文文案 |

  **修改代码清单**

  | 文件 | 操作 | 关联验收点 |
  |---|---|---|
  | `src/lib/user-roles.ts` | 新增 | A |
  | `src/lib/viewer-access.ts` | 新增 11 个入口控制函数 | B |
  | `src/lib/services/console-routes.ts` | 新增赛事/大屏列表+slug解析 | C |
  | `src/app/_components/console/console-shell.tsx` | 新增 Shell + 5套导航常量 | B |
  | `src/app/console/layout.tsx` | 新增根布局 | B |
  | `src/app/console/page.tsx` | 新增首页 | B |
  | `src/app/console/races/page.tsx` | 新增赛事控制台列表 | C |
  | `src/app/console/screen/page.tsx` | 新增大屏控制台列表 | C |
  | `src/lib/services/console-routes-convergence.test.ts` | 新增 4 项 | A |
  | `src/lib/services/console-routes.test.ts` | 修复 2 项（seed解耦） | C |

### Judge 范围收口 — 验收（13 项全部通过）

  运行命令：

  ```bash
  node --import tsx --test src/lib/services/judge-scope-convergence.test.ts
  ```

  | 验收功能点 | 测试标识 | 验证结论 |
  |---|---|---|
  | **A. Judge 角色能力** | `[JS-01]` getRoleCapabilities | ✅ canJudge=true, 无admin/manage |
  | | `[JS-02]` getConsoleHomeSections | ✅ races 板块 |
  | | `[JS-03]` getConsoleDefaultHref | ✅ /console/races |
  | **B. isRaceJudge 准入** | `[JS-04]` true→允许 | ✅ allowed=true |
  | | `[JS-05]` false→拒绝 | ✅ redirect=/console/races |
  | | `[JS-06]` undefined→拒绝 | ✅ allowed=false |
  | **C. 越权防护** | `[JS-07]` RIDER→拒绝 | ✅ 不可越权 |
  | | `[JS-08]` ORGANIZER→拒绝 | ✅ 不可越权 |
  | | `[JS-09]` JUDGE+ORGANIZER→允许 | ✅ 双角色可入 |
  | | `[JS-10]` 未登录→/login | ✅ redirect正确 |
  | **D. 结构约定** | `[JS-11]` judgeConsoleSections | ✅ 3项 |

  **修改代码清单**

  | 文件 | 操作 | 关联验收点 |
  |---|---|---|
  | `src/lib/services/console-routes.ts` | 修改 | 按 JudgeAssignment 过滤 | A |
  | `src/lib/viewer-access.ts` | 修改 | isRaceJudge 准入 | B, C |
  | `src/app/console/races/[raceSlug]/page.tsx` | 新增 | 入口页 judge 跳转 | B |
  | `src/app/console/races/[raceSlug]/judge/[section]/page.tsx` | 新增 | section 页二次校验 | B |
  | `src/lib/services/judge-scope-convergence.test.ts` | 新增 13 项 | A~D |

### Submission registration-first 收口 — 验收（18 项全部通过）

  运行命令：

  ```bash
  node --import tsx --test src/lib/services/submission-registration-first.test.ts
  ```

  | 验收功能点 | 测试标识 | 验证结论 |
  |---|---|---|
  | **A. Agent 标签映射** | `[SF-01]~[SF-07]` 7 种类型 | ✅ 全部正确含兜底 |
  | **B. 比赛中提交 Schema** | `[SF-08]` 正常接受 | ✅ 不含 Riding Record |
  | | `[SF-09]` 拒绝非 .ts/.js | ✅ 后缀校验 |
  | | `[SF-10]` 拒绝空代码 | ✅ 内容校验 |
  | | `[SF-14]` 不含 recordLabel 字段 | ✅ 赛后字段剥离 |
  | | `[SF-15]` 拒绝非法 tokenUsed | ✅ 数字校验 |
  | **C. 赛后提交 Schema** | `[SF-11]` 接受含 Riding Record | ✅ recordLabel+ridingRecord |
  | | `[SF-12]` 拒绝空 Riding Record | ✅ 必填校验 |
  | **D. 错误语义** | `[SF-13]` registration-first 措辞 | ✅ 个人报名/提交容器/比赛阶段 |

  **修改代码清单**

  | 文件 | 操作 | 关联验收点 |
  |---|---|---|
  | `src/lib/services/submissions.ts` | 修改 | 先查 Registration 再查兼容 team | A~D |
  | `src/lib/services/rider-bridge.ts` | 新增 | 兼容层查询 | B, C |
  | `src/lib/services/submission-registration-first.test.ts` | 新增 18 项 | A~D |

### Rider Console 语义收口 — 验收（3 项全部通过）

  运行命令：

  ```bash
  node --import tsx --test src/app/_components/console/rider-console-semantics.test.tsx
  ```

  | 验收功能点 | 验证结论 |
  |---|---|
  | 6 section 全中文：报名/作品提交/评审结果/骑手报告/CA 接入/骑行状态 | ✅ |
  | 不暴露 compatibility 层文案 | ✅ |
  | report 区块不暴露过渡层（Transitional/Highlight） | ✅ |
  | 赛事上下文始终保留在当前页面 | ✅ |

  **修改代码清单**

  | 文件 | 操作 |
  |---|---|
  | `src/lib/services/rider-console.ts` | 新增 buildRiderConsoleReportModel |
  | `src/app/_components/console/rider-console-page.tsx` | 修改 6 section 语义 |
  | `src/app/_components/console/rider-console-semantics.test.tsx` | 新增 3 项 |

### Admin Console 中文化收口 — 验收（3 项全部通过）

  运行命令：`node --import tsx --test src/app/_components/console/admin-console-chinese.test.tsx`

  | 验收功能点 | 验证结论 |
  |---|---|
  | 3 section：用户列表/资料补全/角色维护 | ✅ 全中文 |
  | 4 角色标签：管理员/评委/主办方/骑手 | ✅ 无英文残留 |
  | 资料状态：已补全/待补全 | ✅ 全中文 |
  | 角色维护含保存按钮 | ✅ |
  | 最小账号治理说明 | ✅ |

  | 文件 | 操作 |
  |---|---|
  | `src/app/_components/console/admin-console-page.tsx` | 中文化 |
  | `src/app/console/admin/[section]/page.tsx` | 中文化 |
  | `src/app/_components/console/admin-console-chinese.test.tsx` | 新增 3 项 |

### Live Hall & Race Page 中文化收口 — 验收（2 项全部通过）

  运行命令：`node --import tsx --test src/app/_components/public/race-live-chinese.test.tsx`

  | 验收功能点 | 验证结论 |
  |---|---|
  | live-hall 12 项中文：实况大厅/过程总览/过程指标/大屏入口/骑手动态/报名状态/当前榜单/过程榜单/事件流/最近事件/打开大屏/打开大屏控制台 | ✅ |
  | race-page 10 项中文：公开入口/查看作品/查看赛果/查看复盘/查看合作/返回赛事列表/赛事概览/规则说明/赛程安排/参赛骑手/下一步入口/报名时间/比赛时间 | ✅ |

  | 文件 | 操作 |
  |---|---|
  | `src/app/_components/public/live-hall.tsx` | 中文化 |
  | `src/app/_components/public/race-page.tsx` | 中文化 |
  | `src/app/_components/public/race-live-chinese.test.tsx` | 新增 2 项 |

### Organizer Console 中文化收口 — 验收（1 项通过）

  运行命令：`node --import tsx --test src/app/_components/console/organizer-chinese.test.tsx`

  | 验收功能点 | 验证结论 |
  |---|---|
  | overview+settings：主办方视图/赛事概览/赛事内容/显示选项/保存按钮/下一步入口 | ✅ 全中文无英文 |

  | 文件 | 操作 |
  |---|---|
  | `src/app/_components/console/organizer-console-page.tsx` | 中文化 |
  | `src/app/console/races/new/page.tsx` | 中文化 |
  | `src/app/_components/console/organizer-chinese.test.tsx` | 新增 1 项 |

### 公开入口 / Live Hall / 大屏在线态收口 — 验收（13 项通过）

  仅做静态逻辑验证，不对 UI 渲染做自动化测试。

  运行命令：`node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/adapter-freshness-convergence.test.ts`

  | 验收功能点 | 验证结论 |
  |---|---|
  | **已验证 (自动化 13 项)** | |
  | `getPublicAuthAction` 匿名/已登录文案区分 | ✅ null → "登录 / 注册"，有角色 → "身份入口" |
  | 登录入口不含"返回公开站" | ✅ 不出现误导性文案 |
  | `getConsoleEntryTarget` 分区控制 | ✅ null → null，有角色 → /console |
  | `getConsoleHomeSections` 全角色覆盖 | ✅ 7 种组合，含 null/空数组 |
  | `getLoginRedirectTarget` / `getHomeRedirectTarget` | ✅ 已登录 → /，首页永远公开 |
  | `getCreateRacePageAccess` 组织者门控 | ✅ ORGANIZER 允许，RIDER 拒绝 |
  | `getConsoleRaceViewAccess` 视图守卫 | ✅ organizer/rider/judge + 赛事范围 |
  | `getRoleCapabilities` 能力映射 | ✅ organizer/rider/null 能力矩阵 |
  | `getConsoleAdminAccess` / `getConsoleScreenAccess` | ✅ ADMIN/ORGANIZER 控制台边界 |
  | `getConsoleDefaultHref` 角色默认路由 | ✅ ADMIN → users，ORGANIZER → races |
  | `getCreateRaceBackTarget` | ✅ 返回首页 / |
  | mapToRacingEntries session 时间优先级 | ✅ `lastActiveAt` > `updatedAt` > `entry.createdAt` |
  | resolveMotionState stale 检测 | ✅ running/sprinting > 5min → stale |
  | **未验证 (手动验收 12 项)** | |
  | `public-header.tsx` 双入口并存 | M-8 浏览器确认 |
  | `login/page.tsx` 移除 seed/demo | M-1~M-3 浏览器确认 |
  | `live-hall.tsx` 大屏顶部 + 隐藏控制台入口 | M-8~M-9 浏览器确认 |
  | `JumbotronInline.tsx` 内嵌渲染 | M-8 浏览器确认 |
  | `race-snapshot.ts` session 时间字段 | M-10~M-11 代码审查 |
  | `JumbotronClient.tsx` 在线数口径一致 | M-6 浏览器对比 |
  | `jumbotron/[raceId]/page.tsx` 多场滚动 | M-4~M-5, M-7 浏览器 + 代码审查 |

  **修改代码清单**

  | 文件 | 操作 | 变更摘要 | 关联验收点 |
  |---|---|---|---|
  | `src/lib/viewer-access.ts` | 修改 | `getPublicAuthAction()` public-first：匿名→"登录 / 注册"，已登录→"身份入口"，无"返回公开站" | 已验证 1-2 |
  | | 修改 | `getConsoleEntryTarget()` 仅对有 Console section 的用户返回 /console | 已验证 3-4 |
  | `src/app/_components/public/public-header.tsx` | 修改 | 公开入口与 Console 次级入口并存渲染 | 未验证 |
  | `src/app/login/page.tsx` | 修改 | 移除 seed/demo 预置账号展示面板；返回按钮"返回公开首页" | 未验证 |
  | `src/app/_components/public/live-hall.tsx` | 修改 | JumbotronInline 直接内嵌顶部；移除"打开大屏控制台"公开暴露 | 未验证 |
  | `src/app/JumbotronInline.tsx` | 修改 | 从点击展开式预览改为直接内嵌 JumbotronClient | 未验证 |
  | `src/lib/services/race-snapshot.ts` | 修改 | Prisma select 增加 session.lastActiveAt/updatedAt 字段 | 未验证 |
  | `src/lib/jumbotron/adapter.ts` | 修改 | `mapToRacingEntries()` updatedAt 优先 latestSession.lastActiveAt | 已验证 12 |
  | `src/app/jumbotron/[raceId]/JumbotronClient.tsx` | 修改 | 在线数改用 resolveMotionState，与赛道 stale 判定同一口径 | 未验证 |
  | `src/app/jumbotron/[raceId]/page.tsx` | 修改 | 多场 live race 可滚动切换；无 live race 回退单场渲染 | 未验证 |
  | `src/lib/viewer-access.test.ts` | 已有 | 覆盖访问控制逻辑 (11 项) | 已验证 1-11 |
  | `src/lib/services/adapter-freshness-convergence.test.ts` | 新增 | Session 时间优先级 + resolveMotionState stale 检测 (2 项) | 已验证 12-13 |

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
- 本轮新增但尚未收口的问题：
  - `/.claude-login.html` 只是本地排查 `/login` 返回 HTML 时生成的临时抓取文件，不是正式产品页面，也不代表公开身份入口链路已经真正跑通。
  - 首页“身份入口”按钮当前仍有无法正常跳转的用户反馈，说明公开登录入口链路还没有完成真实验收。
  - 当前登录模型仍然偏向“所有人都可以直接注册 / 登录本地账号”，尚未收口到 `grs003` 期望的正式身份体系与 OAuth 方案。
  - Console 实际准入链路仍需继续核实；按当前用户反馈，仍存在“控制台入口基本畅通无阻、身份验证不符合预期”的问题，没有达到可验收状态。
  - 参赛选手提交链路仍未完整恢复到可直接操作的状态；公开报名、Rider 工作台、提交入口之间仍有断点。
  - `/login` 虽然已能返回 `200` 与页面 HTML，但浏览器端仍出现“页面看起来什么都没有”的现象，说明客户端显示 / 资源缓存 / dev server 状态仍有待继续排查。

## 下一步建议

- 先修 `src/lib/prisma.ts` 的运行时目录策略，把生产态 SQLite 运行目录收口到当前平台可写位置。
- 优先把公开身份入口链路彻底跑通：
  - 修首页“身份入口”按钮跳转；
  - 核实 `/login` 浏览器空白问题；
  - 清理临时排查文件如 `/.claude-login.html`。
- 继续核实并补齐角色与权限链路：
  - 不是简单“任何人都能登录就能进所有台”；
  - 要重新核对公开站、Rider、Judge、Organizer、Admin、Screen Console 的真实准入。
- 继续补齐参赛选手真实操作链路：报名、进入 Rider 工作台、提交作品、查看结果，确保不是只有按钮或文案而是能真实操作。
- 继续扫描用户可见英文残留，优先公开页和 Organizer Console 其他 section。
- 继续推进 `grs003` 深层语义迁移：GitHub OAuth、CA 接入链，以及兼容 `team` 退场。


## 2026-06-19 登录壳层、Riders/Works 索引页与创建赛事表单文案清理
- `src/app/_components/ary-shared.tsx`
  - 登录 / 注册入口从英文改为中文：
  - `登录`
  - `注册`
  - `用户名`
  - `密码`
  - `演示账号`
  - `当前重点`
  - Hero 主标题改为 `公开赛场，私有赛源。`
  - 登录说明和注册说明也收口为中文，不再直接暴露英文控制台说明。
- `src/app/riders/page.tsx`
  - `Riders / Featured Riders` 改为：
  - `骑手`
  - `精选骑手`
- `src/app/works/page.tsx`
  - 原页面混有英文标题和错误编码中文，已整页重写为正常中文公开作品索引：
  - `作品`
  - `公开作品`
  - `赛事上下文`
  - `筛选与排序`
  - `作品卡片`
  - `精选作品`
  - `返回赛事列表`
- `src/app/_components/create-race-form-client.tsx`
  - 原表单中有大段错误编码中文，已在保持字段名、结构和业务参数不变的前提下重写为可读中文。
  - 收口后的主要可见文案包括：
  - `赛事名称`
  - `赛事简介`
  - `题目包名称`
  - `题目描述`
  - `训练数据说明`
  - `评测说明`
  - `关键词`
  - `报名开始 / 报名结束 / 比赛开始 / 比赛结束`
  - `创建赛事`
  - `选择本地题目包`
  - `选择本地底图`
  - `当前底图预览`
- `src/app/_components/public/public-copy-cleanup.test.tsx`
  - 新增定向测试，锁定：
  - 登录壳层使用可读中文
  - Riders / Works 索引页标题使用可读中文
  - 创建赛事表单源码不再包含典型错误编码标记
- 说明
  - 这一轮仍然只做用户可见层文案与编码清理，不改布局，不改大屏样式，不改创建赛事表单字段结构和提交参数。
- 验证
  - `node --import tsx --test src/app/_components/public/public-copy-cleanup.test.tsx`
  - `cmd /c npm run build`


## 2026-06-19 Prisma 运行时目录跨平台收口
- `src/lib/prisma-runtime-paths.ts`
  - 新增跨平台运行时数据库路径解析逻辑。
  - 仅在 `NODE_ENV=production` 且 `VERCEL=1` 时启用 runtime shadow copy。
  - Windows 下使用工作区可写目录：`<cwd>/.tmp/ary-runtime/runtime.db`。
  - 非 Windows 的 Vercel 生产环境继续使用 `/tmp/ary-runtime/runtime.db`。
- `src/lib/prisma.ts`
  - 不再直接硬编码 `/tmp/ary-runtime`，改为调用路径解析函数。
- `src/lib/prisma-runtime-paths.test.ts`
  - 新增 4 组定向测试，覆盖 Windows、非 Windows、非生产环境和本地 production build 非 Vercel 场景。
- 验证
  - `node --import tsx --test src/lib/prisma-runtime-paths.test.ts`
  - `cmd /c npm run build`

## 2026-06-19 old_version 选手链路恢复进展

- 公开首页行动入口已按当前真实链路收口：
  - `骑手注册 / 登录`
  - `查看赛事报名页`
  - 登录后额外显示：
  - `继续参赛`
  - `提交赛后材料`
- 首页主 CTA 已按赛事阶段切换为真实目标：
  - 报名中：`立即报名`
  - 报名结束：`查看赛题`
  - 进行中 / 封榜中：`进入实况大厅`
  - 已结束：`查看赛果`
- 公开报名页已成为正式入口：
  - 未登录用户会跳去 `/login?returnTo=...`
  - Rider 可直接报名
  - 已报名用户可继续进入 Rider 工作台
  - `preparation` 阶段明确不可新报名
- Rider 工作台中的三条核心链路已全部带回流目标：
  - 正式报名后回到 `rider/registration`
  - 赛中提交后回到 `rider/submission`
  - 赛后提交后回到 `rider/submission`
- 登录页已恢复演示账号面板。
- `old_version/` 已从当前构建中排除，不再干扰 `next build`。

### 真实验收证据

- 已用真实本地 Chrome 自动化跑通过以下链路：
  - 登录
  - 报名中赛事进入 Rider 工作台
  - 进行中赛事提交
  - 已结束赛事赛后提交
- 浏览器验收后，数据库中已确认写入：
  - `race_signup / rider_charlie / APPROVED`
  - `race_active / flow-check.ts / QUEUED`
  - `race_finished / post-race-flow.ts + post-race-record.txt / QUEUED`

### 对应验证

- `node --import tsx --test src/app/actions.return-to.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/lib/public-site.test.ts src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx src/app/_components/console/rider-console-page.test.tsx`
- `cmd /c npm run build`

## 2026-06-19 登录后统一退出入口进展

- `src/app/_components/public/public-header.tsx`
  - 已登录态不再显示 `身份入口`
  - 改为统一显示 `退出登录`
  - 仍保留 `进入控制台` 独立入口
- `src/app/_components/console/console-shell.tsx`
  - 控制台侧栏顶部新增统一 `退出登录` 按钮

### 对应验证

- `node --import tsx --test src/app/_components/public/public-header.test.tsx src/app/_components/console/console-shell.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx`
- `cmd /c npm run build`

## 2026-06-19 README 教程重写进展

- `README.md` 已从旧的 Jumbotron 单模块说明重写为当前项目级 README。
- 新结构已拆为两个独立板块：
  - `分角色教程`
  - `运行教程`
- 已补充：
  - 项目入口
  - 演示账号
  - Rider / Organizer / Judge / Admin 的最短操作路径
  - 公开展示体验路径
  - 相关文档入口

### 对应验证

- `cmd /c npm run build`

## 当前仍缺失 / 未完成

- GitHub OAuth 仍未接入，当前仍是本地账号 / 密码会话。
- `Team` 兼容层仍然存在，深层 `teamId -> registrationId` 迁移尚未完成。
- `runner` 路径与 `CA Push + Fetch` 目标之间仍有差距。
- 进行中赛事的公开赛事页仍没有直接暴露明显的 `进入提交` 按钮。
  - 当前提交流程已可用，但主要仍通过 `/console/races/[raceSlug]/rider/submission` 进入。

## UI 相关问题进度

1. 企业账号登进去以后怎么没法创建比赛了？显示的还是和 audience 一样的首页
2. 观众界面下面的四个按键三个缺失，然后那个骑手登录/注册也点不开
3. 用企业账号登进去了，哦，那看来和前面那个问题一样
4. Jumbotron大屏幕没开始的比赛显示即将开始，比赛中的比赛应该要显示Live，比赛结束的应该是Finish，现在三种比赛全是即将开始。其他没啥了
5. 实况大厅，没有点击“打开大屏”前有点错位
6. 用rider登录后，对某个赛事的提交必须去到控制台那里，直接进入赛事主页没有提交链接
7. 创建比赛页面，比我们之前的设计缺少了很多
8. 主页面最下方提示“骑手注册/报名/办赛/合作”那里的蓝色按钮“骑手注册/登录”按了没有真正跳到登录界面。
9. 进入控制台后，我觉得应该展示出本人账号名&身份，做着做着我都忘了当前登录的账号是organizer还是admin还是什么的
