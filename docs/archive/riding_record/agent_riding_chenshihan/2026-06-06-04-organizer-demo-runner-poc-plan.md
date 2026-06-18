# 2026-06-06 计划摘抄 04：Organizer Demo Runner PoC 计划

来源：

- 2026-06-06 会话中的 Organizer Demo Runner PoC 实施计划

类型：

- 面向 `organizer_demo/runner_demo` 的实现计划

目标：

- 在 `organizer_demo/runner_demo` 下做一个独立的 Organizer 私有 Runner 示例
- 跑通这条链路：
  - Rider 提交 `solution.ts`
  - ARY 中转任务
  - Organizer 私有 Runner 拉任务评分
  - Runner 回传分数
  - Organizer 手动发起进度评测
  - 榜单显示分数和排名

计划范围：

- 只覆盖：
  - `SUBMISSION_TEST`
  - `PROGRESS_EVAL`
- 不覆盖：
  - `HARNESS_EVAL`

当前题目固定为：

- 排序题

Runner 目录规划：

- 独立 `package.json`
- 独立 `tsconfig.json`
- `.env.example`
- README
- 轮询入口
- ARY API 客户端
- 排序评测器
- Organizer 私有隐藏测试集

运行模型：

- 长驻轮询 Worker
- 固定配置项：
  - `ARY_BASE_URL`
  - `ARY_RUNNER_TOKEN`
  - `ARY_RACE_ID`
  - `POLL_INTERVAL_MS`
  - `TASK_TIMEOUT_MS`

提交约定：

- 用户提交 JavaScript / TypeScript 模块
- 至少导出：
  - `solve(input: number[]): number[]`

执行方式：

- 先用 `typescript.transpileModule` 转译
- 再写入临时文件
- 再在独立 Node 子进程中执行

失败条件：

- 语法错误
- 无 `solve`
- 运行时异常
- 超时
- 返回值非法

上述情况统一：

- `failed`
- `score = 0`

排序评分规则：

- 隐藏排序测试集通过率
- 用例包含：
  - 空数组
  - 单元素
  - 已排序
  - 逆序
  - 重复值
  - 负数
  - 混合值
  - 大样本
- 公式：
  - `score = passedCases / totalCases * 100`
- 保留 1 位小数
- `runnerComment` 返回：
  - 通过数
  - 第一条失败原因

ARY 侧配套改动：

- 不新增 Runner 协议
- 继续复用现有：
  - `GET /api/runner/tasks/pull`
  - `POST /api/runner/tasks/result`
- 榜单增加显式“排名”列
- 排名不落库，只按：
  - `totalScore desc`
  - `createdAt asc`
  - 现场计算
- 默认种子赛事改成“可立即演示”的活跃排序赛

测试计划：

## 单测

- 排序评测器：
  - 命名导出 `solve`
  - 默认导出 fallback
  - 正确排序
  - 错误排序
  - 缺少导出
  - 语法错误
  - 运行时异常
  - 超时
  - 非数组输出
- ARY client：
  - 空任务
  - 正常回传
  - 401 / 500 分支
- 排名 helper：
  - 降序排序
  - 同分按 `createdAt`
  - 显式名次生成

## 集成验证

- `db:seed` 后能直接进入活跃排序赛
- Rider 提交后 Runner 能拉到 `SUBMISSION_TEST` 并回分
- Organizer 点击“发起进度评测”后 Runner 能拉到 `PROGRESS_EVAL` 并更新榜单
- `/` 与 `/audience` 都能看到相同榜单

这个计划里明确接受的 PoC 语义：

- 评分自动
- 发榜手动
- 不要求全自动实时榜单
