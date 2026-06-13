# ARY for ARY

这是一个基于 `Next.js + Prisma + SQLite` 的 ARY GRS 001 全栈 PoC。

当前仓库已经实现：

- Organizer / Rider 真实账号与 Cookie Session
- 赛事创建、组队报名、代码提交、反馈、通知
- Runner 任务拉取与结果回传 API
- 位于 `organizer_demo/runner_demo` 的 Organizer 私有排序评测 Runner
- 公开榜单与 Audience 视图
- Jumbotron Race Live View 与 Track Profile Calibrator MVP

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
- Jumbotron 大屏：[http://localhost:3000/jumbotron](http://localhost:3000/jumbotron)
- Jumbotron Debug：[http://localhost:3000/jumbotron?debug=1](http://localhost:3000/jumbotron?debug=1)
- Track Calibrator：[http://localhost:3000/jumbotron/calibrator](http://localhost:3000/jumbotron/calibrator)

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
node --import tsx --test src/lib/jumbotron/*.test.ts
node --import tsx --test src/lib/*.test.ts
node --import tsx --test organizer_demo/runner_demo/src/*.test.ts
npm run lint
npm run build
```

## Jumbotron 子系统

Jumbotron MVP 由两部分组成：

- `/jumbotron`：公开 Race Live View，展示 LIVE 状态、TOP3、KPI、赛道位置、Riding Message 气泡和底部风险 ticker。
- `/jumbotron/calibrator`：设计时 Track Profile Calibrator，支持导入底图 / profile、编辑 centerline、配置 lane offset、添加 checkpoint、预览多马和导出 JSON。

核心代码：

- `src/lib/jumbotron/track-runtime.ts`：路径采样、lane offset、horse pose、stale 状态和 message bubble 候选。
- `src/lib/jumbotron/adapter.ts`：把现有 DCR `RaceListItem` 映射为 Jumbotron snapshot。
- `assets/tracks/*/track.profile.json`：示例语义赛道资产。
- `assets/tracks/*/preview.png`：带语义 overlay 的赛道预览图。
- `public/jumbotron/tracks/*/background.svg`：视觉底图，只用于展示，不作为定位事实来源。
- `docs/jumbotron-demo-video-script.md`：GRS-002 录制脚本与分镜。
- `riding_record/agent_riding_jumbotron_grs002.md`：Agent Riding 过程记录。

详细说明见 [docs/jumbotron-mvp.md](/D:/Desktop/ARY-for-ARY/docs/jumbotron-mvp.md)。

## ARY GRS 002 Jumbotron 提交说明

本仓库在 GRS 001 PoC 基础上继续完成了 **ARY GRS 002：Jumbotron** 子系统提交包。GRS 002 的核心不是静态大屏截图，而是证明：

- Jumbotron 可以由 `RaceSnapshot` / `RacingEntrySnapshot` / `RidingMessageSnapshot` / `AttentionItem` 驱动；
- 赛马位置来自 `track.profile.json`、centerline sampling 和 lane offset，而不是画死在背景图里；
- Calibrator 可以把视觉底图校准成可运行、可验证、可导出的语义赛道资产；
- Agent Riding 过程有计划、干预、错误复盘、验收和提交证据。

### GRS 002 本地运行

推荐从干净数据库开始：

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

打开以下入口：

- Jumbotron 大屏：[http://localhost:3000/jumbotron](http://localhost:3000/jumbotron)
- Jumbotron Debug：[http://localhost:3000/jumbotron?debug=1](http://localhost:3000/jumbotron?debug=1)
- 第二条赛道 Debug：[http://localhost:3000/jumbotron?track=city-hairpin&debug=1](http://localhost:3000/jumbotron?track=city-hairpin&debug=1)
- Track Calibrator：[http://localhost:3000/jumbotron/calibrator](http://localhost:3000/jumbotron/calibrator)

### GRS 002 已实现能力

- 16:9 Race Live View。
- LIVE 状态、Round / Phase、elapsed time。
- KPI strip：完成度、在线 Rider、Tokens、Codex / Claude 占比、风险 / 阻碍 / 违规计数。
- TOP3 cards。
- Entry Inspect 页内 drill-down：rank、provider、phase、tokens、progress source、message、risk signals。
- 主赛道 SVG 渲染和动态 s-axis progress。
- Riding Message bubbles 与底部 ticker。
- Risk zone、checkpoint、collision box 和 lane fallback debug overlay。
- 两条示例赛道：`devcompass-oval` 和 `city-hairpin`。
- Track Profile Calibrator：导入、centerline 编辑、start / finish、direction、lane、checkpoint、message zone、no-bubble zone、risk zone、validation、JSON diff、Export JSON、Export Debug SVG。
- 半真实 DCR seed story：四支队伍、不同 Agent provider、提交状态、Runner task、公开榜单、反馈线程、通知、harness entry 和 riding highlight。

### GRS 002 自动彩排与录制

自动检查四个关键页面：

```bash
npm run grs002:check
```

生成短版无声浏览器 smoke demo：

```bash
npm run grs002:record
```

生成主提交用无声字幕版 demo：

```bash
npm run grs002:record:captioned
```

当前已提交的视频产物位于：

```text
outputs/grs002-jumbotron-captioned-demo.webm
outputs/grs002-jumbotron-silent-demo.webm
```

`grs002-jumbotron-captioned-demo.webm` 是主提交证据：约 4 分钟、无音轨、画面内嵌中文字幕，覆盖 ARY 平台边界、GRS-001 PoC 链路、Race Live View、Debug 几何、第二赛道、Calibrator、runtime 架构、Data Story、Agent Riding 和验证结果。外挂字幕文件位于 `docs/grs002-captioned-demo.zh.srt`。`grs002-jumbotron-silent-demo.webm` 保留为短版 smoke demo。

### GRS 002 关键证据文件

| 类型 | 文件 / 路由 | 说明 |
|---|---|---|
| 大屏入口 | `/jumbotron` | 公开 Race Live View |
| Debug 入口 | `/jumbotron?debug=1` | 几何、采样点、lane、risk、collision debug |
| 第二赛道 | `/jumbotron?track=city-hairpin&debug=1` | 证明 profile 可切换 |
| Calibrator | `/jumbotron/calibrator` | 赛道资产生产流程 |
| 数据契约 | `src/lib/jumbotron/contracts.ts` | Jumbotron snapshot / entry / message / attention contracts |
| Track Profile | `src/lib/jumbotron/track-profile.ts` | `track.profile.json` schema |
| Runtime | `src/lib/jumbotron/track-runtime.ts` | progress -> horse pose |
| DCR Adapter | `src/lib/jumbotron/adapter.ts` | DCR race data -> Jumbotron snapshot |
| Seed Story | `prisma/seed.ts` | 半真实 DCR demo 数据 |
| 赛道资产 | `assets/tracks/*/track.profile.json` | 可运行语义赛道资产 |
| 预览图 | `assets/tracks/*/preview.png` | 带 overlay 的 track preview |
| MVP 文档 | `docs/jumbotron-mvp.md` | 实现说明和边界 |
| 提交清单 | `docs/grs002-submission-checklist.md` | 按评分项映射证据 |
| 最终提交说明 | `docs/grs002-final-submission.md` | 运行、视频、PR、提交说明 |
| PR 描述 | `docs/grs002-pr-description.md` | 可复制到 GitHub PR |
| 分镜与字幕 | `docs/grs002-demo-storyboard.md`, `docs/grs002-captioned-demo.zh.srt` | 录制分镜、字幕稿和外挂字幕 |
| 彩排报告 | `docs/grs002-rehearsal-report.md` | 自动彩排结果 |
| Riding Record | `riding_record/agent_riding_jumbotron_grs002.md` | Agent Riding 过程记录 |
| 主视频 | `outputs/grs002-jumbotron-captioned-demo.webm` | 已提交的无声字幕版自动录屏 demo |
| 短版视频 | `outputs/grs002-jumbotron-silent-demo.webm` | 已提交的短版 smoke demo |

### GRS 002 评分项对齐

- **问题理解与系统边界**：见 `docs/jumbotron-mvp.md`、`docs/grs002-final-submission.md`、`riding_record/agent_riding_jumbotron_grs002.md`。
- **Race Live View 运行体验**：见 `/jumbotron`、TOP3、KPI、Entry Inspect、ticker、risk panel。
- **Calibrator 与赛道资产生产**：见 `/jumbotron/calibrator` 和 `assets/tracks/*`。
- **track-runtime 与数据契约**：见 `src/lib/jumbotron/*` 和对应测试。
- **Demo 有效性**：见 `docs/jumbotron-demo-video-script.md`、`docs/grs002-demo-storyboard.md`、`docs/grs002-captioned-demo.zh.srt`、`outputs/grs002-jumbotron-captioned-demo.webm`。
- **Agent Riding Skill**：见 `riding_record/agent_riding_jumbotron_grs002.md` 和 `ROADMAP.md`。
- **文档与工程交付性**：见 `docs/grs002-submission-checklist.md`、`docs/grs002-final-submission.md`。

### GRS 002 PoC 边界

- Calibrator 当前导出本地 JSON / SVG，不把 profile 写入数据库。
- Remote Racing Cockpit 只暴露 seed race URL，不实现完整 cockpit 鉴权。
- Runtime 是 2D SVG 语义赛道渲染，不是物理引擎或 3D 引擎。
- 无声字幕版视频已提交；本轮按用户要求不加入声音，讲解内容全部由画面字幕承担。
- 本地 Prisma 不可用时，Jumbotron 会 fallback 到当前时间 mock snapshot，保证演示入口可用。

### GRS 002 提交仓库

本内容已经同步到：

- `SysuGroup9/ARY-for-ARY` 分支：`xiaoyi24/jumbotron-subsystem`
- `sysu-se/ary-grs-002-xiaoyi24`：`main`
- `sysu-se/ary-grs-001-xiaoyi24`：`main`

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
