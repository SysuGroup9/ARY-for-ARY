# GRS004 / Work Visibility Lifecycle Baseline Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `3.4 Work`
    - `lock`: Organizer `managed race`, Admin `system`
    - `publish`: Organizer `managed race`, Admin `system`
    - `hide`: Rider `own if draft`, Organizer `managed race`, Admin `system`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Work Status`: `draft / submitted / locked / hidden`
  - `Visibility`: 控制公开、隐藏、内部可见
- `docs/grs004/ary-mvp.prd.md`
  - Public Site 不应出现未公开作品
- `docs/grs004/ary-mvp.ia.md`
  - Works 只展示已公开作品；隐藏或未发布作品不进入公开列表

当前显式缺口：

- `src/lib/services/works.ts` 只有读，没有 `publish / hide / lock` 动作
- `src/app/actions.ts` 没有对应 server actions
- `src/lib/services/public-routes.ts` 当前几乎只看 `registration.work` 是否存在，未严格按 `Work.status / visibility` 过滤
- Organizer `works` section 目前只显示标题和状态，没有生命周期动作

## 范围

### 本轮纳入

- 新增 `publishWorkForRace()`
- 新增 `hideWorkForRace()`
- 新增 `lockWorkForRace()`
- Public routes / work page / rider profile 改为只消费公开作品
- Organizer works section 加入最小 lifecycle controls

### 本轮不纳入

- 不重做 Work 创建 / 编辑写路径
- 不新增 Rider 专门的作品管理页
- 不扩多作品模型

## 公开读链路规则

基于当前模型，本轮采用以下最小公开判断：

- `visibility === PUBLIC`
- `status !== DRAFT`
- `status !== HIDDEN`

也就是：

- private work 不公开
- hidden work 不公开
- draft work 不公开
- submitted / locked 且 visibility public 的 work 才进入公开读链路

## 生命周期动作

### hide

- Rider：仅 `own draft`
- Organizer/Admin：`managed race | system`
- 落地效果：
  - `status = HIDDEN`
  - `visibility = PRIVATE`

### publish

- Organizer/Admin：`managed race | system`
- 本轮不允许直接把 `DRAFT` work 公开
- 若当前是 `HIDDEN`，重新公开时恢复到最小稳定态：
  - `status = SUBMITTED`
  - `visibility = PUBLIC`

### lock

- Organizer/Admin：`managed race | system`
- 落地效果：
  - `status = LOCKED`

## 测试对齐

- 新增 `src/app/actions.work-visibility-lifecycle-scope.test.ts`
- 新增 `src/lib/services/work-visibility-lifecycle-scope.test.ts`
- 扩展 `src/lib/services/public-routes.test.ts`
- 扩展 `src/app/_components/console/organizer-console-page.test.tsx`

验证命令：

```bash
node --test-concurrency=1 --import tsx --test src/app/actions.work-visibility-lifecycle-scope.test.ts src/lib/services/work-visibility-lifecycle-scope.test.ts src/lib/services/public-routes.test.ts src/app/_components/console/organizer-console-page.test.tsx
```

## 一句话结论

这一轮先把 Work 的公开可见性和最小 lifecycle 动作补齐，让“公开作品”真正只等于公开作品，而不是“数据库里正好挂了一个 work”。
