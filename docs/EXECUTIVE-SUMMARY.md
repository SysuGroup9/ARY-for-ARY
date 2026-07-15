# ARY — 执行摘要

> 面向 GRS002/003/004 评审高分区的商业展示叙事

---

## 一、一页定位

**ARY（Agent Racing Yard）** 是全球首个以"驾驭 AI Agent"为核心竞赛能力的去中心化智能体赛事平台。

**核心命题**：在一块赛事大屏是否可以由可信数据、可信赛道几何和可维护资产流程驱动？

**回答：可以。** 我们构建了完整的赛事系统（GRS001）、赛马大屏可视化子系统（GRS002）、以及 Gallery-first 公开站点 + 多角色控制台（GRS003/004）。三条链路全部可运行、可演示、可复核。

**一句话**：Ride Agents. Build the Future.

---

## 二、一条可信数据链

```
ARY 数据库 (Prisma + SQLite)
  → Server Action 触发 → Adapter 映射 → RaceSnapshot JSON
    → track-runtime (Catmull-Rom 平滑 + s→点采样 + 车道偏移)
      → HorsePose { x, y, rotation, s, laneId, state }
        → JumbotronClient SVG 渲染 (16:9 大屏)
```

**关键数字**：

| 指标 | 数值 |
|------|------|
| 代码规模 | 31 文件，~4,260 行 TypeScript/TSX/CSS |
| 页面路由 | 22+ 路由（公开端 15 + 控制台 7） |
| 数据模型 | 35+ Prisma 模型，8 个枚举 |
| 角色体系 | 4 角色（Admin/Organizer/Judge/Rider）+ Public |
| 测试覆盖 | 51 单元测试 + 35 E2E，100% 通过 |
| 赛道资产 | 2 条可用赛道（oval + circuit），schema + geometry 校验通过 |

**完整数据流**：从 ARY 赛事数据库 → Adapter 映射 → RaceSnapshot JSON → track-runtime 位置计算 → Jumbotron SVG 渲染。**没有一匹马的位置是手写的 x/y，没有一个排名是从图片推断的。**

---

## 三、一组可复核验收证据

### 3.1 可运行 Demo

```bash
npm run db:seed && npm run dev
# → http://localhost:3000
```

| 演示入口 | 说明 |
|---------|------|
| `/` | 公开首页（Hero + 赛事画廊 + 优秀骑手 + 合作入口） |
| `/races` | 赛事列表（Tab 切换 + 搜索） |
| `/races/sorting-challenge/live` | Live Hall 实况大厅 |
| `/console` | 控制台入口（分角色） |
| `/jumbotron/race_active` | Jumbotron 赛马大屏 |
| `/calibrator` | Track Profile Calibrator |
| `/riders` | 骑手画廊（拍立得墙） |

### 3.2 赛道资产

```
public/assets/tracks/
├── oval-track/    (background.svg + track.profile.json + notes.md + source.prompt.md)
└── circuit-track/ (background.svg + track.profile.json + notes.md + source.prompt.md)
```

两条赛道均通过 Calibrator 的 schema + geometry validation（15+ 项检查），可直接被 Jumbotron 加载。

### 3.3 验收清单

- [x] Race 8 状态机（draft→published→registration→running→submitting→judging→completed→archived）
- [x] 4 角色体系 + 权限矩阵（Admin/Organizer/Judge/Rider）
- [x] 22+ 路由（公开端 15 + 控制台 7）
- [x] Jumbotron 赛马大屏（SVG 渲染 + track-runtime 位置计算）
- [x] Calibrator 赛道校准器（SVG 编辑器 + Validate + Export）
- [x] GitHub OAuth 登录（含代理容错）
- [x] CA Connector 最小闭环（handshake + signals + snapshot fetch）
- [x] Team 参赛模型 + 双审批 + 任务看板 + 队内私聊 + 知识库
- [x] 防伪与防篡改链（P1-A 至 P2-E）
- [x] 友好错误页面（6 组中文化错误提示）
- [x] UI 设计系统（Minimalist Modern 令牌 + 响应式）
- [x] `npx tsc --noEmit` 零错误
- [x] `npm run build` 通过
- [x] `npm run db:seed` 通过

### 3.4 验证命令

```bash
npm run qa:p0          # 51 单元测试 + 35 E2E 回归
npx tsc --noEmit       # TypeScript 零错误
npm run build           # Production build
```

---

## 四、文档索引

| 路径 | 内容 |
|------|------|
| `docs/grs001/` | GRS001 产品需求 + 路线图 |
| `docs/grs002/` | GRS002 Jumbotron 作品说明 + Demo 指南 + 视频脚本 + UML |
| `docs/grs003/` | GRS003 原有文档（历史痕迹） |
| `docs/grs004/` | GRS003/004 领域分析 + PRD + IA + 权限矩阵（权威参考） |
| `docs/superpowers/` | 实时状态跟踪 + 实现计划 |
| `docs/design/` | 设计理念文档 |
| `riding_record/` `riding_record_grs004/` | Agent Riding Records |

---

*生成日期：2026-07-15*
