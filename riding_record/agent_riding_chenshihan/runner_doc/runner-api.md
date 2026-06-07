# ARY Private Runner API（按当前 PRD 收口的 POC 约束）

日期：2026-06-06

## 1. 文档目的

本文档定义 `ARY` 与 `organizer private runner` 之间在当前 POC 阶段采用的接口约束。

本文档遵循以下前提：

1. 以当前 `PRD.md` 的产品边界为准
2. 保留 `ARY temporary relay + organizer private runner` 这套 POC 方案骨架
3. 不回退到 `PRD.md` 中更旧、更抽象的实现描述
4. 不把本文档当成当前仓库代码接口的逐字快照

本文档只定义：

1. PRD 核心业务接口
2. POC 补充控制面接口
3. 任务输入、结果回传和安全边界

本文档不定义：

1. 企业自研 runner 扩展协议
2. user 直传 organizer 对象存储
3. 多 runner 集群调度优化

## 2. 总体边界

### 2.1 当前固定方案

当前 POC 固定采用：

- `runner pull from ARY`
- `ARY 临时中转原始提交`

即：

1. user 原始提交先进入 ARY 的临时待评测队列
2. private runner 主动从 ARY 拉取任务
3. private runner 在 organizer 控制环境中完成评测
4. runner 只把最终结果摘要回传给 ARY
5. ARY 长期只保留元数据、状态、分数和公开展示投影

### 2.2 数据边界

ARY API 不返回：

1. organizer 私有测试正文
2. organizer 私有评分脚本正文
3. organizer 私有业务数据正文
4. 默认完整日志

runner 回传结果时也不得提交以上内容。

### 2.3 Metadata 定义

本文档中的 `metadata` 仅指任务与提交的描述信息，例如：

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
6. 完整 stdout / stderr

## 3. 接口分层

当前 runner 相关接口分成两层。

### 3.1 PRD 核心业务接口

这两条接口直接对应 `PRD.md` 中的 Runner 主流程：

1. `GET /api/runner/tasks/pull`
2. `POST /api/runner/tasks/result`

### 3.2 POC 补充控制面接口

以下接口属于 POC runner 的补充控制面，用于让 pull 模式下的 runner 更稳定地注册、保活、续租和失败上报：

1. `POST /api/runner/v1/register`
2. `POST /api/runner/v1/heartbeat`
3. `POST /api/runner/v1/tasks/{task_id}/renew`
4. `POST /api/runner/v1/tasks/{task_id}/status`
5. `POST /api/runner/v1/tasks/{task_id}/fail`

说明：

- 控制面接口不是 PRD 对外核心接口
- 它们是 POC 方案的内部控制面补充
- 本文档不再把 `POST /api/runner/v1/tasks/claim` 作为主入口接口

## 4. 任务模型

### 4.1 Task

一个待评测任务至少包含：

```json
{
  "task_id": "task_001",
  "task_type": "progress_eval",
  "race_id": "race_123",
  "team_id": "team_a",
  "submission_id": "sub_888",
  "status": "queued",
  "attempt_no": 1
}
```

### 4.2 任务类型

当前 POC 固定定义三类任务：

1. `submission_test`
2. `progress_eval`
3. `harness_eval`

语义如下：

- `submission_test`
  - 对应 Rider 主动点击测试或提交后的本次测试结果
- `progress_eval`
  - 对应赛中按颗粒度更新的进度榜单任务
- `harness_eval`
  - 对应赛后驾驭能力 / Harness 能力评价任务

### 4.3 任务输入边界

三类任务输入不是完全相同的：

- `submission_test`
  - 只需要代码提交
  - 不要求 Riding Record
- `progress_eval`
  - 只需要代码提交
  - 不要求 Riding Record
- `harness_eval`
  - 需要代码提交
  - 需要 Riding Record

因此，文档中不得再默认暗示“所有任务都携带 Riding Record”。

## 5. PRD 核心业务接口

## 5.1 拉取待评测任务

### Endpoint

```http
GET /api/runner/tasks/pull?raceId=<race_id>
```

### Header

推荐最小 Header：

```http
Authorization: Bearer <RUNNER_TOKEN>
X-Runner-Id: <RUNNER_ID>
X-Org-Id: <ORG_ID>
```

### 用途

private runner 主动从 ARY 拉取一个待评测任务。

### 成功响应体

```json
{
  "task": {
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
}
```

如果 `task_type` 为 `harness_eval`，`input_refs` 允许额外包含：

```json
{
  "riding_record_url": "https://ary/...signed-url..."
}
```

### 无任务响应体

```json
{
  "task": null,
  "retry_after_seconds": 10
}
```

## 5.2 回传任务结果

### Endpoint

```http
POST /api/runner/tasks/result
```

### Header

```http
Authorization: Bearer <RUNNER_TOKEN>
X-Runner-Id: <RUNNER_ID>
X-Org-Id: <ORG_ID>
Content-Type: application/json
```

### 用途

runner 向 ARY 提交一个任务的最终结果摘要。

### 请求体

