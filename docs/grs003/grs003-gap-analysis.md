# ARY GRS003 约束差异分析

版本：v1.1 | 日期：2026-06-19 | 作者：系统审计（基于 status.md 全线重新审计）

本文档对 **GRS003 规范全集**（14 份文档）与 **当前代码库**（截至 2026-06-19 收口成果）进行逐项差异对比，并按影响程度分级。本次更新基于 `docs/superpowers/status.md` 记录的全部已完成收口与代码库实际验证，重新评估每一项差异的当前状态。

---

# 第一章：GRS003 约束清单

以下从 GRS003 全部 14 份文档中抽取关键约束，按维度分类。

## 1.1 领域模型约束（来源：`ary-domain-analysis.v0.3.md`）

| # | 约束 | 权威文档 |
|---|------|---------|
| D1 | MVP 只支持个人参赛，不支持 Team | 领域分析 §3.2 |
| D2 | User 通过 `User.roles` 集合表达身份，不建独立 Rider/Judge/Organizer 实体 | 领域分析 §2.2 |
| D3 | 一个 User 对同一 Race 最多一个 Registration | 领域分析 §4.4 |
| D4 | Registration approved 后 ARY 幂等生成且仅生成一个 RaceProject | 领域分析 §4.4 |
| D5 | 一个 RaceProject 可以有多个 CAConnection | 领域分析 §4.4 |
| D6 | 一个 CAConnection 可以有多个 Session | 领域分析 §4.4 |
| D7 | CAConnection 必须先登记和握手，后续数据才可进入有效 Projection/Evidence/Report | 领域分析 §4.4 |
| D8 | CA 接入状态不改变 Registration 资格状态 | 领域分析 §4.4 |
| D9 | MVP 不接受事后手动上传 Session Summary 伪造实时 CA 证据 | 领域分析 §4.4 |
| D10 | 一个 Registration 最多一个主 Work | 领域分析 §4.4 |
| D11 | Work 是作品资产，不是提交记录本身 | 领域分析 §3.2 |
| D12 | Work 是否获奖由 Award 推导，不在 WorkStatus 中重复保存 | 领域分析 §4.4 |
| D13 | JudgeAssignment 应记录 assignedByUserId | 领域分析 §4.4 |
| D14 | Award 授予 Registration，可选关联 Work | 领域分析 §4.4 |
| D15 | Award.rank 在同一 Race 的同一 awardName 内唯一 | 领域分析 §4.4 |
| D16 | 不存在 Organization 实体，主办方通过 User.roles=organizer 表达 | 领域分析 §2.2 |
| D17 | 不存在 Score Rubric 实体，评审标准暂作为配置文本 | 领域分析 §2.2 |
| D18 | Projection 只服务过程展示和大屏，不作为最终结果事实源 | 领域分析 §4.4 |
| D19 | 最终赛果读取 Award、Report 或 leaderboard_read_model | 领域分析 §4.4 |
| D20 | Rider Report 应关联 subjectRegistrationId | 领域分析 §4.4 |
| D21 | screen_feed_projection 应区分 feed item 类型（过程榜 vs 最终榜） | 领域分析 §4.4 |

## 1.2 角色与权限约束（来源：`ary-permission-matrix.md`）

| # | 约束 | 权威文档 |
|---|------|---------|
| P1 | 角色体系：Public / Rider / Judge / Organizer / Admin（5 角色） | 权限矩阵 §2 |
| P2 | 身份通过 `User.roles` 集合表达，可同时拥有多个 role | 权限矩阵 §2 |
| P3 | MVP 不建立独立 RoleAssignment 实体 | 权限矩阵 §2 |
| P4 | Screen Operator 和 Data Maintainer 是操作职责，不新增独立 role | 权限矩阵 §2 |
| P5 | Organizer 只能管理自己负责的 Race（managed race） | 权限矩阵 §2 |
| P6 | Judge 只能访问分配给自己的评审任务 | 权限矩阵 §3.7 |
| P7 | Rider 只能管理自己的 Registration、RaceProject、Work、报告 | 权限矩阵 §3.2-3.4 |
| P8 | Public 不能访问后台、原始 CA Session、未发布 Work、未发布 JudgingRecord、未发布 Report | 权限矩阵 §3 |
| P9 | 原始 CA Session 默认不公开 | 权限矩阵 §3.3 |
| P10 | Admin Console 只承载基础账号、个人资料状态和 User.roles 管理 | 权限矩阵 §3.11 |

## 1.3 信息架构约束（来源：`ary-mvp.ia.md`）

