# ARY for ARY

这是一个基于 `Next.js + Prisma + SQLite` 的 ARY GRS 001 全栈 PoC。

当前仓库已经实现：

- Organizer / Rider 真实账号与 Cookie Session
- 赛事创建、组队报名、代码提交、反馈、通知
- Runner 任务拉取与结果回传 API
- 位于 `organizer_demo/runner_demo` 的 Organizer 私有排序评测 Runner
- 公开榜单与 Audience 视图

## 技术栈

- Next.js 16 App Router
- TypeScript
- Prisma 7
- SQLite
- Zod
- bcryptjs
- jose

## 演示视频

- [GRS_001 完整演示](https://www.bilibili.com/video/BV1qdEs62Egz/)
- [主要功能介绍](https://www.bilibili.com/video/BV1LZEs6LEtV/)

## 本地启动

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件（任选一种）
# Windows (CMD)
copy .env.example .env
# 或 Windows (PowerShell)
Copy-Item .env.example .env
# 或 Mac/Linux/Git Bash
cp .env.example .env

# 3. 初始化数据库
npx prisma migrate dev --name init

# 4. 生成 Prisma Client
npx prisma generate

# 5. 种子数据
npm run db:seed

# 6. 启动项目
npm run dev
```

## 种子演示数据

执行 `npm run db:seed` 后，仓库会生成：

- Organizer 账号：`organizer_demo` / `organizer123`
- Rider 账号：`rider_demo` / `rider123`
- 活跃赛事 ID：`race_sort_demo`
- Rider 默认队伍：`排序演示队`

默认种子赛事已经处于进行中状态，Rider 登录后可以直接提交。


## Jumbotron 大屏

赛马跑马场形式的 Agent Racing 进度可视化大屏，可独立嵌入到赛事列表页，也可全屏访问。

### 快速访问

本地启动后即可看到Jumbotron演示赛（seed 数据）：

```
http://localhost:3000/jumbotron?raceId=race_jumbotron_demo
```

加 `?debug=1` 可进入调试模式，叠加显示中心线采样点、车道边界线、每匹马的 `s` 值标注。

### Jumbotron 演示账号

执行 `npm run db:seed` 后，seed 脚本同时创建以下 Jumbotron 演示账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| Organizer | `organizer_demo` | `organizer123` | 同时管理排序演示赛和 Jumbotron 演示赛，登录后可见两场赛事的 Organizer 控制台 |
| Rider 1 | `jt_rider_1` | `rider123` | AlphaBot 战队队长，进度 88 |
| Rider 2 | `jt_rider_2` | `rider123` | BetaRun 快攻队长，进度 74 |
| Rider 3 | `jt_rider_3` | `rider123` | GammaAI 突破队长，进度 67 |
| Rider 4 | `jt_rider_4` | `rider123` | DeltaCraft 稳进队长，进度 52 |
| Rider 5 | `jt_rider_5` | `rider123` | EpsilonDev 新锐队长，进度 41 |
| Rider 6 | `jt_rider_6` | `rider123` | ZetaForce 违规队长，进度 75（antiCheatPenalty=15） |
| Rider 7 | `jt_rider_7` | `rider123` | EtaLab 跟跑队长，进度 22 |
| Rider 8 | `jt_rider_8` | `rider123` | ThetaSync 起步队长，进度 8，无提交 |

演示赛 ID 固定为 `race_jumbotron_demo`，比赛时间：2026-06-10 至 2026-06-20。

### 向演示赛添加数据

不需要重跑 seed，可通过以下方式动态追加：

- **Prisma Studio**：`npx prisma studio`，直接在浏览器中新增 `LeaderboardEntry`（修改 `totalScore` 即可移动马匹位置）
- **参赛者登录提交**：用任意 `jt_rider_*` 账号登录，找到 Jumbotron 演示赛，正常提交代码即可

`LeaderboardEntry.totalScore`（0–100）= 进度分，直接决定马匹在赛道上的位置，修改后刷新页面（或等待 30 秒自动刷新）即可看到变化。

### 数据维度说明

Jumbotron 展示三个独立维度，数据来源严格不同：

| 维度 | 触发方 | 任务类型 | 存储位置 | 用途 |
|------|--------|----------|----------|------|
| **进度** | ARY 调度 → Runner 自动拉取 | `PROGRESS_EVAL` | `LeaderboardEntry.totalScore` | 马匹在赛道上的位置 |
| **质量** | 参赛者主动提交 | `SUBMISSION_TEST` | `Submission.totalScore`（最新 SCORED） | 马匹下方质量参考 |
| **风险** | ARY 综合推导 | — | `antiCheatPenalty>0` → 高风险 | 风险光环颜色 |

### 赛道资产

Organizer 创赛时可在「赛道类型」下拉中选择：

| `trackId` | 名称 | 特点 |
|-----------|------|------|
| `oval-standard`（默认） | 标准椭圆赛道 | 12 个控制点，经典椭圆形 |
| `rect-standard` | 标准方形赛道 | 12 个控制点，直道 + 圆角弯道 |

也可在「自定义控制点 JSON」填写 `[[x,y],...]` 覆盖所选预设的路径（1920×1080 坐标系，至少 4 个点）。

## Organizer 演示 Runner

Organizer 私有排序 Runner 位于 [organizer_demo/runner_demo](/D:/Desktop/ARY-for-ARY/organizer_demo/runner_demo)。

启动方式：

```bash
cd organizer_demo/runner_demo
cp .env.example .env   # 或用 copy / Copy-Item
npm install
npm run start
```

默认环境变量：

- `ARY_BASE_URL=http://localhost:3000`
- `ARY_RUNNER_TOKEN=ary-runner-dev-secret`
- `ARY_RACE_ID=race_sort_demo`
- `POLL_INTERVAL_MS=2000`
- `TASK_TIMEOUT_MS=5000`

## 完整演示流程

下面这套流程可以完整演示：

- Rider 提交 `solution.ts`
- ARY 创建 Runner 任务
- Organizer 私有 Runner 拉取并评分
- Organizer 手动发起进度评测
- 公开榜单显示分数和排名

### 1. 首次准备

在仓库根目录执行：

```bash
npm install
cp .env.example .env   # 或用 copy / Copy-Item
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

如果你之前已经初始化过数据库，只想把演示数据重置回默认状态，执行：

```bash
npm run db:seed
```

### 2. 终端 A：启动 ARY Web 应用

在仓库根目录执行：

```bash
npm run dev
```

启动后访问：

- 主界面：[http://localhost:3000](http://localhost:3000)
- Audience 视图：[http://localhost:3000/audience](http://localhost:3000/audience)

### 3. 终端 B：启动 Organizer 私有 Runner

在 `organizer_demo/runner_demo` 目录执行：

```bash
cd organizer_demo/runner_demo
cp .env.example .env   # 或用 copy / Copy-Item
npm install
npm run start
```

正常情况下你会看到类似日志：

```text
[runner_demo] polling race race_sort_demo every 2000ms on http://localhost:3000
No queued tasks for race race_sort_demo.
```

这表示私有 Runner 已经开始轮询 ARY。

### 4. Rider 提交代码

1. 打开 [http://localhost:3000](http://localhost:3000)
2. 使用 Rider 账号登录
   - 用户名：`rider_demo`
   - 密码：`rider123`
3. 找到默认活跃赛事“排序 Runner 演示赛”
4. 由于种子数据已经创建了默认队伍“排序演示队”，登录后可以直接提交，不需要重新报名
5. 在提交表单中保留 `solution.ts`，填入一个可执行的 JavaScript / TypeScript 解法，例如：

```ts
export function solve(input: number[]): number[] {
  return [...input].sort((a, b) => a - b);
}
```

6. 点击“进入待评测队列”

### 5. 观察 SUBMISSION_TEST 自动评分

提交之后：

1. ARY 会自动创建一条 `SUBMISSION_TEST` Runner 任务
2. 终端 B 中的私有 Runner 会自动拉取任务并执行隐藏排序用例
3. 成功后终端 B 会出现类似日志：

```text
Processed submission_test task <task-id>.
```

此时含义是：

- 提交已经被私有 Runner 处理
- 分数已经回传给 ARY
- 但公开榜单还不会自动刷新，因为这个 PoC 保留“手动发榜”

### 6. Organizer 手动发起进度评测

1. 在浏览器中退出 Rider，重新登录 Organizer
   - 用户名：`organizer_demo`
   - 密码：`organizer123`
2. 进入同一场赛事“排序 Runner 演示赛”
3. 点击现有按钮“发起进度评测”

点击后：

- ARY 会创建一条 `PROGRESS_EVAL` 任务
- 终端 B 中的私有 Runner 会再次自动拉取并评分
- 成功后你会看到类似日志：

```text
Processed progress_eval task <task-id>.
```

### 7. 查看公开榜单

现在打开以下任一页面：

- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/audience](http://localhost:3000/audience)

你应该能看到：

- 榜单列中有“排名”
- 队伍“排序演示队”
- 总分
- 当前排名

在默认演示数据和上面的示例代码下，通常会看到该队伍以 `100` 分显示在第 `1` 名。

### 8. 一次完整演示的最短命令清单

如果你只想快速复现整套流程，可以直接按下面顺序执行。

终端 A：

```bash
cd D:\Desktop\ARY-for-ARY
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
npm run dev
```

终端 B：

```bash
cd D:\Desktop\ARY-for-ARY\organizer_demo\runner_demo
cp .env.example .env
npm install
npm run start
```

浏览器操作：

1. 用 `rider_demo / rider123` 登录并提交 `solution.ts`
2. 等终端 B 出现 `Processed submission_test task ...`
3. 用 `organizer_demo / organizer123` 登录并点击“发起进度评测”
4. 等终端 B 出现 `Processed progress_eval task ...`
5. 打开 `/audience` 查看公开榜单

这个 PoC 刻意保留“手动发榜”语义：评分自动完成，但公开榜单刷新仍由 Organizer 手动触发。

## 验证命令

```bash
node --import tsx --test src/lib/*.test.ts
node --import tsx --test organizer_demo/runner_demo/src/*.test.ts
npm run lint
npm run build
```

## 数据边界

ARY 持久化保存：

- 赛事公开元数据
- 队伍、反馈、通知
- 提交状态与公开榜单投影
- 公开赛后展示投影

ARY 不保存 Organizer 私有测试集，也不保存 Organizer 私有 Runner 逻辑。

## 相关文档

- [PRD.md](/D:/Desktop/ARY-for-ARY/PRD.md)
- [ROADMAP.md](/D:/Desktop/ARY-for-ARY/ROADMAP.md)
- [runner_doc/organizer-demo-runner.md](/D:/Desktop/ARY-for-ARY/runner_doc/organizer-demo-runner.md)
