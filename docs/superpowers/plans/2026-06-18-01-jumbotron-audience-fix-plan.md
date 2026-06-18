# 2026-06-18 第二周修复执行计划

## 背景

当前仓库已经接入一套可运行的 Jumbotron：

- `src/app/jumbotron/[raceId]/page.tsx`
- `src/app/jumbotron/[raceId]/JumbotronClient.tsx`
- `src/lib/services/race-snapshot.ts`
- `src/lib/jumbotron/adapter.ts`

本轮不重做架构，而是在现有实现上把“公开访问、真实进度、真实入口、状态清理”这几件事收口。

## 本轮目标

1. 把首页改成公开 Audience 首页，登录页独立保留
2. 给 Organizer 创建比赛补齐 Jumbotron / 展示配置
3. 把题目包、提交入口、底图选择从“纯文本命名”改为真实按钮/链接/控件
4. 让 Jumbotron 赛马位置使用真实 progress，而不是按 rank/time 伪造
5. 让活跃骑手排名按主动提交次数计算
6. 修改比赛内容后清空 progress leaderboard 与 snapshot
7. 比赛结束后切换到最终评分榜单
8. 清理当前 mock Jumbotron 痕迹并同步文档

## 执行顺序

### Step 1：首页改为公开入口

关键文件：

- `src/app/page.tsx`
- `src/lib/viewer-access.ts`
- `src/app/audience/page.tsx`
- `src/app/_components/ary-shared.tsx`

预期结果：

- 匿名用户访问 `/` 不再跳转 `/login`
- 首页可浏览公开赛事、公开说明和 Jumbotron 入口
- 登录入口保留在 `/login`
- 已登录用户仍能进入各自角色操作区

### Step 2：补齐创建比赛时的展示选项

关键文件：

- `src/app/_components/ary-shared.tsx`
- `src/lib/services/races.ts`
- `src/lib/validation.ts`
- `prisma/schema.prisma`（若当前字段不够）

预期结果：

- Organizer 能在创建比赛时配置 Jumbotron / Audience 展示相关项
- 底图/赛道资源可以被真实选择
- 题目包不是只显示 label，而是有真实入口

### Step 3：替换 mock progress 为真实 progress

关键文件：

- `src/lib/services/race-snapshot.ts`
- `src/lib/jumbotron/adapter.ts`
- `src/lib/services/runner.ts`
- `src/app/jumbotron/[raceId]/JumbotronClient.tsx`

预期结果：

- snapshot 中包含真实 progress 数据
- `adapter.ts` 删除基于 rank/time 的 `roundProgress` 伪造逻辑
- 大屏马匹位置直接反映真实 progress

### Step 4：活跃骑手排名按主动提交次数

关键文件：

- `src/lib/services/race-snapshot.ts`
- `src/lib/jumbotron/adapter.ts`
- `src/app/jumbotron/[raceId]/JumbotronClient.tsx`
- `Submission` 相关服务

预期结果：

- 每队 submission count 可统计
- 大屏单独展示活跃骑手维度
- 该维度不混入总榜排名

### Step 5：清理比赛内容修改后的旧投影

关键文件：

- `src/lib/services/races.ts`
- `src/app/actions.ts`
- `src/lib/services/race-snapshot.ts`

预期结果：

- 修改题目/训练数据后自动清掉旧 progress 投影
- 删除对应 snapshot 文件
- 避免旧数据继续出现在大屏

### Step 6：比赛结束后切换最终榜单

关键文件：

- `src/lib/services/race-snapshot.ts`
- `src/lib/jumbotron/adapter.ts`
- 相关 leaderboard / archive 服务

预期结果：

- 比赛中显示 progress leaderboard
- 比赛结束后显示 final scoring leaderboard
- 赛后页面语义与数据来源一致

### Step 7：清理 mock 痕迹并同步文档

重点清理：

- fake `rankDelta`
- 强制最后一名 `stale`
- fake/random messages
- mock `currentPhase: "DEV"`
- 硬编码风险提示

同步文档：

- `docs/grs001/ROADMAP.md`
- `plan/implementation-plan.md`
- 其他写了旧逻辑的演示文档

## 验收

### 公开访问

- 登出访问 `/`
- 确认不跳 `/login`
- 确认公开赛事和 Jumbotron 入口可见

### 创建比赛

- Organizer 登录创建比赛
- 确认看到 Jumbotron / 展示配置
- 确认任务包和底图是可操作控件，不是纯文本

### 大屏真实性

- 制造不同真实 progress
- 生成 snapshot
- 打开 `/jumbotron/[raceId]`
- 确认马匹位置跟随真实 progress 变化

### 活跃骑手

- 制造不同 submission 次数
- 重新生成 snapshot
- 确认按主动提交次数排序

### 状态清理

- 修改比赛内容
- 确认 `LeaderboardEntry` 被清空
- 确认 snapshot 被删除或重建

### 比赛结束

- 模拟比赛结束
- 确认榜单切换为最终评分来源