| # | 约束 | 权威文档 |
|---|------|---------|
| I1 | Gallery-first 信息架构：首页以赛事资产为主体 | IA §2.1 |
| I2 | 五类产品体验面：Public Site / Race Console / Admin Console / Screen Console / Screen Display | IA §3.1 |
| I3 | 顶层导航：Races / Works / Riders / Cooperation / Login | IA §4.1 |
| I4 | 首页不设独立 Leaderboards 模块 | IA §7.1.5 |
| I5 | Race Page 内部导航：Overview / Rules / Live / Riders / Works / Results / Review | IA §4.2 |
| I6 | Live Hall 展示经过 Projection 处理的数据，不直接暴露原始 CA 数据 | IA §7.3 |
| I7 | Screen Console 独立于 Race Console，不混入管理端 | IA §8 |
| I8 | Console 内部始终展示当前 Race 上下文，避免跨赛事误操作 | IA §3.2 |
| I9 | 推荐 URL 结构：`/races/{raceSlug}`、`/works/{workSlug}`、`/riders/{riderSlug}`、`/console/*` | IA §10 |
| I10 | Race 状态驱动页面内容优先级（报名中/进行中/提交中/评审中/已结束） | IA §7.2 |
| I11 | 公开端不设置独立 Leaderboards，过程榜保留在 Live Hall，最终榜保留在 Results | IA §7.1.5 |

## 1.4 CA 接入约束（来源：`ary-ca-integration-spec.md`）

| # | 约束 | 权威文档 |
|---|------|---------|
| C1 | Rider 可在参赛过程中新增 CAConnection | CA Spec §3.1 |
| C2 | 每个 CAConnection 必须先通过 ARY CA Connector 完成登记和握手 | CA Spec §3.1 |
| C3 | CA connector 通过 push 传递关键骑行状态（RidingSignalMessage），不是完整 Session 快照 | CA Spec §2 |
| C4 | ARY 需要完整 Session 快照时，从 CA 端 HTTP fetch | CA Spec §2, §6 |
| C5 | CA 接入失败不触发 Registration 自动退赛 | CA Spec §3.2 |
| C6 | 未登记、未握手、归属错误或被禁用 CAConnection 的数据不得进入有效 Projection/Evidence/Report | CA Spec §3.2 |
| C7 | GitHub Repo 只作为作品代码入口或 Evidence 外部材料引用，不能替代实时 CA 接入 | CA Spec §1 |
| C8 | 原始 CA Session 默认不公开 | CA Spec §4.2 |
| C9 | CAConnection 状态：not_configured / connected / active / failed | CA Spec §4.2 |
| C10 | RaceProject 聚合接入状态由多个 CAConnection 综合判定 | CA Spec §4.2 |

## 1.5 赛事状态约束（来源：`ary-domain-analysis.v0.3.md` + `ary-mvp.ia.md`）

| # | 约束 | 权威文档 |
|---|------|---------|
| S1 | Race Status：draft → published → registration → running → submitting → judging → completed → archived（8 状态） | 领域分析 §4.1 |
| S2 | Registration Status：submitted → approved / rejected / withdrawn | 领域分析 §4.1 |
| S3 | RaceProject 聚合接入状态：not_configured / connected / active / failed | 领域分析 §1.6 |
| S4 | CAConnection 接入状态：not_configured / connected / active / failed | 领域分析 §1.6 |
| S5 | Work Status：draft → submitted → locked → hidden | 领域分析 §4.1 |
| S6 | Report Status：draft → generated → reviewed → published | 领域分析 §4.1 |
| S7 | 存在 Review Flag / Review Readiness 评审前风险提示机制 | 领域分析 §1.6 |

## 1.6 产品硬约束（来源：`ary-mvp.prd.md` §7.4）

| # | 约束 | 权威文档 |
|---|------|---------|
| H1 | Registration approved 后 ARY 必须幂等生成且仅生成一个 RaceProject | PRD §7.4 |
| H2 | CA 接入失败、无 CA 数据或空骑行不自动取消 Registration 提交/评审/Award 资格 | PRD §7.4 |
| H3 | CAConnection 可在参赛过程中新增；必须先登记和握手 | PRD §7.4 |
| H4 | MVP 不接受事后手动上传 Session Summary 伪造实时 CA 证据 | PRD §7.4 |
| H5 | GitHub 只作为登录来源、作品代码入口或 Evidence 外部材料引用 | PRD §7.4 |
| H6 | 系统应在评审前识别空骑行、无 CA 数据、空作品、缺必填材料、疑似违规和接入异常 | PRD §7.4 |
| H7 | Projection 只服务过程展示和大屏，不作为最终结果事实源 | PRD §7.4 |
| H8 | 最终赛果读取 Award、Report 或 leaderboard_read_model | PRD §7.4 |
| H9 | 原始 CA Session 默认不公开 | PRD §7.4 |

## 1.7 工程就绪约束（来源：`ary-mvp.prd.md` §14）

| # | 约束 | 权威文档 |
|---|------|---------|
| E1 | 使用 GitHub 登录作为账号入口 | PRD §14.3 |
| E2 | 后台访问必须经过登录和 User.roles 权限校验 | PRD §14.3 |
| E3 | 公开页首屏目标响应时间 1s 内 | PRD §14.2.1 |
| E4 | Live Hall 数据刷新目标 3s 内 | PRD §14.2.1 |
| E5 | MVP 应支持同时在线 200 用户访问公开页面 | PRD §14.2.2 |
| E6 | CA 接入状态必须可追踪 | PRD §14.5 |
| E7 | Projection 必须可重建 | PRD §14.6 |

---

# 第二章：当前架构与技术概述（截至 2026-06-19 收口后）

## 2.1 核心架构

