# ARY GRS 001 产品需求文档5.0版

## 1. 引言

### 1.1 编写目标

本文档旨在定义 Agent Racing Yard Genesis Race Series 001（简称 ARY GRS 001）的产品需求，明确在 Race 数据存留于 Organizer 侧、ARY 不持久化 Race 数据的前提下，ARY 如何完成赛事的创建、披露、组织与展示。

### 1.2 读者对象

本文档的读者包括：
- 开发团队：理解产品需求，指导系统设计与实现
- 评审团队：评估产品定义
- 赛事主办方（Organizer）：了解平台能力与使用方式

### 1.3 文档概述

本文档分为以下部分：
- 第2章：软件系统概述，说明 ARY 的定位与 GRS 001 要解决的问题
- 第3章：功能性需求描述，定义角色、功能模块与业务流程
- 第4章：非功能性需求，定义安全、性能等要求
- 第5章：界面需求，定义页面与交互要求
- 第6章：接口定义，定义 Runner 接口
- 第7章：验收标准

### 1.4 术语定义

| 术语 | 说明 |
|------|------|
| ARY | Agent Racing Yard，智能体时代的软件开发训练场、竞技场 |
| GRS | Genesis Race Series，ARY 的系列赛事 |
| Organizer | 赛事主办方，创建赛事、提供题目、进行评测 |
| Rider | Rider，报名参加比赛、提交代码、查看排名 |
| Audience | 观众，浏览比赛信息、查看排名 |
| Runner | Organizer私有评测程序，主动拉取任务并回传结果 |
| Riding Record | Rider与 Agent 的对话记录 |

## 2. 软件系统概述

### 2.1 产品概述

ARY 是一个**去中心化的智能体赛事平台**。它的核心理念是：**Public Yard, Private Race Source**。

- 赛事数据主权属于 Organizer
- ARY 不持久化存储完整的 Race 数据
- ARY 只消费 Organizer 主动披露的数据
- ARY 负责赛事的创建、披露、组织与展示

**ARY 的核心能力：**
- 展示Organizer发布的竞赛题目
- 收集Rider的代码和 Riding 记录（赛后评估能力时再收集riding记录）
- 临时中转Rider提交到待评测队列
- Organizer 私有 Runner 主动拉取评测
- 接收评测结果并展示
- 展示榜单（按Organizer颗粒度实时更新）
- Rider向Organizer反馈问题
- Organizer修改题目/训练数据
- Organizer赛后评论

### 2.2 GRS 001 要解决的核心问题

**GRS 001 要解决的核心问题是：**

> 在 Race 数据存留于 Organizer 侧、ARY 不持久化 Race 数据的前提下，ARY 如何完成赛事的创建、披露、组织与展示？

**通过 GRS 001 必须证明的四个能力：**

1. Organizer可以创建赛事，数据保留在Organizer侧
2. ARY 不需要持久化完整 Race 数据
3. ARY 仍然可以创建、披露、组织、展示赛事
4. ARY 展示的内容来自 Organizer 主动披露的公开数据

### 2.3 用户特征

| 角色 | 说明 | 是否需要账号 |
|------|------|-------------|
| Organizer | 赛事主办方，创建赛事、提供题目、进行评测 | 是 |
| Rider | 报名参加比赛、提交代码、查看排名 | 是 |
| Audience | 观众，浏览比赛信息、查看排名、观看亮点 | 否（浏览不需要） |
| ARY | 平台本身，负责创建、披露、组织、展示 | - |

**说明**：
- 浏览比赛不需要登录
- 参加比赛/发布比赛需要登录

### 2.4 设计与实现约束

- 数据存储使用浏览器 localStorage
- 评测由Organizer私有 Runner 完成，ARY 不参与评分
- Organizer测试代码不离开Organizer内网

## 3. 功能性需求描述

### 3.1 功能模块

#### 3.1.1 Organizer 端

- 注册/登录
- 创建赛事（基础信息、时间设置、评价标准、赛后展示选项、其他设置）
- 查看实时榜单
- 查看Rider反馈（可回复、标记状态）
- 比赛期间修改题目/训练数据（修改后通知所有Rider）
- 赛后评论（可对所有队伍评论）
- 一键清除比赛

#### 3.1.2 Rider 端

- 注册/登录
- 浏览赛事列表（按状态分类）
- 报名参赛（填写组员信息，不超过人数上限）
- 组内协作（可通过 DC）
- 提交代码和 Riding 记录（受提交频率限制）
- 查看实时进度排名
- 向 Organizer 反馈问题
- 接收 Organizer 题目修改通知

