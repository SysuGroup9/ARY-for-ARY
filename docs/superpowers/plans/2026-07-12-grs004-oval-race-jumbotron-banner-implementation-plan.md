# GRS004 / 椭圆赛道赛事 + 赛事大厅大屏轮播 Implementation Plan

## 目标

1. 在 `prisma/seed.ts` 中新增使用 `oval-track` 椭圆赛道的个人参赛进行中赛事（`race_active_oval`）
2. 在 `src/app/page.tsx` 首页接入 `JumbotronBanner`，让赛事大厅大屏支持多场比赛循环交替展示和暂停

---

## 实现步骤

### Task 1: 新增椭圆赛道进行中赛事（`prisma/seed.ts`）

✅ **Step 1: 新增 race_active_oval 赛事记录**

```ts
const raceActiveOval = await prisma.race.create({
  data: {
    ...raceBase,
    id: "race_active_oval",
    title: "🏇 路径优化挑战赛",
    trackId: "oval-track",
    status: "running",
    // ...
  },
});
```

✅ **Step 2: 为6名骑手创建个人参赛数据**

- Registration(APPROVED) + RaceProject + CAConnection + Session
- Team（兼容容器，name = rider.username，不用队名）
- Submission + SubmissionArtifact（含 submissionId）
- LeaderboardEntry（引用 submissionId）
- TeamArchive（含完整性字段）

✅ **Step 3: 分离 CAType 与 AgentType**

- `ovalCaTypes`：`CLAUDE_CODE / CODEX`（用于 CAConnection.caType）
- `ovalAgentTypes`：`CLAUDE / OPENAI`（用于 agentType 字段）

✅ **Step 4: 将 race_active_oval 加入快照生成循环**

```ts
for (const raceId of [
  raceActive.id,
  raceActiveOval.id,   // ← 新增
  raceSignup.id,
  // ...
]) {
  await generateRaceSnapshot(raceId);
}
```

✅ **Step 5: TypeScript 编译验证**

```bash
npx tsc --noEmit
```

结果：seed.ts、page.tsx 无新增错误。

---

### Task 2: 首页大屏轮播接入（`src/app/page.tsx`）

✅ **Step 1: 导入 JumbotronBanner 和快照工具**

```ts
import JumbotronBanner from "@/app/JumbotronBanner";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import { resolveRaceSnapshotForDisplay } from "@/lib/services/race-snapshot";
```

✅ **Step 2: 过滤进行中赛事并加载快照**

```ts
const liveRaces = races.filter((r) => r.phase === "running" || r.phase === "active");
const bannerItems = (
  await Promise.all(
    liveRaces.map(async (race) => {
      const result = await resolveRaceSnapshotForDisplay(race.id);
      if (!result.snapshot || result.source === "static") return null;
      const trackProfile = getEffectiveTrackProfileFromSnapshot(result.snapshot);
      if (!trackProfile) return null;
      return { fallbackReason, raceId, raceTitle, snapshot, source, trackProfile };
    }),
  )
).filter(Boolean);
```

✅ **Step 3: 渲染 JumbotronBanner**

```tsx
{bannerItems.length > 0 && (
  <JumbotronBanner items={bannerItems} />
)}
```

放在 `<PublicHeader />` 之后、`<PublicHomeHero />` 之前。

---

## 底图确认

- `trackId: "oval-track"` 使用 `public/assets/tracks/oval-track/background.png`
- 该图为操场鸟瞰图：红色椭圆跑道 + 绿色草坪 + 观众席
- 对应用户提供的图示（标准400米操场跑道）

## 验证命令

```bash
npm run db:seed
npm run dev
# 打开 http://localhost:3000，确认：
# 1. 首页顶部显示 Jumbotron 大屏
# 2. 有两场进行中赛事时，每8秒自动切换
# 3. ⏸ 暂停按钮可暂停轮播，▶ 自动可恢复
```
