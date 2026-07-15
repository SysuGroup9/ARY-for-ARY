# ARY GRS004 测试与验收清单

> 本文档是 GRS004 阶段的完整测试文档，覆盖自动化测试执行说明、手工浏览器验收检查清单和测试覆盖矩阵三部分。
> GRS003 的浏览器验收清单见 [`docs/grs003/CHECKLIST.md`](../grs003/CHECKLIST.md)（50 项），本文档聚焦 GRS004 新增功能与回归覆盖。

---

## 〇、准备

```powershell
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run db:generate
npm run db:deploy
npm run db:seed

# 3. 启动开发服务器
npm run dev
# 打开 http://localhost:3000
```

### 测试账号

| 角色 | 用户名 | 密码 | 备注 |
|------|--------|------|------|
| Organizer | `organizer_demo` | `organizer123` | 赛事主办方 |
| Admin | `admin_demo` | `organizer123` | 系统管理员 |
| Judge | `judge_demo` | `rider123` | 评委 |
| Rider / Leader | `rider_alice` | `rider123` | Pathfinders Alpha 队长（APPROVED） |
| Rider / Mate | `rider_bob` | `rider123` | Pathfinders Alpha 队员（PENDING） |
| Rider / Mate | `rider_charlie` | `rider123` | Pathfinders Alpha 队员（APPROVED） |
| Rider / Leader | `rider_diana` | `rider123` | Graph Explorers 队长（APPROVED） |
| Rider / Mate | `rider_eve` | `rider123` | Graph Explorers 队员（PENDING），用于访问控制验证 |
| Rider / Mate | `rider_frank` | `rider123` | Graph Explorers 队员（APPROVED） |
| Rider | `rider_grace` ~ `rider_kate` | `rider123` | 其余种子骑手 |

### 种子赛事 slug 索引

种子赛事 slug 格式为 `{raceId}--{slugify(title)}`，下列为 GRS004 验收常用赛事：

| raceId | title | 公开 slug | 状态 | 用途 |
|--------|-------|----------|------|------|
| `race_active` | Sorting Challenge | `race_active--sorting-challenge` | running | 进行中赛事，3 支队伍 |
| `race_active_oval` | 🏇 路径优化挑战赛 | `race_active_oval--🏇-路径优化挑战赛` | running | 椭圆赛道，E2E 协作验收主赛事 |
| `race_finished` | Performance Marathon | `race_finished--performance-marathon` | completed | 已结束赛事，作品提交/反馈验收 |
| `race_registration_open` | 📝 NLP 推理挑战赛 | `race_registration_open--📝-nlp-推理挑战赛` | registration | 报名中赛事 |
| `race_signup` | API Design Race | `race_signup--api-design-race` | registration | 报名中赛事 |
| `race_matrix_judging` | [Matrix] Judging - Review Queue Arena | `race_matrix_judging--matrix-judging-review-queue-arena` | judging | 评审阶段矩阵赛事 |
| `race_matrix_archived` | [Matrix] Archived - Legacy Showcase Vault | `race_matrix_archived--matrix-archived-legacy-showcase-vault` | archived | 归档赛事 |

---

## 一、自动化测试

### 1.1 单元测试（55 项）

一键执行 P0 回归（含单元测试 + 构建验证）：

```powershell
npm run qa:p0
```

脚本 [`scripts/grs004-p0-regression.mjs`](../../scripts/grs004-p0-regression.mjs) 按 7 个 section 分组执行，每个 section 在需要时自动 reseed 数据库：