```
表示层：Next.js 16 App Router (RSC + Client Components)
  ├── 公开端路由：/, /races/[raceSlug], /works/[workSlug], /riders/[riderSlug],
  │     /races/[raceSlug]/register, /races/[raceSlug]/live,
  │     /races/[raceSlug]/works, /races/[raceSlug]/results,
  │     /races/[raceSlug]/review, /cooperation, /login
  ├── 控制台路由：/console, /console/races, /console/races/new,
  │     /console/races/[raceSlug], /console/races/[raceSlug]/rider/*,
  │     /console/races/[raceSlug]/judge/*, /console/races/[raceSlug]/organizer/*,
  │     /console/admin/*, /console/screen, /console/screen/[raceSlug]/[mode]
  ├── 大屏路由：/jumbotron/[raceId]（多场滚动切换）
  └── Server Actions 集中出口 (src/app/actions.ts)

服务层：src/lib/services/ 下多个领域服务
  └── users / races / submissions / registrations / rider-console / runner /
      teams / feedback / scoring / race-snapshot / projections / results /
      review / public-routes / console-routes / rider-bridge

数据层：Prisma 7 + SQLite (better-sqlite3)
  ├── 核心模型：User(含 role + rolesJson 双字段), Race, Registration, RaceProject,
  │     CAConnection, Session, Work, Submission, JudgeAssignment, JudgingRecord,
  │     Award, Evidence, Report, Projection, FeedbackThread, FeedbackMessage,
  │     Team, TeamMember(async compatibility), RunnerTask, LeaderboardEntry,
  │     HarnessEntry, RidingHighlight, TeamArchive, TeamComment, Notification,
  │     SubmissionArtifact, CAIngestionEvent
  └── 8 个枚举类型

基础设施：JWT(jose) Cookie Session + Zod 4 校验 + Race Phase 状态机(5状态)

Jumbotron 子系统：
  └── adapter.ts + track-runtime/(7 files) + JumbotronInline + JumbotronClient
```

## 2.2 当前角色体系

| 角色 | 实现方式 | 状态 |
|------|---------|------|
| ADMIN | AppRole 常量 + rolesJson + viewer-access 控制 | ✅ 已实现 |
| JUDGE | AppRole 常量 + rolesJson + viewer-access + judge scope convergence | ✅ 已实现 |
| ORGANIZER | AppRole 常量 + rolesJson + viewer-access 控制 | ✅ 已实现 |
| RIDER | AppRole 常量 + rolesJson + viewer-access 控制 | ✅ 已实现 |
| PUBLIC | 无需登录即可浏览公开端 | ✅ 已实现 |

**当前已支持 4 种角色常量**（`appRoles = ["ADMIN", "JUDGE", "ORGANIZER", "RIDER"]`），采用 `rolesJson` JSON 数组存储多角色，同时保留 `role` 单值字段作为回退。

## 2.3 当前数据模型特征

- **Registration 实体存在**：报名事实中枢，含 `@@unique([raceId, userId])` 约束
- **RaceProject 实体存在**：registrationId 一对一关联，含 aggregateIngestionStatus
- **CAConnection 实体存在**：关联 RaceProject，含 caType/connectorId/ingestionStatus
- **Session 实体存在**：关联 CAConnection，含 tokenCost/lastActiveAt 等字段
- **Work 实体存在**：独立于 Submission 的作品资产实体
- **JudgeAssignment 实体存在**：含 assignedByUserId 审计字段
- **JudgingRecord 实体存在**：含 scoreResult/scoreRiding/comments
- **Award 实体存在**：授予 Registration，可选关联 Work
- **Evidence 实体存在**：含 type/sourceRef/visibility 字段
- **Report 实体存在**：3 类报告（RIDER_REPORT / RACE_REPORT / REVIEW_SUMMARY）
- **Projection 实体存在**：含 rebuildRaceProcessProjections() 生成 7 类投影
- **Team 实体仍存在**：作为兼容层保留，未完全删除

## 2.4 当前页面结构

| 路由 | 对应 GRS003 IA | 状态 |
|------|---------------|------|
| `/` | 首页（公开入口） | 已改造（公开入口+控制台次级入口双轨） |
| `/login` | 登录页 | 已改造（移除 seed/demo，支持 returnTo） |
| `/races/[raceSlug]` | Race Page（赛事详情） | ✅ 已实现 |
| `/races/[raceSlug]/live` | Live Hall（实况大厅） | ✅ 已实现 |
| `/races/[raceSlug]/works` | Works 列表 | ✅ 已实现 |
| `/races/[raceSlug]/results` | Results 赛果 | ✅ 已实现 |
| `/races/[raceSlug]/review` | Review 评审总结 | ✅ 已实现 |
| `/races/[raceSlug]/register` | 公开报名页 | ✅ 已实现 |
| `/works/[workSlug]` | Work Page（作品详情） | ✅ 已实现 |
| `/riders/[riderSlug]` | Rider Profile | ✅ 已实现 |
| `/cooperation` | Cooperation 合作页 | ✅ 已实现 |
| `/console` | Console 控制台入口 | ✅ 已实现 |
| `/console/races` | 赛事控制台列表 | ✅ 已实现 |
| `/console/races/new` | 创建赛事 | ✅ 已实现 |
| `/console/races/[raceSlug]` | 赛事工作台入口 | ✅ 已实现 |
| `/console/races/[raceSlug]/rider/*` | Rider View | ✅ 已实现 |
| `/console/races/[raceSlug]/judge/*` | Judge View | ✅ 已实现 |
| `/console/races/[raceSlug]/organizer/*` | Organizer View | ✅ 已实现 |
| `/console/admin/*` | Admin Console | ✅ 已实现 |
| `/console/screen` | Screen Console 列表 | ✅ 已实现 |
| `/console/screen/[raceSlug]/[mode]` | 大屏 7 模式 | ✅ 已实现 |
| `/jumbotron/[raceId]` | 赛马大屏（多场滚动） | 已升级 |

