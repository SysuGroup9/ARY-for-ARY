# ARY GRS 001 ROADMAP

## 任务背景

目标是把 `PRD.md` 中的 ARY 产品方案做成一个可运行演示，并且从“前端假状态 PoC”升级到“真实账号与真实数据库”的全栈版本。

## 当前实现方向

最终实现采用：

- Next.js 16 App Router
- Prisma 7
- SQLite
- Server Actions + API Routes

原因：

- 能快速落地真实注册登录和共享数据
- 仍然能严格控制 ARY 的数据边界
- 后续若需要改成 Postgres，只需要切 Prisma datasource 和部署方式

## 数据边界决策

ARY 持久化：

- 用户、赛事、队伍
- 反馈、通知
- 提交状态
- 公开榜单投影
- 最佳归档与赛后展示

ARY 不持久化：

- Organizer 私有评测代码
- Organizer 私有 Runner 逻辑
- 私有完整评测过程

折中实现：

- Rider 提交进入 ARY 数据库中的临时字段
- Runner 评分后，提交正文被清空
- 仅保留最佳归档用于赛后公开展示

## 当前能力

- 真实注册 / 登录
- Organizer 创建赛事
- Rider 报名参赛
- Rider 提交代码与 Riding Record
- Rider 与 Organizer 的反馈线程
- Runner 拉取任务与回传评分
- Organizer 同步公开榜单
- Organizer 发布赛后展示
- Audience 无登录浏览公开页面

## 临时部署策略

为了让临时域名也能真实写库：

- 构建阶段生成并填充 `prisma/dev.db`
- 运行时在生产环境把该数据库复制到 `/tmp/ary-runtime/runtime.db`
- 预览实例上的写入是真实 SQLite 写入，但不保证长期持久

## 已知限制

- 临时域名上的 SQLite 数据会随实例重建丢失
- 还没有接入 Postgres 等持久数据库
- 还没有接入真实外部 Agent API
- 目前 Runner 鉴权仍是简单 bearer token

## 迭代记录

### Iteration 0

- 阅读 PRD
- 产出实现计划与路线

### Iteration 1

- 接入 GitHub 组织仓库 `SysuGroup9/ARY-for-ARY`
- 完成前端 localStorage PoC
- 部署首个临时预览

### Iteration 2

- 用户指出注册登录是假的，只是 localStorage
- 决定整体重构为 Next.js + Prisma + SQLite

### Iteration 3

- 新建 Prisma schema 与鉴权基础能力
- 重写服务层：users / races / teams / submissions / feedback
- 新建首页、Server Actions、Runner API
- 加入 seed 数据与临时部署 SQLite 方案
- 完成 `tsc`、`lint`、`build` 验证

## 第二周修复计划（Jumbotron / Audience / Snapshot Truthfulness）

本轮不切换实现路线，继续沿用当前仓库中同学已落地的 snapshot-based Jumbotron：

- `src/app/jumbotron/[raceId]/page.tsx`
- `src/lib/services/race-snapshot.ts`
- `src/lib/jumbotron/adapter.ts`
- `src/app/jumbotron/[raceId]/JumbotronClient.tsx`

修复目标如下：

1. **首页改为 Audience 公开首页**
   - `/` 不再强制跳转 `/login`
   - Audience 无需登录即可浏览赛事与 Jumbotron 入口
   - `/login` 保持为独立登录页
   - 首页按比赛阶段分层展示：
     - 报名/准备阶段：展示赛事说明、报名信息、任务入口，不展示大屏
     - 进行中/封榜阶段：展示赛事说明、过程榜单与 Jumbotron 大屏
     - 已结束阶段：展示最终公开结果与 Organizer 允许披露的赛后内容

2. **Organizer 创建比赛补齐 Jumbotron / 展示选项**
   - 继续沿用当前 `CreateRaceForm` 风格
   - 补齐 Jumbotron 展示配置、底图/赛道资源选择、公开可见性等选项

3. **把纯文本命名改成真实按钮/链接**
   - 题目发布：提供真实链接或上传入口，而不是仅 `taskPackageLabel`
   - 参赛者提交：保留当前文本式提交，但增加清晰跳转/提交按钮
   - 大屏底图：提供真实选择/上传控件

4. **Jumbotron 位置改为真实进度值驱动**
   - 删除 adapter 中按 rank/time 伪造 `roundProgress` 的逻辑
   - 改为消费企业 Runner 返回的真实 progress 值

5. **活跃骑手排名按主动提交次数计算**
   - 基于 `Submission` 表统计每队主动提交次数
   - 在 Jumbotron 中独立展示，不与比赛总排名混淆

6. **修改比赛内容后清掉进度榜单 / snapshot**
   - 修改题目/训练数据后，清空 `LeaderboardEntry`
   - 删除 `public/assets/snapshots/<raceId>.json`
   - 防止大屏残留旧进度状态

7. **比赛结束后切换到最终评分榜单**
   - 比赛中展示 progress leaderboard
   - 比赛结束后展示 final scoring leaderboard
   - 不再延续 progress-only 的赛道语义

8. **清理当前 Jumbotron mock 痕迹**
   - 去掉 fake `rankDelta`
   - 去掉强制最后一名 stale
   - 去掉 fake/random messages
   - 去掉硬编码风险说明和 `currentPhase: "DEV"`

## 错误复盘

- 早期从旧 PoC 迁移时有编码损坏的中文文本混入新实现。
- 改进措施：不再从旧损坏文件复制中文字面量，所有中文文案重新手写并在最终构建前做人工检查。
