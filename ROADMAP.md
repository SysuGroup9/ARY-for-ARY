# ARY GRS 001 ROADMAP

## 1. 任务背景

目标是实现一个可运行的 ARY GRS 001 PoC，用来证明：

1. Race 数据主权属于 Organizer。
2. ARY 不需要持久化完整 Race 数据。
3. ARY 仍然可以创建、披露、组织、展示赛事。
4. ARY 展示的内容来自 Organizer 主动披露的公开数据。

## 2. 最终采用的实现方向

### 2.1 为什么没有继续做后端版

仓库中的 [PRD.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PRD.md) 和 [PoC.md](C:/Users/xy/Documents/Codex/2026-06-05/files-mentioned-by-the-user-prd-2/PoC.md) 明确把本次验证约束成：

- 数据存储使用浏览器 `localStorage`
- Organizer 私有评测由 Runner 完成
- 不要求生产级安全
- 重点是验证数据边界与流程闭环

因此本次实现从最初的“Next.js + SQLite”方案切换为“React + TypeScript + Vite + localStorage”的纯前端 PoC。

### 2.2 当前技术栈

- React 19
- TypeScript
- Vite
- 浏览器 `localStorage`

## 3. 已实现能力

### 3.1 角色流

- Organizer 登录 / 注册
- Rider 登录 / 注册
- Audience 无需登录浏览公开内容

### 3.2 赛事组织

- Organizer 创建赛事
- 时间线校验
- 比赛状态自动计算
- Rider 报名参赛
- 队伍人数上限校验
- 提交频率限制校验

### 3.3 提交流程

- Rider 提交代码和 Riding Record
- 提交进入待评测队列
- Runner 拉取任务
- Runner 回传评分结果
- ARY 更新最高分归档与公开榜单投影
- 回传后临时提交物从队列中删除

### 3.4 沟通与披露

- Rider 向 Organizer 发送反馈
- Organizer 回复并标记 `resolved`
- Organizer 修改题目 / 训练数据说明并广播通知
- Organizer 发布赛后总评和队伍评论
- Audience 查看公开榜单、Harness 榜单与赛后亮点

### 3.5 导出与清理

- 下载最高分归档 JSON
- 下载公开分数 JSON
- Organizer 一键清除比赛
- 本地重置为种子数据

## 4. 当前数据边界

### 4.1 ARY 在浏览器侧保存

- 赛事公开元数据
- 队伍信息
- 提交状态
- 反馈与通知
- 公开榜单
- 最高分归档
- 赛后亮点与 Harness 榜单

### 4.2 ARY 不保存

- Organizer 私有测试代码
- Organizer 内网 Runner 实现细节
- 真实远程评测环境

### 4.3 临时数据策略

- Rider 提交先进入前端内存 / localStorage 队列
- Runner 回传结果后，对应提交的临时 artifact 置空
- 最佳成绩归档单独保留，用于赛后公开展示与下载

说明：
- 这一步是对 PRD 中“评测后删除临时提交物”和“赛后仍可展示最佳成果”的折中实现。
- 保留的是公开可展示的最高分归档，而不是完整私有评测过程。

## 5. 已知限制

- Runner API 是页面交互模拟，不是真实 HTTP 服务
- 认证是演示级明文账号，不是生产级安全实现
- `localStorage` 天然不适合多设备协同，这里只用于 PoC 证明
- 没有真实文件上传，只用文本内容模拟代码包和 Riding Record
- 没有真正接入 Agent 提供商 API，只保留评分模型与字段结构

## 6. 迭代记录

### Iteration 0

- 阅读需求并输出首版实现计划

### Iteration 1

- 将当前工作区接入组织仓库 `SysuGroup9/ARY-for-ARY`
- 保留远端已有 `PRD.md` 和 `PoC.md` 历史
- 新增 `.gitignore`

### Iteration 2

- 发现仓库中的 `PRD.md` / `PoC.md` 将本次实现明确约束为纯前端 localStorage PoC
- 放弃先前的 SQLite 方向
- 改用 React + TypeScript + Vite 落地

### Iteration 3

- 实现领域模型、种子数据、比赛状态计算、榜单逻辑
- 实现 Organizer / Rider / Runner / Audience 页面
- 实现反馈、通知、赛后展示、导出与清理能力
- 完成 `lint` 与 `build` 验证