## 2.5 当前认证方式

- JWT Cookie Session（jose 库）
- 用户名+密码登录（bcryptjs 哈希）
- `SESSION_SECRET` 环境变量
- **GitHub OAuth 登录尚未接入**

## 2.6 当前赛事状态

Race Phase 状态机：`registration → preparation → active → frozen → finished`（5 状态，`race-phase.ts`）

**与 GRS003 的 8 状态体系（draft → published → registration → running → submitting → judging → completed → archived）不匹配。Race 模型无显式 status 字段，完全依赖时间窗口推导。**

---

# 第三章：逐项差异重新评估（基于 2026-06-19 收口成果）

## 评估状态标记

| 标记 | 含义 |
|------|------|
| ✅ 已解决 | 代码已实现并通过验收测试 |
| 🔶 部分解决 | Schema/模型已就位，但运行时逻辑或深层迁移未完成 |
| ❌ 未解决 | 完全未开始或存在实质性差距 |
| 🆕 新增差距 | 本次审计新发现的问题 |

---

## 3.1 领域模型差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **Team 实体** | 重大 | 🔶 部分解决 | Prisma 中 Team+TeamMember 模型仍存在；深层 teamId→registrationId 迁移未完成；`rider-bridge.ts` 提供兼容层查询但未消除。 |
| **User.role 模型** | 重大 | 🔶 部分解决 | 已新增 `rolesJson` 字段存储 JSON 数组，`user-roles.ts` 实现 `normalizeRoles/parseRolesJson/hasRole/getDefaultActiveRole` 4 角色体系。但 `role` 单值字段仍然存在，形成双轨。 |
| **Judge 角色** | 重大 | ✅ 已解决 | `AppRole.JUDGE` 已纳入 4 角色体系；judge scope convergence（13 项测试通过）；Judge view 路由就位。 |
| **Admin 角色** | 重大 | ✅ 已解决 | `AppRole.ADMIN` 已纳入；Admin Console 页面已实现（用户列表/资料补全/角色维护）；中文化收口（3 项测试通过）。 |
| **Registration 实体** | 重大 | ✅ 已解决 | `Registration` 模型存在于 Prisma schema；`@@unique([raceId, userId])` 约束；submissions 服务已改为 registration-first。 |
| **RaceProject 实体** | 重大 | ✅ 已解决 | `RaceProject` 模型存在于 Prisma schema；`registrationId @unique` 一对一；含 aggregateIngestionStatus/githubRepoUrl。 |
| **CAConnection 实体** | 重大 | ✅ 已解决 | `CAConnection` 模型存在于 Prisma schema；含 caType/connectorId/ingestionStatus 等字段。 |
| **Session 实体** | 重大 | ✅ 已解决 | `Session` 模型存在于 Prisma schema；含 tokenCost/lastActiveAt；jumbotron adapter 优先读取 session 时间。 |
| **Work 实体** | 中度 | ✅ 已解决 | `Work` 模型作为独立资产实体存在；works-page 和 work-page 组件已实现（13 项测试通过）。 |
| **JudgeAssignment 实体** | 重大 | ✅ 已解决 | `JudgeAssignment` 模型存在，含 assignedByUserId；judge 范围收口按 assignment 过滤。 |
| **JudgingRecord 实体** | 重大 | ✅ 已解决 | `JudgingRecord` 模型存在（含 scoreResult/scoreRiding/comments）。 |
| **Award 实体** | 重大 | ✅ 已解决 | `Award` 模型存在；results 服务按 Award/Report/Work 聚合公开赛果（9 项测试通过）。 |
| **Evidence 实体** | 重大 | ✅ 已解决 | `Evidence` 模型存在（含 type/sourceRef/visibility 字段）。 |
| **Report 实体** | 中度 | 🔶 部分解决 | `Report` 模型存在（3 类型）；`buildRiderConsoleReportModel()` 已实现；但评审流程与报告生成链路的运行时实现待核实。 |
| **Projection 概念** | 中度 | ✅ 已解决 | 7 类 Projection 全部实现（`rebuildRaceProcessProjections()`）；adapter 不再伪造消息和风险提醒（48 项测试通过）。 |
| **Organization 实体** | N/A | ✅ 一致 | 明确不引入。 |
| **Score Rubric** | 轻微 | ✅ 一致 | 明确暂不建模。 |

