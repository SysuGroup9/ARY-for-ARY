# GRS004 / Public Phase Label Normalization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Race Status` 已定义为明确状态语义，而不是给用户看的内部枚举值
- `docs/grs004/ary-mvp.ia.md`
  - 首页 Hero / Featured Race / Race Page / Live Hall / Screen Display 都要表达赛事当前阶段
- `docs/grs004/ux-hifi.taskbook.md`
  - Race Page、Live Hall、Screen Display 都要有清晰可读的状态表达
- 当前代码现状
  - `src/lib/race-phase.ts` 已有 `getRacePhaseLabel()`
  - 但多个 public / screen 视图仍直接显示 `race.phase`

当前显式缺口：

- 首页 Hero、首页赛事卡片、赛事列表页会直接显示 `running / judging / archived`
- `Race Page`、`Live Hall`、`Live Display`、`Billboard`、`Leaderboard`、`Announcement Display` 也仍有相同问题
- 这会把内部 phase key 暴露给用户，不符合公开端与大屏的可读性要求

## 范围

### 本轮纳入

- 放宽 `getRacePhaseLabel()`，允许直接消费运行时 `string`
- 收口以下页面的阶段显示：
  - `PublicHomeHero`
  - `HomeGallery`
  - `RacesIndexPageView`
  - `RacePageView`
  - `RaceRegisterPageView`
  - `LiveHallView`
  - `LiveDisplayView`
  - `BillboardDisplayView`
  - `LeaderboardDisplayView`
  - `AnnouncementDisplayView`
- 让 `Race Page` 的“公开入口 / 下一步入口”文案与状态 CTA 一起回归

### 本轮不纳入

- 不改 console 内部 phase copy 全量中文化
- 不改 phase 本身的状态机
- 不引入新的显示状态名称

## 落地规则

### phase label helper

- `getRacePhaseLabel()` 从只接收 `RacePhase`，放宽为可接收 `RacePhase | string`
- 若命中已知 phase：
  - 返回正式中文标签
- 若是未知字符串：
  - 原样回退

### 用户可见规则

以下原始 phase key 不应再直接裸露给公开端 / 展示端用户：

- `running`
- `submitting`
- `judging`
- `completed`
- `archived`
- 以及 legacy `active / frozen / finished / preparation`

它们都应通过 helper 显示为：

- `比赛中`
- `提交中`
- `评审中`
- `已结束`
- `已归档`
- `封榜中`
- `报名结束`

### Race Page

配合 phase label 收口，同时恢复更接近文档的入口组织：

- 主 CTA 卡片显示 `公开入口`
- 子入口区显示 `下一步入口`
- 报名期主 CTA 附带：
  - `先登录或注册骑手账号，再进入该赛事完成正式报名。`
- 子入口补回：
  - `查看合作`

## 测试对齐

- 更新：
  - `src/app/_components/public/billboard-display.test.tsx`
- 新增：
  - `src/app/_components/public/public-phase-label-regression.test.tsx`
- 回归：
  - `src/app/_components/public/public-phase-cta-regression.test.tsx`
  - `src/app/_components/public/race-page.test.tsx`
  - `src/lib/public-site.test.ts`

验证命令：

```bash
node --import tsx --test src/app/_components/public/public-phase-cta-regression.test.tsx src/app/_components/public/public-phase-label-regression.test.tsx src/app/_components/public/billboard-display.test.tsx src/app/_components/public/race-page.test.tsx src/lib/public-site.test.ts
npm run build
```

## 一句话结论

这一轮不是改状态机，而是把已经存在的 phase 语义真正送到公开端和展示端用户界面，不再把内部英文 phase key 直接暴露出去。
