# ARY GRS 002

这是 GRS-002 Jumbotron 子系统的入口文档。完整设计、演示与提交材料已经拆分到本目录下，避免重复维护根目录说明和作品说明文档。

## 文档入口

- `Jumbotron-PRD.md`：完整作品说明与架构细节
- `Jumbotron信息架构.md`：前置信息架构
- `Jumbotron子系统定义.md`：前置子系统定义
- `DEMO-GUIDE.md`：Demo 演示流程
- `VIDEO-SCRIPT.md`：视频脚本
- `GRS-002-riding-record.md`：Riding Record
- `assets/`：快照与赛道资产说明

## 快速开始

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name add-track-and-progress-fields
npx prisma generate
npm run db:seed
npm run dev
```

访问入口：

- `/`：公开首页与 Jumbotron 横幅
- `/jumbotron/[raceId]`：全屏大屏
- `/calibrator`：赛道校准工具

## 演示账号

运行 `npm run db:seed` 后可使用：

- Organizer：`organizer_demo / organizer123`
- Rider：`rider_alice` ~ `rider_olivia`，密码均为 `rider123`

更完整的赛事和账号说明见 `Jumbotron-PRD.md`。
