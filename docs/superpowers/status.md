# ARY 状态

本文记录当前工作区已完成与待完成的任务状态，以 `docs/superpowers/plans/` 和 `docs/superpowers/specs/` 为权威来源。本文档统一使用 UTF-8 编码和中文维护。

---

## 历史记录（GRS003，2026-06）

### 2026-06-19 控制台基础路线收口（已完成验收）

- 新增控制台路由与壳层：`/console`、`/console/races`、`/console/screen`
- `src/lib/viewer-access.ts` 增加 Admin/Judge/Organizer/Rider/Screen 入口控制
- `src/lib/services/console-routes.ts` 增加赛事控制台列表、大屏控制台列表，以及按 slug 取赛事上下文的逻辑
- 4 角色体系：Admin/Organizer/Rider/Judge 访问控制；Race Console、Admin Console、Screen Console 按能力边界拆分
- 验证：19 项测试通过

### 2026-06-19 公开端与过程投影收口（已完成验收）

- `src/lib/jumbotron/adapter.ts`：去掉伪造骑行消息，活跃骑手和控制台 KPI 优先读取 Registration/RaceProject
- `src/lib/services/projections.ts`：增加 `EVENT_STREAM_READ_MODEL` 投影输出
- `src/app/_components/public/live-hall.tsx`：过程榜单改读 `CURRENT_LEADERBOARD`，事件流改读 `EVENT_STREAM_READ_MODEL`
- 验证：48 项测试通过

### 2026-06-19 公开结果链收口（已完成验收）

- `src/lib/services/results.ts` 增加 `buildPublicResultsModel()`
- `src/lib/services/review.ts` 增加 `buildPublicReviewModel()`
- `src/lib/services/public-routes.ts` 补齐 `techNotes`、`judgeComments`、`skillTags`、`performanceSummary`
- 验证：22 项通过

### 2026-06-19 GitHub OAuth 与真实 Agent 最小闭环补齐

- GitHub OAuth callback 链路：state cookie、GitHub code exchange、用户查找/创建与 session 写入
- `organizer_demo/ca_connector_demo/` 最小演示器：本地 snapshot server、ARY handshake client、signal push client、`.env.example` 与 README
- `README.md` 与 `.env.example` 补齐 `SESSION_SECRET/ARY_BASE_URL/GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET/GITHUB_CALLBACK_URL` 说明
- 验证：`npm --prefix organizer_demo/ca_connector_demo run typecheck` 通过

### 2026-06-20 环境修复与结构收口

- `prisma db push` 同步数据库与 Schema，`prisma generate` 重新生成 Prisma 客户端
- Race 状态机 5→8：新增 `running/submitting/judging/completed/archived`；`race-phase.ts` 重写，新增 `isValidPhaseTransition()`
- Runner 路径降级：提交不再自动入 Runner 队列，CA Connector→JudgingRecord 成为主路径
- Console 权限验证：Organizer 按 `organizerId` 过滤、Rider 按 registration、Judge 按 assignment
- 验证：`npx tsc --noEmit` 零错误；`npm run build` 通过；`npm run db:seed` 生成3赛事 + 11骑手

### 2026-06-20 Admin 办赛申请审批功能（已完成验收）

- 企业填写合作表单 → `CooperationRequest(PENDING, submitterId=当前用户)` → Admin 控制台审批 → 批准自动创建 Race / 拒绝标记 REJECTED
- Admin Console 新增 `race-requests` section，由3个 section 扩展为4个
- 验证：TypeScript 编译零错误；`prisma db push` 同步；手动验收通过

### 2026-06-20 Rider 控制台「作品提交」Section 收口

- 比赛中（active/frozen/running/submitting）：只保留「赛中代码测试」入口，去掉独立的「提交作品」
- 比赛结束后（finished/completed）：统一为「作品提交」，含代码文件 + Riding Record 双入口

### 2026-06-20 Organizer 大屏控制台入口恢复

按最新产品要求，恢复主办方进入大屏控制台的能力：Organizer 可从自己主办赛事的主办方视图直接进入大屏控制台，并在 `/console/screen` 中只看到自己主办的赛事；Admin 仍保留全部赛事的大屏控制台访问范围。

- `src/app/_components/console/organizer-console-page.tsx`：新增「大屏控制台」按钮
- `src/lib/viewer-access.ts`：`canUseScreen`、`getConsoleHomeSections()`、`getConsoleScreenAccess()` 允许 ORGANIZER
- `src/lib/services/console-routes.ts`：ADMIN 返回全部赛事、ORGANIZER 返回自己主办的赛事

