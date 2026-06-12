# ARY for ARY — GRS 002

基于 `Next.js + Prisma + SQLite` 的 ARY Agent Racing 全栈 PoC，核心展示 **Jumbotron 赛马大屏可视化子系统**。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 15 App Router + TypeScript |
| ORM | Prisma 7 + SQLite |
| 校验 | Zod |
| 认证 | bcryptjs + jose (Cookie Session) |

---

## 本地启动

```bash
# 1. 安装依赖
npm install

# 2. 环境变量
copy .env.example .env          # Windows CMD
# 或 cp .env.example .env       # Git Bash / Mac / Linux

# 3. 数据库迁移 + 生成客户端
npx prisma migrate deploy
npx prisma generate

# 4. 种子数据（每次执行都会全量重置）
npm run db:seed

# 5. 启动
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)

---

## GRS 002 评审演示指南

> 本节供评审直接使用，按顺序操作即可完整覆盖 GRS 002 所有评分点。

### 第一步：启动并查看 Jumbotron 大屏

```
http://localhost:3000/jumbotron?raceId=race_jumbotron_demo
```

大屏展示 8 支队伍的实时赛马状态，涵盖：

| 视觉元素 | 说明 |
|---|---|
| 赛道底图 | 真实赛场照片为背景，土黄色赛道环覆盖其上 |
| 🐴 马匹位置 | 由 `LeaderboardEntry.totalScore`（进度分）驱动，非计时器 |
| 排名徽章 | 马匹中心显示当前排名数字 |
| ↑↓ 排名变化 | 与上次 30 s 刷新快照对比，绿色上升 / 红色下降 |
| 风险光环 | 虚线彩圈（橙=中风险，红=高风险）|
| 违规徽章 | 红色 `!` 角标，来自 `antiCheatPenalty > 0` |
| 气泡消息 | 首次超越 25/50/75/100% 里程碑或排名变化时弹出 |
| 检查点 | 琥珀黄虚线横栏，均匀分布在赛道上 |
| 起/终点 | 黑白棋格线 |
| 左侧面板 | 活跃骑手 TOP3、赛道小地图、KPI（Token/排名/提交数）|
| 底部 ticker | 违规与高风险队伍滚动提示 |

加 `?debug=1` 可激活调试叠加层（中心线、车道边界、每匹马 s 值、碰撞框）：

```
http://localhost:3000/jumbotron?raceId=race_jumbotron_demo&debug=1
```

### 第二步：演示 Calibrator 赛道校准工具

```
http://localhost:3000/jumbotron/calibrator
```

Calibrator 是独立可视化赛道编辑工具，用于生成自定义赛道轮廓（`TrackProfile`），与 Jumbotron 共用同一套 `TrackRuntime` 引擎。

**主要操作：**

1. **绘制控制点**：单击画布空白处添加点，拖拽移动，双击删除
2. **加载预设**：点击"预设：椭圆"或"预设：方形"快速加载示例赛道
3. **实时预览**：≥ 4 个控制点后自动渲染 Catmull-Rom 平滑曲线、车道边界、起/终线、检查点
4. **马匹预览**：拖动"位置 S"滑块，查看任意弧长位置的马匹分布（验证 lane offset 正确性）
5. **配置车道**：调整车道数和半宽，lane offset 公式 `offset = -halfWidth + (2×halfWidth)/(N+1) × (idx+1)`
6. **设置方向**：顺时针 / 逆时针
7. **设置起/终点**：S 值（0.0–1.0）控制起跑线位置
8. **上传底图**：导入真实赛场图片对照描绘轨迹，透明度可调
9. **验证 + 导出**：点击"验证"检查点数/弧长/ID；"下载 profile.json"导出完整 TrackProfile；"复制控制点"粘贴到创建比赛表单

### 第三步：创建带自定义赛道的新比赛

1. 用 `organizer_demo / organizer123` 登录
2. 进入「创建新赛事」页面
3. 在 **Jumbotron 赛道** 部分：
   - 选择赛道类型（椭圆 / 方形）
   - 选择赛道方向（顺时针 / 逆时针）
   - 设置起/终点位置 S
   - 或点击链接打开 Calibrator 生成自定义控制点，粘贴到「自定义控制点 JSON」字段

### 第四步：观察数据驱动的马匹更新

1. 用任意 `jt_rider_*` 账号提交代码 → 触发 `SUBMISSION_TEST`，质量分更新
2. 用 `organizer_demo` 登录演示赛 → 点击"发起进度评测" → 触发 `PROGRESS_EVAL`，马匹位置更新
3. 刷新 `/jumbotron?raceId=race_jumbotron_demo` → 30 s 内自动轮询更新（或手动刷新）

---

## 种子演示账号

执行 `npm run db:seed` 后自动创建：

### 通用账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| Organizer | `organizer_demo` | `organizer123` | 管理两场赛事（排序演示 + Jumbotron 演示），登录可见完整 Organizer 控制台 |
| Rider | `rider_demo` | `rider123` | 排序演示赛队长 |

### Jumbotron 演示账号（8 支队伍）

| 用户名 | 密码 | 队伍 | 进度 | 状态 |
|--------|------|------|------|------|
| `jt_rider_1` | `rider123` | AlphaBot 战队 | 88 | 领跑 |
| `jt_rider_2` | `rider123` | BetaRun 快攻 | 74 | 正常 |
| `jt_rider_3` | `rider123` | GammaAI 突破 | 67 | 正常 |
| `jt_rider_4` | `rider123` | DeltaCraft 稳进 | 52 | 正常 |
| `jt_rider_5` | `rider123` | EpsilonDev 新锐 | 41 | 正常 |
| `jt_rider_6` | `rider123` | ZetaForce 违规 | 75 | ⚠ antiCheatPenalty=15，高风险 + 违规徽章 |
| `jt_rider_7` | `rider123` | EtaLab 跟跑 | 22 | 落后 |
| `jt_rider_8` | `rider123` | ThetaSync 起步 | 8 | 几乎无提交 |

---

## Jumbotron 子系统详解

### 路由

| URL | 说明 |
|-----|------|
| `/jumbotron` | 选择比赛页面（列出所有赛事） |
| `/jumbotron?raceId=<id>` | 全屏 Jumbotron 大屏 |
| `/jumbotron?raceId=<id>&debug=1` | 调试模式（叠加技术信息） |
| `/jumbotron/calibrator` | 赛道校准编辑工具（无需登录） |

### 数据三维度

| 维度 | 触发方 | 任务类型 | 存储位置 |
|------|--------|----------|----------|
| **进度**（马匹位置） | ARY 调度 → Runner 自动 | `PROGRESS_EVAL` | `LeaderboardEntry.totalScore` |
| **质量**（辅助参考） | 参赛者主动提交 | `SUBMISSION_TEST` | `Submission.totalScore`（最新 SCORED） |
| **风险/违规** | ARY 推导 | — | `antiCheatPenalty > 0` |

> 进度和质量来源完全独立，不可混淆。排名变化基于进度分的 30 s 轮询对比。

### 赛道系统

**内置预设赛道：**

| trackId | 名称 | 控制点 |
|---------|------|--------|
| `oval-standard`（默认）| 标准椭圆 | 12 个 |
| `rect-standard` | 标准方形 | 12 个 |

**自定义赛道（创建比赛表单）：**

- **赛道类型**：下拉选择预设
- **赛道方向**：顺时针 / 逆时针
- **起/终点 S**：0.0–1.0，控制起跑线位置
- **自定义控制点 JSON**：`[[x,y],...]` 格式，1920×1080 坐标系，≥ 4 个点
- 可用 `/jumbotron/calibrator` 可视化生成后粘贴到此字段

**Calibrator 与 Jumbotron 的关系：**

```
Calibrator (编辑)
  └─ TrackRuntime (共享引擎)
        ├─ sampleAt(s) → pos / tangent / normal
        ├─ computeHorsePose(entryId, s, laneOffset, zIndex)
        └─ getPathD(offset, N) → SVG path string
              └─ Jumbotron (渲染)
