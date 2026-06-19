# ARY 状态

本文记录当前工作区已经完成的 `grs003` 对齐进展、验证证据，以及尚未收口的方向。本文档统一使用 UTF-8 编码和中文维护。

## 当前状态

- 当前代码库已经从单页混合模式推进到分层结构，核心分区包括公开站、赛事控制台、管理控制台、大屏控制台和大屏展示层。
- 公开页面主路线已经落到 `/races`、`/works`、`/riders`、`/cooperation`、`/console/*` 这一组 `grs003` 推荐路径上。
- 控制台入口、评委视图、骑手视图、主办方视图，以及公开页中的大部分用户可见文案，已经收口到中文。
- Jumbotron 与大屏赛道渲染样式仍以“尽量保留最早样式”为原则，这几轮中文化收口没有改动赛道视觉结构。
- 项目尚未完成全部 `grs003` 要求，尤其是 GitHub OAuth、运行时路径、CA 接入，以及部分深层语义迁移仍在进行中。

## 已完成收口

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