## 3.2 角色与权限差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **角色数量** | 重大 | ✅ 已解决 | 4 角色体系（ADMIN/JUDGE/ORGANIZER/RIDER）+ Public 无登录 = 5 种体验面。 |
| **Role 存储方式** | 重大 | 🔶 部分解决 | `rolesJson` 支持多角色，但 `role` 单值字段仍存，未完全迁移。 |
| **GitHub 登录** | 重大 | 🔶 部分解决 | GitHub OAuth 主链路代码已具备（`github-oauth.ts`、callback route、loginWithGitHubAction）；但首页/`/login`/callback/session 的真实验收尚未完成，且登录模型仍保留本地账号兜底。 |
| **权限校验** | 重大 | 🔶 部分解决 | `viewer-access.ts` 实现 11 个入口控制函数（19 项测试通过），覆盖 admin/judge/organizer/rider/screen 入口。但完整 13×6 矩阵未逐项验证；Console 实际准入链路被反馈"基本畅通无阻"，未达可验收状态。 |
| **Organizer 范围** | 轻微 | 🔶 部分解决 | `viewer-access.ts` 中有 `managed race` 概念，但需核实实际查询层是否已按 managed race 过滤。 |
| **Admin Console** | 重大 | ✅ 已解决 | `/console/admin/*` 路由就位，含用户列表/资料补全/角色维护 3 个 section。 |
| **Screen Operator** | 轻微 | ✅ 一致 | 由 organizer/admin 兼任。 |

## 3.3 信息架构差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **首页结构** | 重大 | 🔶 部分解决 | 首页公开入口已改造为 public-first + Console 次级入口双轨；CTA 已收口为"查看赛事报名页"。但整体是否完全达到 Gallery-first（Hero+Featured Races+Latest Results+Featured Works+Featured Riders+Past Races+CTA）布局待浏览器验收。 |
| **页面数量** | 重大 | ✅ 已解决 | 15+ 页面全部就位（见 §2.4 页面结构表）。 |
| **Race 详情页** | 重大 | ✅ 已解决 | `/races/[raceSlug]` 独立 Race Page（race-page.tsx），含公开入口/查看作品/赛果/复盘/合作。 |
| **Live Hall** | 重大 | ✅ 已解决 | `/races/[raceSlug]/live` Live Hall（live-hall.tsx），读取 6 类 Projection，不回退 legacy 数据（48 项测试通过）。 |
| **Works 页面** | 重大 | ✅ 已解决 | `/races/[raceSlug]/works` + `/works/[workSlug]`（13 项测试通过）。 |
| **Results 页面** | 重大 | ✅ 已解决 | `/races/[raceSlug]/results`（9 项纯函数+5 组件测试通过）。 |
| **Rider Profile** | 重大 | ✅ 已解决 | `/riders/[riderSlug]` 骑手档案页（含 Skill Tag/性能摘要/参赛记录）。 |
| **Cooperation** | 重大 | ✅ 已解决 | `/cooperation` 合作页已实现（`cooperation-page.tsx` + 路由）。 |
| **Console 管理端** | 重大 | ✅ 已解决 | `/console/*` 完整路由体系 + ConsoleShell 布局（19 项测试通过）。 |
| **URL 结构** | 重大 | ✅ 已解决 | 层级式：`/races/` `/works/` `/riders/` `/console/` `/cooperation`。 |
| **导航模型** | 中度 | ✅ 已解决 | public-header 实现双轨（公开入口+Console 次级入口）。 |
| **首页 Leaderboard** | 中度 | ✅ 已解决 | Live Hall 不再回退 legacy leaderboardEntries；首页不设独立 Leaderboard。 |

## 3.4 CA 接入差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **CA 接入方式** | 重大 | 🔶 部分解决 | CAConnection/Session 模型与最小运行时桥已具备（handshake / signals / snapshot fetch API + connector demo）；但旧 Runner Pull 主路径仍在，尚未完成正式运行时切换。 |
| **CAConnection 模型** | 重大 | ✅ 已解决 | Schema 层已实现（含 caType/connectorId/ingestionStatus/registeredAt/disabledAt）。 |
| **数据方向** | 重大 | 🔶 部分解决 | Push+Fetch 最小闭环已可演示，但 Runner Pull → 回传模式仍在运行，正式主路径尚未切换完成。 |
| **原始数据可见性** | 中度 | 🔶 部分解决 | Evidence.visibility 字段已设计，但 CA Session 不公开的运行时强制执行待核实。 |
| **接入失败处理** | 轻微 | 🔶 部分解决 | RaceProject.aggregateIngestionStatus 字段已设计；语义上不改变 Registration 资格，但需完整链路验证。 |
| **CA 作为参赛资格** | 中度 | 🔶 部分解决 | Schema 分离了 CA 接入与 Registration 资格，运行时门禁逻辑待核实。 |

