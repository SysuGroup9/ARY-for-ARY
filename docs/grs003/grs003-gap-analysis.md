# ARY GRS003 约束差异分析

版本：v1.0 | 日期：2026-06-18 | 作者：系统审计

本文档对 **GRS003 规范全集**（14 份文档）与 **现有代码库**（GRS001/GRS002 成果）进行逐项差异对比，并按影响程度分级。

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

# 第二章：现有架构与技术概述

## 2.1 现有系统核心架构

```
表示层：Next.js 16 App Router (RSC + Client Components)
  ├── 5 个页面路由 (/, /login, /audience, /jumbotron/[raceId], /calibrator)
  ├── 17 个 Server Actions (src/app/actions.ts)
  └── 2 个 Runner API Route Handlers (pull/result)
  
服务层：8 个领域服务文件 (src/lib/services/)
  └── users / races / submissions / runner / teams / feedback / scoring / race-snapshot

数据层：Prisma 7 + SQLite (better-sqlite3)
  ├── 14 个数据模型（User/Race/Team/TeamMember/Submission/SubmissionArtifact/
  │     RunnerTask/LeaderboardEntry/TeamArchive/HarnessEntry/RidingHighlight/
  │     FeedbackThread/FeedbackMessage/Notification/TeamComment）
  └── 7 个枚举类型

基础设施：JWT(jose) Cookie Session + Zod 4 校验 + Race Phase 状态机

Jumbotron 子系统：
  └── adapter.ts + track-runtime/(7 files) + Calibrator + JumbotronClient
```

## 2.2 现有角色体系

| 角色 | 实现方式 |
|------|---------|
| ORGANIZER | UserRole 枚举值，通过 requireRole("ORGANIZER") 校验 |
| RIDER | UserRole 枚举值，通过 requireRole("RIDER") 校验 |
| Audience | 无登录即可浏览（viewer-access.ts 中 canManage/canRide 判断） |

**当前只支持 2 种角色常量**，采用单一 role 模型（`User.role: UserRole`，非集合）。

## 2.3 现有数据模型特征

- **Team 实体存在**：`Team` + `TeamMember` 模型，支持组队参赛
- **Runner 任务驱动**：`RunnerTask` (SUBMISSION_TEST/PROGRESS_EVAL/HARNESS_EVAL)
- **无 CAConnection 实体**
- **无 RaceProject 实体**
- **无 Judge/JudgeAssignment 实体**
- **无 Award 实体**（使用 LeaderboardEntry + HarnessEntry 代替）
- **无 Evidence 实体**
- **无 Report 实体**（使用 TeamArchive/RidingHighlight/TeamComment 代替）
- **无 Projection 概念**（Jumbotron 使用 Adapter → RaceSnapshot JSON 方式）

## 2.4 现有页面结构

| 路由 | 对应 GRS003 IA |
|------|---------------|
| `/` | 首页（含 Organizer/Rider 操作面板 + Jumbotron 横幅） |
| `/login` | 登录页 |
| `/audience` | 观众页 |
| `/jumbotron/[raceId]` | 赛马大屏（对应 Screen Display / Jumbotron） |
| `/calibrator` | 赛道校准（对应部分 Screen Console 功能） |