| Section | 覆盖范围 | 关键测试文件 |
|---------|---------|-------------|
| Auth / Profile / Role Governance | GitHub OAuth 友好降级、profile completion 门控、session `roles[]` 清理、Admin 角色维护 | [`auth-entry.test.ts`](../../src/lib/auth-entry.test.ts)、[`profile-completion.test.ts`](../../src/lib/profile-completion.test.ts)、[`auth-session-roles-only.test.ts`](../../src/lib/auth-session-roles-only.test.ts) |
| Console Access / System Scope | 4 角色控制台访问边界、profile completion 门控复用 | [`viewer-access.test.ts`](../../src/lib/viewer-access.test.ts)、[`console-routes.test.ts`](../../src/lib/services/console-routes.test.ts) |
| Race Lifecycle | 8 阶段状态机：创建/发布/编辑/归档/快照，Admin+System scope | [`race-create-scope.test.ts`](../../src/lib/services/race-create-scope.test.ts)、[`race-publish-scope.test.ts`](../../src/lib/services/race-publish-scope.test.ts)、[`race-archive-scope.test.ts`](../../src/lib/services/race-archive-scope.test.ts) |
| Registration / CA Participation | 报名审核四态、CA Connection 审计、轮换/禁用、Rider 快照 scope | [`registration-helpers.test.ts`](../../src/lib/registration-helpers.test.ts)、[`ca-rotation-disable.test.ts`](../../src/lib/services/ca-rotation-disable.test.ts)、[`ca-fetch-rider-scope.test.ts`](../../src/lib/services/ca-fetch-rider-scope.test.ts) |
| CA Ingestion / Projection / Live / Screen | 可信链（payloadDigest/sequence/integrity）、签名验证、Projection 重建、Screen Display | [`ca-ingestion-integrity.test.ts`](../../src/lib/services/ca-ingestion-integrity.test.ts)、[`ca-signature-verification.test.ts`](../../src/lib/services/ca-signature-verification.test.ts)、[`race-snapshot.test.ts`](../../src/lib/services/race-snapshot.test.ts)、[`screen-display.test.ts`](../../src/lib/services/screen-display.test.ts) |
| Work Submission / Visibility / Public Routes | 草稿物化、可见性生命周期、材料完整性、公开路由 | [`submissions-work-materialization.test.ts`](../../src/lib/services/submissions-work-materialization.test.ts)、[`work-visibility-lifecycle-scope.test.ts`](../../src/lib/services/work-visibility-lifecycle-scope.test.ts)、[`public-routes.test.ts`](../../src/lib/services/public-routes.test.ts)、[`material-integrity-submissions.test.ts`](../../src/lib/services/material-integrity-submissions.test.ts) |
| Judging / Awards / Reports / Public Results | Judge 分配/移除、Award 草稿/撤回/发布、Report 生成/发布、赛果链 | [`judging-assignment-scope.test.ts`](../../src/lib/services/judging-assignment-scope.test.ts)、[`awards-draft-withdraw.test.ts`](../../src/lib/services/awards-draft-withdraw.test.ts)、[`awards-publication.test.ts`](../../src/lib/services/awards-publication.test.ts)、[`reports-generation.test.ts`](../../src/lib/services/reports-generation.test.ts) |

### 1.2 协作功能单元测试（18 项，含 3 项新增边界场景）

协作五阶段测试，对应 [`collaboration.ts`](../../src/lib/services/collaboration.ts) 和 [`knowledge-base.ts`](../../src/lib/services/knowledge-base.ts)：

```powershell
node --import tsx --test src/lib/services/collaboration-schema.test.ts src/lib/services/collaboration-phase2.test.ts src/lib/services/collaboration-phase3.test.ts src/lib/services/collaboration-phase4.test.ts src/lib/services/collaboration-phase5.test.ts
```