#### 3.1.3 Audience 端

- 浏览赛事（无需登录）
- 查看公开排名
- 查看赛后展示内容

### 3.2 核心业务流程

#### 3.2.1 Race 创建流程

Organizer 登录后填写：

**基础信息：**
- 赛事名称、简介
- 题目压缩包（含任务描述，可含训练数据）
- 是否有训练数据（勾选后 ARY 不处理）

**时间设置：**
- 报名开始时间、报名结束时间
- 比赛开始时间、比赛结束时间

**时间线说明：**
- 报名开始时间 ≤ 报名结束时间 ≤ 比赛开始时间 ≤ 比赛结束时间

**评价标准：**
- Organizer自定义，由Organizer自己的 Runner 进行评分
- ARY 只接收Organizer Runner 回传的最终分数

**赛后展示选项：**
- Organizer提供的题目
- 训练数据
- Organizer评论
- 展示前N名 Riding 亮点（默认3）
- Rider代码

**其他设置：**
- 每组人数上限（默认5人）
- 提交频率限制（默认24小时一次）
- 一键清除比赛

#### 3.2.2 Rider请求测试流程

1. Rider点击测试
2. 发送代码给 ARY
3. ARY 记录Rider信息
4. ARY 把代码发给 Organizer 的 Runner
5. Organizer 在自己环境进行评测
6. Organizer 返回结果给 ARY
7. ARY 返回结果给Rider

#### 3.2.3 ARY规定颗粒度时间自动读取进度流程

1. ARY 每隔固定颗粒度给 Organizer 发送读取进度请求
2. Organizer收到请求后，读取一次 Runner 拉取的 Rider 的代码，并计算进度
3. Organizer返回进度结果给ARY
4. ARY在榜单中更新，展示进度

#### 3.2.4 赛后评价Rider驾驭能力流程

1. ARY在比赛结束后，自动读取Rider的Riding记录和代码
2. ARY记录Rider信息
3. ARY发送Riding记录和代码给Organizer
4. Organizer根据记录和代码进行Harness能力评价
5. Organizer返回评价结果给ARY
6. ARY在Harness能力榜单中更新并展示

#### 3.2.5 比赛状态转换

| 状态 | 条件 | Rider可操作 |
|------|------|-------------|
| 报名中 | 当前时间在报名开始~报名结束之间 | 可报名 |
| 报名结束 | 当前时间在报名结束~比赛开始之间 | 不可报名，等待开始 |
| 比赛中 | 当前时间在比赛开始~比赛结束之间 | 已报名的可提交 |
| 比赛结束 | 当前时间晚于比赛结束 | 不可提交，查看最终排名 |

### 3.3 数据定义

#### 3.3.1 Organizer 侧数据（不存储在 ARY）

- Runner环境
- 测试代码
- 由Runner拉取的各个Rider的代码和Riding记录
- 进度评价程序
- Harness能力评价程序

#### 3.3.2 ARY 侧存储数据

- Race题目和可能有的训练数据
- 进度榜单
- 赛后的Harness能力榜单
- 反馈记录
- 通知记录

#### 3.3.3 Rider临时数据

- 提交的代码（评测完成后从队列中删除）
- Riding 记录（赛后评价完Harness能力后删除）

### 3.4 赛后展示逻辑

**直接公开（无需勾选）：**
- 完整排名
- Organizer提供的题目

**Organizer可勾选：**
- 训练数据
- Organizer评论
- 前N名 Riding 亮点（Organizer设置 N 值，默认3）
- Rider代码

### 3.5 Rider反馈功能

Rider在比赛期间可通过 ARY 向Organizer发送私信，反馈以下问题：
- 题目描述不清或存在歧义
- 训练数据问题
- 其他与竞赛相关的问题

**反馈可见性**：
- Organizer：可见所有队伍的反馈
- Rider：仅可见自己队伍的反馈及Organizer回复
- 其他队伍：不可见

**反馈状态**：
- pending：待处理
- resolved：已处理

### 3.6 Organizer修改题目/训练数据

Organizer收到Rider反馈后，可在比赛期间修改：
- 题目描述
- 训练数据

**注**：Organizer测试代码和关键词配置不可修改（防止影响评分公平性）

**通知机制**：Organizer修改后，ARY 自动向所有Rider发送通知。

## 4. 非功能性需求

### 4.1 安全性

