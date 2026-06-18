# ARY GRS 002 Jumbotron — Demo 演示指南

## 环境准备

```bash
npm install
npm run db:seed
npm run dev
```

打开 `http://localhost:3000`

---

## 演示流程（约 5 分钟）

### 第一幕：Jumbotron 赛马大屏（2 分钟）

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 打开主页，观察顶部赛马横幅 | 自动轮播 3 个赛事的 Jumbotron 画面 |
| 2 | 点击横幅 Tab 切换到「排序算法挑战赛」 | 8 匹 🐎 在赛道上按真实 progress 对应的位置分布 |
| 3 | **指认 P0 要素**：Header（LIVE 徽章 + 计时）、KPI Strip（完成度/Tokens/CA）、TOP3 卡片、赛道主画面、底部滚动 Ticker |
| 4 | **点击 KPI 项**「完成度」→ 展开各队进度明细表；再点「Tokens」→ 各队 Token 明细；再点收起 |
| 5 | **点击赛道上的马匹** → 弹出 drill-down 详情面板（骑手/排名/分数/进度/Tokens/风险/留言） |
| 6 | **指认 P1 要素**：气泡（马匹上方白色留言框）、风险标记（Ticker 红色 item）、活跃骑手 TOP3、Entry Legend、右下角 Mini Map |
| 7 | 点击「🔲 全屏」→ 新标签页打开满屏 Jumbotron；按 **D 键** 展示 Debug Mode（红色中心线/采样点/s 值） |
| 8 | 切换到「性能优化马拉松」（已结束赛事）→ 观察 FINISHED 状态和赛后总评 |

### 第二幕：Calibrator 赛道校准（2 分钟）

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 打开 `http://localhost:3000/calibrator` | Calibrator 设计时工具 |
| 2 | 预设 12 个控制点已加载，蓝色路径线可见 | 说明：赛道几何由 centerline points 描述 |
| 3 | **点「📷 导入底图」** → 选择一张赛道底图 | 底图加载后显示在 Canvas 上 |
| 4 | **拖拽控制点** 对齐底图上的赛道线 | 左键拖拽移动、双击空白添加、右键删除 |
| 5 | 底部进度条拖动 → 观察单马沿赛道 0%→100% 移动 | 证明位置由 `s` 参数驱动 |
| 6 | 马匹数量设为 8 → 多马预览 | 证明 lane offset 可用 |
| 7 | 点 **✓ 校验** → 观察 Inspector 显示 validation 结果 | Schema + geometry 通过 |
| 8 | 点 **⬇ 导出** → 下载 `track.profile.json` | 说明：此 JSON 可直接被 Jumbotron 使用 |

### 第三幕：数据流说明（1 分钟）

| 步骤 | 说明 |
|------|------|
| 1 | 在 ARY 首页，Organizer 点「生成 Jumbotron 快照」 | 触发 `generateRaceSnapshot()` |
| 2 | 打开 `public/assets/snapshots/race_active.json` | 展示 RaceSnapshot 数据结构 |
| 3 | 说明数据链路：ARY DB → Adapter → RaceSnapshot → track-runtime → Jumbotron | 从真实数据到可视化 |
| 4 | 说明当前边界：roundProgress 已优先读取 Runner 回传的真实 progress；submissionCount 用于活跃骑手排行；仍有少量展示字段属于 PoC 推导 | 诚实说明 PoC 边界 |

---

## Debug Mode 展示要点

| 展示项 | 操作 |
|--------|------|
| 中心线（红色 polyline） | 按 D，赛道画面显示完整的采样路径 |
| 采样点（红色圆点） | 每隔 8 个点标记一个 |
| 马匹 s 值 | 每匹马下方显示绿色 `s=0.xxx` 标签 |
| stale 状态 | 无更新的 entry 显示 OFFLINE |

---
