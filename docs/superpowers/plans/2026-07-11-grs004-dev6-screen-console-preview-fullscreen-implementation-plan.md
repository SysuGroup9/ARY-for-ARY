# GRS004 / DEV-6 Screen Console Preview + Fullscreen Output Implementation Plan

**Goal:** 让 `Screen Console` 真正补齐文档里已写出的 `预览 + Fullscreen Output`。

**Architecture:** 保留 `jumbotron` 现有 inline preview / fallback 逻辑，其他模式新增 iframe 预览；同时把当前输出的一键动作显式收口为 `全屏展示当前输出`。

**Tech Stack:** Next.js、React SSR、TypeScript、现有 Screen Console 页面与 display 路由、Node test (`tsx`)

---

## Task 1: TDD - preview / fullscreen 文案测试

- [ ] 扩展 `src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 扩展 `src/app/_components/console/console-copy.test.tsx`
- [ ] 覆盖：
  - `全屏展示当前输出`
  - `当前输出预览`
  - 非 jumbotron 模式出现 iframe
- [ ] 运行测试确认失败

## Task 2: Screen Console 实现

- [ ] 更新 `src/app/_components/console/screen-console-page.tsx`
- [ ] 当前输出主按钮改为 `全屏展示当前输出`
- [ ] 对非 `jumbotron` 模式新增 iframe 预览
- [ ] 保持 jumbotron 现有 preview/fallback 逻辑不变

## Task 3: Verification + Docs

- [ ] 跑聚焦测试：
  - `node --import tsx --test src/app/_components/console/console-copy.test.tsx src/app/_components/console/screen-console-controls.test.tsx`
- [ ] 跑构建：
  - `npm run build`
- [ ] 更新：
  - `docs/superpowers/status.md`
  - `grs004readme.md`

## Done 条件

- Screen Console 已有明确 `全屏展示当前输出`
- 非 jumbotron 模式已具备当前输出预览
- 控制面和展示面仍保持分离
- 测试与构建全部通过