```json
{
  "task_id": "task_001",
  "submission_id": "sub_888",
  "status": "succeeded",
  "score": 79.4,
  "runner_comment": "边界验证不足，建议补充极端输入测试",
  "result_hash": "sha256:...",
  "finished_at": "2026-06-06T10:05:00Z"
}
```

### 字段说明

必填字段：

1. `task_id`
2. `submission_id`
3. `status`
4. `score`

可选字段：

1. `runner_comment`
2. `result_hash`
3. `finished_at`

### `score` 语义

- `submission_test`
  - 本次测试结果分数
- `progress_eval`
  - 本次进度榜单分数
- `harness_eval`
  - 本次赛后 Harness 榜单分数

### 响应体

```json
{
  "task_id": "task_001",
  "accepted": true,
  "final_status": "succeeded"
}
```

### 榜单更新语义

- `progress_eval` 成功后，ARY 更新进度榜单
- `harness_eval` 成功后，ARY 更新赛后 Harness 榜单
- `submission_test` 不自动等同于公开榜单刷新

### 结果回传约束

禁止通过该接口回传：

1. organizer 私有测试正文
2. organizer 私有评分脚本正文
3. organizer 私有业务数据正文
4. 默认完整 stdout / stderr
5. 默认完整 user 原始代码正文
6. 默认 Riding Record 全文

## 6. POC 补充控制面接口

## 6.1 注册 runner

### Endpoint

```http
POST /api/runner/v1/register
```

### 用途

runner 首次启动或重启后，向 ARY 注册自身信息。

### 请求体

```json
{
  "runner_id": "runner_sz_01",
  "org_id": "org_001",
  "hostname": "ecs-prod-01",
  "version": "0.1.0",
  "capabilities": {
    "max_concurrent_jobs": 2,
    "supports_submission_test": true,
    "supports_progress_eval": true,
    "supports_harness_eval": true
  }
}
```

## 6.2 runner 心跳

### Endpoint

```http
POST /api/runner/v1/heartbeat
```

### 用途

runner 周期性上报自身在线状态。

## 6.3 续租任务

### Endpoint

```http
POST /api/runner/v1/tasks/{task_id}/renew
```

### 用途

runner 在任务执行时间较长时续租，避免任务被重新放回队列。

## 6.4 上报任务状态

### Endpoint

```http
POST /api/runner/v1/tasks/{task_id}/status
```

### 用途

runner 在下载、执行、回传等阶段更新中间状态。

### 允许上报的状态

1. `claimed`
2. `downloading`
3. `evaluating`
4. `reporting`
5. `failed`

`succeeded` 必须通过 `POST /api/runner/tasks/result` 完成。

## 6.5 上报任务失败

### Endpoint

```http
POST /api/runner/v1/tasks/{task_id}/fail
```

### 用途

runner 在无法完成任务时，显式结束失败任务。

## 7. 任务状态机

POC 固定状态集合：

```text
queued
claimed
downloading
evaluating
reporting
succeeded
failed
lease_expired
```

状态流转规则：

```text
queued -> claimed -> downloading -> evaluating -> reporting -> succeeded
claimed/evaluating/reporting -> failed
claimed/evaluating -> lease_expired -> queued
```

## 8. 错误码建议

POC 建议至少支持以下错误码：

1. `AUTH_FAILED`
2. `RUNNER_NOT_REGISTERED`
3. `NO_AVAILABLE_TASK`
4. `LEASE_INVALID`
5. `LEASE_EXPIRED`
6. `INPUT_DOWNLOAD_FAILED`
7. `EXEC_TIMEOUT`
8. `EXEC_RUNTIME_ERROR`
9. `RESULT_VALIDATION_FAILED`
10. `RESULT_SUBMIT_FAILED`

## 9. 幂等性要求

### 9.1 pull

同一任务同一时刻只能被一个 runner 成功占有。

### 9.2 result

`result` 接口必须支持幂等处理。

如果 runner 因网络抖动重复提交同一 `task_id + submission_id + result_hash`，ARY 不应重复记分。

### 9.3 fail

`fail` 接口也应支持幂等处理。

## 10. 安全要求

1. 所有接口必须走 HTTPS
2. 所有接口必须要求 runner token
3. 所有任务输入引用必须短期有效
4. ARY 日志不得打印完整敏感载荷
5. 结果接口不得接收私有原文内容

## 11. 与榜单的关系

ARY 只有在收到 `result` 接口的成功响应后，才可以：

1. 更新队伍当前成绩
2. 按任务类型更新对应公开榜单或赛后榜单
3. 推送前端榜单变化

因此榜单更新的真实触发点是：

`runner 成功回传最终结果摘要`

而不是：

`user 每次代码变更`

## 12. 当前结论

当前 POC API 结论如下：

1. PRD 核心业务接口固定为 `pull` 和 `result`
2. POC 控制面补充 `register / heartbeat / renew / status / fail`
3. 任务类型固定为 `submission_test / progress_eval / harness_eval`
4. Riding Record 只在 `harness_eval` 中作为必需输入
5. runner 只向 ARY 回传最终分数为核心的结果摘要
6. 任务完成后，ARY 才更新对应榜单和展示
