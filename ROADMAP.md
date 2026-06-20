# ARY GRS003 ROADMAP

## 任务背景

本轮目标聚焦在 GRS003 里我负责的两条主线：

- 把账号入口从本地用户名密码升级为 GitHub OAuth。
- 把真实 agent 接入从“文档与数据模型已就位、演示链路未闭环”推进到“可实际演示 handshake / signal / snapshot 的最小闭环”。

对应依据：

- `docs/grs003/ary-mvp.prd.md`
- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-ca-integration-spec.md`
- `docs/grs003/grs003-gap-analysis.md`

## 设计取舍

本轮采用“最小可交付闭环”策略，而不是一次性彻底重构：

- GitHub 登录优先做到真实可用，保留现有本地账号流作为开发兜底，避免 seed 与现有演示账号体系立即失效。
- 真实 agent 接入复用现有 `CAConnection`、handshake、signal、snapshot 服务层，不重写整套 ingest 模型。
- 旧 `Runner Pull` 链路本轮不删除，只降级为兼容层，避免影响现有提交/评分演示路径。
- 大屏控制台与赛事控制台继续分离，但先按现状把大屏能力收口为仅 `Admin` 可见；“企业能力”暂不新增角色，先由 `Admin` 代理，避免在角色模型尚未成型时继续把 Organizer 当成大屏默认用户。

原因：

- 作业演示更需要“可跑通的真实入口”，而不是大规模结构清理。
- 当前仓库已经有较完整的 CA 数据模型与 API 骨架，复用收益高。
- 彻底移除旧链路会波及提交、评分、大屏等多处，风险偏高。

## 计划拆分

### 1. GitHub OAuth 登录闭环

目标：

- 新增 GitHub 登录入口。
- 完成 OAuth state 校验、code exchange、用户查找/创建、JWT session 写入。
- 登录页以 GitHub 入口为主，本地账号入口降为开发模式说明。
- `.env.example` 和 README 补齐 GitHub OAuth 配置说明。

### 2. 真实 agent 接入闭环

目标：

- 修正 `CAConnection` 创建语义，避免手动创建时直接伪造握手完成。
- 为 Rider 控制台补充真实 connector 接入说明与快照同步入口。
- 提供一个仓库内可运行的 mock connector / real-agent demo 脚本，用于演示：
  - connector 暴露 snapshot 接口
  - 调用 ARY handshake API
  - 调用 ARY signals API 推送真实信号
  - 由 ARY 主动 fetch snapshot 完成闭环

### 3. 文档与协作留痕

目标：

- 新增本 ROADMAP，记录设计取舍与迭代。
- 补充一份本轮实现说明文档，覆盖环境变量、GitHub 登录配置、agent 演示步骤。
- README 补齐“如何演示 GitHub 登录 + 真实 agent 接入”。

## 已识别风险

- GitHub OAuth 依赖用户自行配置 GitHub App，仓库内只能提供配置说明与回调实现，不能提交真实密钥。
- 当前 Prisma `User` 模型仍保留本地密码字段，OAuth 用户需要兼容现有字段约束。
- `RacePhase` 仍是旧 5 状态体系，本轮只保证 agent 接入在当前状态机内可演示，不同时解决 5->8 状态迁移。
- Rider 控制台当前会直接展示 `connectorSecret`，这适合本地演示，但生产上不应长期这样暴露。
- 当前 GitHub OAuth 回调与本地 CA connector demo 目标都是“最小演示闭环”，尚未引入生产级审计、密钥轮换和 connector 注册编排。

## 迭代记录

### Iteration 1

- 克隆需求仓库与实现仓库。
- 对照 GRS003 文档与实现仓库差距分析，确认“接入 GitHub，真实 agent”具体指向：
  - GitHub OAuth 登录未接入
  - CA push/fetch 运行时闭环未完成
- 确认采用最小可交付闭环方案。

### Iteration 2

- 根据最新业务口径，确认赛事控制台与大屏控制台不是同一能力集合。
- 将大屏控制台从 Organizer 默认能力中移除，只保留 `Admin` 可见。
- 在协作文档中明确记录：企业能力尚未独立建模，当前由 `Admin` 代理大屏控制台权限；后续若要还原“企业可见”，应先补独立角色或能力模型，而不是重新放宽 Organizer 权限。

### Iteration 3

- 确认 GitHub OAuth 主链路代码已具备：登录 action、state cookie、GitHub callback、用户落库与 session 写入。
- README 已补齐 GitHub OAuth 的最小环境变量与本地配置说明。
- 新增 [`organizer_demo/ca_connector_demo/README.md`](ARY-for-ARY/organizer_demo/ca_connector_demo/README.md) 对应的最小 CA connector demo：
  - 独立 `package.json` / `tsconfig.json`
  - `.env.example`
  - ARY client / config / demo runtime
  - 本地 snapshot server + handshake + signal 推送
- 已恢复 Prisma client 生成产物，`src/generated/prisma` 可再次被应用构建链路解析。
- 本轮验收命令已通过：
  - `powershell -Command "$env:DATABASE_URL='file:./dev.db'; npm run db:generate"`
  - `npm --prefix organizer_demo/ca_connector_demo run typecheck`
  - `powershell -Command "$env:DATABASE_URL='file:./dev.db'; npm --prefix organizer_demo/ca_connector_demo run typecheck; npm run build"`
- 这一轮优先保证”可演示的真实接入闭环”，暂不扩展到生产级 connector SDK 或自动 snapshot 调度。

### Iteration 4（2026-06-20，Hrm-cell）

- 修复 `prisma db push` 环境问题：Schema 已包含全部 GRS003 领域模型（Registration/RaceProject/CAConnection/Work/Award/Evidence/Report/Projection），但数据库未同步。执行 `prisma db push` + `prisma generate` 后 Seed 和 Build 均通过。
- 修复 `admin-console-page.test.tsx` 中 15 个 TypeScript 错误（`as const` → `as AppRole[]`）。
- 删除断裂的 `prisma/backfill-registration-refs.ts`（该脚本期望旧模型已含 `registrationId` 字段，但 Schema migration 未执行）。
- **Race 状态机 5→8 升级**：
  - Prisma `Race` 模型新增 `status String?` 字段，显式存储 8 状态（draft/published/registration/running/submitting/judging/completed/archived）。
  - `race-phase.ts` 重写：优先读取显式 status，null 时 fallback 时间窗口推导，保留旧 5 状态兼容。
  - 新增 `isValidPhaseTransition()` 校验合法状态迁移。
  - Seed 数据三个赛事设置显式 status（running/registration/completed）。
- **Runner 主路径降级**：`submissions.ts` 中 `enqueueSubmissionTestTask` 和 `enqueueHarnessEvalTaskForArtifact` 调用注释掉，提交通路不再自动入 Runner 队列。CA Connector → JudgingRecord 成为主评分路径。
- **Console 权限验证**：确认 `console-routes.ts` 中 Organizer 按 `organizerId` 过滤、Rider 按 `registration` 过滤、Judge 按 `judgeAssignment` 过滤，权限已正确加固。
- **GitHub OAuth 验收**：验证 `github-oauth.ts` → callback route → login page 全链路完整，缺 GitHub App 配置时自动重定向到 `/login?oauthError=` 并显示中文提示。
- 最终验证：`npx tsc --noEmit` 零错误，`npm run build` 通过，`npm run db:seed` 生成 3 赛事 + 11 骑手 + Registration/RaceProject 数据。

### Iteration 5（2026-06-20，UI 全面重构）

- **设计系统升级**：新建 `DESIGN.md` 完整 8 节设计规范，参考 Vercel/Stripe/Linear 设计系统。`globals.css` 全面重写：新配色 token、多层阴影、统一间距/圆角体系。
- **全局字体放大 7-10%**：h1/h2/h3/body/按钮/badge 等全部微调。
- **低对比度修复**：console-shell 3 处 `color: var(--muted)`→`var(--muted-foreground)`，`--dark-muted` 0.65→0.75，placeholder opacity 提升。
- **7 个公开页面卡片化改造**：live-hall/results/review/works/work/rider-profile/race-register 全部从旧 `.panel` 迁移到 `.card` 系统。
- **布局溢出修复**：8 个页面补充 `<main>` 包裹，body/main 添加 overflow-x 防护，实况大厅 JumbotronInline 使用 `overflow:clip + contain:strict`。
- **首页优化**：骑手/合作列平衡、往届赛事用 muted 背景替代 opacity、section-dark 按钮自动适配、底部改为 Sysu-Group9 团队信息。
- **粒子背景**：`constellation`（光点+连线）和 `drift`（方块上升+点击波纹）两种模式，中央真空区保护内容。
- **企业办赛合作表单**：`CooperationRequest` 数据模型，完整赛事配置字段+文件上传，需登录才能提交。
- **控制台身份显示**：侧栏顶部显示用户名+角色标签（管理员/主办方/骑手/评委），9 个 ConsoleShell 调用点全部传递 user。
- **Jumbotron 状态修复**：adapter.ts 适配 GRS003 8 状态（running→LIVE，completed→FINISHED）。
- **赛事详情页**：进行中赛事新增"选手提交入口"按钮。
- **演示账号更新**：5 个清晰标签+角色展示。
- 验证：`npx tsc --noEmit` 零错误，`npm run build` 通过。
