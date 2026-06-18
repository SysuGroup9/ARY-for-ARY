# ARY GRS 001 实现计划

## 1. 目标定义

实现一个可运行的 ARY GRS 001 PoC，重点证明：

- Organizer 可以发布赛事，但核心私有数据留在 Organizer 侧。
- ARY 只保存公开元数据、业务投影和必要的流程状态。
- Participant 和 Audience 能完整体验“发现赛事 -> 报名/参与 -> 查看进度/结果”的闭环。
- Runner 可以通过 API 与 ARY 协作完成任务拉取和结果回传。

## 2. 设计思路与 trade-offs

### 2.1 为什么选单体 Web PoC

推荐先实现一个 `Next.js` 单体应用，内含页面与 API：

- 页面层负责 Organizer / Participant / Audience 的交互。
- API 层负责报名、提交、反馈、通知、榜单、Runner 集成。
- SQLite 保存“允许持久化的数据投影”。
- 文件系统临时目录保存待评测文件。

这样做的收益：

- 开发速度快，容易把产品流程闭环。
- 更容易精确控制“哪些数据可以持久化，哪些不行”。
- Runner 的协议可以先稳定下来，后续再独立拆服务。

代价：

- 不是最终生产架构。
- 并发能力和扩展性一般。
- 真实去中心化仍然主要靠数据边界控制，而不是物理多部署。

### 2.2 关于“不持久化完整 Race 数据”的实现解释

建议把数据分成三层：

1. `Public Projection`
   - 公开赛事信息
   - 榜单
   - 赛后展示内容
   - 可长期持久化

2. `Process Metadata`
   - 用户、队伍、报名、通知、反馈、任务状态
   - 为了让流程可运行，允许持久化

3. `Private Artifacts`
   - 提交代码
   - Riding Record
   - Organizer 测试代码
   - 其中 Organizer 私有部分不进 ARY
   - Participant 提交的代码/记录只在 ARY 临时中转

这个划分能同时满足：

- 产品可运行
- 数据边界清晰
- PRD 的核心命题成立

## 3. 建议系统模块

### 3.1 Web 页面

- 首页 / 赛事列表页
- 赛事详情页
- Organizer 控制台
- Participant 控制台
- Public 榜单 / 赛后展示页
- 登录 / 注册页

### 3.2 API 模块

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

### 3.3 领域服务

- 比赛状态计算服务
- 权限与角色校验服务
- 提交节流服务
- 榜单更新服务
- 披露投影服务
- 临时文件清理服务

## 4. 建议数据模型

### 4.1 持久化表

- `users`
  - id, username, passwordHash, role, createdAt
- `races`
  - id, organizerId, title, summary, status fields, config json, createdAt
- `race_public_assets`
  - raceId, publicPromptText, publicTrainingMeta, displayOptions
- `teams`
  - id, raceId, captainId, name
- `team_members`
  - teamId, userId, displayName
- `registrations`
  - id, raceId, teamId, createdAt
- `submissions`
  - id, raceId, teamId, status, score, createdAt, pulledAt, finishedAt
- `leaderboard_entries`
  - id, raceId, teamId, totalScore, taskScore, tokenScore, dialogueScore, rank
- `feedback_threads`
  - id, raceId, teamId, status, createdAt
- `feedback_messages`
  - id, threadId, senderRole, senderId, content, createdAt
- `notifications`
  - id, raceId, targetType, targetId, title, body, createdAt, readAt
- `post_race_showcases`
  - id, raceId, kind, content, rankScope, createdAt

### 4.2 临时文件目录

- `work/runtime/submissions/{submissionId}/code.zip`
- `work/runtime/submissions/{submissionId}/riding-record.txt`

### 4.3 不落库的数据

- Organizer 测试代码
- Organizer 关键词配置的私有实现细节
- 未公开的原始题目数据
- 未公开的完整评测过程明细

## 5. 页面和能力映射

### 5.1 Organizer

- 创建赛事：
  - 基础信息
  - 时间设置
  - 评分模型
  - 赛后展示选项
  - 其他设置
- 反馈中心：
  - 查看队伍反馈
  - 回复
  - 标记 `resolved`
- 赛事维护：
  - 修改题目描述
  - 修改训练数据说明
  - 广播通知
- 赛后：
  - 发布评论
  - 查看最终榜单
  - 一键清除

### 5.2 Participant

- 浏览赛事列表
- 报名参赛
- 查看自己队伍信息
- 上传代码和 Riding Record
- 查看提交频率限制提示
- 查看实时榜单
- 发送反馈
- 查看 Organizer 通知

### 5.3 Audience

- 查看公开赛事列表
- 查看赛事详情
- 查看公开榜单
- 查看赛后披露内容

## 6. Runner API 设计

### 6.1 拉取任务

`GET /api/runner/tasks/pull`

返回：

- 尚未拉取的待评测任务
- 任务元数据
- 临时文件下载地址

### 6.2 回传结果

`POST /api/runner/tasks/result`

回传：

- submissionId
- score breakdown
- final score
- status
- optional comments

### 6.3 回传公开榜单快照

建议额外提供：

`POST /api/runner/leaderboard/sync`

原因：

- 这样可以把“Organizer 主动披露的公开投影”与“具体评测细节”分开。
- ARY 只接收公开榜单结果，不接收完整私有评测记录。

## 7. 验收映射

### 7.1 核心命题

- 创建赛事时，不上传 Organizer 测试代码到 ARY。
- Runner 只通过 API 拉取 Participant 提交物。
- ARY 数据库中不保存完整代码正文和完整 Riding 正文。
- Public 页面展示的内容全部来自 Organizer 配置或 Runner 公开回传。

### 7.2 功能项

- 赛事创建、报名、提交、反馈、通知、榜单、赛后展示都需要落成可点击流程。
- 提交频率限制必须在前后端都校验。
- 比赛状态必须由时间自动计算，不允许手工乱改。

### 7.3 文档项

- README
- API 说明
- 数据边界说明
- 已知限制说明

## 8. 分阶段执行计划

### Step 1

初始化项目：

- Next.js
- Tailwind
- Prisma + SQLite
- ESLint / TypeScript 基线

### Step 2

完成基础模型与通用能力：

- 数据库 schema
- 种子数据
- 认证与角色中间件
- 时间状态计算

### Step 3

完成 Organizer 核心页面和 API：

- 创建赛事
- 查看赛事
- 处理反馈
- 修改题目和训练数据
- 发布通知

### Step 4

完成 Participant / Audience 核心页面和 API：

- 浏览赛事
- 报名
- 提交
- 反馈
- 榜单查看

### Step 5

完成 Runner 集成：

- 拉取任务
- 回传结果
- 榜单同步
- 文件清理

### Step 6

完成赛后展示和清理：

- 完整排名
- 评论
- Riding highlight
- 公开题目/训练数据
- 一键清除

### Step 7

测试与文档：

- 自测核心流程
- 对照 PRD 验收
- 完成 README 与开发说明

## 9. 待确认事项

1. 是否确认以 `PRD(4).md` + 已读取到的 `PRD(5).md` 内容作为当前最终需求基线？
2. 是否接受 `Next.js + SQLite + Prisma` 作为 PoC 技术栈？
3. 是否接受“赛后下载文件由 Organizer 侧保存/导出，ARY 不长期保存代码与 Riding Record”的边界？
4. 是否接受先做 Web PoC，不做生产级鉴权与真实企业内网集成？

## 10. 确认后将立即执行的内容

- 脚手架初始化
- 数据模型设计
- 核心页面与 API 实现
- Runner 协议落地
- 文档同步
