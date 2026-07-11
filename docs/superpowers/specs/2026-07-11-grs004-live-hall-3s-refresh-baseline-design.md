# GRS004 / Live Hall 3s Refresh Baseline Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.prd.md`
  - `Live Hall 数据刷新目标：3s 内`
  - `赛事进行中的 Live Hall 和 Screen Console 应优先保证稳定展示`
- `docs/grs004/ary-qa-plan.md`
  - `Live Hall 数据刷新`
  - `Live Hall 数据刷新目标：3s 内`
- `docs/grs004/grs003-gap-analysis.md`
  - 仍明确记录 `Live Hall 3s 数据刷新 | 无刷新机制`

当前显式缺口：

- `/races/[raceSlug]/live` 虽然已经读取 Projection，但页面仍是一次性 SSR 输出
- `/screen/[raceSlug]/live` 同样没有持续刷新机制
- 这与文档要求的“进行中赛事页面应在 3s 内更新”不一致

## 范围

### 本轮纳入

- 为公开 `Live Hall` 增加最小 3 秒自动刷新
- 为公开 `Screen Live Display` 增加相同自动刷新
- 用 phase gating 控制只在“实时阶段”启用刷新
- 新增纯函数与 source 回归测试

### 本轮不纳入

- 不改成 WebSocket / SSE
- 不改 Projection 生成频率
- 不为 Results / Works / Race Page 增加自动刷新
- 不处理 200 并发与真实性能压测

## 落地规则

### 自动刷新策略

- 新增 `LiveAutoRefresh` client 组件
- 默认间隔：`3000ms`
- 刷新方式：`router.refresh()`

### phase gating

只在以下 phase 启用：

- `registration`
- `running`
- `submitting`
- `judging`
- legacy `active`
- legacy `frozen`

以下 phase 不启用：

- `draft`
- `published`
- `completed`
- `archived`
- legacy `preparation`
- legacy `finished`

### 挂载位置

- `src/app/races/[raceSlug]/live/page.tsx`
- `src/app/screen/[raceSlug]/live/page.tsx`

这样可以避免把 client hook 混入现有纯 view 组件，保持 `renderToStaticMarkup` 级别的视图测试稳定。

## 测试对齐

- 新增 `src/app/_components/public/live-auto-refresh.test.ts`
- 回归：
  - `src/app/_components/public/live-hall.test.tsx`
  - `src/app/_components/public/live-display.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/public/live-auto-refresh.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/public/live-display.test.tsx
npm run build
```

## 一句话结论

这一轮不是重写实时架构，而是先把文档明确要求的“Live Hall 3s 刷新目标”落成最小可运行基线，并同步覆盖到公开 live 大屏输出。