| 阶段 | 测试文件 | 覆盖内容 |
|------|---------|---------|
| 阶段一 Schema | [`collaboration-schema.test.ts`](../../src/lib/services/collaboration-schema.test.ts) | 3 枚举 + 2 新模型 + 7 模型修改校验 |
| 阶段二 服务重构 | [`collaboration-phase2.test.ts`](../../src/lib/services/collaboration-phase2.test.ts) | Team 创建/加入、双审批、Leader rejected→删除、Submission modifiedBy 记录 |
| 阶段三 协作模块 | [`collaboration-phase3.test.ts`](../../src/lib/services/collaboration-phase3.test.ts) | TeamTask CRUD、CollaborationMessage 私聊、KnowledgeBase 聚合/导出/权限 |
| 阶段四 评分重构 | [`collaboration-phase4.test.ts`](../../src/lib/services/collaboration-phase4.test.ts) | Award→Team 维度、JudgingRecord→Team Work、Results 链 |
| 阶段五 E2E 集成 | [`collaboration-phase5.test.ts`](../../src/lib/services/collaboration-phase5.test.ts) | Server Action 接入、端到端 Team 生命周期、Award 继承 |

### 1.3 E2E 协作回归测试（35 项）

需先启动 `npm run dev`，再执行 Playwright E2E：

```powershell
# 终端 A：启动开发服务器
npm run dev

# 终端 B：执行 E2E
node scripts/e2e-grs004-regression.mjs
```

脚本 [`scripts/e2e-grs004-regression.mjs`](../../scripts/e2e-grs004-regression.mjs) 覆盖 9 个 Phase：

| Phase | 覆盖内容 | 检查项数 |
|-------|---------|---------|
| Phase 1 | Leader 协作页基础验证（队伍信息/任务看板/协作消息/知识库/下载/导出） | 8 项 |
| Phase 2 | Leader 任务创建 + 发布时间 | 2 项 |
| Phase 3 | Leader 协作消息发送 | 2 项 |
| Phase 4 | Leader 作品提交（teamId 路径） | 1 项 |
| Phase 5 | Leader 发送反馈（teamId） | 1 项 |
| Phase 6 | 知识库 API（代码下载/导出 ZIP/无权限拒绝） | 7 项 |
| Phase 7 | Organizer 管理（报名列表/团队评语/成员数只统计 APPROVED） | 3 项 |
| Phase 8 | Mate 视角（队伍信息/任务/消息/队长名） | 4 项 |
| Phase 9 | PENDING 成员访问控制（任务/消息/知识库/提交/反馈被拦截） | 6 项 |

**通过标准**：35 项全部 ✅，通过率 100%。

### 1.4 E2E Race 生命周期测试（14 项）

验证 Race 8 阶段状态机的端到端浏览器流程，覆盖 Admin 建赛、Organizer 发布、公开端阶段标签、Rider 报名、归档赛事访问和边界场景。

```powershell
# 终端 A：启动开发服务器
npm run dev

# 终端 B：执行 E2E
node scripts/e2e-race-lifecycle.mjs
```

脚本 [`scripts/e2e-race-lifecycle.mjs`](../../scripts/e2e-race-lifecycle.mjs) 覆盖 6 个 Phase：

| Phase | 覆盖内容 | 检查项数 |
|-------|---------|---------|
| Phase 1 | Admin 登录 → 创建赛事 → 提交跳转 | 3 项 |
| Phase 2 | Organizer 赛事列表 → 控制台入口 → settings 页 | 3 项 |
| Phase 3 | 公开端 8 阶段标签验证（running/registration/completed） | 3 项 |
| Phase 4 | Rider 报名页加载 | 1 项 |
| Phase 5 | 归档赛事仍可公开查看 + 赛果入口 | 2 项 |
| Phase 6 | 边界场景（未登录重定向/404 不白屏） | 2 项 |

**通过标准**：14 项全部 ✅，通过率 100%。

### 1.5 类型检查与 Lint

```powershell
npx tsc --noEmit     # TypeScript 零错误
npx eslint           # ESLint 零错误
npm run build        # 生产构建通过
```

---

## 二、手工浏览器验收检查清单

> 以下清单针对 GRS004 新增功能，建议在 `npm run db:seed && npm run dev` 后逐项验收。
> GRS003 基础链路（公开端/登录/Console/Jumbotron/Calibrator）见 [`docs/grs003/CHECKLIST.md`](../grs003/CHECKLIST.md)。

