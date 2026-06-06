# ARY Private Runner 部署说明（按当前 PRD 收口的 POC）

日期：2026-06-06

## 1. 文档目的

本文档用于指导 organizer 在自己的环境中部署 `ARY 官方标准 private runner 镜像`。

本文档只面向当前已经确认的 POC 方案：

1. ARY 提供官方标准 runner 镜像
2. organizer 自己部署 runner
3. runner 采用 pull 模式从 ARY 拉任务
4. ARY 对原始提交只做临时中转
5. runner 在企业环境中执行私有评测

本文档不覆盖：

1. 企业自研 runner
2. 直传 organizer 对象存储
3. 多 runner 集群编排

## 2. 部署目标

部署完成后，runner 应具备以下能力：

1. 成功向 ARY 注册
2. 定时发送心跳
3. 主动拉取待评测任务
4. 访问企业本地私有测试与评分目录
5. 本地执行三类任务：
   - `submission_test`
   - `progress_eval`
   - `harness_eval`
6. 回传最终分数为核心的结果摘要到 ARY

## 3. 最小运行要求

### 3.1 主机要求

建议最小要求：

1. Linux 主机
2. 已安装 Docker
3. 可访问 ARY API 的出站网络
4. 可挂载本地目录

POC 阶段建议最低资源：

1. CPU：2 vCPU
2. 内存：4 GB
3. 磁盘：20 GB

### 3.2 网络要求

runner 只需要：

1. 主动访问 ARY API
2. 主动下载 ARY 提供的临时输入引用

runner 不需要：

1. 暴露公网接收接口
2. 允许 ARY 主动连入企业网络

### 3.3 Docker 要求

要求支持：

1. 拉取镜像
2. 以环境变量启动容器
3. 挂载本地目录
4. 查看容器日志

## 4. 本地目录准备

建议准备以下目录：

```text
/opt/ary/tests
/opt/ary/scoring
/opt/ary/data
/opt/ary/rules
/opt/ary/feedback
/opt/ary/workdir
/opt/ary/logs
```

目录说明：

1. `/opt/ary/tests`
   - 隐藏测试与最终测试

2. `/opt/ary/scoring`
   - 评分脚本与得分逻辑

3. `/opt/ary/data`
   - organizer 私有业务数据

4. `/opt/ary/rules`
   - 进度评价规则
   - Harness 评价规则

5. `/opt/ary/feedback`
   - 可公开反馈模板，可选

6. `/opt/ary/workdir`
   - runner 执行任务的临时工作目录

7. `/opt/ary/logs`
   - 本地脱敏日志目录，可选

## 5. 环境变量模板

建议使用 `.env` 或等价方式管理。

最小模板如下：

```dotenv
RUNNER_ID=runner_sz_01
ORG_ID=org_001
RUNNER_TOKEN=replace_with_runner_token
ARY_API_BASE=https://ary.example.com

POLL_INTERVAL_SECONDS=10
MAX_CONCURRENT_JOBS=1
JOB_CLAIM_TIMEOUT_SECONDS=300

WORKDIR=/app/workdir
JOB_TIMEOUT_SECONDS=300
MAX_MEMORY_MB=2048
MAX_OUTPUT_SIZE_MB=20

TESTS_DIR=/app/tests
SCORING_DIR=/app/scoring
PRIVATE_DATA_DIR=/app/data
RULES_DIR=/app/rules
FEEDBACK_DIR=/app/feedback

RESULT_SIGNING_KEY=replace_with_signing_key

LOG_LEVEL=info
MASK_SENSITIVE_LOGS=true
```

说明：

- 不再保留 `UPLOAD_PUBLIC_ARTIFACTS` 作为默认示例配置
- 公开展示内容由 ARY 根据结果摘要生成，不要求 runner 主动上传公开 artifact

## 6. Docker 启动示例

### 6.1 拉取镜像

```bash
docker pull ary/private-runner:0.1.0
```

### 6.2 启动命令示例

```bash
docker run -d \
  --name ary-private-runner \
  --restart unless-stopped \
  --env-file /opt/ary/runner.env \
  -v /opt/ary/tests:/app/tests:ro \
  -v /opt/ary/scoring:/app/scoring:ro \
  -v /opt/ary/data:/app/data:ro \
  -v /opt/ary/rules:/app/rules:ro \
  -v /opt/ary/feedback:/app/feedback:ro \
  -v /opt/ary/workdir:/app/workdir \
  -v /opt/ary/logs:/app/logs \
  ary/private-runner:0.1.0
```

### 6.3 启动说明

1. 私有测试与评分目录建议只读挂载
2. `workdir` 需要可写
3. `logs` 可留本地，但必须遵守脱敏要求

## 7. 首次部署流程

推荐顺序：

