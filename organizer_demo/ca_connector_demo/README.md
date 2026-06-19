# CA Connector Demo

这个目录提供一个最小可运行的 real agent / CA connector 演示，用来打通 ARY 当前已经存在的三段运行时链路：

- 调用 ARY `handshake` API 完成连接登记确认
- 调用 ARY `signals` API 推送真实 riding signal
- 在本地暴露 `snapshot` HTTP 接口，供 ARY 通过 Rider 控制台手动抓取

## 目录作用

该 demo 不是生产 SDK，也不是长期 connector 架构，只是一个最小闭环演示器，方便在本地把 `GitHub OAuth + real agent` 任务中的“真实 agent 接入”部分快速跑通。

## 运行前准备

1. 先在 ARY 根目录完成依赖、Prisma 生成、迁移和 seed。
2. 启动 ARY 开发服务。
3. 以 Rider 身份登录，进入 `CA 接入` 页面。
4. 为某个已生成的 `RaceProject` 登记一条 `CAConnection`。
5. 从 Rider 页面抄下这些字段，写入本目录 `.env`：
   - `CA_CONNECTION_ID`
   - `CA_CONNECTOR_SECRET`
   - `CA_PROJECT_ID`
   - `CA_RACE_ID`
   - `CA_REGISTRATION_ID`
   - `CA_RACE_PROJECT_ID`

## 环境变量

先复制：

```bash
copy .env.example .env
```

然后补齐：

```env
ARY_BASE_URL=http://localhost:3000
CA_CONNECTOR_BASE_URL=http://localhost:4010
CA_CONNECTION_ID=replace-with-caconnection-id
CA_CONNECTOR_SECRET=replace-with-connector-secret
CA_PROJECT_ID=replace-with-ca-project-id
CA_CONNECTOR_ID=codex_connector_demo
CA_CONNECTOR_VERSION=0.1.0
CA_SESSION_ID=codex_session_demo_001
CA_RACE_ID=replace-with-race-id
CA_REGISTRATION_ID=replace-with-registration-id
CA_RACE_PROJECT_ID=replace-with-race-project-id
CA_TYPE=CODEX
PORT=4010
```

说明：

- `CA_CONNECTOR_BASE_URL` 必须和 Rider 页里登记的 `Connector Base URL` 一致。
- `CA_SESSION_ID` 是稍后在 Rider 控制台里手动输入抓取 snapshot 的会话 ID。
- `PORT` 默认 `4010`，与 `CA_CONNECTOR_BASE_URL` 保持一致即可。

## 安装与启动

```bash
npm install
npm run start
```

启动后会自动执行：

1. 启动本地 snapshot server
2. 向 ARY 发送 handshake
3. 向 ARY 发送 `session_started`
4. 向 ARY 发送 `task_progress`
5. 等待 Rider 控制台手动抓取 snapshot

## 验收路径

1. 在 ARY Rider 控制台确认该连接的“握手”状态变成已完成。
2. 在 ARY 过程视图里确认出现 session / signal 数据。
3. 在 Rider 控制台的 `CA Session ID` 输入框填入 `.env` 里的 `CA_SESSION_ID`。
4. 点击 `抓取快照`。
5. 确认 ARY 中出现 session summary evidence，并且过程投影刷新。

## 当前边界

- 这是单连接、单 session 的静态 demo，不做多 session 编排。
- snapshot 内容是本地构造的固定 payload，用于演示 fetch 链路，不代表真实 connector 完整状态机。
- 该 demo 默认会直接把 connector secret 用在本地请求头中，只适合本地演示，不适合生产部署。