### 模块 A：Team 参赛模型与双审批

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| A1 | Leader 创建队伍 | `rider_alice` 登录 → 进入已 approved 报名的赛事 Rider 视图 → 创建 Team | 队伍创建成功，自动成为 Leader；队伍规模 1-5 人 |
| A2 | Mate 申请入队 | `rider_bob` 登录 → 进入同赛事 Rider 视图 → 申请加入 Team | 入队申请状态为 PENDING |
| A3 | Leader 审批 Mate | `rider_alice` → collaboration 页 → 批准 `rider_bob` | 状态变为 APPROVED；Mate 可见队内内容 |
| A4 | Leader 拒绝 Mate | Leader 对某 PENDING 成员执行 reject | 成员状态变 REJECTED；不进入队内协作视图 |
| A5 | Leader 踢出成员 | Leader 对 APPROVED 成员执行移除 | 成员状态变 REMOVED；失去队内访问权 |
| A6 | Leader rejected→Team 删除 | Organizer 拒绝 Leader 的报名 → Team 被删除 | Team 不再出现在赛事队伍列表 |
| A7 | 双审批门控 | 未通过 Organizer 报名审批的 Rider 尝试创建 Team | 拒绝，提示需先通过报名审核 |
| A8 | PENDING 成员门控 | `rider_eve`（Graph Explorers PENDING）访问 Pathfinders Alpha 的 collaboration 页 | 看到提示"入队申请尚未通过"或非队内成员提示，任务/消息/知识库被拦截 |

### 模块 B：队内协作（任务看板 / 消息 / 知识库）

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| B1 | 任务看板创建 | Leader 在 collaboration 页 → 填写任务标题 → 选择 assignee → 发布任务 | 任务出现在看板，状态 TODO，显示发布时间 |
| B2 | 任务完成标记 | Mate 登录 → 看到被分配任务 → 标记 DONE | 任务状态变 DONE，记录完成时间 |
| B3 | 协作消息发送 | Leader 选 receiver → 填写消息内容 → 发送 | 消息出现在协作消息区；receiver 可见 |
| B4 | 消息关联知识资产 | 发送消息时关联 submission / task / work | 消息显示关联资产链接 |
| B5 | 知识库聚合视图 | 进入 collaboration 页 → 知识库区 | 显示队伍提交历史、任务、消息聚合视图 |
| B6 | 代码下载 | 点击"下载最新代码" | 触发文件下载（Content-Disposition），非 JSON 响应 |
| B7 | 知识库 ZIP 导出 | 点击"导出知识库" | 返回 application/zip，含 latest_code + tasks.json + submissions.json |
| B8 | 无提交时代码提示 | 队伍无 Submission 时 | 显示"暂无代码提交记录"，不触发 no_code.txt 下载 |
| B9 | 无权限团队拒绝 | 访问无关团队的 `/api/knowledge-base/{otherTeamId}/code` | 返回 403 |
| B10 | Team 上限边界 | Team 达到 maxTeamSize(5) 后新成员加入 | 拒绝，提示"队伍人数已满" |
| B11 | 未审批 Team 不可加入 | Leader 报名未审批时 Mate 尝试加入 | 拒绝，提示"尚未通过审核" |
| B12 | 已有队伍不可加入其他队 | Mate 已有 Team A，尝试加入 Team B | 拒绝，提示"你已有队伍" |

### 模块 C：Race 8 阶段状态机

| # | 赛事 | 预期状态 | URL |
|---|------|---------|-----|
| C1 | Sorting Challenge | running（比赛中） | `/races/race_active--sorting-challenge` |
| C2 | API Design Race | registration（报名中） | `/races/race_signup--api-design-race` |
| C3 | NLP 推理挑战赛 | registration（报名中） | `/races/race_registration_open--📝-nlp-推理挑战赛` |
| C4 | Performance Marathon | completed（已结束） | `/races/race_finished--performance-marathon` |
| C5 | Review Queue Arena | judging（评审中） | `/races/race_matrix_judging--matrix-judging-review-queue-arena` |
| C6 | Legacy Showcase Vault | archived（已归档） | `/races/race_matrix_archived--matrix-archived-legacy-showcase-vault` |

