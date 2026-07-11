# GRS004 / Works Display Copy Localization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display` 是展示输出面
  - `Works Display` 是大屏作品展示模式
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display` 需要远距离可读、状态清楚、不是后台页面放大版
  - `Works` 应表达公开作品浏览、精选 / 获奖标识和作品展示气质
- `docs/grs004/grs003-gap-analysis.md`
  - 当前仍存在用户可见英文残留待扫描

当前代码现状：

- `src/app/_components/public/works-display.tsx` 的作品展示结构已经可用
- 但仍残留一组英文用户可见标签：
  - `Works / Showcase`
  - `Featured Work`
  - `Works filter and sort`

这会让已经完成中文化的大屏模式里，作品展示页仍然显得像半成品。

## 范围

### 本轮纳入

- 只收口 `src/app/_components/public/works-display.tsx` 的用户可见英文文案
- 同步更新 `src/app/_components/public/works-display.test.tsx`
- 回归一条已有的公共显示层 phase label regression

### 本轮不纳入

- 不修改 `Works Display` 布局
- 不修改作品筛选、排序、精选作品选择规则
- 不修改 `ScreenDisplayShell` 的共享外层文案
- 不扩展到 `WorksPage` 或 `Work Page`

## 落地规则

- `Works / Showcase` -> `作品展示`
- `Featured Work` -> `精选作品`
- `Works filter and sort` -> `作品筛选与排序`

其余已有中文表达：

- `全部公开作品`
- `精选`
- `已获奖`
- `评审中`
- `排序：最新提交`
- `作品橱窗`

本轮全部保持不变。

## 测试对齐

- 更新：
  - `src/app/_components/public/works-display.test.tsx`
- 回归：
  - `src/app/_components/public/public-phase-label-regression.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/public/works-display.test.tsx src/app/_components/public/public-phase-label-regression.test.tsx
npm run build
```

## 一句话结论

这一轮不改作品展示逻辑，只把 `Works Display` 里残留的英文标签收口为正式中文展示文案。
