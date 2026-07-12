# GRS004 / 椭圆赛道赛事 + 赛事大厅大屏轮播 Design

## 目的

本设计承接用户需求：

1. 在 seed 中新增一场使用操场椭圆赛道背景（`oval-track/background.png`）的进行中赛事，以个人参赛形式建立数据
2. 让公开站首页的赛事大厅大屏支持多场比赛循环交替播放，并提供暂停按钮

---

## 背景

### 现有赛道

| trackId | 背景图 | 形状 |
|---|---|---|
| `oval-track` | `public/assets/tracks/oval-track/background.png` | 椭圆操场跑道 |
| `circuit-track` | `public/assets/tracks/circuit-track/background.svg` | 方形竞技场 |

用户确认使用 `oval-track` 配合 `background.png`（操场鸟瞰图，红色椭圆跑道+绿色草坪+观众席）。

### 现有 JumbotronBanner

`src/app/JumbotronBanner.tsx` 已经具备：
- 多场赛事轮播（8秒间隔）
- 暂停/恢复按钮（`⏸ 暂停` / `▶ 自动`）
- 手动切换（◀ / ▶ 按钮 + 赛事 tab）
- 手动切换后自动锁定当前赛事（需再按 `▶ 自动` 恢复）
- 全屏入口链接
- 状态显示：`自动轮播` / `已锁定 · {n}/{total}`

问题：首页 `src/app/page.tsx` 当前只使用 `PublicHomeHero` 和 `HomeGallery`，没有嵌入 `JumbotronBanner`。

---

## 设计

### 1. 新赛事 `race_active_oval`

**数据规格：**
- `id`: `race_active_oval`
- `trackId`: `oval-track`
- `status`: `running`
- `title`: `🏇 路径优化挑战赛`
- `organizerId`: `organizer_demo`（沿用 raceBase）
- 6 名个人参赛骑手（rider_alice ~ rider_frank）
- 每名骑手：Registration(APPROVED) + RaceProject + CAConnection(ACTIVE/CONNECTED) + Session + Team(兼容容器，name=rider.username) + Submission + SubmissionArtifact + LeaderboardEntry + TeamArchive

**个人参赛说明：**
兼容容器（Team）以骑手用户名命名（不用队名），保持与系统现有 Team 数据模型的兼容性。

**底图确认：**
`oval-track/background.png` 为操场鸟瞰图（红色椭圆跑道），与用户图示一致。

### 2. 首页大屏轮播接入

**修改文件：** `src/app/page.tsx`

**新增逻辑：**
1. 过滤 `phase === "running" || phase === "active"` 的进行中赛事
2. 并行调用 `resolveRaceSnapshotForDisplay()` 获取每场赛事的快照
3. 调用 `getEffectiveTrackProfileFromSnapshot()` 获取赛道 profile
4. 组装 `JumbotronData[]` 数组传入 `<JumbotronBanner items={bannerItems} />`
5. 只有 items > 0 时才渲染 JumbotronBanner

**渲染位置：**
JumbotronBanner 放在 PublicHeader 之后、PublicHomeHero 之前，作为页面顶部的大屏展示区域。

---

## 验收对齐

1. `npm run db:seed` 后能看到 `race_active_oval` 赛事（🏇 路径优化挑战赛）
2. 首页加载后，大屏区域显示进行中赛事的 Jumbotron 画面
3. 若有多场进行中赛事，大屏每8秒自动切换到下一场
4. 点击 `⏸ 暂停` 按钮后，自动轮播停止，状态显示"已锁定"
5. 再次点击 `▶ 自动` 后，自动轮播恢复
6. 可通过 ◀ / ▶ 按钮或赛事 tab 手动切换（切换后自动进入"已锁定"状态）
7. 椭圆赛道背景使用 `oval-track/background.png`（操场跑道图）

---

## 一句话结论

通过新增 `race_active_oval` seed 数据和在首页嵌入现有 `JumbotronBanner`，让公开站首页大屏支持多场进行中赛事循环交替展示，并保留用户主动暂停的能力。