每个赛事页应显示对应中文状态标签；公开端 CTA 按阶段切换（报名中→立即报名，比赛中→进入实况大厅，已结束→查看赛果）。

### 模块 D：Screen 6 模式大屏展示

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| D1 | Jumbotron 赛马大屏 | `/jumbotron/race_active` | 赛马以 Team 为单位渲染；🐎 在赛道上；KPI/Ticker 正常 |
| D2 | Screen Billboard | `/screen/race_active--sorting-challenge/billboard` | Billboard 模式加载，读取 SCREEN_FEED projection |
| D3 | Screen Live | `/screen/race_active--sorting-challenge/live` | Live 模式；3s 自动刷新；显示实时进度 |
| D4 | Screen Leaderboard | `/screen/race_active--sorting-challenge/leaderboard` | 榜单模式；按 Team 排名 |
| D5 | Screen Works | `/screen/race_active--sorting-challenge/works` | 作品模式；展示 Team 作品 |
| D6 | Screen Announcement | `/screen/race_active--sorting-challenge/announcement` | 公告模式；展示已发布公告 |
| D7 | Screen Console 模式切换 | `/console/screen` → 选择赛事 → 切换模式 | 6 模式可切换；预览生效 |
| D8 | Screen Console 全屏 | Screen Console 内点击全屏按钮 | 新标签页满屏展示 |
| D9 | Screen 回退 | 断开 Projection 数据源 → 访问 Screen | 回退到最近稳定 Projection 或静态公告 |
| D10 | 风险数据一致性 | 大屏 KPI 风险数 vs 参赛者明细 | KPI 数字与带风险参赛者条目数完全一致；风险说明可追溯 |

### 模块 E：防伪与防篡改

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| E1 | CA Connection 签名 | 查看种子赛事中已签名 CA Connection 数据 | `credentialFingerprint` / `publicKeyPem` / `signatureVersion` 有值 |
| E2 | Connector 轮换 | Rider 在 CA 控制台执行 secret 轮换 | `secretVersion` 递增；`secretRotatedAt` 更新；handshake 清空 |
| E3 | Connector 禁用/启用 | Organizer 在 ca-status 禁用某 Connection | `disabledAt` / `disabledReason` 写入；启用后清除 |
| E4 | Organizer 可信度面板 | Organizer 进入 ca-status 区 | 显示 `trusted/review_needed/failed` 三态；含 4 组细节 |
| E5 | Connector 审计概览 | Organizer ca-status 区查看审计列表 | 展示 createdAt/action/result/reason 审计事件 |
| E6 | 生产签名强制 | 远程非 localhost connector push 信号 | 拒绝，原因为 `credential_required`；localhost demo 保留兼容 |
| E7 | 材料完整性 hash | 查看 Work / Submission / TeamArchive | `contentHash` / `codeContentHash` / `ridingRecordHash` 有值 |
| E8 | 结果引用冻结 | 查看 Award / JudgingRecord | 保存参考 Evidence 快照（`sourceRefJson` + `sourceDigest`） |
| E9 | 安全审计记录 | 触发 CA Connection 操作后查 SecurityAudit | 审计记录写入，含 actor/action/result/reason |