### 2026-07-09 GRS004 防伪防篡改计划更新

- 新增 `docs/grs004/防伪与防篡改计划.md`（v0.4），把 GRS003 旧安全计划按当前实现重写
- 安全中心从旧 Runner/自动 DQ/固定客户端，转向 `Registration → RaceProject → CAConnection → Session → Evidence → Projection → Organizer/Judge review` 主链路

---

## 当前整体状态（2026-07-12）

项目已从"底层模型和规则对齐"推进到"用户可以直接操作和验证"的阶段。本地可部署、可回归测试、可手工验收、可演示的主链路已具备：

```
npm install && npm run db:generate && npm run db:deploy && npm run db:seed && npm run dev
```

回归验证入口：`npm run qa:p0`

---

## ✅ 2026-07-12 新增功能

### 椭圆赛道个人赛 + 赛事大厅大屏轮播

| 任务 | 说明 |
|---|---|
| ✅ 新增 `race_registration_open` 可报名赛事 | 📝 NLP 推理挑战赛，`status: "registration"`，日期用 `addDays(now, ...)` 相对偏移（报名窗口 -3d ~ +4d），解决原有 `race_signup` 日期过期导致无可报名赛事的问题 |
| ✅ 新增 `race_active_oval` 种子赛事 | 使用操场椭圆赛道（`oval-track/background.png`），状态 `running`，6 名骑手以个人形式参赛（兼容 Team 容器名 = 骑手用户名） |
| ✅ 赛事大厅大屏轮播接入 | 实况大厅"打开大屏"页面（`src/app/jumbotron/[raceId]/page.tsx`）的 phase 过滤补入 `running`，使所有进行中赛事都进入 `JumbotronBanner` 轮播列表，每8秒自动切换（首页 `page.tsx` 未改动） |
| ✅ 暂停 / 恢复支持 | `JumbotronBanner` 已有 `⏸ 暂停` / `▶ 自动` 按钮；手动切换后自动锁定，再按自动键恢复轮播 |

- 底图：`public/assets/tracks/oval-track/background.png`（标准400米操场跑道鸟瞰图）
- 赛道：`oval-track`（椭圆，8车道）
- 参与骑手：`rider_alice ~ rider_frank`，以用户名作为参赛标识（不用队名）
- 相关文档：`docs/superpowers/specs/2026-07-12-grs004-oval-race-jumbotron-banner-design.md`、`docs/superpowers/plans/2026-07-12-grs004-oval-race-jumbotron-banner-implementation-plan.md`

### 大屏风险数据一致性修复

| 任务 | 说明 |
|---|---|
| ✅ 修复"风险数字点开无内容"Bug | 大屏 KPI 显示风险数（如1个），但点开参赛者却全是 `low`/0，风险无处可查 |
| ✅ 参赛者风险综合推导 | `adapter.ts` 的 `mapToRacingEntries()` 现从三个来源推导每位参赛者风险：CA 接入失败（FAILED）、会话风险等级（Session.riskLevel/riskReason）、反作弊扣分（antiCheatPenalty） |
| ✅ 新增 `riskReason` 字段 | `RacingEntrySnapshot` 增加 `riskReason?: string`，携带真实风险说明文本 |
| ✅ KPI 与参赛者一致 | `race-snapshot.ts` 中 KPI `riskCount`/`violationCount` 改为从实际带风险的参赛者条目派生，保证数字与明细完全一致 |
| ✅ 风险详情面板 UI | 风险 KPI 面板只列出真正带风险的参赛者，展示风险等级徽章 + 违规数 + 风险说明；无风险时显示"当前没有活跃风险" |
| ✅ Drill-down 面板 | 单个参赛者详情面板新增风险说明行（⚠ 图标 + reason） |

- 根因：KPI `riskCount` 统计"CA接入失败或反作弊扣分"，而参赛者条目的 `riskLevel`/`violationCount` **只反映反作弊扣分**，当风险源为 CA 接入失败时（如 `race_story_running` 的 rider_orion），KPI 计数为1但无任何参赛者体现
- 涉及文件：`src/lib/jumbotron/track-runtime/types.ts`、`src/lib/jumbotron/adapter.ts`、`src/lib/services/race-snapshot.ts`、`src/app/jumbotron/[raceId]/JumbotronClient.tsx`
- 验证：`npm run db:seed` 重新生成快照后，`race_active`（KPI 2 ⟷ 2 风险骑手）、`race_active_oval`（1 ⟷ 1）、`race_story_running`（1 ⟷ 1）KPI 数字与参赛者明细完全一致
- 相关文档：`docs/superpowers/specs/2026-07-12-grs004-jumbotron-risk-consistency-design.md`、`docs/superpowers/plans/2026-07-12-grs004-jumbotron-risk-consistency-implementation-plan.md`