| ID | 约束 | 实现方式 |
|----|------|----------|
| S-01 | Organizer测试代码不暴露给Rider | 存储在Organizer自己数据库中，不传给 ARY |
| S-02 | Organizer未勾选的展示选项赛后自动清除 | ARY 根据勾选决定展示内容 |
| S-03 | Organizer可一键清除比赛 | 提供“清除比赛”按钮 |
| S-04 | Organizer可通过ARY拉取Rider数据 | Organizer通过Runner固定颗粒度自动拉取 |
| S-05 | Rider反馈内容仅Organizer和对应队伍可见 | 反馈消息不公开 |
| S-06 | Organizer测试代码不离开Organizer内网 | Runner在Organizer内运行 |

### 4.2 去中心化与去持久化

- Race 数据主权属于 Organizer
- ARY 不持久化完整 Race 数据
- Rider代码临时存储，被Organizer存储完成后删除
- Organizer可一键清除比赛所有数据

## 5. 界面需求

### 5.1 赛事列表页

- 按状态分类展示（报名中、报名结束、比赛中、比赛结束）
- 观众无需登录即可浏览

### 5.2 赛事详情页

- 展示比赛名称、时间、规则、公开描述
- 进度排名榜单
- 报名按钮（登录后可见）
- 提交入口（报名成功且比赛中可见）

### 5.3 赛后展示页

- 完整排名
- 前 N 名 Riding 亮点（按Organizer设置）
- Organizer评论
- Organizer公开的题目和训练数据

## 6. 接口定义（仅供参考）

### 6.1 Runner 拉取任务

**请求：**
GET /api/runner/tasks/pull
Headers: Authorization: Bearer {runner_token}

**响应：**
```json
{
    "tasks": [
        {
            "taskId": "task_001",
            "submissionId": "sub_001",
            "teamId": "team_001",
            "teamName": "排序小分队",
            "codeZipUrl": "https://ary.com/temp/code.zip",
            "ridingRecordUrl": "https://ary.com/temp/riding.txt",
            "taskDesc": "实现快速排序",
            "keywords": ["需求分析", "时间复杂度"]
        }
    ]
}
```

### 6.2 Runner 回传结果

**请求：**
POST /api/runner/tasks/result
Headers: Authorization: Bearer {runner_token}
Content-Type: application/json

**请求体：**
```json
{
    "taskId": "task_001",
    "submissionId": "sub_001",
    "score": 88.6,
    "status": "success"
}
```

### 6.3 临时文件清理

- Runner 拉取任务后，ARY 标记任务为“已拉取”
- 结果回传后，ARY 删除临时存储的代码压缩包和 Riding 记录文件
- 临时文件默认 24 小时后自动过期删除

## 7. 验收标准

### 7.1 核心功能验收

- [ ] Race 公开数据可以留在 ARY 侧
- [ ] ARY 不需要持久化保存私密 Race 数据
- [ ] ARY 仍然可以创建、披露、组织、展示赛事
- [ ] 赛中 ARY 可以展示进度榜单
- [ ] 赛后展示内容来自 Organizer 主动披露的公开数据

### 7.2 功能验收

- [ ] Organizer 可创建赛事（含基础信息、时间设置、评价标准、赛后展示选项、其他设置）
- [ ] 时间设置包含报名开始/结束时间和比赛开始/结束时间
- [ ] 每组人数上限默认为5人
- [ ] Rider可浏览赛事列表并按状态分类
- [ ] Rider可在报名时间内报名
- [ ] Rider可在比赛时间内提交代码
- [ ] 提交频率限制生效
- [ ] 榜单按颗粒度更新
- [ ] Rider可向 Organizer 反馈问题
- [ ] Organizer 可查看反馈并回复
- [ ] Organizer 可修改题目/训练数据并通知Rider
- [ ] 赛后完整排名直接公开
- [ ] Organizer 可设置展示前N名 Riding 亮点
- [ ] Organizer 可对所有队伍赛后评论
- [ ] 赛后根据Organizer勾选展示内容
- [ ] Organizer 可通过runner拉取Rider的代码和 Riding 记录
- [ ] Organizer 可一键清除比赛
- [ ] Audience 可浏览公开信息（无需登录）

### 7.3 安全验收

- [ ] Organizer测试代码不暴露给Rider和ARY
- [ ] Organizer测试代码不离开Organizer内网
- [ ] Organizer未勾选的展示选项赛后自动清除
- [ ] Organizer可一键清除比赛
- [ ] Rider反馈内容仅Organizer和对应队伍可见
- [ ] Rider提交代码和记录在 Runner 回传结果后自动删除