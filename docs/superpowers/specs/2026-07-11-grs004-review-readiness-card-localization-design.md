# GRS004 / Review Readiness Card Localization Design

## 目的

本设计直接承接：

- `docs/grs004/ary-mvp.prd.md`
  - `系统应在评审前识别空骑行、无 CA 数据、空作品、缺必填材料、疑似违规和接入异常，并在 Organizer / Judge 工作流中提示`
- `docs/grs004/ary-mvp.ia.md`
  - `Judge View` 要表达评审效率和可信依据
  - `Rider View` / `Organizer View` 都需要风险提示
- 当前代码现状
  - `ReviewReadinessCard` 已经被 `Organizer / Rider / Judge` 三个工作台复用
  - 但卡片文案仍混用：
    - `Status Badge`
    - `CA Ingestion`
    - `Internal Evidence`
    - `Review Reason`
    - `Review Flag`

当前显式缺口：

- 风险提示的内容已经是中文语义，但外围标签仍是英文
- 这和当前公开端、console 其他区域逐步完成的中文化收口不一致

## 范围

### 本轮纳入

- 只收口 `src/app/_components/console/review-readiness-card.tsx`
- 同步更新直接依赖该卡片的 Judge / Organizer / Rider focused tests

### 本轮不纳入

- 不修改 `Trust / Risk Summary`
- 不修改 `Connector Audit Overview`
- 不改 `review-readiness-helpers.ts` 的领域语义

## 落地规则

### 卡片标签

- `Status Badge` -> `状态`
- `CA Ingestion` -> `CA 接入`
- `Internal Evidence` -> `内部证据数`
- `Review Needed Evidence` -> `需复核证据数`
- `Medium Confidence Evidence` -> `中可信度证据数`
- `Review Reason` -> `复核原因`
- `Review Flag` -> `复核标记`

### 状态值

- `review_needed` -> `需要复核`
- `ready` -> `已就绪`

### CA 接入状态值

- `ACTIVE` -> `活跃中`
- `CONNECTED` -> `已连接`
- `FAILED` -> `接入失败`
- `NOT_CONFIGURED` -> `未接入`

### 严重度

- `high` -> `高`
- `medium` -> `中`

## 测试对齐

- 新增：
  - `src/app/_components/console/review-readiness-card.test.tsx`
- 更新：
  - `src/app/_components/console/judge-console-page.test.tsx`
  - `src/app/_components/console/organizer-console-page.test.tsx`

验证命令：

```bash
node --import tsx --test src/app/_components/console/review-readiness-card.test.tsx src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/rider-console-page.test.tsx
npm run build
```

## 一句话结论

这一轮不是改风险判定逻辑，而是把已经存在的评审前风险提示卡真正收口成完整中文表达，让 Organizer / Rider / Judge 三条工作台的风险提示读起来像同一套产品语言。
