# GRS004 / Public Site 8-Phase CTA Alignment Design

## 目的

本设计直接承接：

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Race Status` 已收口为 8 状态：
    - `draft`
    - `published`
    - `registration`
    - `running`
    - `submitting`
    - `judging`
    - `completed`
    - `archived`
- `docs/grs004/ary-mvp.ia.md`
  - `Race | running | Live Hall、Screen Console、过程 Projection 优先`
  - `Race | submitting | Work Submission、提交提醒、已提交作品优先`
  - `Race | judging | Works、评审进度、结果公布时间优先`
  - `Race | archived | 作为 Past Race 和案例资产展示`
- `docs/grs004/design-prototype/data/sample-races.js`
  - `running` 示例 CTA：`进入 Live Hall`
  - `judging` 示例 CTA：`查看评审进度`
- 当前代码现状
  - `src/lib/race-phase.ts` 已是 8 状态模型
  - 但 `src/lib/public-site.ts` 仍在用旧的 `active / frozen / finished / preparation` 语义做分组和 CTA

当前显式缺口：

- 首页 live race 分组仍只识别 legacy `active / frozen`
- 公开 CTA 没有覆盖 `running / submitting / judging / completed`
- 首页卡片和赛事列表页仍然部分按旧 phase 手写按钮逻辑

这会让公开站在底层 phase 模型已经升级后，仍然继续输出旧生命周期语义。

## 范围

### 本轮纳入

- 收口 `src/lib/public-site.ts` 的 phase 分组和 CTA 规则
- 让首页 Hero / HomeGallery / RacesIndexPageView 统一复用 phase-aware CTA helper
- 补 8 状态 phase 的回归测试

### 本轮不纳入

- 不新增独立 public `judging progress` 页面
- 不改 `Race Page` 自身已有的下一步入口结构
- 不调整 `race-phase.ts` 本身

## 落地规则

### 公开站 live race 判定

`liveRaces` 只包含真正应优先进入 `Live Hall` 的阶段：

- `running`
- legacy `active`
- legacy `frozen`

不把 `submitting / judging` 混进 `liveRaces`。

### 公开 CTA 规则

- `published`
  - `/races/{slug}`
  - `查看赛题`
- `registration`
  - `/races/{slug}/register`
  - `立即报名`
- `running`
  - `/races/{slug}/live`
  - `进入实况大厅`
- `submitting`
  - `/races/{slug}/works`
  - `查看作品`
- `judging`
  - `/races/{slug}/works`
  - `查看作品`
- `completed / archived`
  - `/races/{slug}/results`
  - `查看赛果`

### 关于 `judging` 的说明

文档原型里的理想 CTA 是 `查看评审进度`，但当前公开站还没有独立 public judging-progress 页面。因此本轮按“**不发明新路由，只在现有公开页面中选择最接近文档语义的入口**”处理为：

- `judging` 先落到 `/works`
- 让“已提交作品优先”先在公开站成立

### 赛事列表分组

`groupPublicRacesByPhase()` 继续保持兼容输出结构，但内部语义收口为：

- `active`
  - `running`
  - legacy `active`
- `frozen`
  - `submitting`
  - `judging`
  - legacy `frozen`
- `registration`
  - `registration`
- `preparation`
  - `published`
  - legacy `preparation`
- `finished`
  - `completed`
  - `archived`
  - legacy `finished`

## 测试对齐

- 更新 `src/lib/public-site.test.ts`
- 新增 `src/app/_components/public/public-phase-cta-regression.test.tsx`

验证命令：

```bash
node --import tsx --test src/lib/public-site.test.ts src/app/_components/public/public-phase-cta-regression.test.tsx
npm run build
```

## 一句话结论

这一轮要修的不是 phase 模型本身，而是让公开站真正消费已经落地的 8 状态生命周期，不再继续用旧的 `active / finished` 心智来驱动首页分组和 CTA。
