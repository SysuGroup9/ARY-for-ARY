# ARY Private Runner 实现说明（按当前 PRD 收口的 POC 已确定版）

日期：2026-06-06

## 1. 文档目的

本文档描述当前已经确定的 `ARY private runner` 方案边界。

本文档记录的是：

1. 当前 PRD 下被接受的 POC runner 形态
2. 任务输入与输出边界
3. 榜单更新语义
4. 安全与部署约束

本文档不是：

1. 当前仓库接口的逐字代码快照
2. 企业自研 runner 规范
3. 生产级多节点调度方案

## 2. 当前已确定的方案

当前 POC 固定采用以下方案：

1. `ARY 提供官方标准 runner 镜像`
2. `organizer 自己部署 runner`
3. `runner 运行在 organizer 控制的环境中`
4. `runner 使用 pull 模式主动从 ARY 拉取任务`
5. `ARY 对原始提交只做临时中转`
6. `organizer 私有测试、评分脚本、私有业务数据只在 organizer 环境中使用`
7. `runner 只将最终分数为核心的结果摘要返回给 ARY`

## 3. 产品边界与数据边界

### 3.1 ARY 的责任

ARY 只负责：

1. 接收 user 提交
2. 创建评测任务
3. 管理任务状态与任务队列
4. 向 runner 提供待拉取任务
5. 接收 runner 返回的结果摘要
6. 更新进度榜单、赛后 Harness 榜单和公开展示

ARY 不负责：

1. 执行 organizer 私有测试
2. 执行 organizer 私有评分逻辑
3. 长期保存 organizer 私有评测资产

### 3.2 organizer 的责任

organizer 负责：

1. 准备私有测试数据
2. 准备评分脚本
3. 准备私有业务数据
4. 部署 ARY 官方 runner
5. 维护本地评测环境可用性

### 3.3 private runner 的责任

runner 负责：

1. 注册与心跳
2. 拉取待评测任务
3. 下载任务输入引用
4. 在企业环境中执行评测
5. 回传最终结果摘要

runner 不负责：

1. 对外暴露公网入口
2. 回传 organizer 私有测试正文
3. 回传评分脚本正文
4. 回传私有业务数据正文

### 3.4 Metadata 定义

本文档中的 `metadata` 仅指：

1. `submission_id`
2. `team_id`
3. `race_id`
4. 上传时间
5. 文件名
6. 文件大小
7. 文件哈希
8. 临时输入引用
9. 任务状态
10. `task_type`

`metadata` 不包括：

1. 原始代码正文
2. Riding Record 正文
3. 隐藏测试
4. 评分脚本
5. 私有业务数据
6. 完整日志

## 4. 部署模型

### 4.1 最小部署形态

POC 推荐的唯一最小形态：

1. 一个 `Docker container`
2. 运行在 organizer 控制的 Linux 主机、VM、ECS 或 Kubernetes 节点中
3. 拥有对 ARY API 的出站访问能力
4. 拥有对本地私有评测目录的读取权限

### 4.2 当前不要求的能力

当前 POC 不要求：

1. 多节点 runner 集群
2. 分布式调度
3. 自动弹性扩缩容
4. 多租户隔离平台
5. 企业自定义 runner 实现

## 5. 原始提交落点

当前 POC 固定采用：

`ARY temporary relay + organizer private runner`

即：

1. user 原始代码先进入 ARY 临时待评测队列
2. 对于 `harness_eval`，Riding Record 也进入 ARY 临时待评测队列
3. ARY 创建任务后由 runner 拉取
4. runner 拉取并完成评测后，ARY 删除原始内容或仅保留哈希、状态、分数和公开投影

当前 POC 不采用：

1. user 直传 organizer 对象存储
2. ARY 长期保存原始提交内容

## 6. 任务类型

当前 POC 固定三类任务：

1. `submission_test`
2. `progress_eval`
3. `harness_eval`

### 6.1 `submission_test`

- 对应 Rider 主动测试或提交后的本次测试结果
- 输入只需要代码提交
- 不要求 Riding Record

### 6.2 `progress_eval`

- 对应赛中按颗粒度更新的进度榜单
- 输入只需要代码提交
- 不要求 Riding Record

### 6.3 `harness_eval`

- 对应 PRD 中赛后驾驭能力 / Harness 能力评价流程
- 输入需要代码提交
- 输入需要 Riding Record

## 7. 任务输入协议

runner 拉到的任务至少包含：

