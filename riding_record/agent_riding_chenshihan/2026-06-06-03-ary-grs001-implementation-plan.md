# 2026-06-06 计划摘抄 03：ARY GRS 001 实现计划

来源：

- `plan/implementation-plan.md`

类型：

- 产品/PoC 总体实现计划

目标：

- 做出一个可运行的 ARY GRS 001 PoC，证明：
  - Organizer 可以发起赛事
  - 关键私有评测资产留在 Organizer 侧
  - ARY 只保留必要元数据与公开投影
  - Participant / Audience 可以跑通完整体验
  - Runner 可以通过 API 完成拉任务和回分

总体架构选择：

- 采用单体 `Next.js` Web PoC，而不是多服务拆分
- 页面、API、业务状态、Runner 接口先落在一个仓库里
- 数据库使用 SQLite

这样做的原因：

- 开发快，适合快速验证闭环
- 更容易控制“哪些数据该持久化、哪些不该持久化”
- Runner 协议可以先稳定下来，后续再拆服务

数据被分成三层：

## 1. Public Projection

- 公开赛事信息
- 榜单
- 赛后展示

## 2. Process Metadata

- 用户
- 队伍
- 报名
- 通知
- 反馈
- 任务状态

## 3. Private Artifacts

- 提交代码
- Riding Record
- Organizer 测试代码

其中：

- Organizer 私有评测逻辑不进 ARY
- Rider 原始提交只在 ARY 临时中转

计划中的主要模块：

- Web 页面
  - 首页 / 赛事列表
  - 赛事详情
  - Organizer 控制台
  - Participant 控制台
  - Public 榜单 / 展示页
  - 登录 / 注册页
- API 模块
  - `auth`
  - `races`
  - `teams`
  - `registrations`
  - `submissions`
  - `feedback`
  - `notifications`
  - `leaderboard`
  - `runner`
  - `exports`
- 领域服务
  - 比赛状态计算
  - 权限控制
  - 提交节流
  - 榜单更新
  - 展示投影
  - 临时文件清理

当时规划中的数据模型重点：

- `users`
- `races`
- `teams`
- `team_members`
- `submissions`
- `leaderboard_entries`
- `feedback_threads`
- `feedback_messages`
- `notifications`
- `post_race_showcases`

当时规划中的 Runner 协议重点：

- `GET /api/runner/tasks/pull`
- `POST /api/runner/tasks/result`

并且曾额外设想：

- `POST /api/runner/leaderboard/sync`

说明：

- 这份计划是更早期的高层实施计划
- 其中一些内容已经被后续真实实现替换或收缩
- 例如当前仓库真实 Runner 协议和 Harness 语义，应该以现有代码与 `organizer_demo/runner_doc/` 为准