```

两者完全共用同一套 `Jumbotron/track-runtime.ts` 引擎，Calibrator 中看到的赛道和马匹布局即最终大屏效果。

### 实时更新机制

- 大屏每 30 秒执行 `router.refresh()` 拉取新服务端数据
- 排名变化通过 `sessionStorage` 保存上次快照，刷新后对比检测 `↑↓`
- 气泡消息：里程碑（25/50/75/100%）优先于排名变化；全局最多 3 条；`noBubbleZones` 过滤赛道缝合区；4 秒 CSS 淡出

---

## Organizer 演示 Runner（排序题）

排序演示赛的私有 Runner 位于 `organizer_demo/runner_demo`：

```bash
cd organizer_demo/runner_demo
copy .env.example .env   # 或 cp .env.example .env
npm install
npm run start
```

Runner 默认配置：
- `ARY_BASE_URL=http://localhost:3000`
- `ARY_RACE_ID=race_sort_demo`
- 每 2 s 轮询一次

---

## 完整演示流程（排序题 Runner）

**终端 A**（ARY 主程序）：
```bash
npm install && cp .env.example .env
npx prisma migrate deploy && npx prisma generate
npm run db:seed
npm run dev
```

**终端 B**（私有 Runner）：
```bash
cd organizer_demo/runner_demo
cp .env.example .env && npm install && npm run start
```

**浏览器操作**：
1. `rider_demo / rider123` 登录 → 找到「排序 Runner 演示赛」→ 提交 `solution.ts`
2. 等终端 B 出现 `Processed submission_test task ...`
3. `organizer_demo / organizer123` 登录 → 点击"发起进度评测"
4. 等终端 B 出现 `Processed progress_eval task ...`
5. 打开 `/audience` 查看公开榜单

---

## 验证命令

```bash
node --import tsx --test src/lib/*.test.ts
node --import tsx --test organizer_demo/runner_demo/src/*.test.ts
npm run lint
npm run build
```

---

## 演示视频

- [GRS_001 完整演示](https://www.bilibili.com/video/BV1qdEs62Egz/)
- [主要功能介绍](https://www.bilibili.com/video/BV1LZEs6LEtV/)

---

## 相关文档

- [ROADMAP.md](./ROADMAP.md) — 迭代历史与 MVP 完成情况
- [plan/2026-06-10-jumbotron-subsystem.md](./plan/2026-06-10-jumbotron-subsystem.md) — Jumbotron 子系统设计文档
- [Jumbotron/SUBSYSTEM.md](./Jumbotron/SUBSYSTEM.md) — 子系统技术规格