1. organizer 在 ARY 创建账号
2. organizer 在 ARY 中创建 Race
3. ARY 签发 `RUNNER_ID` 和 `RUNNER_TOKEN`
4. 企业主机准备本地目录
5. 企业将私有测试、评分脚本和私有数据放入目录
6. 企业创建环境变量文件
7. 企业拉取官方 runner 镜像
8. 企业执行 Docker 启动命令
9. 检查 runner 是否成功注册与心跳

## 8. 部署后检查

### 8.1 容器状态检查

```bash
docker ps
```

预期：

1. 容器处于 `Up`
2. 没有持续重启

### 8.2 容器日志检查

```bash
docker logs --tail 200 ary-private-runner
```

预期至少包含：

1. runner 启动成功
2. 注册成功
3. 心跳成功
4. 空轮询或任务拉取成功

不应出现：

1. 私有测试正文
2. 私有业务数据正文
3. 完整选手代码正文
4. Riding Record 全文

### 8.3 网络连通性检查

至少确认：

1. runner 能访问 `ARY_API_BASE`
2. runner 能获取短期任务输入引用

### 8.4 目录挂载检查

进入容器确认目录存在：

```bash
docker exec -it ary-private-runner sh
```

检查：

```bash
ls /app/tests
ls /app/scoring
ls /app/data
ls /app/rules
ls /app/workdir
```

## 9. 安全要求

### 9.1 主机级要求

1. runner 主机应由 organizer 控制
2. runner 主机不应暴露不必要公网端口
3. 非必要人员不得直接访问私有测试目录

### 9.2 目录权限要求

1. `/opt/ary/tests` 只允许授权人员维护
2. `/opt/ary/scoring` 只允许授权人员维护
3. `/opt/ary/data` 只允许授权人员维护
4. `/opt/ary/workdir` 可写，但要定期清理

### 9.3 日志要求

runner 日志不得输出：

1. organizer 私有测试正文
2. organizer 私有业务数据正文
3. 完整评分脚本正文
4. 完整选手原始代码正文
5. Riding Record 全文

### 9.4 token 管理要求

1. `RUNNER_TOKEN` 不应写入公开脚本仓库
2. `RUNNER_TOKEN` 不应出现在截图或日志中
3. token 泄漏时应能由 ARY 后台吊销并重新签发

## 10. 运维建议

### 10.1 单节点 POC 推荐配置

建议：

1. `MAX_CONCURRENT_JOBS=1`
2. `POLL_INTERVAL_SECONDS=10`
3. `JOB_TIMEOUT_SECONDS=300`

这样最容易定位问题，也避免多个任务并发带来的混乱。

### 10.2 升级方式

升级镜像建议：

1. 停止当前容器
2. 拉取新镜像
3. 使用同一配置重新启动
4. 验证注册、心跳、拉任务正常

### 10.3 清理策略

建议定期清理：

1. `workdir` 中的历史临时文件
2. 已归档的本地脱敏日志

## 11. 常见故障排查

### 11.1 runner 无法注册

检查：

1. `RUNNER_ID` 是否正确
2. `RUNNER_TOKEN` 是否正确
3. `ARY_API_BASE` 是否可访问
4. 企业网络是否允许出站访问

### 11.2 runner 没有任务可拉

检查：

1. ARY 是否有待评测任务
2. `ORG_ID` 是否和 Race 归属一致
3. runner 是否支持对应任务类型

### 11.3 任务拉到后执行失败

检查：

1. `/app/tests` 是否挂载正确
2. `/app/scoring` 是否挂载正确
3. `/app/data` 是否挂载正确
4. `RULES_DIR` 中是否存在对应任务规则
5. `JOB_TIMEOUT_SECONDS` 是否过小

### 11.4 结果回传失败

检查：

1. runner 与 ARY 的网络连通性
2. 结果 JSON 是否符合 `runner-api.md`
3. `RESULT_SIGNING_KEY` 是否正确

### 11.5 容器反复重启

检查：

1. 环境变量是否缺失
2. 挂载目录是否不存在
3. 容器是否有写权限访问 `workdir`

## 12. 交付清单

企业完成部署时，最小交付应包含：

1. 一台已运行 runner 的企业主机或容器实例
2. 已准备好的私有测试目录
3. 已准备好的评分脚本目录
4. 已准备好的规则目录
5. 已配置完成的环境变量文件
6. 成功注册和心跳的 runner 实例

## 13. 当前结论

当前 POC 部署结论如下：

1. 企业不需要开发 runner
2. 企业只需要部署 ARY 官方 runner 镜像
3. 企业需要准备私有评测资产和本地目录
4. runner 以出站方式连接 ARY
5. runner 通过本地挂载访问 organizer 私有数据
6. runner 处理 `submission_test / progress_eval / harness_eval`
7. 部署形态以单节点 Docker 容器为准