---

## 当前整体状态（2026-07-12，GRS004）

项目已从"底层模型和规则对齐"推进到"用户可以直接操作和验证"的阶段。本地可部署、可回归测试、可手工验收、可演示的主链路已具备：

```
npm install && npm run db:generate && npm run db:deploy && npm run db:seed && npm run dev
```

回归验证入口：`npm run qa:p0`（覆盖 Auth/Profile/Roles、Console 访问、Race 生命周期、Registration/CA、Works、Judging、Awards、Reports 全链路）

---

## ✅ 已完成（2026-07，GRS004）

### Auth / Profile / Session（DEV-3）

| 任务 | 说明 |
|---|---|
| ✅ GitHub OAuth 友好错误收口 | `/login` 区分 OAuth 是否真正配置，占位值时显示"未配置"提示；callback 失败给中文错误而非500 |
| ✅ GitHub 占位配置门控 | `.env` 中 `replace-with-*` 值时 GitHub 登录按钮不可用 |
| ✅ GitHub OAuth 登录模型收口 | GitHub token exchange、用户创建/更新、session 写入链路完整 |
| ✅ Profile completion 正式流程 | 新用户或资料未补全用户先进入 `/profile`，补全后才能使用 Console |
| ✅ 单值 role 残留清理 | Session 侧统一使用 `roles[]`，旧 `role` 字段残留已移除 |
| ✅ Auth 回归覆盖 | Auth 入口回归测试套件已建立 |
| ✅ Console 路由 profile completion 门控 | 未完成 profile 不能进入 Console |
| ✅ 公开端 session 隔离 | 公开页不再向未登录用户泄漏 session 信息 |

### Race 生命周期（DEV-2）

| 任务 | 说明 |
|---|---|
| ✅ Race 创建权限对齐 | Admin 可创建赛事并指定 Organizer；赛事默认 draft，需显式发布 |
| ✅ Race 编辑权限对齐 | Organizer 只能编辑自己管理的赛事，Admin 可编辑所有 |
| ✅ Race 发布权限对齐 | `draft → published` 需要显式发布动作 |
| ✅ Race 归档权限对齐 | `completed → archived` 归档后仍保留公开查看入口 |
| ✅ Race 快照权限对齐 | Organizer/Admin 才能触发 Race 快照生成 |
| ✅ Race Console 根路由访问边界 | 各角色只能访问对应分区 |
| ✅ Race Console 整体权限对齐 | Organizer/Rider/Judge 各自只看到自己的 Section |
| ✅ Admin 进入 Race Console | Admin 可进入 `/console/races` 和 `/console/races/new` |
| ✅ 公开端阶段标签本地化 | `running`→`比赛中` 等8阶段均已本地化；`public-phase-label-regression.test.tsx` 覆盖 |
| ✅ Console 阶段标签本地化 | Console 内阶段标签统一中文 |
| ✅ 公开端 8 阶段 CTA 对齐 | 公开赛事页按8阶段切换文案和 CTA |

### Registration / RaceProject / CA（DEV-4、DEV-5）

| 任务 | 说明 |
|---|---|
| ✅ 报名审核生命周期 | 新报名进入 `SUBMITTED`，Organizer/Admin 可 approve/reject；只有 approved 才生成 RaceProject 和兼容 Team |
| ✅ 报名撤回与参赛资格门控 | 允许阶段内 Rider 主动撤回；只有 approved 报名才能接 CA、提交作品 |
| ✅ 清理旧 Team/Registration 双入口 | 移除旧 Team 直接注册入口，统一走 Registration 主链路 |
| ✅ Rider 提交旧 Team 门控移除 | 提交时不再以 Team 存在作为前置条件 |
| ✅ Rider CA 接入文案本地化 | CA 接入 Section 文案收口为中文 |
| ✅ Rider 快照 Fetch 自身范围限制 | Rider 只能 fetch 自己 RaceProject 的 Session 快照 |
| ✅ Review readiness 风险提示 | CA 接入失败、无 CA 数据等情况形成评审前风险卡片 |
| ✅ Review readiness 卡片本地化 | 风险提示卡片文案收口为中文 |
| ✅ CA Connection 管理权限对齐 | CAConnection 只能由 Rider 在自己 RaceProject 下操作 |
| ✅ Projection 重建权限对齐 | Projection 重建只能由 Organizer/Admin 触发，范围限制为本赛事 |
| ✅ DEV-5 P0 可信链缺口 | `CAIngestionEvent` 补 `payloadDigest/sequence/receivedAt/integrityStatus`；重复 idempotencyKey 且 payload 不一致形成 `integrity_gap`；`SESSION_SUMMARY` Evidence 补完整性元数据；`ca-integrity-helpers.ts` 已实现 |
| ✅ DEV-5 signal contract 对齐 | 信号 schema 收口，字段必填性和幂等规则对齐 |
| ✅ DEV-5 snapshot contract 对齐 | Snapshot schema 收口，来源校验对齐 |

