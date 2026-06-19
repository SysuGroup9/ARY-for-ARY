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
- 这一轮优先保证“可演示的真实接入闭环”，暂不扩展到生产级 connector SDK 或自动 snapshot 调度。