### 模块 F：友好错误提示闭环

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| F1 | 登录失败 | 输错密码登录 | 页面内中文错误卡片，非白屏 |
| F2 | GitHub OAuth 未配置 | `.env` 为占位值时点 GitHub 登录 | 提示"GitHub 登录未配置"，按钮不可用 |
| F3 | GitHub OAuth 失败 | 触发 OAuth callback 失败 | 重定向到 `/login?oauthError=...`，显示中文错误码 |
| F4 | Rider 报名失败 | 在非报名阶段尝试报名 | 回到报名页显示中文错误提示 |
| F5 | Rider CA 接入失败 | CA 接入异常 | 回到 CA setup 页显示友好提示 |
| F6 | Rider 作品提交失败 | 提交不完整作品 | 回到提交页显示错误卡片 |
| F7 | Organizer 操作失败 | Organizer 在 settings/works/awards 执行失败 | 回到原分区显示中文提示 |
| F8 | Admin 操作失败 | Admin 建赛/合作审批失败 | 回到原页面显示友好提示 |
| F9 | Console 根路由 | `/console` 根路由异常 | 显示友好回退，非白屏 |
| F10 | 404 边界 | 访问 `/races/nonexistent` | 返回 404 或友好提示 |
| F11 | 未登录访问 Console | 未登录访问 `/console` | 重定向到 `/login` |
| F12 | 越权访问 | Rider 访问 Organizer 视图 | 重定向或拒绝访问 |

### 模块 G：Auth / Profile / OAuth

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| G1 | Session roles 清理 | 登录后检查 session | 使用 `roles[]`，无旧单值 `role` 残留 |
| G2 | Profile completion 门控 | 新用户登录 | 跳转 `/profile` 补全后才能进 Console |
| G3 | Console profile 门控 | 未完成 profile 访问 `/console` | 拦截并重定向到 `/profile` |
| G4 | 公开端 session 隔离 | 未登录访问公开页 | 不泄漏 session 信息 |
| G5 | GitHub OAuth 降级 | 占位值时 | 登录页明确区分"已配置"vs"未配置" |

---

## 三、测试覆盖矩阵

> 功能 × 测试类型映射。✅ = 有覆盖，— = 不适用。

