# Organizer 演示 Runner

这个目录保存排序题 PoC 使用的 Organizer 私有 Runner。

## 环境准备

先用 `.env.example` 复制出本地 `.env`：

```powershell
Copy-Item .env.example .env
```

默认种子赛事 ID 是 `race_sort_demo`。

## 启动

先启动 ARY 应用，再在本目录执行：

```powershell
npm install
npm run start
```

这个 Worker 会：

1. 轮询 `GET /api/runner/tasks/pull?raceId=race_sort_demo`
2. 对提交的 `solve(input)` 实现执行隐藏排序用例
3. 把最终分数回传到 `POST /api/runner/tasks/result`

`HARNESS_EVAL` 在本次 PoC 中故意不支持，收到后会直接按失败回传。