### Work / 作品提交（DEV-4）

| 任务 | 说明 |
|---|---|
| ✅ Work 创建与提交物化 | Rider 先保存草稿（物化为 Work 资产），再正式提交；草稿不自动公开 |
| ✅ Work 可见性生命周期 | 正式提交后进入 SUBMITTED，公开/隐藏/锁定控制权在 Organizer/Admin |
| ✅ Rider 作品提交 readiness 提示 | 草稿不完整时给出提示，防止空提交 |
| ✅ Works 展示文案本地化 | 公开端和 Console 的 Works 展示文案收口为中文 |

### Judging / 评审

| 任务 | 说明 |
|---|---|
| ✅ Judge 分配权限对齐 | JudgeAssignment 只能由 Organizer/Admin 操作，scope 限为本赛事 |
| ✅ Judge 分配移除 | 支持移除 JudgeAssignment |

### Awards / Reports（DEV-7）

| 任务 | 说明 |
|---|---|
| ✅ Award/Report/Announcement 权限对齐 | 三类资产操作均限制在 Organizer/Admin 本赛事范围内 |
| ✅ Award/Report/Announcement 服务层加固 | Service 层补充权限校验和 scope 检查 |
| ✅ Award 草稿编辑 | 支持 Award 草稿创建和编辑 |
| ✅ Award 草稿撤回 | 支持已草稿 Award 撤回 |
| ✅ Award 正式发布 | `publishAwardsForRace` 实现：JudgingRecord → Award 生命周期，发布后才进入公开榜单 |
| ✅ **Report 编辑与评审门控** | `updateReportDraftForRace()` 草稿编辑；`markReportReviewedForRace()` 评审门控；PUBLISHED 后禁止再编辑；Server Action 已接入 |
| ✅ **Report 可见性与发布** | `publishReportForRace()` 实现发布；`publishedAt` 写入；公开只读已发布 Report；Organizer Console reports 分区展示完整操作入口 |

### Screen Console / 大屏展示（DEV-6）

| 任务 | 说明 |
|---|---|
| ✅ Screen 模式专属路由 | `src/app/screen/[raceSlug]/billboard\|live\|leaderboard\|works\|announcement\|static` 全部存在 |
| ✅ Billboard Screen Feed 集成 | Billboard 视图接入 SCREEN_FEED projection |
| ✅ Live 专属输出 | Live 模式专属数据管道和展示，含 `LiveAutoRefresh`（3s自动刷新） |
| ✅ Leaderboard 专属输出 | Leaderboard 模式专属数据管道 |
| ✅ Works 专属输出 | Works 模式专属数据管道 |
| ✅ Announcement Screen 基础 | 公告模式基础展示 |
| ✅ Screen Console 预览与全屏 | 大屏控制台内嵌预览和全屏切换 |
| ✅ Screen 展示状态基础 | 大屏展示状态机（live/fallback/static） |
| ✅ Screen 回退机制 | 大屏展示失败时回退到最近稳定 Projection |
| ✅ Screen Console Calibration 集成 | 大屏控制台内嵌赛道校准器 |
| ✅ Screen 赛道配置持久化 | 校准后的 track config 写入 Race 并持久化 |

### 防伪与防篡改（P1/P2）

