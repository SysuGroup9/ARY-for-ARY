# Organizer 演示 Runner 流程说明

本文档说明排序题 PoC 中使用的 Organizer 私有 Runner。

## 范围

- 支持的任务类型：`SUBMISSION_TEST`、`PROGRESS_EVAL`
- 不支持的任务类型：`HARNESS_EVAL`
- 提交格式：导出 `solve(input: number[]): number[]` 的 JavaScript / TypeScript 模块
- 评分模型：隐藏排序测试用例通过率，保留 1 位小数

## 隐藏排序用例

Organizer 私有隐藏用例保存在 `organizer_demo/runner_demo/src/hidden-cases.ts`。

当前覆盖的用例类别：

- 空数组
- 单元素
- 已排序输入
- 逆序输入
- 重复元素
- 负数
- 混合值
- 大样本

## 启动步骤

1. 在仓库根目录启动 ARY 应用
2. 执行 `npm run db:seed` 初始化数据库
3. 将 `organizer_demo/runner_demo/.env.example` 复制为 `.env`
4. 在 `organizer_demo/runner_demo` 目录执行 `npm run start`

## 运行时行为

Worker 循环会：

1. 轮询 `GET /api/runner/tasks/pull?raceId=race_sort_demo`
2. 用 `typescript.transpileModule` 转译提交的 TypeScript / JavaScript
3. 在独立 Node 子进程中执行转译后的模块
4. 跑 Organizer 私有隐藏排序用例
5. 把最终结果回传到 `POST /api/runner/tasks/result`

失败策略：

- 语法错误：失败，分数 `0`
- 缺少 `solve` 导出：失败，分数 `0`
- 运行时异常：失败，分数 `0`
- 超时：失败，分数 `0`
- 返回值非法：失败，分数 `0`
- 不支持的 `HARNESS_EVAL`：失败，并返回 `unsupported in organizer_demo PoC`

## 手动发榜

这个 PoC 有意保留“手动发榜”行为。

推荐操作流程：

1. Rider 提交代码
2. 私有 Runner 完成 `SUBMISSION_TEST`
3. Organizer 在 ARY 页面点击现有的发榜按钮
4. ARY 创建 `PROGRESS_EVAL`
5. 私有 Runner 完成 `PROGRESS_EVAL`
6. 公开榜单显示分数与排名