**当前缺失 GRS003 IA 要求的页面**：Race Page（独立赛事详情）、Live Hall、Works 列表/详情、Results 赛果、Review 评审总结、Rider Profile、Cooperation、/console/* 管理端全套。

## 2.5 现有认证方式

- JWT Cookie Session（jose 库）
- 用户名+密码登录（bcryptjs 哈希）
- `SESSION_SECRET` 环境变量
- **非 GitHub OAuth 登录**

## 2.6 现有赛事状态

Race Phase 状态机：`registration → preparation → active → frozen → finished`（5 状态，`race-phase.ts`）

**与 GRS003 的 8 状态体系不匹配**。

---

# 第三章：逐项差异对比分析

## 3.1 领域模型差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **Team 实体** | Team + TeamMember 模型完整存在 | 明确不支持 Team，个人参赛 | **重大** |
| **User.role 模型** | 单一 `UserRole` 枚举（ORGANIZER/RIDER），一对一 | `User.roles` 集合，多 role 并存 | **重大** |
| **Judge 角色** | 不存在 | 新增 `judge` role | **重大** |
| **Admin 角色** | 不存在 | 新增 `admin` role | **重大** |
| **Registration 实体** | 不存在独立 Registration | 参赛报名事实中枢 | **重大** |
| **RaceProject 实体** | 不存在 | Registration 对应的骑行工作区 | **重大** |
| **CAConnection 实体** | 不存在 | 单个 CA 接入登记实例 | **重大** |
| **Session 实体** | 不存在 | CAConnection 下的 CA 协同过程 | **重大** |
| **Work 实体** | Submission 承担（但语义不同：Submission 是提交记录，Work 是资产） | 作品资产，独立于提交记录 | **中度** |
| **JudgeAssignment 实体** | 不存在 | 评审分配事实 | **重大** |
| **JudgingRecord 实体** | 不存在 | 评审评分和评语 | **重大** |
| **Award 实体** | LeaderboardEntry + HarnessEntry 代替 | 奖项结果，授予 Registration | **重大** |
| **Evidence 实体** | 不存在 | 能力证据事实 | **重大** |
| **Report 实体** | TeamArchive/RidingHighlight/TeamComment 代替 | rider_report/race_report/review_summary | **中度** |
| **Projection 概念** | Adapter+Snapshot 模式 | 独立的过程投影体系 | **中度** |
| **Organization 实体** | 不存在 | 明确不引入 | 一致 ✅ |
| **Score Rubric** | 评分权重存在（weightTaskPassRate 等） | 明确暂不建模 | 轻微 |

## 3.2 角色与权限差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **角色数量** | 2 种（ORGANIZER/RIDER） | 5 种（Public/Rider/Judge/Organizer/Admin） | **重大** |
| **Role 存储方式** | 单一 `role: UserRole` 字段 | `roles: UserRole[]` 集合 | **重大** |
| **GitHub 登录** | 用户名+密码（bcryptjs） | 要求 GitHub OAuth 登录 | **重大** |
| **权限校验** | `requireRole()` 二分法（ORGANIZER vs RIDER） | 多角色资源动作级权限矩阵（13 类资源 × 6 角色） | **重大** |
| **Organizer 范围** | 全局所有 Race（通过 organizerId 匹配） | 仅限 managed race | 轻微 |
| **Admin Console** | 不存在 | 需要独立的 Admin Console | **重大** |
| **Screen Operator** | 无独立职责定义 | 由 organizer/admin 兼任的操作职责 | 轻微 |

## 3.3 信息架构差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **首页结构** | 单页面承载公开+管理（Organizer 面板 + Rider 面板 + Jumbotron + Runner Queue） | Gallery-first，纯赛事资产展示，管理端分离 | **重大** |
| **页面数量** | 5 个路由 | 至少 15+ 页面（含 10 P0 公开页 + Console 多视图） | **重大** |
| **Race 详情页** | 嵌入在首页 `article.race-panel` 中 | 独立 Race Page（`/races/{raceSlug}`） | **重大** |
| **Live Hall** | Jumbotron 大屏承担部分功能 | 独立的实况大厅页面 | **重大** |
| **Works 页面** | 不存在 | 独立的作品列表 + 作品详情页 | **重大** |
| **Results 页面** | 榜单嵌入首页 | 独立的赛果页 | **重大** |
| **Rider Profile** | 不存在 | 独立的骑手档案页 | **重大** |
| **Cooperation** | 不存在 | 独立的介绍与合作页 | **重大** |
| **Console 管理端** | 与首页混合 | 独立 `/console/*` 路由体系 | **重大** |
| **URL 结构** | 平铺式（/ /login /audience /jumbotron/ /calibrator） | 层级式（/races/ /works/ /riders/ /console/） | **重大** |
| **导航模型** | 无公开顶层导航 | Races / Works / Riders / Cooperation / Login | **中度** |
| **首页 Leaderboard** | 存在（每个 Race Panel 嵌入榜单） | 明确禁止独立 Leaderboards 模块 | **中度** |

## 3.4 CA 接入差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **CA 接入方式** | Organizer 私有 Runner 主动 pull 拉取任务 | CA Connector push 骑行信号 + ARY HTTP fetch 快照 | **重大** |
| **CAConnection 模型** | 不存在 | 每个 RaceProject 下可配多个 CAConnection，需登记握手 | **重大** |
| **数据方向** | Runner → Pull → 回传 | CA → Push → ARY + ARY → Fetch → CA | **重大** |
| **原始数据可见性** | Organizer 私有 | 原始 CA Session 默认不公开 | **中度** |
| **接入失败处理** | Runner 任务 STALE/FAILED | 聚合接入状态提示，不改变 Registration 资格 | 轻微（语义提升） |
| **CA 作为参赛资格** | Runner 任务是核心评测路径 | CA 接入失败不取消参赛资格 | **中度** |

## 3.5 赛事生命周期差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **Race 状态数量** | 5 状态（registration/preparation/active/frozen/finished） | 8 状态（draft/published/registration/running/submitting/judging/completed/archived） | **中度** |
| **draft 状态** | 不存在（创建即发布） | 草稿 → 发布 | **中度** |
| **submitting 状态** | 不存在独立阶段 | 专门的提交阶段 | 轻微 |
| **judging 状态** | 不存在 | 专门的评审阶段 | **中度** |
| **archived 状态** | 不存在 | 归档 | 轻微 |
| **封榜（frozen）** | 存在 | 未在 GRS003 中作为独立状态 | 轻微（可能需要保留为子状态） |

## 3.6 Jumbotron / Screen Display 差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **大屏控制台** | Calibrator（设计时工具）+ JumbotronBanner/JumbotronInline（嵌入式） | Screen Console（独立控制台）+ Screen Display（展示输出面） | **中度** |
| **大屏模式** | Jumbotron 单一模式 | Jumbotron + Billboard + Live + Leaderboard + Works + Announcement（6 模式） | **中度** |
| **全屏管理** | 手动打开新标签页 | Screen Console 统一控制 | 轻微 |
| **fallback 机制** | 无 | 大屏失败时切换到稳定 Projection 或静态公告 | **中度** |
| **track-runtime** | 完整实现（GRS002 核心资产） | 未在 GRS003 中定义（可作为 DEV-6 复用） | 一致 ✅ |

## 3.7 评审体系差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **评委角色** | 不存在 | Judge role | **重大** |
| **评分方式** | Runner 自动评分（SUBMISSION_TEST） + Organizer 手动发起 PROGRESS_EVAL/HARNESS_EVAL | 人工评分为主，评委按固定评分项评分 | **重大** |
| **评分维度** | passRate + codeReviewScore + reasoningScore + keywordScore | scoreResult（作品结果）+ scoreRiding（骑行能力） | **中度** |
| **评审分配** | 无 | JudgeAssignment 分配事实 | **重大** |
| **评审前风险提示** | 无 | Review Flag / Review Readiness | **重大** |
| **赛后报告** | TeamComment + RidingHighlight | rider_report + race_report + review_summary | **中度** |

## 3.8 技术栈差异

| 差异项 | 现有实现 | GRS003 要求 | 差异性质 |
|--------|---------|------------|---------|
| **认证方式** | JWT Cookie + 用户名/密码 | GitHub OAuth 登录 | **重大** |
| **数据库** | SQLite (better-sqlite3) | 未指定（但需支撑 staging/production 环境） | 轻微（SQLite 可运行，Postgres 更合适） |
| **Prisma 版本** | Prisma 7.8 | 未指定 | 轻微 |
| **Next.js** | Next.js 16 App Router | 未指定（符合现代框架要求） | 一致 ✅ |
| **响应时间目标** | 无明确指标 | 公开页 1s、Live Hall 3s 刷新 | 轻微 |
| **并发要求** | 无 | 200 同时在线 | 轻微 |
| **多环境** | 仅 dev/production | dev/staging/production 三环境 | 轻微 |
| **Runner API** | Bearer Token 简单认证 | 未在 GRS003 中定义（CA Connector 方式替代） | **中度** |

---

# 第四章：差异分级

## 4.1 分级标准

| 级别 | 定义 | 判断标准 |
|------|------|---------|
| **重大差异** | 需要架构重构、新增核心实体、或改变基础数据模型的变更 | 涉及领域不变量、主键关系、角色体系、认证方式等 |
| **中度差异** | 需要新增/重构模块，但不改变核心架构模式 | 涉及页面结构、新增服务、API 扩展、状态机调整等 |
| **轻微差异** | 命名调整、参数扩展、或现有模块上的增量修改 | 不改变现有数据模型主键和核心关系 |

## 4.2 重大差异（共 24 项）

| # | 差异项 | 影响范围 |
|---|--------|---------|
| 1 | 删除 Team 实体，改为个人参赛 | User → Registration 关系、UI、报名流程 |
| 2 | User.role 从单一值改为集合（roles[]） | Schema、auth.ts、所有 Server Action 权限校验 |
| 3 | 新增 Judge 角色 | 数据模型、权限矩阵、UI |
| 4 | 新增 Admin 角色 | 数据模型、权限矩阵、Admin Console |
| 5 | 新增 Registration 实体 | 完整报名流程、RaceProject 生成、参赛追溯 |
| 6 | 新增 RaceProject 实体 | CA 接入容器、聚合状态、Projection 输入 |
| 7 | 新增 CAConnection 实体 | CA 登记握手、接入状态追踪 |
| 8 | 新增 Session 实体 | CA 协同过程记录、Summary 生成 |
| 9 | 新增 JudgeAssignment 实体 | 评审分配、评分追溯 |
| 10 | 新增 JudgingRecord 实体 | 评分、评语、评审结果 |
| 11 | 新增 Award 实体 | 奖项结果、榜单生成 |
| 12 | 新增 Evidence 实体 | 能力证据采集、引用、可见性控制 |
| 13 | 认证方式改为 GitHub OAuth 登录 | auth.ts 重构、Session 管理 |
| 14 | 权限从二分法改为 13×6 矩阵 | 所有鉴权点 |
| 15 | 首页从混合式改为 Gallery-first | page.tsx 完全重写 |
| 16 | 新增独立 Race Page（赛事详情页） | 新页面 + 对应读取模型 |
| 17 | 新增 Live Hall 实况大厅 | 新页面 + Projection 消费 |
| 18 | 新增 Works 列表 + Work Page | 2 个页面 + Work 资产模型 |
| 19 | 新增 Results 赛果页 | 新页面 + Award/Leaderboard 读取 |
| 20 | 新增 Rider Profile 骑手档案 | 新页面 + 聚合读取模型 |
| 21 | 新增 Cooperation 页 | 新页面 |
| 22 | 新增 Console 管理端（/console/*） | 独立路由体系 + Organizer/Rider/Judge View |
| 23 | 新增 Admin Console | 用户管理 + roles 维护 |
| 24 | CA 接入方式从 Runner Pull 改为 CA Push+Fetch | 废除 Runner API，新建 CA Connector |

### 4.2.1 重大差异详细说明

---

#### 差异 #1：删除 Team 实体，改为个人参赛

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：数据库存在完整的 `Team` + `TeamMember` 模型，报名流程为 Rider 创建队伍并添加成员（`registerTeam` 服务），提交以队伍为单位进行。信息架构上每个赛事下展示队伍列表和队员名册。<br>**目标状态**：MVP 明确只支持个人参赛（`ary-domain-analysis.v0.3.md` §3.2），不存在 Team 实体。选手以个人身份报名，Registration 直接关联 User 和 Race。提交、评审、Award 均以个人为单位。 |
| **影响范围** | **数据模型**：`Team` 表、`TeamMember` 表需删除；`Submission.teamId` 改为 `registrationId`；`LeaderboardEntry.teamId` 改为 `registrationId`；`HarnessEntry.teamId` 改为 `registrationId`。<br>**服务层**：`lib/services/teams.ts` 整体移除或重构为 Registration 服务；`lib/services/submissions.ts` 中的冷却检查逻辑从 team 维度改为 user 维度；`lib/services/runner.ts` 中所有 teamId 引用改为 registrationId。<br>**UI**：首页的"报名参赛"表单（队名+组员列表）改为个人报名流程；"当前队伍"面板改为个人参赛状态；"队伍评语"区改为个人评语。<br>**Seed 数据**：`prisma/seed.ts` 中的 Team 创建逻辑需全部重写。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §2.2"明确不进入 MVP 的实体/概念"：Team MVP 只支持个人参赛，不建团队实体。`ary-mvp.prd.md` §4"MVP 固定约束：个人参赛、不支持 Team"。 |
| **具体说明** | GRS001 阶段按原始 PRD 设计了组队功能（每队最多 5 人、Rider 报名时填写组员信息），这是基于旧版 PRD（v6.0）中预留的组队接口。GRS003 在领域分析阶段做出了明确的架构决策：首场 MVP 聚焦个人参赛以降低复杂度，Team 留待后续版本扩展。这一决策贯穿了 GRS003 全部 14 份文档，形成了完整的领域不变量链：一个 User 对同一 Race 最多一个 Registration → 一个 Registration 最多一个 RaceProject → 一个 Registration 最多一个主 Work。现有 Team 模型与这一不变量链存在根本性冲突。 |
| **建议做法** | 1. 新建 `Registration` 实体替代 `Team` 作为参赛事实中枢。<br>2. 将 `registerTeam` 服务重构为 `createRegistration`，去掉队伍名称和组员填写，改为个人报名确认。<br>3. 所有 `teamId` 引用的地方（Submission/LeaderboardEntry/HarnessEntry/RunnerTask/TeamArchive）统一迁移到 `registrationId`。<br>4. 保留 Team 模型定义但不用于 MVP，或直接删除并在 migration 中处理。 |

---

#### 差异 #2：User.role 从单一值改为集合（roles[]）

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：Prisma schema 中 `User.role` 定义为单值枚举 `UserRole`（ORGANIZER / RIDER），一个用户只能拥有一个角色。`auth.ts` 中 `SessionUser.role` 为单值；`requireRole()` 做单一角色校验。<br>**目标状态**：`User.roles` 应为集合，可同时包含 rider、judge、organizer、admin 中的多个值。同一用户可以既是某场赛事的 Organizer，又是另一场赛事的 Rider，还可以是某场赛事的 Judge。`auth.ts` 需要支持多角色 Session。 |
| **影响范围** | **Prisma Schema**：`User.role UserRole` 改为 `User.roles UserRole[]` 或关联表。<br>**auth.ts**：`SessionUser.role` 改为 `SessionUser.roles`；`requireRole()` 改为 `requireAnyRole()` 或 `requireRoles()`；`getRoleCapabilities()` 需支持多角色交集判断。<br>**actions.ts**：所有 17 个 Server Action 的 `requireRole()` 调用需调整。<br>**UI**：首页角色判断从 `canManage/canRide` 二元扩展到多角色面板展示；Header 需展示当前切换的角色上下文。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §2.2：User 持有 `roles` 集合，可以同时拥有 rider、judge、organizer、admin 中的多个身份。MVP 不把角色分配建模为独立实体。`ary-mvp.prd.md` §4。 |
| **具体说明** | GRS001 阶段只定义了两种用户角色（赛事主办方和参赛选手），采用枚举单值设计是合理的简化。GRS003 引入了 Judge（评委）和 Admin（管理员）角色，且明确同一用户可以同时承担多个角色，例如：一位老师既可以作为 Organizer 创建赛事，又可以作为 Judge 评审作品。当前的单值 role 架构无法表达这种"一人多职"的场景，且 `requireRole()` 仅支持单一角色校验，无法处理"该用户需要拥有 organizer 或 admin 角色才能访问"的逻辑。 |
| **建议做法** | 1. Prisma 中改为 `roles String` 存储 JSON 数组（SQLite 不支持原生数组），或使用关联表 `UserRoleAssignment` 但 GRS003 明确不建议独立实体。<br>2. 采用 JSON 字符串存储 `roles` 字段（如 `'["rider","judge"]'`），在应用层解析和使用。<br>3. `requireRole()` 改为 `requireAnyRole(...allowedRoles)`，遍历 `SessionUser.roles` 检查。<br>4. UI 层增加"角色切换"控件（当用户拥有多个 role 时）。 |

---

#### 差异 #3：新增 Judge 角色

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：系统只存在 ORGANIZER 和 RIDER 两种角色，评审由 Organizer 通过发起 PROGRESS_EVAL 和 HARNESS_EVAL Runner 任务完成，Runner 自动评分后 ARY 计算总分。评委不作为独立角色存在。<br>**目标状态**：新增 `judge` role，评委是拥有独立身份和权限体系的角色。Judge 通过 JudgeAssignment 被分配作品，查看作品和骑行摘要，按 MVP 固定评分项（scoreResult + scoreRiding + comments）完成人工评分，评审以人工为主、指标为辅。 |
| **影响范围** | **数据模型**：新增 `JudgingRecord`、`JudgeAssignment` 实体；`User.roles` 需支持 `"judge"` 值。<br>**服务层**：新增 `lib/services/judging.ts` 处理评审分配和评分提交。<br>**UI**：新增 Judge View 页面（Race Console 子视图），展示待评审作品列表、评审表单、已提交评审。<br>**权限**：Judge 只能访问分配给自己的评审任务和相关作品/Evidence 摘要。 |
| **目标来源** | `ary-mvp.prd.md` §4 核心用户角色表：Judge 评委，完成作品评审和骑行能力评价的用户。`ary-permission-matrix.md` §3.2：Judge 拥有 `assigned` 范围的资源访问权限。`ary-domain-analysis.v0.3.md`：Judge 由拥有 judge role 的 User 表达，不建独立实体。 |
| **具体说明** | GRS001/GRS002 的评审模式是"Organizer 的私有 Runner 自动评分 + ARY 权重计算总分"，本质上是一个自动化评测流水线，没有人工评委的概念。GRS003 把评审定位为 ARY 的核心差异化能力——评审不仅看作品结果，更要看骑行过程（Agent Riding Skill），因此必须引入人工评委角色。Judge 需要查看作品的骑行摘要和 Evidence，按固定的作品结果维度（完成度、产品理解、技术实现、体验表达、创新性、可展示性）和骑行能力维度（目标拆解、Agent 协同、纠偏、技术路线判断、成本控制、风险处理、复盘表达）进行综合评分。这些是 Runner 自动评分无法替代的。 |
| **建议做法** | 1. 在 `UserRole` 枚举中新增 `JUDGE` 值。<br>2. 创建 `JudgingRecord` 模型（关联 JudgeAssignment + Work + scoreResult + scoreRiding + comments）。<br>3. 创建 `JudgeAssignment` 模型（assignedByUserId + judgeId + workId）。<br>4. Organizer View 新增"评委管理"和"评审分配"功能。<br>5. 新增 Judge View 页面路由 `/console/races/{raceSlug}/judge`。 |

---

#### 差异 #4：新增 Admin 角色

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：系统无 Admin 角色，Organizer 拥有最高操作权限（可创建赛事、管理报名、清空比赛等），没有独立的用户管理和角色分配能力。<br>**目标状态**：新增 `admin` role，Admin 拥有独立的 Admin Console，可查看 GitHub 登录用户列表、查看资料补全状态、维护 `User.roles`。Admin 不承担赛事执行、CA 接入维护或数据运营职责。 |
| **影响范围** | **数据模型**：`User.roles` 需支持 `"admin"` 值；User 模型可能需要 `profileCompleted` 字段。<br>**UI**：新增 Admin Console 页面（`/console/admin`），包含用户列表、资料补全状态、roles 维护三个子视图。<br>**权限**：新增 Admin 专属权限规则，Admin 可以 update_roles 但不能操作赛事资源。 |
| **目标来源** | `ary-mvp.prd.md` §4：Admin 最小系统管理与身份维护用户。`ary-permission-matrix.md` §3.11：Admin 可以 `update_roles`、`view_private_profile`。`ary-mvp.ia.md` §8.5：Admin Console 只承载基础账号、个人资料状态和 `User.roles` 管理。 |
| **具体说明** | GRS001 阶段是 PoC 性质的 demo，没有考虑系统管理层面。GRS003 作为支撑首场标杆赛事的 MVP，需要在正式比赛运营中具备最低限度的账号管理能力：主办方和评委身份需要由可信的 Admin 用户分配，而不是任何人注册都能成为 Organizer。Admin 角色的设计刻意"最小化"——不承担赛事执行，只处理身份治理，这避免了 Admin 成为"超级用户"的安全风险。 |
| **建议做法** | 1. 在 `UserRole` 枚举中新增 `ADMIN` 值。<br>2. 创建 Admin Console 路由（`/console/admin/*`），实现用户列表、roles 编辑、资料状态查看。<br>3. 在 `auth.ts` 中增加 `requireRole("ADMIN")` 校验。<br>4. Seed 数据中创建一个初始 Admin 账号。<br>5. Admin 操作需有审计日志（当前可先以操作记录实现，后续升级）。 |

---

#### 差异 #5：新增 Registration 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：报名通过 `Team` 实体表达——Rider 创建队伍（`registerTeam`），队伍关联 Race 和队长（captainId），成员通过 TeamMember 存储。不存在独立的报名申请、审核、批准/拒绝流程。Team 创建即视为报名成功。<br>**目标状态**：`Registration` 是连接 User 与 Race 的报名事实中枢。拥有 `submitted → approved → rejected → withdrawn` 完整生命周期。Registration approved 后由 ARY 幂等自动生成 RaceProject。Registration 是后续所有参赛流程的追溯起点（RaceProject、Work、Evidence、Award、rider_report 均从 Registration 长出）。 |
| **影响范围** | **数据模型**：新建 `Registration` 表（id, raceId, userId, status, submittedAt, approvedAt, rejectedAt, withdrawnAt）；所有从 Team 派生的关系（RaceProject, Work, etc.）改为从 Registration 派生。<br>**服务层**：`lib/services/teams.ts` 重构为 `lib/services/registrations.ts`，实现 submit/approve/reject/withdraw 操作。<br>**UI**：Organizer View 新增"报名管理"页面（审核报名、批量审批）；Rider View 展示个人报名状态。<br>**权限**：Registration 有一套独立的权限规则（submit/approve/reject/withdraw）。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §2.2 核心实体：Registration 连接 Race 与拥有 rider role 的 User 的报名事实。`ary-mvp.prd.md` §7.4 硬约束：Registration 进入 approved 后 ARY 必须幂等生成且仅生成一个 RaceProject。 |
| **具体说明** | 现有 Team 模型承载了两个不同的语义：报名事实（谁参加哪场比赛）和协作组织（队伍内的成员关系）。GRS003 将这两个语义解耦：个人参赛不需要队伍组织，但报名审核流程是赛事运营的必要环节（防止恶意报名、确认参赛资格）。Registration 的审核流程解决了现有系统中"任何人创建 Team 即报名成功"的安全隐患。同时，Registration 作为参赛追溯中枢的设计，使后续的 RaceProject 自动生成、Work 关联、Award 授予都有一条清晰的追溯链。 |
| **建议做法** | 1. 创建 `Registration` 模型（字段：id, raceId, userId, status, submittedAt, approvedAt 等）。<br>2. 添加唯一约束 `raceId + userId`（一个 User 对同一 Race 最多一个 Registration）。<br>3. Registration approved 后在 $transaction 中幂等创建 RaceProject。<br>4. 迁移现有 Team 中的数据到 Registration（保留 teamId 用于存量兼容或直接重建 Seed）。 |

---

#### 差异 #6：新增 RaceProject 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：系统中不存在"参赛工作区"概念。Rider 报名后直接开始提交代码（Submission），通过 RunnerTask 进行评测。CA 数据接入不在现有系统的关注范围内——代码由 Rider 手动提交文本。<br>**目标状态**：`RaceProject` 是 Registration 对应的本场比赛骑行工作区。Registration approved 后由 ARY 幂等自动生成。RaceProject 是多个 CAConnection 的容器，承载聚合接入状态（aggregateIngestionStatus）、关联 GitHub Repo（作为代码材料入口，不作为 CA 接入源），并作为 Projection 的输入源。 |
| **影响范围** | **数据模型**：新建 `RaceProject` 表（id, registrationId, raceId, repoUrl, aggregateIngestionStatus, connectionHealth, lastSyncedAt）。<br>**服务层**：新增 `lib/services/race-project.ts`，实现幂等创建、CAConnection 关联管理。<br>**UI**：Rider View 展示 RaceProject 状态（CA 接入健康度、已关联 CA）。<br>**Projection 输入**：RaceProject 的聚合状态是 race_progress_projection 和 registration_status_projection 的数据来源。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §4.1：RaceProject 是某次参赛的骑行工作区容器，由 approved Registration 自动生成。§4.4 不变量：已批准 Registration 应有且仅有一个 RaceProject。`ary-mvp.prd.md` §8：RaceProject 承载多个 CAConnection 的聚合实时 CA 接入健康度。 |
| **具体说明** | RaceProject 是 GRS003 引入的关键抽象层。它在 Registration（事实）和 CAConnection（技术接入）之间建立了缓冲：即使所有 CAConnection 都 failed，RaceProject 依然存在，Registration 依然有效。这个设计支撑了"CA 接入不作为参赛资格硬门禁"的产品硬约束。现有的 Submission 模型承担了部分类似职责，但 Submission 是一次性的代码提交，而 RaceProject 是持续的骑行工作区——它需要追踪参赛全过程的 CA 接入状态变化。 |
| **建议做法** | 1. 创建 `RaceProject` 模型，添加唯一约束 `registrationId`（一对一）。<br>2. Registration approved 时在 $transaction 中幂等创建（检查是否已存在，避免重复审批时创建多个）。<br>3. RaceProject 的 aggregateIngestionStatus 由所有关联 CAConnection 的状态聚合计算。<br>4. 将现有 Submission 的部分元数据（tokenUsed、agentType）迁移到 RaceProject 或 CAConnection 层。 |

---

#### 差异 #7：新增 CAConnection 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：系统没有 CA 接入概念。代码通过 Rider 手动填写文本提交，Agent 类型仅为 `agentType` 枚举标注。Runner 拉取任务后获得内联代码内容并在 Organizer 私有环境中评测。<br>**目标状态**：`CAConnection` 是 RaceProject 下的单个 CA 接入登记与运行实例。每个 CAConnection 绑定一个 CA 类型（codex/claude_code/other）、connector 实例、外部 CA Project。具有完整的生命周期：登记 → 握手 → connected → active（产生 Session 后）→ 可 failed。参赛过程中可以新增多个 CAConnection。只有已登记、已握手、归属正确且未禁用的 CAConnection 数据才能进入 Projection/Evidence/Report。 |
| **影响范围** | **数据模型**：新建 `CAConnection` 表（caConnectionId, raceProjectId, caType, connectorId, connectorVersion, caProjectId, ingestionStatus, registeredAt, disabledAt, lastSyncedAt）。<br>**服务层**：新增 `lib/services/ca-connection.ts` 处理登记、握手、状态管理。<br>**CA Connector**：全新模块，处理 CA Session 数据 push 接收和 HTTP fetch 快照。<br>**UI**：Rider View 展示 CAConnection 列表、接入状态、新增连接入口。 |
| **目标来源** | `ary-ca-integration-spec.md` §3.1：CAConnection 登记与握手、接入生命周期。`ary-domain-analysis.v0.3.md` §4.4 不变量：一个 RaceProject 可以有多个 CAConnection；CAConnection 必须先登记和握手。 |
| **具体说明** | 现有系统的 Runner Pull 模型与 GRS003 的 CAConnection 模型代表了完全不同的数据流向：Runner Pull 是"组织者私有评测程序主动拉取"，CAConnection 是"CA 连接器主动推送 + ARY 按需拉取快照"。前者的数据主体是代码提交，后者的数据主体是 CA 协同过程。CAConnection 的"登记-握手"机制保证了只有合法、授权的 CA 连接才能向 ARY 写入骑行数据，防止数据伪造和越权接入。 |
| **建议做法** | 1. 创建 `CAConnection` 模型，关联 RaceProject。<br>2. 实现 CA Connection 登记 API（Rider 在参赛过程中通过 Rider View 新增）。<br>3. 实现握手校验机制（connector 向 ARY 发起握手请求，ARY 验证 caType、connectorId、外部 CA Project 归属）。<br>4. 实现 RidingSignalMessage push 接收端（基于 `idempotencyKey` 做幂等去重）。<br>5. CAConnection failed 时仅更新状态，不触发 Registration 状态变化。 |

---

#### 差异 #8：新增 Session 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：不存在 CA 协同过程记录。Rider 提交的代码和 Riding Record（如果有）是静态文本，没有 Session 概念。RunnerTask 是评测任务，不是骑行过程记录。<br>**目标状态**：`Session` 是 CAConnection 下的一次 CA 协同工作记录。包含 startedAt、endedAt、messageCount、toolCallCount、tokenCost 等字段。一个 CAConnection 可以有多个 Session。Session Summary 是 Evidence 的 session_summary 类型来源。原始 Session 数据默认不公开。 |
| **影响范围** | **数据模型**：新建 `Session` 表（sessionId, caConnectionId, startedAt, endedAt, messageCount, toolCallCount, tokenCost, lastActiveAt）。<br>**CA Connector**：push 信号中的 session_started / session_completed 事件触发 Session 的创建和更新；HTTP fetch 快照用于补充 Session 的完整数据。<br>**Evidence**：Session 是 Evidence.type=session_summary 的来源。<br>**UI**：Rider View 展示 Session 列表和摘要；Judge View 展示骑行摘要（基于 Session Summary）。 |
| **目标来源** | `ary-ca-integration-spec.md` §4.1：Session 是 CAConnection 下的一次 CA 协同过程。`ary-domain-analysis.v0.3.md` §2.2：Session 可来自 Codex、Claude Code 等实时 CA 协同过程。 |
| **具体说明** | Session 是 ARY 从"代码提交平台"转变为"骑行过程平台"的关键数据对象。现有系统只存储最终提交的代码和 Riding Record（Rider 赛后一次性提交），这意味着无法知道比赛过程中发生了多少次 Session、每次 Session 的时长和成本、Rider 在中间环节的纠偏和调整。Session 填补了这个过程数据的空白——它是后续 Projection（过程展示）、Evidence（能力证据）、Review（评审参考）和 Report（选手报告）的数据基础。 |
| **建议做法** | 1. 创建 `Session` 模型，关联 CAConnection。<br>2. 接收 `session_started` push 事件时创建 Session，`session_completed` 时更新结束时间和统计数据。<br>3. 实现 Session Summary 生成（从 Session 数据中提取关键摘要，作为 Evidence 输入）。<br>4. 原始 Session 标记为私有，公开端只读取 Session Summary。 |

---

#### 差异 #9：新增 JudgeAssignment 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：评审由 Organizer 发起 Runner 任务完成，Runner 自动评分后直接写入 LeaderboardEntry/HarnessEntry。不存在评委分配机制——所有提交由 Runner 统一评测。<br>**目标状态**：`JudgeAssignment` 是评审分配事实。Organizer 将 Work 分配给 Judge（拥有 judge role 的 User），记录 assignedByUserId（操作者）和 assignedAt（分配时间）。JudgeAssignment 是 JudgingRecord 的前置条件——评审记录必须来源于一个分配事实。 |
| **影响范围** | **数据模型**：新建 `JudgeAssignment` 表（assignmentId, workId, judgeId, assignedByUserId, assignedAt）。<br>**服务层**：新增评审分配服务（assign/reassign/remove）。<br>**UI**：Organizer View 新增 Judge Assignment 管理界面（评委列表、待分配作品、拖拽或下拉分配）。<br>**权限**：只有 Organizer 或 Admin 可以创建和修改 JudgeAssignment。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §4.4 不变量：JudgeAssignment 应记录 assignedByUserId；分配人应拥有 organizer 或 admin role。`ary-permission-matrix.md` §3.6：JudgeAssignment 只能由 Organizer managed race 或 Admin system 范围创建。 |
| **具体说明** | 现有 Runner 自动评测模型下，所有提交都由同一套 Runner 处理，没有"评审分配"的必要。GRS003 引入人工评委后，评审分配成为必要的流程步骤：Organizer 需要确保每个作品都被分配了评委，且避免同一评委被分配过多作品。assignedByUserId 的审计字段设计确保了分配行为的可追溯性——知道谁在什么时间把哪个作品分配给了哪个评委。 |
| **建议做法** | 1. 创建 `JudgeAssignment` 模型。<br>2. 在 Organizer View 中实现作品→评委分配界面。<br>3. 实现分配校验：评委必须是拥有 judge role 的用户；同一作品可被分配给多个评委。<br>4. JudgeAssignment 创建时自动记录 assignedByUserId（从当前 Session 获取）。 |

---

#### 差异 #10：新增 JudgingRecord 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：Runner 回传的评分分项（passRate/codeReviewScore/reasoningScore/keywordScore）直接写入 Submission 和 RunnerTask。Organizer 可对队伍写评语（TeamComment），但这不是结构化的评审记录。不存在独立的评分记录实体。<br>**目标状态**：`JudgingRecord` 是结构化的评审记录，来源于 JudgeAssignment，包含 `scoreResult`（作品结果评分）、`scoreRiding`（骑行能力评分）、`comments`（评语）和 `submittedAt`（提交时间）。评委提交前可以保存草稿和修改。评分维度参考 MVP 固定评分项，不建模为可配置 Score Rubric。 |
| **影响范围** | **数据模型**：新建 `JudgingRecord` 表（judgingId, assignmentId, scoreResult, scoreRiding, comments, submittedAt）。<br>**服务层**：新增评审提交服务（create/submit/update draft）。<br>**UI**：Judge View 的评审表单（评分 slider/input + 评语 textarea + 提交/保存草稿按钮）。<br>**Award 生成**：Award 可弱追溯到相关 JudgingRecord。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §4.1：JudgingRecord 基于 JudgeAssignment 产生，包含评分和评语。`ary-permission-matrix.md` §3.7：JudgingRecord 的 create/submit/update_before_submit 只能由 assigned judge 执行。 |
| **具体说明** | GRS003 的评分体系与现有 Runner 自动评分有本质区别。Runner 评分的重点是"代码质量"（passRate 反映测试通过率、codeReviewScore 反映代码质量），而 JudgingRecord 需要同时评估"作品质量"和"骑行能力"。scoreResult 关注作品本身（完成度、产品理解、技术实现、体验表达、创新性、可展示性），scoreRiding 关注选手在骑行过程中的表现（目标拆解、Agent 协同、纠偏、技术路线判断、成本控制、风险处理、复盘表达）。这两种维度的评分共同构成了 ARY 对选手能力的全面评价。 |
| **建议做法** | 1. 创建 `JudgingRecord` 模型，关联 JudgeAssignment。<br>2. 评分字段采用 JSON 存储（scoreResult 和 scoreRiding 均为多维度分数对象）。<br>3. 实现评审草稿保存和正式提交两种状态。<br>4. 提交后不可再修改（除非 Organizer 特殊操作）。<br>5. 将现有 TeamComment 迁移为 JudgingRecord.comments。 |

---

#### 差异 #11：新增 Award 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：LeaderboardEntry 按 totalScore 降序排列即形成榜单；HarnessEntry 按 harnessScore 降序排列形成赛后驾驭能力榜；RidingHighlight 展示前 N 名亮点。奖项由榜单推导，不存在独立的 Award 实体。<br>**目标状态**：`Award` 是奖项结果实体，包含 `awardName`（奖项名称）、`rank`（名次）、`decisionReason`（评奖理由）、`publishedAt`（发布时间）。Award 授予 Registration（获奖选手），可选关联 Work（获奖作品）。Leaderboard 是按 Award.rank 排列的读取模型，Award 是榜单的事实源。同一 Race 的同一 awardName 下 rank 唯一。 |
| **影响范围** | **数据模型**：新建 `Award` 表（awardId, raceId, registrationId, workId?, awardName, rank, decisionReason, publishedAt）。删除或重构 `LeaderboardEntry`、`HarnessEntry`、`RidingHighlight` 为读取模型。<br>**服务层**：新增 Award 管理服务（create_draft/edit_draft/publish/withdraw）。<br>**UI**：Organizer View 的 Awards 管理界面；Results 页面读取 Award 生成榜单展示。<br>**约束**：Award.rank 在同一 Race 同一 awardName 下唯一。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §4.1：Award 授予 Registration，可选关联获奖 Work。§4.4 不变量：Award.rank 在同一 Race 的同一 awardName 范围内应唯一。`ary-permission-matrix.md` §3.8：Award draft 发布前只允许 managed race Organizer 和 Admin 查看。 |
| **具体说明** | 现有系统的"榜单=分数排序"模型在只有一种排名的场景下工作良好，但 GRS003 要求 MVP 首场赛事至少有 6 个奖项类别（总成绩榜、最佳作品、最佳 Agent Rider、最佳纠偏、最佳成本控制、最佳复盘）。这要求 Award 不能只是"分数+排名"的简单投影——每个奖项可能有不同的评审依据和评选逻辑。例如"最佳成本控制"可能优先看重 token 效率而非 passRate，"最佳复盘"优先看重 Riding Record 的深度。Award 的 draft/publish 机制也确保了赛果在正式公布前不会泄露。 |
| **建议做法** | 1. 创建 `Award` 模型。<br>2. 将 LeaderboardEntry 和 HarnessEntry 重构为 Award 的读取投影（从 Award 表聚合生成）。<br>3. 在 Organizer View 中实现 Award 管理：创建 draft、编辑、发布、撤回。<br>4. Results 页面从 Award 读取最终榜单数据。<br>5. 将 RidingHighlight 改为基于 Award + Evidence 生成的读取模型。 |

---

#### 差异 #12：新增 Evidence 实体

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：系统中有 SubmissionArtifact（不可变快照）保存了代码和 Riding Record 的副本，但没有通用的 Evidence 概念。赛后展示通过 RidingHighlight 和 TeamArchive 提供部分数据，但这些都不是结构化的证据体系。<br>**目标状态**：`Evidence` 是支撑骑行能力评价的证据事实实体。包含 `type`（session_summary/work/commit_pr/screenshot/judge_comment/retrospective/video）、`summary`（摘要）、`sourceRef`（来源引用）、`visibility`（可见性控制）。Evidence 归属 Registration，可通过 sourceRef 引用 Session Summary、Work、JudgingRecord、GitHub 代码材料等来源。公开端只展示可公开 Evidence 摘要。 |
| **影响范围** | **数据模型**：新建 `Evidence` 表（evidenceId, registrationId, type, title, summary, sourceRef, visibility）。<br>**服务层**：新增 Evidence 采集和引用服务。<br>**UI**：Work Page 展示 Evidence 摘要；Rider Profile 展示能力证据；Review 页面引用 Evidence；Judge View 展示 Evidence 作为评审参考。<br>**权限**：Evidence 有独立的可见性控制（public/private/internal）。 |
| **目标来源** | `ary-domain-analysis.v0.3.md` §2.2：Evidence 是能力证据事实，归属 Registration，通过 sourceRef 引用来源。`ary-permission-matrix.md` §3.5：Evidence 的 view_public/view_private/set_visibility 权限规则。 |
| **具体说明** | Evidence 是 ARY 从"比赛结果公布"升级到"能力证明"的关键概念。现有系统的 RidingHighlight 是一种"赛后花絮"式的展示，不承载结构化的能力评价。GRS003 要求的 Evidence 体系需要回答"这个选手为什么骑得好"，而不是仅仅"他得了多少分"。每条 Evidence 通过 sourceRef 追溯到原始数据（Session Summary 证明了 CA 协同过程，Work 证明了最终交付质量，JudgingRecord 证明了评委认可程度），形成了从数据到结论的可信链条。 |
| **建议做法** | 1. 创建 `Evidence` 模型。<br>2. 在以下事件发生时自动创建 Evidence：Session 完成 → Evidence(type=session_summary)；Work 提交 → Evidence(type=work)；JudgingRecord 提交 → Evidence(type=judge_comment)。<br>3. 实现 visibility 控制：Rider 默认管理自己 Evidence 的可见性。<br>4. 将现有 SubmissionArtifact 的不可变快照思想继承到 Evidence.sourceRef 设计。 |

---

#### 差异 #13：认证方式改为 GitHub OAuth 登录

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：认证系统采用 JWT Cookie Session（jose 库）+ bcryptjs 密码哈希。用户通过用户名/密码注册和登录。`registerUser()` 和 `loginUser()` 服务处理表单提交，`createSession()` 生成 7 天有效期的 HS256 JWT Token。<br>**目标状态**：MVP 使用 GitHub OAuth 作为唯一登录方式。用户通过 GitHub 账号登录后补充个人资料（displayName、学校/单位等）成为 ARY User。不再提供用户名/密码注册登录。 |
| **影响范围** | **auth.ts**：完全重写——移除 bcryptjs 密码逻辑，集成 GitHub OAuth 流程（NextAuth.js 或手动实现 OAuth 2.0）。<br>**数据模型**：User 表新增 `githubAccount` 字段，`passwordHash` 移除或改为可选。<br>**UI**：login/page.tsx 从表单登录改为 GitHub 登录按钮；新增个人资料补全页面。<br>**Admin Console**：用户列表基于 GitHub 登录数据。 |
| **目标来源** | `ary-mvp.prd.md` §14.3："MVP 使用 GitHub 登录作为账号入口"；§14.4：公开端安全要求。`ary-domain-analysis.v0.3.md` §3.2："User / Account 使用 GitHub 账号登录，登录后补充个人信息成为 ARY User"。 |
| **具体说明** | GRS001 阶段选择用户名/密码登录是为了最快速度实现全栈认证闭环，以及方便 Demo 演示（固定的 demo 账号直接可用）。GRS003 要求 GitHub 登录的原因：1) ARY 面向开发者群体，GitHub 是天然的身份入口；2) GitHub 账号直接关联代码仓库，为作品代码入口和 Evidence 外部材料引用提供基础；3) 降低 ARY 自身的账号安全责任（不需要存储密码哈希，不需要处理密码重置流程）。 |
| **建议做法** | 1. 集成 NextAuth.js v5（@auth/next）的 GitHub Provider，或手动实现 OAuth 2.0 流程。<br>2. 在 `next.config.ts` 和 Vercel 环境变量中配置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET。<br>3. OAuth 回调后创建或查找 User 记录（以 githubAccount 为唯一标识）。<br>4. 新增"个人资料补全"页面（首次登录后引导填写 displayName）。<br>5. 保留现有 JWT Session 管理机制，仅将登录入口从表单改为 OAuth，Session 的存储和校验逻辑可沿用 jose 方案。 |

---

#### 差异 #14：权限从二分法改为 13×6 矩阵

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：权限校验极其简单——`requireRole("ORGANIZER")` 或 `requireRole("RIDER")` 两个出口。通过 `getRoleCapabilities()` 返回 `{canManage, canRide}` 二元布尔值。页面渲染时用 `if (canManage)` 判断是否显示 Organizer 面板。没有资源级别的权限控制——任何 Organizer 可以操作任何 Race（只要知道 raceId）。<br>**目标状态**：完整的资源动作级权限矩阵，覆盖 13 类资源（Race/Registration/RaceProject/Work/Evidence/JudgeAssignment/JudgingRecord/Award/Projection/Report/User/Announcement/ScreenDisplay）× 6 种角色（Public/Rider/Judge/Organizer/Admin/system）× 5-6 种动作（view/create/edit/publish/delete 等）。每个操作需要校验角色 + 资源归属范围（own/assigned/managed race/public/system）。 |
| **影响范围** | **所有 Server Actions**：每个 Action 需要校验：1) 用户是否登录；2) 用户是否拥有所需角色；3) 操作的目标资源是否在用户的权限范围内。<br>**所有 API Routes**：Runner API 和未来的 CA Connector API 需要权限校验。<br>**所有页面**：数据查询需要按权限范围过滤（例如 `listRaces()` 中 Organizer 只能看到自己管理的 Race）。<br>**中间件**：需要统一的鉴权中间件处理 Console 路由的访问控制。 |
| **目标来源** | `ary-permission-matrix.md` 全文（13 类资源 × 6 角色 × 多动作的完整矩阵）。`ary-mvp.prd.md` §14.3："后台访问必须经过登录和 User.roles 权限校验；Race Console、Admin Console、Screen Console 的访问边界必须隔离"。 |
| **具体说明** | GRS001 的二分权限是为 PoC 演示设计的。在实际赛事运营中，"知道 raceId 就能操作任何赛事"是一个严重的安全漏洞——一个恶意 Organizer 可以清空其他人的比赛、查看其他 Rider 的反馈。GRS003 的权限矩阵将"角色"和"资源范围"解耦：Organizer 角色只是能力标识，具体能操作哪些 Race 由 managed race 范围决定。Judge 只能访问 assigned 范围内的作品，Rider 只能操作 own 范围内的 Registration/RaceProject/Work。这种细粒度权限是赛事安全运营的基础。 |
| **建议做法** | 1. 创建 `lib/permissions.ts`，将 `ary-permission-matrix.md` 的矩阵翻译为可执行函数（如 `canAccessResource(user, action, resource)`）。<br>2. 在 Server Actions 和 Route Handlers 中统一调用权限校验。<br>3. 对 `listRaces()` 等数据查询增加基于用户角色的过滤逻辑。<br>4. 创建 Console 路由的 middleware 做前置角色检查。<br>5. 编写权限测试用例覆盖矩阵中的关键路径。 |

---

#### 差异 #15：首页从混合式改为 Gallery-first

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：首页（`src/app/page.tsx`）是"公开+管理"混合体。左侧 sidebar 包含账户中心、赛事浏览器、Runner API 面板。右侧 content 区包含：Organizer 创建赛事表单、每场赛事的详细信息面板（公开信息 + Rider 报名/提交 + Organizer 管理/反馈/发榜/评语 + Runner Queue + JumbotronInline）。页面结构以"操作面板"为核心组织逻辑。<br>**目标状态**：首页是 Gallery-first 的纯公开赛事展示入口。结构为：Hero / Featured Races（含 Live Race Switcher）→ Latest Results → Featured Works → Featured Riders → Past Races → CTA（报名/办赛/赞助/合作）。管理端入口弱化（Console Entry 在导航中），不干扰公众浏览。首页不设置独立 Leaderboards 模块。 |
| **影响范围** | **page.tsx**：完全重写——移除所有 Organizer/Rider 操作面板，删除 sidebar 结构，改为 Hero + 赛事卡片 + 作品卡片 + 骑手卡片的 Gallery 布局。<br>**JumbotronBanner/Inline**：Hero 区域中的 Live Race Switcher 可复用现有横幅组件的轮播和赛道渲染逻辑，但交互模式需调整。<br>**UI 组件**：新增 FeaturedRaces、LatestResults、FeaturedWorks、FeaturedRiders、PastRaces 组件。 |
| **目标来源** | `ary-mvp.ia.md` §7.1 首页 / Race Gallery 完整信息架构。`ary-mvp.prd.md` §7.1 Public Site 能力需求。`ary-mvp.ia.md` §7.1.5："首页不设独立 Leaderboards 模块"。 |
| **具体说明** | GRS001 的首页本质上是"控制台+公开展示"的混合体——它的设计目标是让开发团队在一页内看到所有功能的运行结果。GRS003 要求 Gallery-first 的首页是面向公众的产品体验面——它的目标是让第一次访问 ARY 的人在首屏理解当前正在进行什么赛事、有哪些优秀作品、如何参与。这是一个从"开发者自测页面"到"用户产品首页"的根本转变。当前首页的 Organizer Studio、Runner Queue、反馈中心等模块属于 Console 范畴，不应暴露给公众。 |
| **建议做法** | 1. 设计新的 HomePage 组件结构：Hero（Jumbotron + Live Race Switcher）→ Latest Results（卡片列表）→ Featured Works（作品卡片）→ Featured Riders（骑手卡片）→ Past Races（往届赛事）→ CTA 区。<br>2. 将现有 Organizer/Rider 操作面板迁移到 `/console/*` 路由下。<br>3. Hero 中的 Live Race Switcher 复用现有 JumbotronBanner 的 RaceSnapshot 数据源和 track-runtime 渲染逻辑。<br>4. 新增 `home_gallery_read_model` 和 `featured_races_read_model` 作为首页数据源。 |

---

#### 差异 #16：新增独立 Race Page（赛事详情页）

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：赛事信息以 `article.race-panel` 嵌入在首页中。每个赛事面板内包含了公开赛事情息（PublicRaceSections）+ Rider 操作区 + Organizer 管理区 + Runner Queue + JumbotronInline。不存在独立的赛事详情页路由。<br>**目标状态**：每个赛事有独立的 Race Page（`/races/{raceSlug}`），是 ARY 公开端最重要的二级页面。根据赛事状态动态调整信息优先级：报名中 → 赛题说明 + 报名入口优先；进行中 → Live Hall + Jumbotron 优先；已结束 → 赛果 + 作品 + 评审总结优先。内部导航：Overview / Rules & Schedule / Live / Riders / Works / Results / Review。 |
| **影响范围** | **新路由**：`/races/{raceSlug}` 和子页面（live/works/results/review）。<br>**新页面**：Race Page（服务端数据加载 + 状态驱动的内容布局）。<br>**数据源**：Race Page 需要聚合 Race 全量数据（基本信息 + 报名统计 + 作品列表 + 榜单 + 评审总结）。<br>**URL 设计**：新增 `slug` 字段（Race 的公开 URL 标识）。 |
| **目标来源** | `ary-mvp.ia.md` §7.2 赛事详情页 / Race Page 完整信息架构。`ary-mvp.prd.md` §7.1 Public Site：赛事详情页根据赛事生命周期提供报名、Live、Works、Results、Review 等入口。 |
| **具体说明** | 当前首页中嵌入赛事信息的方式无法支撑 GRS003 要求的信息深度。一场赛事从报名到结束，其 Race Page 需要承载完全不同的信息内容和交互入口——报名阶段的赛题介绍和报名 CTA、进行中的实况大厅和 Jumbotron、结束后的赛果和评审总结。这些内容如果全部挤在一个 panel 中会形成信息过载。独立的 Race Page 配合基于状态的动态布局，才能在每个阶段提供最优的信息消费体验。 |
| **建议做法** | 1. 创建 `src/app/races/[raceSlug]/page.tsx` 路由。<br>2. 在 `Race` 模型中新增 `slug` 字段（从 title 生成或手动设置）。<br>3. 实现基于 Race 状态的动态内容布局组件。<br>4. 将现有 `PublicRaceSections` 组件的内容迁移到 Race Page 并增强。<br>5. 新增子路由：`/races/[raceSlug]/live`、`/races/[raceSlug]/works`、`/races/[raceSlug]/results`、`/races/[raceSlug]/review`。 |

---

#### 差异 #17：新增 Live Hall 实况大厅

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：Jumbotron 大屏（JumbotronClient）和嵌入式横幅（JumbotronBanner/Inline）承担了部分"赛事实况"的展示功能——展示马匹位置、KPI、TOP3、消息气泡等。但这些组件是为大屏视觉效果设计的，不是为网页端浏览设计的。没有独立的实况大厅页面。<br>**目标状态**：Live Hall 是进行中赛事的核心公开页面（`/races/{raceSlug}/live`）。展示内容：赛事状态 + 阶段进度 + 骑手活动 + 事件流 + 成本/进度/风险指标 + 当前过程榜单 + 大屏入口。Live Hall 读取 Projection，不直接暴露原始 CA 数据。过程榜单是 Live Hall 的一部分，不作为最终赛果。 |
| **影响范围** | **新路由**：`/races/{raceSlug}/live`。<br>**新页面**：Live Hall 页面（读取 Projection 数据，展示赛事实时状态）。<br>**数据源**：依赖 race_progress_projection、registration_status_projection、cost_projection、risk_projection、event_stream_read_model、current_leaderboard_projection。<br>**Jumbotron 关系**：Jumbotron 作为 Screen Display 的一种输出模式，Live Hall 提供进入大屏的入口。 |
| **目标来源** | `ary-mvp.ia.md` §7.3 实况大厅 / Live Hall 完整信息架构。`ary-mvp.prd.md` §7.1：Live Hall 展示进行中赛事状态、骑手活动、关键事件和成本/进度/风险摘要。 |
| **具体说明** | GRS002 的 Jumbotron 是为现场大屏 16:9 视口设计的视觉体验，但线上公众也需要在网页端了解赛事进行状态。Live Hall 定位为网页端的"赛事直播面板"，它复用 Projection 数据但以更适合网页浏览的信息密度和交互方式呈现（表格、指标卡、事件时间线等，而非赛道动画）。Jumbotron 仍然是现场大屏的最佳选择，但 Live Hall 是线上公众的第一入口。 |
| **建议做法** | 1. 实现 Projection 生成引擎（从 CAConnection/Session 数据聚合生成各项 Projection）。<br>2. 创建 Live Hall 页面组件，消费 Projection 数据。<br>3. 展示 MVP 指标：当前参赛人数、活跃骑手数、已启动 Session 数、已提交作品数、平均进度、总 token 消耗、高风险骑手数、最近关键事件。<br>4. 当前过程榜单在 Live Hall 中展示，但不与最终赛果混淆。<br>5. 提供"进入大屏"入口跳转到 `/jumbotron/[raceId]` 或 Screen Display。 |

---

#### 差异 #18：新增 Works 列表 + Work Page

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：不存在独立的作品列表和作品详情页。Rider 提交的代码和数据通过 Submission 存储，评测结果展示在首页的 Runner Queue 表格和 Leaderboard 中。赛后展示通过 RidingHighlight 和 TeamArchive 提供有限的代码片段和 Riding Record 摘要。<br>**目标状态**：Works 是某场赛事的公开作品集合页（`/races/{raceSlug}/works`），展示已公开作品的卡片列表。Work Page 是单件作品的详情页（`/works/{workSlug}`），沉淀作品资产、案例资产和评审资产——包含 Demo/视频、问题定义、解决方案、技术方案、骑行过程摘要、关键证据、评委点评、奖项信息等。 |
| **影响范围** | **新路由**：`/races/{raceSlug}/works`、`/works/{workSlug}`。<br>**数据模型**：`Work` 实体替代 `Submission` 的作品语义（Submission 保留为提交记录）。<br>**新页面**：Works 列表页 + Work 详情页。<br>**数据源**：Works 列表读取 works_list_read_model；Work Page 读取 work_detail_read_model。 |
| **目标来源** | `ary-mvp.ia.md` §7.4 作品列表 / Works、§7.5 作品详情页 / Work Page。`ary-mvp.prd.md` §7.1 Public Site：Works 展示某场赛事已公开作品集合；Work Page 沉淀作品资产、案例资产和评审资产。 |
| **具体说明** | 现有系统中作品的展示是薄弱的——RidingHighlight 只展示前 N 名的代码片段和 Riding Record 摘要，缺乏作品的全貌展示。GRS003 要求每一件公开作品都成为一个独立的传播载体（可分享的 URL、丰富的作品信息、评审反馈的整合），这是 ARY "让作品可传播"目标的实现基础。Work Page 不仅是展示页，更是案例资产、教学素材和招商材料的来源。 |
| **建议做法** | 1. 将 `Work` 定位为独立于 `Submission` 的资产实体——Submission 是提交动作的记录，Work 是沉淀后的作品资产。<br>2. 创建 Works 列表页（支持筛选和排序）。<br>3. 创建 Work Page（包含 Demo/视频嵌入、技术说明、骑行摘要、Evidence 引用、评委点评、奖项信息）。<br>4. 从 `SubmissionArtifact`、`TeamArchive` 和 `RidingHighlight` 中提取数据填充 Work 的初始内容。 |

---

#### 差异 #19：新增 Results 赛果页

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：榜单直接嵌入首页每个赛事面板的 `PublicRaceSections` 中——LeaderboardEntry 和 HarnessEntry 按分数排序以表格形式展示。不存在独立的赛果页。<br>**目标状态**：Results 是赛事结束后的独立赛果页（`/races/{raceSlug}/results`）。展示内容：Race Result Summary + Award Leaderboards（多个奖项榜单）+ Winning Works + Riding Skill Highlights + Review Entry。Results 读取 `leaderboard_read_model`、Award 和 Report，不读取过程 Projection 作为最终结果。 |
| **影响范围** | **新路由**：`/races/{raceSlug}/results`。<br>**新页面**：Results 赛果页。<br>**数据源**：依赖 Award、leaderboard_read_model、Report。<br>**UI 变化**：首页中的榜单展示移除（保留在 Results 页中），首页只通过 Latest Results 模块提供入口。 |
| **目标来源** | `ary-mvp.ia.md` §7.6 赛果榜单 / Results。`ary-mvp.prd.md` §7.1：Results 发布赛事最终结果，突出 Agent Riding Skill 榜单。 |
| **具体说明** | GRS003 要求 Results 不是简单的"分数降序表格"，而是围绕多个 Award 类别组织的结构化赛果展示。首场 MVP 预设 6 个奖项类别，每个类别有独立的解释和获奖理由。这需要从设计层面区分"过程榜"（Live Hall 中的实时排名）和"结果榜"（Results 中的最终 Award），避免观众混淆。现有系统将两者混在同一个榜单中展示。 |
| **建议做法** | 1. 创建 Results 页面，按 Award.awardName 分组展示榜单。<br>2. 每个榜单项展示：排名、选手、作品、分数、获奖理由、作品链接。<br>3. 将 RidingHighlight 整合为 Results 中的 Featured Works 和 Riding Skill Highlights 模块。<br>4. 首页的榜单展示替换为 Latest Results 模块（仅展示摘要和进入 Results 页的入口）。 |

---

#### 差异 #20：新增 Rider Profile 骑手档案

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：Rider 信息仅以 username 形式存在于 Leaderboard 和 Team 列表中。没有独立的骑手档案页——无法查看某位 Rider 的参赛历史、作品集、获奖记录和能力标签。<br>**目标状态**：Rider Profile 是公开的骑手档案页（`/riders/{riderSlug}`），展示骑手的基础信息（姓名/学校/单位）、参赛记录、获奖记录、作品记录、Agent Riding Skill 标签、骑行数据摘要（成本/进度/风险表现）、评委评语和能力证据。 |
| **影响范围** | **新路由**：`/riders/{riderSlug}`。<br>**新页面**：Rider Profile 页（聚合多个数据源）。<br>**数据源**：依赖 `rider_profile_read_model`（从 User + Registration + Work + Award + Skill Tag + Evidence 聚合）。<br>**UI**：首页的 Featured Riders 模块提供 Rider Profile 入口。 |
| **目标来源** | `ary-mvp.ia.md` §7.8 骑手档案 / Rider Profile。`ary-mvp.prd.md` §7.1：骑手档案基于用户资料、报名、作品、奖项、能力标签和公开 Evidence 生成。 |
| **具体说明** | Rider Profile 是 ARY "让能力可证明"目标的核心承载页面。它不是一个社交主页，而是一个自动聚合的能力证据集——选手不需要手动维护，RY 系统通过报名记录、作品、奖项、Evidence 和 Riding Skill 标签自动生成。对于学生/开发者，这是可用于简历和面试的能力证明；对于企业，这是发现和评估人才的入口。 |
| **建议做法** | 1. 创建 Rider Profile 页面组件。<br>2. 实现 `rider_profile_read_model` 的数据聚合逻辑（跨 Race/Registration/Work/Award/Evidence 查询）。<br>3. 展示 Agent Riding Skill 标签（从 JudgingRecord + Evidence 推导）。<br>4. 在 User 模型中新增 `slug` 字段。<br>5. 首页 Featured Riders 模块提供进入 Rider Profile 的入口。 |

---

#### 差异 #21：新增 Cooperation 页

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：不存在合作或介绍页面。首页的 HeroSection 包含简单的"ARY for ARY"标题和描述，但缺乏系统的价值阐述和合作路径。<br>**目标状态**：Cooperation 是独立的介绍与合作页（`/cooperation`），内容包含：什么是 ARY、什么是 Agent Riding Skill、为什么需要 Agent Racing、如何参赛、如何办赛、如何赞助、联系合作。服务四类用户：学生/开发者、老师/学校、企业、社区。 |
| **影响范围** | **新路由**：`/cooperation`。<br>**新页面**：Cooperation 页（静态内容为主）。<br>**导航**：公开端顶层导航中新增 Cooperation 入口。 |
| **目标来源** | `ary-mvp.ia.md` §7.9 Cooperation。`ary-mvp.prd.md` §7.1 Public Site：Cooperation 解释 ARY 价值并承接合作转化。 |
| **具体说明** | Cooperation 页面是 ARY "让平台可转化"目标的实现载体。它将 ARY 的价值主张系统地展示给潜在参赛者（学生/开发者）、教学内容需求方（老师/学校）、赞助方（企业）和社区共创者，并分别提供明确的下一步行动引导。现有系统的 HeroSection 只做了最基本的品牌展示，无法承接这些转化场景。 |
| **建议做法** | 1. 创建 Cooperation 页面（静态内容，可后续接入 CMS）。<br>2. 按用户角色分区展示：学生/开发者 → 参赛路径；老师/学校 → 办赛和课程路径；企业 → 赞助和命题路径；社区 → 共创路径。<br>3. 添加联系表单或联系信息。<br>4. 在公开端顶层导航中添加 Cooperation 入口。 |

---

#### 差异 #22：新增 Console 管理端（/console/*）

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：所有管理功能嵌入在首页中——Organizer 创建赛事、修改题目、发起评测、赛后评语、清空比赛等操作全部在首页的 Organizer Console panel 中完成。Rider 的报名、提交、反馈操作也同样嵌入首页。不存在独立的管理端路由。只有 `/calibrator` 是独立的管理工具页面。<br>**目标状态**：Console 是独立的管理端体系（`/console/*`），与公开端完全分离。Race Console 是核心——以单场 Race Workspace 为上下文，按 Organizer/Rider/Judge View 展示不同的工作台视图。Admin Console 和 Screen Console 是独立入口。Console 入口在公开导航中弱化，通过登录后的 Console Entry 进入。 |
| **影响范围** | **新路由体系**：`/console`、`/console/races`、`/console/races/{raceSlug}/organizer/*`、`/console/races/{raceSlug}/rider/*`、`/console/races/{raceSlug}/judge/*`、`/console/admin/*`、`/console/screen/*`。<br>**UI 重构**：所有嵌入首页的管理面板迁移到 Console 路由下。<br>**权限**：所有 `/console/*` 路由需要前置鉴权（middleware 检查登录状态和角色）。<br>**导航**：新增 Console Shell 布局（sidebar + content）。 |
| **目标来源** | `ary-mvp.ia.md` §3.1 产品体验面：Race Console、Admin Console、Screen Console。§8 Console 管理端信息架构。`ary-mvp.prd.md` §7.2 Console 管理端。 |
| **具体说明** | GRS001 将管理功能嵌入首页是 PoC 阶段的权宜之计——方便开发和 demo 演示。但正式赛事运营中，公众不应看到甚至触及赛事管理界面。Console 独立分离后：1) 公众看到的首页是纯粹的 Gallery 浏览体验；2) 管理操作集中到 Console 中，按 race 上下文隔离，避免跨赛事误操作；3) 不同角色的视图在 Console 中按 sidebar 导航清晰区分。 |
| **建议做法** | 1. 创建 `/console` 目录结构，实现 Console Shell 布局组件（sidebar + breadcrumb + content area）。<br>2. 从首页 `page.tsx` 中逐个迁移管理功能：创建赛事 → `/console/races/new`；报名管理 → `/console/races/{raceSlug}/organizer/registrations`；Rider 提交 → `/console/races/{raceSlug}/rider/submission`。<br>3. 实现 Console middleware（检查登录和角色权限）。<br>4. 设计 Console 的导航 sidebar（根据角色动态显示可访问的视图）。<br>5. `/console` 首页根据 User.roles 展示可进入的视图入口。 |

---

#### 差异 #23：新增 Admin Console

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：不存在 Admin Console。Organizer 拥有最高操作权限。没有独立的用户管理能力——无法查看用户列表、无法分配角色、无法查看资料补全状态。<br>**目标状态**：Admin Console 是独立的管理页面（`/console/admin`），仅 admin 角色可访问。包含三个子视图：用户列表（查看所有 GitHub 登录用户）、资料补全状态（显示哪些用户已完成资料补全）、User.roles 维护（为任意用户分配/移除角色）。Admin Console 不承担赛事执行、CA 接入维护或数据运营职责。 |
| **影响范围** | **新路由**：`/console/admin`、`/console/admin/users`、`/console/admin/profile-completion`、`/console/admin/roles`。<br>**新服务**：`lib/services/admin.ts` 处理用户查询和 roles 更新。<br>**权限**：仅 `admin` role 可访问 Admin Console 路由。<br>**数据模型**：User 表可能需要新增字段（profileCompleted、profileData）。 |
| **目标来源** | `ary-mvp.ia.md` §8.5 Admin Console 账号与角色控制台。`ary-mvp.prd.md` §7.2：Admin Console 支持最小账号与角色管理。`ary-permission-matrix.md` §3.11：Admin 可以维护 User.roles。 |
| **具体说明** | Admin Console 是 ARY 身份治理的最小单元。在首场赛事运营中，需要有一个可靠的机制来分配 Organizer 和 Judge 身份——不能让任何人注册就能成为赛事主办方或评委。Admin 角色作为"身份管理员"，将身份治理从业务操作中分离。Admin 的刻意最小化设计（不碰赛事数据、不碰 CA 接入）降低了权限集中风险。 |
| **建议做法** | 1. 创建 Admin Console 路由和页面。<br>2. 实现用户列表页面（搜索、筛选、查看详情）。<br>3. 实现 roles 编辑功能（多选 Organizer/Judge/Rider/Admin）。<br>4. 实现资料补全状态展示（User.profileCompleted 字段 + 未补全用户的高亮提示）。<br>5. 通过 Seed 数据创建初始 Admin 账号。 |

---

#### 差异 #24：CA 接入方式从 Runner Pull 改为 CA Push+Fetch

| 字段 | 内容 |
|------|------|
| **差异内容** | **现有状态**：CA 数据（代码和 Riding Record）的流向是 Runner Pull 模型——Organizer 的私有 Runner 通过 `GET /api/runner/tasks/pull` 主动轮询拉取任务，评测完成后通过 `POST /api/runner/tasks/result` 回传评分分项。推送方向是 Runner → ARY（回传结果），拉取方向是 Runner ← ARY（拉取任务）。Bearer Token 完成简单认证。<br>**目标状态**：CA 接入采用 Push + Fetch 混合模型——CA Connector 通过 push 向 ARY 发送关键骑行状态事件（RidingSignalMessage），包含幂等去重键。当 ARY 需要完整 Session 快照时，主动向 CA Connector 发起 HTTP fetch（`GET /ary/ca/connections/{caConnectionId}/sessions/{caSessionId}/snapshot`）。Push 消息需校验 CAConnection 的登记和握手状态。未登记/未握手的连接数据拒绝接收。 |
| **影响范围** | **Runner API 废除**：`src/app/api/runner/tasks/pull/route.ts` 和 `result/route.ts` 删除或废弃。<br>**新 API**：CA Connector push endpoint（接收 RidingSignalMessage）；CA Connector fetch endpoint（返回 Session 快照）。<br>**新服务**：CA 接入服务（消息校验、幂等去重、Session 管理、Projection 触发）。<br>**organizer_demo/runner_demo**：现有 Runner Demo 代码不再使用，替换为 CA Connector 实现。<br>**认证**：Runner Token 替换为 CA Connector 认证机制。 |
| **目标来源** | `ary-ca-integration-spec.md` §2 CA 接入与 Agent Race 的关系、§5 原始骑行状态消息草案、§6 Session 快照 fetch。`ary-mvp.prd.md` §7.3 CA Data Ingestion。 |
| **具体说明** | Runner Pull 模型的设计出发点是"Organizer 私有评测程序"，数据内容是一次性的代码提交。CA Push+Fetch 模型的设计出发点是"实时 CA 协同过程的持续观测"，数据内容是赛事的全程骑行事件流。两者的根本区别：1) 方向反转——从 Organizer 拉取改为 CA 主动推送；2) 粒度不同——从"提交-评测"批次改为"事件-快照"实时流；3) 认证模式——从单 Bearer Token 改为每 CAConnection 登记握手。这个变化消除了现有模型的一个根本假设——"评测由 Organizer 控制"——取而代之的是"数据由 CA 驱动，ARY 负责接入校验和投影"。 |
| **建议做法** | 1. 设计并实现 CA Connector push API（接收 RidingSignalMessage，按 idempotencyKey 去重）。<br>2. 实现 CA Connector fetch 接口（ARY 主动拉取完整 Session 快照）。<br>3. 在 CAConnection 登记和握手时生成连接凭证，push 和 fetch 时校验连接归属。<br>4. 现有 Runner API 的两条路由可先保留用于向后兼容或废弃。<br>5. 现有 `organizer_demo/runner_demo` 中的 Runner 实现可作为 CA Connector 参考，但核心逻辑需重写（从 pull 轮询改为 push 事件发送）。<br>6. 将 `lib/services/runner.ts` 中的任务入队和评分逻辑重构为 CA 接入的 Projection 生成逻辑。 |

---

## 4.3 中度差异（共 14 项）

| # | 差异项 | 影响范围 |
|---|--------|---------|
| 1 | Submission → Work 语义转变 | 数据模型、UI 文案 |
| 2 | 新增 Report 实体（3 类型） | 报告生成/发布模块 |
| 3 | 新增 Projection 体系 | 投影生成/重算/消费 |
| 4 | Race 状态从 5 状态扩为 8 状态 | race-phase.ts、页面状态逻辑 |
| 5 | 新增 Screen Console 独立控制台 | 新页面，与 Calibrator 合并或替代 |
| 6 | 大屏从单一 Jumbotron 扩为 6 模式 | JumbotronClient 重构 |
| 7 | 新增 Screen Display fallback 机制 | 大屏容错逻辑 |
| 8 | 评分从 Runner 自动评分改为人评委为主 | 评审流程重构 |
| 9 | 评分维度调整（从分项改为作品+骑行二维） | scoring.ts 调整 |
| 10 | URL 结构从平铺改为层级式 | 路由重构 |
| 11 | 公开端导航模型建立 | 新 layout/nav 组件 |
| 12 | 原始 CA Session 默认不公开的数据隔离 | 数据访问层 |
| 13 | 首页禁止独立 Leaderboard | page.tsx 结构调整 |
| 14 | 新增 Review 评审总结页 | 新页面 + review_summary Report |

## 4.4 轻微差异（共 10 项）

| # | 差异项 | 处理方式 |
|---|--------|---------|
| 1 | Race 中 frozen 状态保留或合并 | 可作为 running 的子状态 |
| 2 | DB 从 SQLite 考虑迁移 Postgres | 仅改 datasource |
| 3 | 公开页响应时间目标 1s | 性能优化 |
| 4 | Live Hall 数据刷新 3s 内 | 增加轮询/推送 |
| 5 | 并发支持 200 用户 | 部署配置 |
| 6 | dev/staging/production 三环境 | CI/CD 配置 |
| 7 | Runner API 废弃，改为 CA Connector | API 路由删除 |
| 8 | 评分权重保留但不作为独立 Score Rubric | 保持现有 weight 配置 |
| 9 | Organizer 范围从全局收窄为 managed race | 鉴权增强（轻微改动） |
| 10 | Score Rubric 明确暂不入模型 | 与现有 "暂不进入" 一致 ✅ |

## 4.5 已对齐项（无需变更）

| # | 现有实现 | 与 GRS003 一致性 |
|---|---------|-----------------|
| 1 | Prisma 7 + App Router 技术栈 | 符合现代 Web 框架要求 |
| 2 | track-runtime 赛道运行时 | GRS003 未定义，可作为 DEV-6 复用 |
| 3 | Calibrator 赛道校准 | GRS003 Screen Console 的 Track/Theme 配置基础 |
| 4 | JumbotronClient SVG 渲染 | 可作为 Jumbotron Display Mode 基础 |
| 5 | Zod 4 所有输入校验前置 | 符合领域不变量要求 |
| 6 | $transaction 原子操作模式 | 符合幂等要求 |
| 7 | SubmissionArtifact 不可变快照 | 符合证据不可篡改思想 |
| 8 | Adapter 模式（数据映射解耦） | 符合 DCRaceDataProvider → CA Connector 预留接口模式 |
| 9 | 不引入 Organization 实体 | 明确一致 ✅ |
| 10 | 不引入独立 RoleAssignment 实体 | 明确一致 ✅ |

---

# 第五章：总结

## 5.1 差异分布统计

| 等级 | 数量 | 占比 |
|------|------|------|
| 重大差异 | 24 | 50% |
| 中度差异 | 14 | 29% |
| 轻微差异 | 10 | 21% |
| **合计** | **48** | **100%** |

## 5.2 核心结论

当前代码库（GRS001/GRS002 成果）与 GRS003 规范之间存在 **根本性的概念模型差异**，主要体现在三个维度：

1. **领域模型重构（最大差距）**：现有系统围绕 Team + Submission + RunnerTask 构建；GRS003 要求围绕 Registration + RaceProject + CAConnection + Work + Award + Evidence + Report 构建。核心实体集合几乎完全不重叠。

2. **角色与权限升级**：从 2 角色二分法 → 5 角色 13×6 权限矩阵，需要全面重写认证授权体系，并从用户名/密码登录改为 GitHub OAuth。

3. **信息架构重建**：从单页混合管理端 → Gallery-first + 独立 Console 体系，页面从 5 个路由扩至 15+ 个路由，URL 结构完全重新设计。

## 5.3 可复用资产

尽管差异巨大，以下 GRS001/GRS002 产出具有迁移价值：

| 资产 | 复用方式 |
|------|---------|
| Prisma + Next.js 技术选型 | 直接沿用，模型需完全重写 |
| Zod 校验模式 | 校验内容变更，但模式保留 |
| Server Actions 集中出口模式 | 17 个 Action 需全部重写，但架构模式保留 |
| track-runtime 套件（7 个文件） | 直接复用为 Jumbotron Display 基础 |
| Calibrator（SVG 编辑器） | 整合进 Screen Console 的 Theme/Calibration |
| JumbotronClient SVG 渲染 | 作为 Jumbotron Display Mode 基础 |
| Adapter 解耦模式 | 从 AryDerivedDataProvider 迁移到 CA Connector |
| $transaction 原子操作模式 | 直接沿用 |
| Catmull-Rom 样条 + s 轴补间算法 | 直接复用 |

## 5.4 差距最大的模块（需从零构建）

- Admin Console（全新）
- Screen Console（部分全新，部分复用 Calibrator+JumbotronClient）
- CA Connector + Ingestion Pipeline（全新）
- Evidence Store（全新）
- Report Generator（全新）
- Projection Engine（全新，从 Adapter+Snapshot 模式演化）
- Rider Profile 聚合读取模型（全新）
- Cooperation 页（全新）
- Review 评审总结（全新）