```json
{
  "task_id": "task_001",
  "task_type": "progress_eval",
  "race_id": "race_123",
  "team_id": "team_a",
  "submission_id": "sub_888",
  "metadata": {
    "uploaded_at": "2026-06-06T10:00:00Z",
    "file_name": "solution.zip",
    "file_size": 20480,
    "file_hash": "sha256:...",
    "status": "queued",
    "attempt_no": 1
  },
  "input_refs": {
    "code_bundle_url": "https://ary/...signed-url..."
  },
  "execution_policy": {
    "timeout_seconds": 300,
    "max_memory_mb": 2048
  }
}
```

补充约束：

1. `code_bundle_url`：三类任务都可以出现
2. `riding_record_url`：只在 `harness_eval` 中出现
3. 私有测试、评分脚本和私有业务数据不通过任务输入下发
4. runner 必须从本地挂载目录读取私有评测资产

## 8. 结果输出协议

runner 返回给 ARY 的结果摘要收口为：

```json
{
  "task_id": "task_001",
  "submission_id": "sub_888",
  "status": "succeeded",
  "score": 79.4,
  "runner_comment": "边界验证不足，建议补充极端输入测试",
  "result_hash": "sha256:...",
  "finished_at": "2026-06-06T10:02:00Z"
}
```

说明：

1. `score` 是唯一必需的结果数值
2. `runner_comment` 是可选单段摘要
3. 不再要求分项分数对象
4. 不再要求榜单投影对象
5. 不再要求多段公开反馈对象

### 8.1 `score` 语义

- `submission_test`
  - 本次测试结果分数
- `progress_eval`
  - 本次进度榜单分数
- `harness_eval`
  - 本次赛后 Harness 榜单分数

## 9. 任务状态机

当前 POC 最小状态机：

```text
queued -> claimed -> downloading -> evaluating -> reporting -> succeeded
claimed/evaluating/reporting -> failed
claimed/evaluating -> lease_expired -> queued
```

状态语义：

1. `queued`
   - 任务已创建，等待 runner 拉取
2. `claimed`
   - 任务已被某个 runner 占有
3. `downloading`
   - runner 正在下载代码包，必要时下载 Riding Record
4. `evaluating`
   - runner 在企业环境中执行评测
5. `reporting`
   - runner 正在回传最终结果摘要
6. `succeeded`
   - ARY 成功接收结果，可用于更新对应榜单
7. `failed`
   - 任务失败，记录错误摘要
8. `lease_expired`
   - runner 超时或崩溃，任务重新进入队列

## 10. 榜单更新方式

当前 POC 中，榜单更新是：

`按任务完成后的颗粒度 / checkpoint / 准实时更新`

而不是：

`user 每次代码变更后实时重排`

具体语义如下：

1. `submission_test`
   - 不自动等同于公开榜单刷新
2. `progress_eval`
   - 成功后更新进度榜单
3. `harness_eval`
   - 成功后更新赛后 Harness 榜单

因此 runner 方案支持的是：

`准实时榜单`

不是：

`逐代码变更实时榜单`

## 11. 安全约束

### 11.1 runner 必须满足

1. 只在 organizer 控制的环境中运行
2. 私有测试资产仅从本地挂载目录读取
3. 不回传私有测试正文
4. 不回传私有评分规则正文
5. 不回传私有业务数据正文
6. 不默认回传完整 stdout / stderr
7. 不默认回传完整 user 原始代码正文
8. 不默认回传 Riding Record 全文
9. 不在日志中输出私有测试内容
10. 不在日志中输出私有业务数据内容
11. 不在日志中输出完整选手代码正文
12. 不在日志中输出 Riding Record 全文

### 11.2 ARY 必须满足

1. 只对原始提交做临时中转
2. 评测结束后删除原始内容或仅保留哈希
3. 长期只保留元数据、状态、分数、排名和可公开反馈
4. platform operator 和普通评委不能读取 organizer 私密评测资产

## 12. POC 不包含的内容

当前方案不包含：

1. 企业自定义 runner 协议实现
2. ARY 托管评测执行环境
3. 企业对象存储直传
4. 多 runner 集群编排
5. 复杂权限矩阵
6. 平台内置通用评分引擎

## 13. 后续可扩展方向

POC 通过后，可扩展方向包括：

1. 允许企业使用 runner SDK / API 协议自研 runner
2. 改造为 user 直传 organizer 控制存储
3. 支持多个 runner worker
4. 支持更细粒度的结果签名与审计链

## 14. 当前结论

当前 runner 方案结论如下：

1. `runner 由 ARY 提供官方标准镜像`
2. `runner 由 organizer 自己部署`
3. `runner 在 organizer 环境中执行私有评测`
4. `runner 采用 pull 模式从 ARY 拉任务`
5. `ARY 对原始提交仅临时中转`
6. `runner 只向 ARY 回传最终分数为核心的结果摘要`
7. `榜单采用按任务完成后的颗粒度 / checkpoint / 准实时更新`
