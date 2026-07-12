# GRS004 / 可报名赛事补充 Implementation Plan

## 目标

在 `prisma/seed.ts` 中新增一个始终处于当前报名窗口内的赛事 `race_registration_open`，解决现有 `race_signup` 日期过期问题。

## 实现步骤

✅ **Step 1: 分析现有 race_signup 问题**

`race_signup` 日期全部固定在2026年6月，今日（2026-07-12）已超出报名窗口。`getRacePhase()` 对 `registration` 状态仍按时间窗口推进，导致该赛事已不处于"报名中"。

✅ **Step 2: 新增 race_registration_open（prisma/seed.ts）**

```ts
const raceRegistrationOpen = await prisma.race.create({
  data: {
    ...raceBase,
    id: "race_registration_open",
    title: "📝 NLP 推理挑战赛",
    status: "registration",
    signupStart: addDays(now, -3),
    signupEnd:   addDays(now, +4),
    raceStart:   addDays(now, +5),
    raceEnd:     addDays(now, +12),
    // ...
  },
});
```

✅ **Step 3: 加入快照生成循环**

```ts
for (const raceId of [
  raceActive.id,
  raceActiveOval.id,
  raceRegistrationOpen.id,  // ← 新增
  raceSignup.id,
  // ...
]) {
  await generateRaceSnapshot(raceId);
}
```

✅ **Step 4: TypeScript 编译验证**

```bash
npx tsc --noEmit
```

结果：零错误。

## 验证命令

```bash
npm run db:seed
npm run dev
# 打开公开站赛事列表，确认"📝 NLP 推理挑战赛"状态为"报名中"
# 打开 /races/{slug}/register，确认 Rider 可提交报名
```