| 任务 | 说明 |
|---|---|
| ✅ DEV-5 P0 可信链 | 见上方 Registration/CA 分区 |
| ✅ P0-B 序列号防重放 | sequence 单调性约束、重放检测 |
| ✅ **P1-A 材料完整性基础** | `Work` 有 `sourceRefJson/contentHash`；`Submission/SubmissionArtifact/TeamArchive` 有 `codeContentHash/ridingRecordHash/submitterBindingJson`；`CooperationRequest/Race` 有 `challengeSourceRefJson/challengeContentHash`；写入时通过 `buildPayloadDigest` 实时计算 hash |
| ✅ P1-B 结果引用冻结 | `result-reference-freeze-helpers.ts` 实现；Award/JudgingRecord 保存参考 Evidence 快照 |
| ✅ P1-C 统一安全审计 | `security-audit-helpers.ts` 实现 |
| ✅ P2-A Connector 签名方案 | `CAConnection` 新增 `credentialFingerprint/publicKeyPem/signatureVersion`；`ca-signature-helpers.ts` 实现 |
| ✅ **P2-B Connector 轮换与禁用** | `rotateCAConnectionSecretForRider()`、`disableCAConnectionForOrganizer()`、`enableCAConnectionForOrganizer()` 已实现；轮换 secret 时清空 handshake；Rider/Organizer Console 已显示 `secretVersion/secretRotatedAt/disabledAt/disabledReason` 及操作入口 |
| ✅ **P2-C Organizer 可信度/风险展示** | `buildTrustRiskSummary()` 已在 Organizer Console `ca-status` 实现；输出 `trusted/review_needed/failed` 三态；细节含 CA Ingestion、Evidence Integrity、Latest Session Risk、Connector Readiness 四组 |
| ✅ **P2-D Connector 审计概览** | `getRegistrationSecurityAudits()` 已实现；Organizer Console `ca-status` 展示 connector 安全审计事件列表，含 createdAt/action/result/reason |
| ✅ **P2-E 生产级签名强制** | `requiresProductionConnectorSignature()` 已接入 `ca-ingestion.ts` 和 `ca-fetch.ts`；远程非本地 connector 必须登记 credential，拒绝原因为 `credential_required`；localhost demo 保留 bearer-only 兼容 |

### 权限矩阵与回归

| 任务 | 说明 |
|---|---|
| ✅ 权限矩阵 Console 访问验证 | `viewer-access.test.ts` 与 `ary-permission-matrix.md` 口径一致；Organizer `canUseScreen: true` 有自动化覆盖 |
| ✅ P0 回归 Runner | `npm run qa:p0` 一键回归，覆盖全流程 |
| ✅ Live Hall 3s 自动刷新 | `LiveAutoRefresh` 组件，`intervalMs=3000`，已在 `live/page.tsx` 中使用 |

### 友好错误提示收口

| 任务 | 说明 |
|---|---|
| ✅ 核心流程友好错误 | public 报名、rider 报名/CA setup/submission 等失败后回到原页面显示中文错误卡片 |
| ✅ Console 根路由友好错误回退 | `/console` 根路由及赛事列表页失败时显示友好提示 |
| ✅ 入口页友好错误 | `/login`、`/profile`、`/races/new` 等入口页失败场景收口 |
| ✅ Organizer 核心操作友好错误 | Organizer settings/registrations/works 等操作失败后显示友好提示 |
| ✅ Judge/Screen 友好错误 | Judge 操作和大屏控制台操作失败后友好提示 |
| ✅ Admin 合作与维护友好错误 | Admin 建赛、合作审批、维护操作失败后友好提示 |

### 兼容层 / 清理

| 任务 | 说明 |
|---|---|
| ✅ Runner 自动入队降级 | 提交不再自动进入 Runner 队列，保留兼容路径但降级为手动触发 |
| ✅ 旧 TeamComment/Feedback 权限对齐 | 旧 team comment 和 feedback 操作收口到正确 scope |
| ✅ Organizer CA 状态文案本地化 | CA 状态 section 文案收口为中文 |

---

## ⏳ 待实现

> 经代码核查，原"待实现"列表中的所有条目均已在代码中实现。当前项目无剩余未完成的防伪防篡改、Screen Console、Report、CA 完整性任务。

如需追踪新任务，请在此补充。

---

## 参考文档入口

| 文档 | 说明 |
|---|---|
| `grs004readme.md` | GRS004 整体进展和可运行说明 |
| `docs/grs004/PLAN.md` | 近期任务窗口和里程碑 |
| `docs/grs004/STATUS.md` | 任务瞬时看板 |
| `docs/grs004/防伪与防篡改计划.md` | GRS004 安全计划（v0.4） |
| `docs/superpowers/plans/` | 所有实现计划（已完成和待完成） |
| `docs/superpowers/specs/` | 所有设计文档 |
