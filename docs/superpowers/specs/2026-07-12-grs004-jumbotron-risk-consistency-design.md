# GRS004 / 大屏风险数据一致性 Design

## 问题

赛事大屏（`/jumbotron/[raceId]`）顶部 KPI 显示"1 个风险"，但点开"风险"详情面板遍历所有参赛者时，没有任何参赛者的风险等级或违规数反映出该风险 —— 用户只看到一个数字，看不到具体是谁、因为什么原因。

### 根因

风险数据由两条互不一致的路径计算，来源在 `src/lib/jumbotron/adapter.ts`：

1. **KPI 的 `riskCount`**（`calculateKPIs`）统计两类来源：
   - `raceProject.aggregateIngestionStatus === "FAILED"`（CA 接入失败）
   - `teamArchive.antiCheatPenalty > 0`（反作弊扣分）

2. **每个参赛者的 `riskLevel` / `violationCount`**（`mapToRacingEntries`）**只**反映反作弊扣分：
   ```ts
   riskLevel: (archive?.antiCheatPenalty ?? 0) > 0 ? "medium" : "low",
   violationCount: (archive?.antiCheatPenalty ?? 0) > 0 ? 1 : 0,
   ```

因此当风险来源是"CA 接入失败"或"会话风险"时（如 `race_story_running` 的 rider_orion），KPI 计数为 1，但所有参赛者条目都是 `low` / `0`，详情面板显示不出任何风险行。

此外：
- 会话级风险（`Session.riskLevel` / `Session.riskReason`）在数据库中已有数据，但从未被 adapter 读取或展示。
- 参赛者快照缺少"风险原因"字段，即使等级正确也无法说明为什么。

## 解决方案

让参赛者条目的风险成为**唯一权威来源**，综合三类信号，并让 KPI 数字从条目派生，保证两者永远一致。

### 1. 数据契约扩展

`RacingEntrySnapshot`（`types.ts`）新增可选字段：

```ts
riskReason?: string;   // 风险原因说明，供详情面板/抽屉展示
```

`AryRaceData` 的 session 类型（`adapter.ts`）新增：

```ts
ingestionStatus?: string;   // caConnection 级别的接入状态
riskLevel?: string;         // session.riskLevel
riskReason?: string;        // session.riskReason
```

### 2. 综合风险推导（`mapToRacingEntries`）

对每个参赛者按优先级合并三类信号：

| 来源 | 触发条件 | 等级 | violationCount | 原因文案 |
|---|---|---|---|---|
| 反作弊扣分 | `antiCheatPenalty > 0` | `high` | +1 | `检测到诱导词，扣 N 分` |
| CA 接入失败 | `aggregateIngestionStatus === "FAILED"` 或任一 connection `ingestionStatus === "FAILED"` | `medium`（不降级已有 high） | 0 | `CA 接入失败，实况数据中断` |
| 会话风险 | `session.riskLevel` 为 `medium`/`high` | 取会话等级（不降级已有等级） | 0 | `session.riskReason` 或 `会话风险等级偏高` |

多个原因用 `；` 连接。无任何风险时 `riskLevel="low"`、`riskReason=undefined`。

### 3. KPI 从条目派生（`race-snapshot.ts`）

在 `buildRaceSnapshot` 内计算完 `entries` 后，覆盖 KPI：

```ts
const riskyEntries = entries.filter(
  (e) => e.riskLevel === "medium" || e.riskLevel === "high" || e.violationCount > 0,
);
kpis.riskCount = riskyEntries.length;
kpis.violationCount = riskyEntries.reduce((sum, e) => sum + e.violationCount, 0);
```

与已有的 `onlineRiders` / `activeRiders` 覆盖同处，保持模式一致。

### 4. 查询补齐字段（`race-snapshot.ts`）

Prisma 查询的 `caConnections.select` 增加 `ingestionStatus`；`sessions.select` 增加 `riskLevel`、`riskReason`。raceData 映射同步透传。

### 5. Attention Items 覆盖会话风险（`generateAttentionItems`）

原来只对 `FAILED` 接入和反作弊扣分生成 ticker 条目，补充：会话 `riskLevel` 为 `medium`/`high` 时也生成一条 `risk` 类 attention item，保证滚动条与详情面板一致。

### 6. UI 展示（`JumbotronClient.tsx`）

- **风险详情面板**：只列出真正有风险的参赛者（`medium`/`high`/有违规/有原因），新增"风险说明"列，用彩色徽章显示等级；无风险时显示"当前没有活跃风险"。
- **抽屉（drill-down）**：风险等级用中文标签，新增一行 `⚠ {riskReason}` 展示原因。
- 新增 `riskLevelLabel()` 辅助函数（none/low→正常，medium→注意，high→高危）与对应徽章 CSS。

## 验收

- `npm run db:seed` 重新生成快照后：
  - `race_active`: KPI 风险数 = 有风险条目数（charlie 会话阻塞 + diana 反作弊扣分 = 2）
  - `race_active_oval`: KPI 1 ⟷ diana token 成本预警 1
  - `race_story_running`: KPI 1 ⟷ orion CA 接入失败 1（**修复前显示 1 但无任何风险条目**）
- 大屏点开"风险"面板能看到具体参赛者、等级、违规数、原因
- 点开单个参赛者抽屉能看到风险原因
- `tsc --noEmit` 对改动文件零错误
