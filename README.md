# ARY GRS 002 — Jumbotron 赛马大屏子系统

> 一块由 RaceSnapshot、Track Profile 和 Riding Message 驱动的赛事大屏——马匹位置全链路计算，赛道几何经 Calibrator 人工校准，数据经 Adapter 映射入轨，不写死一个坐标。

基于 `Next.js 16 + Prisma 7 + SQLite`，并入现有 ARY 项目。包含 Jumbotron Race Live View（运行时大屏）、Track Profile Calibrator（设计时 SVG 编辑器）和 track-runtime（共享位置计算包）。

---

## 快速开始

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name add-track-and-progress-fields
npx prisma generate
npm run db:seed
npm run dev
```

打开 `http://localhost:3000`，主页顶部即见 Jumbotron 赛马横幅轮播。

## 演示视频

[![ARY GRS 002 Jumbotron 演示](https://img.shields.io/badge/Bilibili-演示视频-00a1d6?logo=bilibili)](https://www.bilibili.com/video/BV1GYJ561Eb1/?vd_source=1b134e71774d2264b0206c4267e3e406)

---

## 演示账号

先执行：

```bash
npm run db:seed
```

seed 会写入 1 个 Organizer 账号，以及覆盖三场演示比赛中所有展示成员的 Rider 测试账号。也就是说，页面里出现的 captain、助理、组员现在都对应真实可登录账号。

| 角色      | 用户名范围                                                | 密码             | 说明 |
| --------- | --------------------------------------------------------- | ---------------- | ---- |
| Organizer | `organizer_demo`                                          | `organizer123`   | 唯一 Organizer 示例账号 |
| Rider     | `rider_alice` ~ `rider_olivia`                            | `rider123`       | 15 个队长账号 |
| Rider     | `rider_active_assistant_01` ~ `rider_active_assistant_08` | `rider123`       | 进行中比赛的助理账号 |
| Rider     | `rider_signup_member_01` ~ `rider_signup_member_03`       | `rider123`       | 报名中比赛的组员账号 |
| Rider     | `rider_finished_member_01` ~ `rider_finished_member_06`   | `rider123`       | 已结束比赛的组员账号 |

### 三场演示比赛与账号关系

`prisma/seed.ts` 会生成 3 场演示比赛：

- `race_active`：正在进行中的“排序算法挑战赛”
- `race_signup`：报名中的“API 设计大赛”
- `race_finished`：已结束的“性能优化马拉松”

这 3 场比赛里页面展示出来的所有队伍成员，现在都对应数据库中的独立 `User` 账号，并且都可以使用上面的用户名和统一密码登录。

---

## 路由

| 路由                    | 说明                          | 权限      |
| ----------------------- | ----------------------------- | --------- |
| `/`                   | 公开主页（含 Jumbotron 轮播横幅） | 公开      |
| `/jumbotron/[raceId]` | Jumbotron 全屏大屏            | 公开      |
| `/calibrator`         | Track Profile Calibrator      | Organizer |

---

## 功能

### Jumbotron Race Live View

| 功能             | 说明                                                         |
| ---------------- | ------------------------------------------------------------ |
| 赛马轮播横幅     | 主页顶部，自动 8 秒切换赛事，鼠标悬停暂停                    |
| 五个信息区域     | Header / KPI Strip / 赛道 SVG / TOP3+活跃骑手 / Ticker+Footer |
| 马匹动画         | s 轴补间（非 x/y）、每马不同速度、起跑效果、9 种动画状态     |
| per-entry 可视化 | 12 种颜色环 + 12 种 emoji + 排名 badge + 队名标签 + 消息气泡 |
| KPI drill-down   | 点击完成度 / Tokens / CA / 风险 → 展开各队明细表            |
| 活跃骑手 TOP3    | 按主动提交次数排序，独立于比赛总榜                           |
| 小地图 Minimap   | 右下角显示整条赛道缩略图和所有队伍当前位置                   |
| 详情面板         | 点击马匹或 TOP3 → 弹窗展示 12 字段                          |
| Debug Mode       | 按 D 键：中心线 / 采样点 / s 值                              |
| 全屏             | 🔲 按钮 → 新标签页 100vw×100vh                             |

### Track Profile Calibrator

| 功能          | 说明                                               |
| ------------- | -------------------------------------------------- |
| 导入底图      | SVG / PNG → 显示在编辑区                          |
| 编辑控制点    | 拖拽移动 / 右键删除 / 双击空白添加                 |
| 路径预览      | Catmull-Rom 平滑 + 方向箭头                        |
| 车道 / 检查点 | Inspector 中配置                                   |
| 单马预览      | 底部 scrubber 0%→100%                             |
| 多马预览      | 1~12 匹                                            |
| Validate      | schema + geometry 15+ 项校验                       |
| Export        | 导出 `track.profile.json`，直接供 Jumbotron 加载 |

### track-runtime（共享包）

Calibrator 的马匹预览与 Jumbotron 的马匹渲染使用**同一套函数**（`sampleAt` / `normal` / `tangentAngle`）。

---

## 操作速览

| 操作                                 | 效果                     |
| ------------------------------------ | ------------------------ |
| 点击 KPI 项                          | 展开各队明细表           |
| 点击马匹 / TOP3                      | 弹出 drill-down 详情面板 |
| 按 D 键                              | Debug Mode               |
| 点 🔲 全屏                           | 满屏大屏                 |
| 主页横幅 Tab 切换                    | 浏览不同赛事             |
| Calibrator: 导入底图 → 拖点 → 导出 | 校准赛道资产             |

---

## 赛道资产

| 赛道          | 控制点     | 车道 | 底图                |
| ------------- | ---------- | ---- | ------------------- |
| oval-track    | 12（椭圆） | 3    | SVG（Morandi 暖调） |
| circuit-track | 16（环形） | 3    | SVG（蓝灰冷调）     |

两条赛道均通过 Calibrator 校准，可被 Jumbotron 直接加载。

---

## 数据流

```
ARY DB → Server Action → RaceSnapshot JSON → Adapter → track-runtime → HorsePose → Jumbotron SVG
```

当前 Jumbotron 已优先消费 Runner 回传的真实 `progress` 字段，马匹位置不再按 rank/time 均摊伪造。`DCRaceDataProvider` 接口仍然预留，后续若接入企业侧数据源，可替换数据提供层而不改渲染层。

---

## 文档

| 文档                                                                          | 说明                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------- |
| [Jumbotron-PRD.md](Jumbotron-PRD.md)                                             | 作品说明文档（系统架构/功能清单/数据契约/验收） |
| [Jumbotron信息架构.md](Jumbotron信息架构.md)                                     | 信息架构（前置参考）                            |
| [Jumbotron子系统定义.md](Jumbotron子系统定义.md)                                 | 子系统定义（前置参考）                          |
| [DEMO-GUIDE.md](DEMO-GUIDE.md)                                                   | 演示流程指南                                    |
| [VIDEO-SCRIPT.md](VIDEO-SCRIPT.md)                                               | 视频分镜脚本                                    |
| [riding_record/GRS-002-riding-record.md](riding_record/GRS-002-riding-record.md) | Agent Riding Record                             |
| [riding_record/uml/](riding_record/uml/)                                         | UML 建模图（用例/状态机/时序）                  |

---

## 验证

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## 提交物

| # | 提交物        | 路径                                                                                         |
| - | ------------- | -------------------------------------------------------------------------------------------- |
| 1 | 作品说明文档  | `Jumbotron-PRD.md`                                                                         |
| 2 | 可运行 Demo   | `npm run db:seed && npm run dev`                                                           |
| 3 | 短视频        | `https://www.bilibili.com/video/BV1GYJ561Eb1/?vd_source=1b134e71774d2264b0206c4267e3e406`  |
| 4 | 赛道资产 ×2  | `public/assets/tracks/oval-track/` `circuit-track/`                                      |
| 5 | 数据样例 ×3  | `public/assets/snapshots/race_*.json`                                                      |
| 6 | Riding Record | `riding_record/GRS-002-riding-record.md`                                                   |
| 8 | Demo 指南     | `DEMO-GUIDE.md`                                                                            |
| 9 | 视频脚本      | `VIDEO-SCRIPT.md`                                                                          |

---

*ARY GRS 002 — 陈怀容24325033— 2026*