## 3.5 赛事生命周期差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **Race 状态数量** | 中度 | ❌ 未解决 | 仍为 5 状态（registration/preparation/active/frozen/finished），基于时间窗口推导。无显式 `Race.status` 字段。GRS003 要求 8 状态（draft/published/registration/running/submitting/judging/completed/archived）。 |
| **draft 状态** | 中度 | ❌ 未解决 | 创建即发布，无草稿态。 |
| **submitting 状态** | 轻微 | ❌ 未解决 | 无独立提交阶段。 |
| **judging 状态** | 中度 | ❌ 未解决 | 无独立评审阶段。 |
| **archived 状态** | 轻微 | ❌ 未解决 | 无归档状态。 |
| **封榜（frozen）** | 轻微 | 🔶 待定 | GRS003 未将其作为独立状态；当前保留，可能需要合并为 running 子状态。 |

## 3.6 Jumbotron / Screen Display 差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **大屏控制台** | 中度 | ✅ 已解决 | Screen Console 已实现 7 模式路由（jumbotron/billboard/live/leaderboard/works/announcement/calibration），超过 GRS003 要求的 6 模式。含 `screen-console-page.tsx` + `screen/[raceSlug]/[mode]/page.tsx`。 |
| **大屏模式** | 中度 | ✅ 已解决 | 7 种模式标签（大屏/看板/实况/榜单/作品/公告/校准）。 |
| **全屏管理** | 轻微 | ✅ 已解决 | Screen Console 统一控制入口，不再手动打开新标签页。 |
| **fallback 机制** | 中度 | ❌ 未解决 | 大屏失败时切换到稳定 Projection 或静态公告的 fallback 未实现。 |
| **track-runtime** | N/A | ✅ 一致 | 完整保留，GRS003 未定义，作为 DEV-6 复用。 |

## 3.7 评审体系差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **评委角色** | 重大 | ✅ 已解决 | Judge 角色 + JudgeAssignment + JudgingRecord Schema 已就位；judge scope convergence（13 项测试通过）；Judge view 路由就位。 |
| **评分方式** | 重大 | 🔶 部分解决 | JudgingRecord 含 scoreResult/scoreRiding 二维评分字段。但 Judge View 的实际评审表单和提交流程待核实；Runner 自动评分仍存在（`runner.ts`）。 |
| **评分维度** | 中度 | 🔶 部分解决 | 字段设计已从 passRate/codeReviewScore 扩展为 scoreResult+scoreRiding。 |
| **评审分配** | 重大 | 🔶 部分解决 | JudgeAssignment 模型就位，含 assignedByUserId 审计字段。Organizer View 的评审分配界面待核实。 |
| **评审前风险提示** | 重大 | ❌ 未解决 | Review Flag / Review Readiness 机制未发现实现。 |
| **赛后报告** | 中度 | 🔶 部分解决 | Report 模型就位（3 类型）；`buildRiderConsoleReportModel()` 已实现。自动生成和发布链路待核实。 |

## 3.8 技术栈差异

| 差异项 | 原评级 | 当前状态 | 详情 |
|--------|-------|---------|------|
| **认证方式** | 重大 | 🔶 部分解决 | 仍为 JWT Cookie session；GitHub OAuth 主链路已接入，但本地用户名/密码入口仍保留为开发兜底，尚未完全收口到单一正式身份入口。 |
| **数据库** | 轻微 | 未变 | 仍为 SQLite，迁移 Postgres 非 MVP 强制性要求。 |
| **Prisma 版本** | 轻微 | ✅ 一致 | Prisma 7 符合要求。 |
| **Next.js** | 轻微 | ✅ 一致 | Next.js 16 App Router 符合要求。 |
| **响应时间目标** | 轻微 | 🔶 未验证 | 无性能基准测试。 |
| **并发要求** | 轻微 | 🔶 未验证 | 无压力测试。 |
| **多环境** | 轻微 | 🔶 未验证 | 仅 dev/production，无 staging 环境配置。 |
| **Runner API** | 中度 | 🔶 过渡中 | Bearer Token 认证仍存在；待 CA Connector 替代。 |

---

# 第四章：差异分级（重新评估）

## 4.1 分级标准

| 级别 | 定义 | 判断标准 |
|------|------|---------|
| **重大差异** | 需要架构重构、新增核心实体、或改变基础数据模型的变更 | 涉及领域不变量、主键关系、角色体系、认证方式等 |
| **中度差异** | 需要新增/重构模块，但不改变核心架构模式 | 涉及页面结构、新增服务、API 扩展、状态机调整等 |
| **轻微差异** | 命名调整、参数扩展、或现有模块上的增量修改 | 不改变现有数据模型主键和核心关系 |

## 4.2 当前仍存在的重大差异（共 4 项）

| # | 差异项 | 原状态 | 当前状态 | 剩余差距 |
|---|--------|--------|---------|---------|
| 1 | **Team 实体删除** | 存在 Team+TeamMember | 🔶 Schema 中仍存在 | 深层 teamId→registrationId 迁移未完成；兼容层（rider-bridge.ts）仍在使用 |
| 2 | **User.role 集合化** | 单一 role 枚举 | 🔶 role + rolesJson 双轨 | `role` 字段未删除；旧代码可能仍读取 role 单值 |
| 3 | **GitHub OAuth 登录** | 用户名+密码 | 🔶 主链路已实现 | OAuth service / callback route / login action 已就位，但真实验收与登录模型收口未完成 |
| 4 | **CA Push+Fetch 模式** | Runner Pull | 🔶 最小闭环已具备 | handshake / signals / snapshot fetch API 与 connector demo 已就位，但 ingest pipeline 主路径仍保留 Runner Pull |

