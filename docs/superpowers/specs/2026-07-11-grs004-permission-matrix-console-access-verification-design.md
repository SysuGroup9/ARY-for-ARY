# GRS004 / Console Permission Matrix Access Verification Design

## 目的

本设计直接承接：

- `docs/grs004/ary-permission-matrix.md`
  - `# 2. 角色与范围规则`
  - `## 3.1 Race`
  - `## 3.11 User`
  - `## 3.13 ScreenDisplay`
- `docs/grs004/grs003-gap-analysis.md`
  - `权限校验 | 🔶 部分解决`
  - `完整 13×6 矩阵未逐项验证`

当前代码里已经有：

- `src/lib/viewer-access.ts`
  - `getRoleCapabilities()`
  - `getCreateRacePageAccess()`
  - `getConsoleEntryTarget()`
  - `getConsoleHomeSections()`
  - `getConsoleDefaultHref()`
  - `getConsoleRaceViewAccess()`
  - `getConsoleAdminAccess()`
  - `getConsoleScreenAccess()`

但现有 `src/lib/viewer-access.test.ts` 仍保留旧口径：

- 仍断言 Organizer 不能使用 `Screen Console`
- 仍断言 Organizer 在 console home 里没有 `screen` section
- 因此当前测试与 `ary-permission-matrix.md` 已直接冲突

本轮目标是：**把 console 入口和准入测试重新收口到 `ary-permission-matrix.md` 当前口径，先让权限矩阵在 `viewer-access` 这一层变成可验证状态。**

## 范围

### 本轮纳入

- 对齐 `src/lib/viewer-access.test.ts`
- 明确覆盖：
  - Organizer 可进入 `Screen Console`
  - Organizer 在 console home 中可见 `screen`
  - Admin 仍保留 `admin + screen`
  - Rider / Judge 不能进入 `Screen Console`
  - 匿名用户进入受保护入口时跳转 `/login`
- 继续覆盖：
  - create-race 仅 Organizer 可用
  - race workspace 仍按 `isRaceOrganizer / isRaceJudge / isRaceRider` 约束

### 本轮不纳入

- 不新增新的权限 helper
- 不调整 `managed race` 查询层
- 不扩展到资源动作级 13×6 全矩阵自动化测试
- 不重构 page-level redirect 结构

## 约束

### 文档约束

- Organizer 可以管理自己负责的 Race 及其展示
- `ScreenDisplay.configure / switch_mode / fallback_*` 允许 Organizer(`managed race`) 和 Admin(`system`)
- Admin Console 只对 Admin 开放
- Race workspace 仍必须区分 Organizer / Judge / Rider 的作用域

### 当前代码现实

- `viewer-access.ts` 当前逻辑已经允许 Organizer 使用 `Screen Console`
- 失败的是旧测试，不是当前 helper 行为

因此本轮应遵循：

1. **优先对齐测试到文档**
2. **只有当测试暴露真实实现偏差时才修改 helper**
3. **不把本轮扩大成完整权限系统重构**

## 方案选择

### 方案 A：更新现有 `viewer-access` 测试为文档口径

优点：

- 直接命中当前显式缺口
- 风险最低
- 能快速把“部分解决但未逐项验证”推进到可验证状态

缺点：

- 仍然只覆盖 console 入口层，不是完整资源动作矩阵

### 方案 B：新增更大范围 page/integration 权限测试

优点：

- 覆盖范围更大

缺点：

- 会把当前最小缺口扩成多页面测试工程
- 不适合先修正已知的文档/测试冲突

### 推荐方案

采用 **方案 A：先更新 `viewer-access` 测试为文档口径**。

## 用户可见变化

本轮落地后，用户界面本身不新增功能；变化体现在：

1. `Screen Console` 的 Organizer 准入口径将有自动化测试保护
2. Console 首页 section 映射将与权限矩阵一致
3. 后续若权限逻辑被回退，测试会直接失败

## 测试对齐

需要覆盖：

- `src/lib/viewer-access.test.ts`
  - Organizer `canUseScreen = true`
  - Organizer console sections 包含 `screen`
  - Organizer `getConsoleScreenAccess()` 为 allowed
  - Rider / Judge 无 `screen` section
  - Admin 仍拥有 `admin + screen`

验证命令：

```bash
node --import tsx --test src/lib/viewer-access.test.ts
```

## 验收对齐

本轮完成后，需要能证明：

1. `viewer-access` 测试不再与 `ary-permission-matrix.md` 冲突
2. Organizer 的 `Screen Console` 准入由自动化测试显式覆盖
3. Admin / Rider / Judge 的 console section 口径也仍有覆盖
4. 若现有 helper 与文档不一致，测试会直接暴露

## 一句话结论

这轮不是在发明新权限规则，而是把已经写进 `ary-permission-matrix.md` 的 console 准入口径，真正变成会自动失败的测试事实。
