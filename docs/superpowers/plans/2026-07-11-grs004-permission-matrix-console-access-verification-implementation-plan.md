# GRS004 / Console Permission Matrix Access Verification Implementation Plan

## 目标

把 `viewer-access` 的 console 入口测试收口到 `docs/grs004/ary-permission-matrix.md` 当前口径，尤其补齐 Organizer 对 `Screen Console` 的显式覆盖。

## 任务拆分

### Task 1: 先跑现有 viewer-access 测试确认失败点

- [ ] 运行：
  - `node --import tsx --test src/lib/viewer-access.test.ts`
- [ ] 记录当前与权限矩阵冲突的断言：
  - Organizer `canUseScreen`
  - Organizer `screen` section
  - Organizer `getConsoleScreenAccess()`

### Task 2: 更新测试到权限矩阵口径

- [ ] 修改 `src/lib/viewer-access.test.ts`
- [ ] 对齐：
  - Organizer 可使用 `Screen Console`
  - Organizer console home 包含 `screen`
  - Rider / Judge 不包含 `screen`
  - Admin 仍保留 `admin + screen`
- [ ] 视情况补足组合角色断言

### Task 3: 仅在测试暴露真实偏差时修改 helper

- [ ] 如有必要，再修改 `src/lib/viewer-access.ts`
- [ ] 若现有 helper 已符合文档，则不做实现改动

### Task 4: 验证与文档同步

- [ ] 运行：
  - `node --import tsx --test src/lib/viewer-access.test.ts`
- [ ] 更新：
  - `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/lib/viewer-access.test.ts
```

## 完成标准

- `viewer-access.test.ts` 已与 `ary-permission-matrix.md` 口径一致
- Organizer 的 `Screen Console` 准入已有自动化覆盖
- Rider / Judge / Admin 的入口口径未被破坏
- 测试通过