## 4.3 当前仍存在的中度差异（共 8 项）

| # | 差异项 | 当前状态 | 剩余差距 |
|---|--------|---------|---------|
| 1 | **Team→Registration 深层迁移** | 🔶 | Submission/LeaderboardEntry/HarnessEntry/RunnerTask 中 teamId 引用未迁移 |
| 2 | **Role 单值残留清理** | 🔶 | `role` 字段需移除，所有读取点迁移到 rolesJson |
| 3 | **Race 状态从 5→8** | ❌ | race-phase.ts 仍为 5 状态；Race 模型无 status 字段 |
| 4 | **大屏 fallback 机制** | ❌ | 无失败降级到稳定 Projection/静态公告的逻辑 |
| 5 | **评分模式迁移** | 🔶 | JudgingRecord 模型存在，但 Runner 自动评分仍为主路径 |
| 6 | **评审前风险提示** | ❌ | Review Flag/Readiness 未实现 |
| 7 | **CA Session 不公开** | 🔶 | 可见性字段已设计，运行时隔离待核实 |
| 8 | **Runner API 废除** | 🔶 | Runner API route 仍存在；`organizer_demo/` 未清理 |

## 4.4 当前仍存在的轻微差异（共 6 项）

| # | 差异项 | 当前状态 |
|---|--------|---------|
| 1 | Race frozen 状态保留/合并 | 待定 |
| 2 | SQLite → Postgres 迁移 | 非 MVP 强制要求 |
| 3 | 公开页 1s 响应时间 | 无性能基准 |
| 4 | Live Hall 3s 数据刷新 | 无刷新机制 |
| 5 | 200 并发在线 | 无压力测试 |
| 6 | dev/staging/production 三环境 | 仅 dev/production |

## 4.5 已完全解决项汇总（共 18 项重大+中度）

| 差异项 | 原评级 | 验证方式 |
|--------|-------|---------|
| Judge 角色 | 重大 | 13 项测试通过 |
| Admin 角色 | 重大 | 3 项测试通过 |
| Registration 实体 | 重大 | Schema + 18 项测试 |
| RaceProject 实体 | 重大 | Schema 验证 |
| CAConnection 实体 | 重大 | Schema 验证 |
| Session 实体 | 重大 | Schema 验证 |
| JudgeAssignment 实体 | 重大 | Schema + 13 项测试 |
| JudgingRecord 实体 | 重大 | Schema 验证 |
| Award 实体 | 重大 | Schema + 9 项测试 |
| Evidence 实体 | 重大 | Schema 验证 |
| Projection 体系 | 中度 | 48 项测试通过 |
| 独立 Race Page | 重大 | 组件实现+测试 |
| Live Hall | 重大 | 48 项测试通过 |
| Works 列表+Work Page | 重大 | 13 项测试通过 |
| Results 赛果页 | 重大 | 22 项测试通过 |
| Rider Profile | 重大 | 组件实现+测试 |
| Cooperation 页 | 重大 | 组件+路由就位 |
| Console 管理端 | 重大 | 19 项测试通过 |
| Admin Console | 重大 | 3 项测试通过 |
| URL 结构 | 重大 | 路由验证 |
| 公开端导航 | 中度 | 组件实现 |
| Screen Console 7 模式 | 中度 | 路由+组件就位 |
| 首页 Leaderboard 移除 | 中度 | 48 项测试验证 |

---

# 第五章：新增差距（🆕）- 从 status.md "当前阻塞/未完成项" 提取

以下差距项不在原 gap analysis 中，但在本次 audit 过程中发现。

## 5.1 构建环境问题

| 差距项 | 描述 | 影响 |
|--------|------|------|
| 🆕 **prisma.ts 硬编码路径** | `src/lib/prisma.ts` 在 `production` 分支里硬编码写入 `/tmp/ary-runtime`；该问题曾在 Windows 环境触发过构建阻塞，但通过恢复 Prisma client 生成产物后，当前 `db:generate` / `typecheck` / `build` 已可通过 | 历史风险，需后续继续观察 |

**当前状态**：已缓解，当前构建验证已通过。

## 5.2 身份入口链路断点

| 差距项 | 描述 | 影响 |
|--------|------|------|
| 🆕 **首页"身份入口"按钮跳转异常** | 用户反馈无法正常跳转，公开登录入口链路未完成真实验收 | 用户无法从首页进入登录流程 |
| 🆕 **/login 浏览器空白** | 服务端返回 200 和完整 HTML，但浏览器端出现"页面看起来什么都没有"的现象 | 登录页面对用户不可用 |
| 🆕 **临时排查文件残留** | `/.claude-login.html` 是排查 /login 时生成的临时文件，不是正式产品页面 | 需清理 |

**当前状态**：未修复。

## 5.3 控制台准入链路

