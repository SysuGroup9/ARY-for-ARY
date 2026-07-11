# GRS004 / P0 One-Click Regression Runner Design

## 目的

本设计直接承接：

- `docs/grs004/ary-qa-plan.md`
  - `P0 回归必须一键跑通`
  - P0 主路径：
    - `GitHub 登录`
    - `资料补全`
    - `Admin 分配 roles`
    - `Organizer 创建并发布 Race`
    - `Rider 报名`
    - `Organizer 审核`
    - `ARY 自动生成 RaceProject`
    - `实时 CA 接入成功`
    - `Live Hall 展示 Projection`
    - `Rider 提交 Work`
    - `Organizer 分配 Judge`
    - `Judge 提交 JudgingRecord`
    - `Organizer 发布 Award / Leaderboard`
    - `Report 生成和发布`
    - `Public 查看 Results / Review / Work / Rider Profile`
    - `Screen Console 展示赛事状态`
- `docs/grs004/ary-release-ops-plan.md`
  - 彩排、go/no-go 和回滚前需要明确 P0 smoke / regression 入口

当前显式缺口：

- 仓库里已有大量聚焦测试，但仍散落在 README / status /对话里
- `package.json` 没有正式的一键 P0 回归入口
- 由于不少测试会写数据库，缺少统一编排时容易受前一组测试污染

## 范围

### 本轮纳入

- 新增正式脚本入口：
  - `npm run test:p0`
  - `npm run qa:p0`
- 新增编排脚本：
  - `scripts/grs004-p0-regression.mjs`
- 把现有通过的聚焦测试映射成稳定分组
- 对数据库相关分组在执行前自动 `db:seed`
- 在一键脚本末尾附带 `npm run build`

### 本轮不纳入

- 不新增浏览器级 e2e harness
- 不引入 Playwright / Cypress
- 不把非 P0 的全部测试并入一键入口

## 设计约束

- 一键回归入口必须优先复用当前已存在、已通过的测试，不新造平行验证体系
- 对数据库相关分组必须显式重置种子，避免状态污染
- 若任一分组失败，应立即中止并返回非零退出码
- 输出应清楚显示当前执行到哪一个分组

## 分组策略

### 1. Auth / Profile / Role Governance

- GitHub 登录入口与 fallback gating
- 资料补全
- Admin 角色治理 UI 与 action wiring

### 2. Console Access / System Scope

- Console root / races root
- Admin system scope organizer route 入口
- Organizer / Rider / Judge scoped access

### 3. Race Lifecycle

- Race create / edit / publish / archive

### 4. Registration / CA Participation

- 报名、审核、撤回
- RaceProject 自动生成
- CA 自助接入与 snapshot own-scope

### 5. CA Ingestion / Projection / Live / Screen

- CA handshake / signal / snapshot
- Projection / screen display / live hall

### 6. Work Submission / Visibility / Public Routes

- Work draft / submit / materialization
- Work visibility lifecycle
- Public work / rider / race routes

### 7. Judging / Awards / Reports / Public Results

- Judge assignment
- JudgingRecord 冻结引用
- Award / Report / Announcement
- Results / Review 公开读取

### 8. Production Build Verification

- `npm run build`

## 测试稳定性补充

- 在本轮落脚时，顺手修复了 `src/lib/services/race-archive-scope.test.ts` 中依赖过期 seed 时间窗口的 fixture，使 `running` 归档拒绝断言不再受当前日期漂移影响

## 验证命令

```bash
npm run qa:p0
```

## 一句话结论

这一轮把文档中的 “P0 回归必须一键跑通” 变成了仓库里的正式命令，而不是聊天记录里的命令拼图。
