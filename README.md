# ARY for ARY

一个基于 React + TypeScript + Vite 的前端 PoC，用来实现并验证 ARY GRS 001 的核心产品设计。

## 项目目标

本项目验证以下命题：

- Organizer 可以创建赛事，并保留核心 Race 数据控制权
- ARY 不需要服务端数据库，也能完成赛事创建、披露、组织和展示
- ARY 只保留公开投影和流程状态，不接触 Organizer 私有测试代码

## 技术路线

- 前端框架：React 19
- 语言：TypeScript
- 构建工具：Vite
- 存储：浏览器 `localStorage`

说明：
- 这是有意选择的 PoC 路线，不是简化版偷工减料。
- 仓库内的 [PRD.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PRD.md) 和 [PoC.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PoC.md) 明确要求当前验证优先使用前端本地存储。

## 已实现模块

- Organizer 登录 / 注册
- Rider 登录 / 注册
- Audience 公开浏览
- 赛事创建
- 比赛状态自动切换
- 报名与队伍管理
- 提交代码与 Riding Record
- Runner 拉取任务与回传评分
- 公开榜单同步
- 反馈与通知
- 赛后展示
- 最高分归档导出
- 一键清除比赛
- 重置为种子数据

## 运行方式

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

静态检查：

```bash
npm run lint
```

## 演示账号

种子数据内置两个演示账号：

- Organizer
  - username: `organizer_demo`
  - password: `organizer123`
- Rider
  - username: `rider_demo`
  - password: `rider123`

也可以在页面上直接注册新的 Organizer 或 Rider 账号。

## 页面说明

### Overview

- 浏览赛事
- 查看公开时间线、规则、榜单、赛后展示
- 验证数据边界与披露效果

### Organizer

- 创建赛事
- 修改题目 / 训练数据说明
- 回复 Rider 反馈
- 同步公开榜单
- 生成 Harness 榜单与赛后亮点
- 发布赛后总评和队伍评论
- 导出结果
- 一键清除比赛

### Rider

- 报名参赛
- 提交代码和 Riding Record
- 查看通知
- 向 Organizer 反馈问题

### Runner

- 模拟 `GET /api/runner/tasks/pull`
- 模拟 `POST /api/runner/tasks/result`
- 将评分结果回传为公开榜单投影

### Audience

- 查看公开榜单
- 查看 Harness 榜单
- 查看赛后亮点与评论

## 数据边界

### 由 ARY 保留

- 赛事公开信息
- 队伍信息
- 反馈与通知
- 提交状态
- 公开榜单
- 最高分归档
- 赛后展示内容

### 不进入 ARY

- Organizer 私有测试代码
- Organizer 内网评测环境
- 真实远程 Runner 实现

### 临时提交流程

- Rider 提交先进入队列
- Runner 拉取后标记为 `pulled`
- Runner 回传评分后，提交 artifact 置空
- 最佳成绩归档保留，用于赛后展示与导出

## 已知限制

- 这是单浏览器 localStorage PoC，不支持真实多端同步
- Runner API 是页面模拟，不是独立后端服务
- 未接入真实 Agent API
- 未实现生产级认证与权限系统
- 未实现真实文件上传，仅用文本字段模拟压缩包与记录文件

## 文档

- [PRD.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PRD.md)
- [PoC.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PoC.md)
- [ROADMAP.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/ROADMAP.md)
- [plan/implementation-plan.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/plan/implementation-plan.md)
