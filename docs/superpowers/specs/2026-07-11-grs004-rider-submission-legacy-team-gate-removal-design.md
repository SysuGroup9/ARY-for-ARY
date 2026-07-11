# GRS004 / Rider Submission Legacy Team Gate Removal Design

## 目的

本设计直接承接：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - MVP 只支持个人参赛
  - `Registration` 是参赛事实主轴
  - `Team` 不应继续作为正式参赛语义核心
- `docs/grs004/grs003-gap-analysis.md`
  - `Team 实体删除` 仍是未完全收口的大差异
  - `参赛选手提交链路断点` 是已明确存在的可用性问题
- 当前代码现状
  - `createSubmission()`、`createFinalSubmission()`、`saveWorkDraftForRider()` 仍要求 legacy compatibility team 已存在
  - Rider `submission` section 也会因 `riderTeam === null` 直接锁住提交入口

当前显式缺口：

- `approved registration` 即使已经拥有正式参赛资格，仍会因为缺失旧 Team 兼容容器而无法继续提交
- 这与 `Registration -> RaceProject -> Work Submission` 的正式语义不一致

## 范围

### 本轮纳入

- 为 `approved registration` 提供 legacy compatibility container 的自愈 backfill
- Rider `submission` section 去掉 `!riderTeam` 的阻断 gate
- 最近提交列表改为优先按 `registrationId` 读取，不再强依赖 team

### 本轮不纳入

- 不删除 Prisma 里的 `Team` 模型
- 不迁移 `RunnerTask / TeamArchive / LeaderboardEntry / HarnessEntry` 的 `teamId`
- 不重写 legacy compatibility 子系统

## 落地规则

### 后端

- 新增 `ensureCompatibilityContainerForApprovedRegistration()`
- 输入：`raceId + userId`
- 规则：
  - 若没有 `Registration`：拒绝
  - 若 `Registration.status !== APPROVED`：拒绝
  - 若旧 Team 已存在：直接返回
  - 若旧 Team 缺失：自动补建 `${username} solo` compatibility container

### 提交链路

- `saveWorkDraftForRider()`
  - 不再因为缺少旧 Team 容器而报错
  - 会先自愈兼容容器，再保存草稿
- `createSubmission() / createFinalSubmission()`
  - 同样先自愈兼容容器，再继续提交

### Rider UI

- `approved registration` 不再因为 `riderTeam === null` 被判定为“提交已锁定”
- Rider 仍可看到：
  - `保存作品草稿`
  - `提交代码`
  - `提交赛后代码与 Riding Record`
- 最近提交列表改为在 `registrationId` 可用时优先按 `registrationId` 过滤

## 测试对齐

- 扩展 `src/lib/services/submissions-work-materialization.test.ts`
- 扩展 `src/app/_components/console/rider-console-page.test.tsx`
- 回归 `src/lib/services/submissions.test.ts`

验证命令：

```bash
node --test-concurrency=1 --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions-work-materialization.test.ts src/lib/services/submissions.test.ts
```

## 一句话结论

这一轮不是删除 Team 模型，而是先把 Team 对 Rider 正式提交链路的阻断作用拿掉，让 `approved registration` 真正成为提交入口的唯一正式前提。