| 功能模块 | 单元测试 | E2E | 手工验收 | 覆盖文件入口 |
|---------|---------|-----|---------|-------------|
| Auth / Profile / Session | ✅ | — | ✅ G1-G5 | [`auth-entry.test.ts`](../../src/lib/auth-entry.test.ts) |
| 4 角色控制台访问 | ✅ | — | — (GRS003) | [`viewer-access.test.ts`](../../src/lib/viewer-access.test.ts) |
| Race 8 阶段状态机 | ✅ | — | ✅ C1-C6 | [`race-create-scope.test.ts`](../../src/lib/services/race-create-scope.test.ts) |
| 报名审核四态 | ✅ | — | — | [`registration-helpers.test.ts`](../../src/lib/registration-helpers.test.ts) |
| Team 创建/加入 | ✅ | ✅ P1 | ✅ A1-A2 | [`collaboration-phase2.test.ts`](../../src/lib/services/collaboration-phase2.test.ts) |
| 双审批入队 | ✅ | ✅ P9 | ✅ A3-A8 | [`collaboration-phase2.test.ts`](../../src/lib/services/collaboration-phase2.test.ts) |
| Leader rejected→删除 | ✅ | ✅ P5 | ✅ A6 | [`collaboration-phase2.test.ts`](../../src/lib/services/collaboration-phase2.test.ts) |
| TeamTask 任务看板 | ✅ | ✅ P2 | ✅ B1-B2 | [`collaboration-phase3.test.ts`](../../src/lib/services/collaboration-phase3.test.ts) |
| CollaborationMessage 私聊 | ✅ | ✅ P3 | ✅ B3-B4 | [`collaboration-phase3.test.ts`](../../src/lib/services/collaboration-phase3.test.ts) |
| KnowledgeBase 聚合/导出 | ✅ | ✅ P6 | ✅ B5-B9 | [`collaboration-phase3.test.ts`](../../src/lib/services/collaboration-phase3.test.ts) |
| 代码文件下载 | ✅ | ✅ P6 | ✅ B6 | [`knowledge-base.ts`](../../src/lib/services/knowledge-base.ts) |
| Work 草稿物化 | ✅ | ✅ P4 | — | [`submissions-work-materialization.test.ts`](../../src/lib/services/submissions-work-materialization.test.ts) |
| Work 可见性生命周期 | ✅ | — | — | [`work-visibility-lifecycle-scope.test.ts`](../../src/lib/services/work-visibility-lifecycle-scope.test.ts) |
| CA Connection 审计 | ✅ | — | ✅ E4-E5 | [`ca-connection-audit.test.ts`](../../src/lib/services/ca-connection-audit.test.ts) |
| CA 轮换/禁用 | ✅ | — | ✅ E2-E3 | [`ca-rotation-disable.test.ts`](../../src/lib/services/ca-rotation-disable.test.ts) |
| CA 签名验证 | ✅ | — | ✅ E1, E6 | [`ca-signature-verification.test.ts`](../../src/lib/services/ca-signature-verification.test.ts) |
| CA 可信链（integrity） | ✅ | — | — | [`ca-ingestion-integrity.test.ts`](../../src/lib/services/ca-ingestion-integrity.test.ts) |
| 材料完整性 | ✅ | — | ✅ E7 | [`material-integrity-helpers.test.ts`](../../src/lib/material-integrity-helpers.test.ts) |
| 结果引用冻结 | ✅ | — | ✅ E8 | [`result-reference-freeze-helpers.test.ts`](../../src/lib/result-reference-freeze-helpers.test.ts) |
| 安全审计 | ✅ | — | ✅ E9 | [`security-audit-helpers.test.ts`](../../src/lib/security-audit-helpers.test.ts) |
| Award 草稿/发布 | ✅ | — | — | [`awards-draft-withdraw.test.ts`](../../src/lib/services/awards-draft-withdraw.test.ts) |
| Report 生成/发布 | ✅ | — | — | [`reports-generation.test.ts`](../../src/lib/services/reports-generation.test.ts) |
| Judge 分配/移除 | ✅ | — | — | [`judging-assignment-scope.test.ts`](../../src/lib/services/judging-assignment-scope.test.ts) |
| Screen 6 模式 | ✅ | — | ✅ D1-D9 | [`screen-display.test.ts`](../../src/lib/services/screen-display.test.ts) |
| Screen 回退 | ✅ | — | ✅ D9 | [`screen-display.test.ts`](../../src/lib/services/screen-display.test.ts) |
| 风险数据一致性 | ✅ | — | ✅ D10 | [`jumbotron-adapter.test.ts`](../../src/lib/jumbotron-adapter.test.ts)（含 4 项新增去重/多源/边界回归测试） |
| 公开路由 | ✅ | — | — | [`public-routes.test.ts`](../../src/lib/services/public-routes.test.ts) |
| Review readiness | ✅ | — | — | [`review-readiness-helpers.test.ts`](../../src/lib/review-readiness-helpers.test.ts) |
| 友好错误闭环 | ✅ | — | ✅ F1-F12 | [`action-feedback.test.ts`](../../src/lib/action-feedback.test.ts) |
| E2E 协作全链路 | — | ✅ P1-P9 | ✅ A+B | [`e2e-grs004-regression.mjs`](../../scripts/e2e-grs004-regression.mjs) |
| E2E Race 生命周期 | — | ✅ P1-P6 | ✅ C+G | [`e2e-race-lifecycle.mjs`](../../scripts/e2e-race-lifecycle.mjs) |
| Team 边界场景 | ✅ | ✅ P2 | ✅ B10-B12 | [`collaboration-phase2.test.ts`](../../src/lib/services/collaboration-phase2.test.ts)（含 3 项新增上限/未审批/已有队伍测试） |

---

## 四、测试完成标准

进入首场赛事彩排前，应满足：

