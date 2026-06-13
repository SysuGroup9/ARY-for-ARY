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
- Jumbotron Race Live View 展示公开赛事赛道态势
- Track Profile Calibrator 复用 runtime 做设计时预览

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

### Iteration 4

- 新增 `src/lib/jumbotron` 契约、Zod profile schema、track runtime 与 DCR adapter
- 新增 `/jumbotron` Race Live View，支持 TOP3、KPI、赛道 SVG 渲染、message bubble、ticker 与 debug geometry
- 新增 `/jumbotron/calibrator`，支持导入底图 / profile、编辑 centerline、lane offset、checkpoint、scrubber 多马预览和导出 JSON
- 新增两条示例 track profile 与视觉底图资产
- 新增 Jumbotron runtime / adapter 单元测试与 `docs/jumbotron-mvp.md`

### Iteration 5

- 按 GRS-002 评分标准新增 A/S 冲刺矩阵
- 将 mock snapshot 改为当前时间生成，避免演示时被 stale 逻辑误伤
- Race Live View 增加客户端动态推进、s 轴补间、drill-down 入口、Live Story 和 debug collision boxes
- Track Profile 增加 risk zones，Calibrator 增加 message / no bubble / risk zone 编辑、JSON diff preview 与 debug SVG export
- 为两条赛道生成 `preview.png`
- 新增 GRS-002 短视频脚本和 Agent Riding Record

### Iteration 6

- 用户明确要求实际录视频和人工演示后续再做，本轮先补齐其他评分材料
- Race Live View 将 TOP3 占位链接升级为页内 Entry Inspect 面板，并支持点击马匹 marker 选择队伍
- Calibrator 补齐 start / finish 设置、lane 增删改、checkpoint 重命名 / 移动 / 删除、zone 删除和 profile import 校验
- `prisma/seed.ts` 增加四队伍半真实 DCR demo story：提交、公开榜单、Runner task、反馈、通知、harness 与 highlight
- 新增 `docs/grs002-submission-checklist.md`，把评分标准映射到具体路由、文件和剩余录制事项
- 调整 stale 状态规则，避免已完成 / 阻塞等终态队伍在演示时被错误地全部灰化

### Iteration 7

- 按用户要求补 PR 描述、最终提交文档、视频分镜、字幕文案、彩排报告和无声录制脚本
- 新增 `scripts/grs002-rehearsal-check.mjs`，用于检查 Jumbotron、debug route、city-hairpin 和 Calibrator 页面
- 新增 `scripts/record-grs002-demo.mjs`，用于生成 `outputs/grs002-jumbotron-silent-demo.webm`
- 在 Riding Record 中补最终验收计划、录制准备和人工复盘占位
- 记录 GitHub CLI 未登录时 PR 创建的限制，保留可复制的 PR 正文和 compare URL 流程

## 错误复盘

- 早期从旧 PoC 迁移时有编码损坏的中文文本混入新实现。
- 改进措施：不再从旧损坏文件复制中文字面量，所有中文文案重新手写并在最终构建前做人工检查。
- Jumbotron 第一版 MVP 偏重代码实现，未先按 GRS-002 硬门槛补齐短视频脚本、Riding Record 和评分证据。
- 改进措施：先建立评分矩阵，再将视频脚本、Riding Record、debug 证据和 Calibrator 流程作为可交付物同步实现。
- Race Live View 曾经只有外链式 drill-down，占位 URL 会削弱“现场大屏可解释性”。
- 改进措施：增加页内 Entry Inspect 面板，先在大屏内解释公开数据来源、风险和消息，再提供 cockpit URL。