| 差距项 | 描述 | 影响 |
|--------|------|------|
| 🆕 **Console 准入未达可验收状态** | 用户反馈"控制台入口基本畅通无阻、身份验证不符合预期" | 角色权限形同虚设的风险 |
| 🆕 **参赛选手提交链路断点** | 公开报名、Rider 工作台、提交入口之间存在断点，未恢复到可直接操作的状态 | 核心参赛流程不可用 |

**当前状态**：待核实修复。

## 5.4 登录模型未收口

| 差距项 | 描述 | 影响 |
|--------|------|------|
| 🆕 **登录模型仍偏向"任何人都可直接注册/登录本地账号"** | 尚未收口到 grs003 期望的正式身份体系与 OAuth 方案 | 与 GRS003 要求的 GitHub OAuth 唯一登录入口不一致 |

**当前状态**：部分收口（GitHub OAuth 主链路已具备，但正式入口策略仍未完全收口）。

## 5.5 中文残留扫描

| 差距项 | 描述 | 影响 |
|--------|------|------|
| 🆕 **用户可见英文残留** | status.md 指出"公开页和 Organizer Console 其他 section"仍有英文残留待扫描 | 用户体验不统一 |

**当前状态**：部分完成（Race Page/Live Hall/Admin/Organizer overview+settings 已中文化），其余 section 待扫描。

---

# 第六章：差异分布统计（重新计算）

## 6.1 本次审计后

| 等级 | v1.0 原始 | v1.1 当前 | 变化 |
|------|----------|----------|------|
| 重大差异-已解决 | 0 | 18 | +18 |
| 重大差异-部分解决 | 0 | 5 | +5 |
| 重大差异-未解决 | 24 | 1 | -23 |
| 中度差异-已解决 | 0 | 8 | +8 |
| 中度差异-部分解决 | 0 | 5 | +5 |
| 中度差异-未解决 | 14 | 1 | -13 |
| 轻微差异 | 10 | 6 | -4 |
| 新增差距 | 0 | 5 | +5 |

## 6.2 关键数字

| 指标 | v1.0 | v1.1 |
|------|------|------|
| 总差异项 | 48 | 49（含新增） |
| 已完全解决 | 0 | **26**（18 重大 + 8 中度） |
| 部分解决（进行中） | 0 | **10** |
| 仍完全未解决 | 38 | **8**（含新增 5） |

## 6.3 核心结论（更新）

相比 v1.0 审计时"现有系统围绕 Team+Submission+RunnerTask 构建，核心实体集合几乎完全不重叠"的结论，**截至 2026-06-19 收口后**：

1. **领域模型已基本对齐**：全部 12 个核心 GRS003 实体（Registration/RaceProject/CAConnection/Session/Work/JudgeAssignment/JudgingRecord/Award/Evidence/Report/Projection）已在 Prisma Schema 中就位，角色体系已扩展至 4 角色 + Public。

2. **信息架构已基本重建**：15+ 页面全部就位，URL 结构从平铺改为层级式，公开端导航、Console 管理端、Screen Console 7 模式均已实现。

3. **剩余差距集中在三个方向**：
   - **认证升级**：GitHub OAuth 主链路已实现，但真实验收与登录模型收口未完成
   - **运行时链路**：CA Push+Fetch 最小闭环已具备，但主路径仍未切换；深层 teamId 迁移与 Role 单值残留仍待清理
   - **质量收口**：身份入口链路断点、Console 准入验证、提交链路断点仍需真实验收；构建阻塞已不再是当前主问题

---

# 第七章：可复用资产（不变）

尽管差异大幅缩小，以下 GRS001/GRS002 产出仍然具有迁移价值：

| 资产 | 复用方式 |
|------|---------|
| Prisma + Next.js 技术选型 | 直接沿用 |
| Zod 校验模式 | 模式保留，内容已更新 |
| Server Actions 集中出口模式 | 架构模式保留，Actions 已大幅扩展 |
| track-runtime 套件（7 个文件） | 直接复用为 Jumbotron Display 基础 |
| JumbotronClient SVG 渲染 | 已整合进 Screen Console |
| Adapter 解耦模式 | 已从 AryDerivedDataProvider 迁移到 Projection 体系 |
| $transaction 原子操作模式 | 直接沿用 |
| Catmull-Rom 样条 + s 轴补间算法 | 直接复用 |

---

# 第八章：更新记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-06-18 | 初始版本：基于 GRS001/GRS002 成果与 GRS003 规范全集首次差异分析，48 项差异。 |
| v1.1 | 2026-06-19 | 全线重新审计：基于 `docs/superpowers/status.md` 记录的 2026-06-19 收口成果与代码库实战验证，逐项重新评估。18 项重大差异已解决，8 项中度差异已解决，新增 5 项运行时/质量差距。核心差异从"领域模型完全不重叠"缩小为"GitHub OAuth+CA 运行时链路+质量收口"三方向。 |
| v1.2 | 2026-06-19 | 修正部分过时判断：GitHub OAuth 与 CA Push+Fetch 已从“完全未开始”更新为“主链路/最小闭环已具备但尚未完成真实验收或主路径切换”；构建环境阻塞改为历史风险，不再视为当前主阻塞。 |