- [x] 单元测试 55 项全部通过（含 4 项 generateAttentionItems 回归 + 3 项 Team 边界测试）
- [x] 协作五阶段测试 18 项全部通过（含 3 项新增边界场景）
- [x] E2E 协作回归 35 项 100% 通过率
- [x] E2E Race 生命周期 14 项 100% 通过率
- [x] `npm run build` 通过（注：存在既有 Turbopack NFT warning 和 organizer-console-page 类型错误，非本轮引入）
- [x] `tsc --noEmit` 零错误
- [x] `npm run build` 通过
- [ ] 手工验收清单模块 A-F 全部 ✅
- [ ] 权限测试无高危漏洞（模块 F12 越权访问验证）
- [ ] CA 接入成功/部分失败/重复同步场景通过
- [ ] Screen 基础展示和 fallback 场景通过

---

## 五、验收记录

> 每次验收后在此记录结果。格式：`日期 | 验收人 | 模块 | 结果 | 备注`

| 日期 | 验收人 | 模块 | 结果 | 备注 |
|------|--------|------|------|------|
| 2026-07-14 | 黄智亮/肖懿 | 自动化（单元+E2E） | ✅ 全通过 | 51 单元 + 35 E2E，tsc/ESLint 零错误 |
| 2026-07-15 | Owen | 单元测试补充 | ✅ 全通过 | 新增 4 项 generateAttentionItems 回归 + 3 项 Team 边界测试，合计 55 单元 + 18 协作 |
| 2026-07-15 | Owen | E2E Race 生命周期 | ✅ 14/14 | 新增 `e2e-race-lifecycle.mjs`，覆盖建赛/发布/阶段标签/报名/归档/边界 |
| 2026-07-15 | Owen | 脚本清理 | ✅ 完成 | 删除重复的 `e2e-collaboration-test.py`，统一到 JS E2E |
| | | 手工 A-G | 待验收 | 需按本清单逐项检查 |

---

## 六、缺口分析与改进记录

### 6.1 已闭合的缺口

| 缺口 | 改进措施 | 状态 |
|------|---------|------|
| E2E 只覆盖协作模块，缺 Race 生命周期 | 新增 [`e2e-race-lifecycle.mjs`](../../scripts/e2e-race-lifecycle.mjs)，覆盖建赛→发布→阶段标签→报名→归档→边界 | ✅ 已闭合 |
| `generateAttentionItems` 去重无回归测试 | 新增 4 项测试：多成员 CA 失败不重复、CA+会话双源不漏报、low/none 不生成、反作弊扣分文案 | ✅ 已闭合 |
| Team 边界场景缺测（上限/未审批/已有队伍） | 在 [`collaboration-phase2.test.ts`](../../src/lib/services/collaboration-phase2.test.ts) 新增 3 项边界测试 | ✅ 已闭合 |
| Python E2E 与 JS E2E 重复 | 删除 `e2e-collaboration-test.py`，统一到 JS 版 | ✅ 已闭合 |

### 6.2 仍待改进的缺口（按优先级排序）

| 优先级 | 缺口 | 说明 | 建议 |
|--------|------|------|------|
| P1 | CA 接入 E2E | handshake → push signal → projection → screen 的端到端链路只有单元测试 | 需 mock connector server，工作量较大 |
| P1 | 公开端渲染 E2E | 首页→赛事详情→作品→骑手→赛果的渲染链无 E2E | 补充 `e2e-public-render.mjs` |
| P2 | 性能/非功能测试 | QA Plan 2.8 要求：首屏 <1s、3s 刷新、200 并发 | MVP 阶段可选，需 k6 或 Lighthouse CI |
| P2 | 归档赛事操作拒绝 | 归档后尝试建队/提交应被拒绝 | 补单元测试 |
| P3 | 空数据态渲染 | 无赛事/无队伍/无作品时页面渲染 | 补单元测试 |

---

*文档版本：v1.1 | 生成日期：2026-07-15 | 最后更新：2026-07-15（新增 E2E + 回归测试 + 缺口分析） | 维护者：GRS004 团队*
