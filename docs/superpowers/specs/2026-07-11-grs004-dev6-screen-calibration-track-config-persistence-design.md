# GRS004 / DEV-6 Screen Calibration Track Config Persistence Design

## 目的

本轮直接承接以下文档中的显式要求：

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `Theme / Calibration`
    - `Display Control`
  - `核心任务`
    - `配置大屏主题`
    - `完成现场屏幕校准`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Console`
    - `Race 选择`
    - `Display Mode`
    - `预览`
    - `全屏输出`
    - `fallback`

当前代码已经有：

- `Screen Console / calibration`
- `CalibratorClient`
- `Race.trackConfigJson`
- `parseRaceTrackConfigJson()` / `serializeRaceTrackConfig()`
- `resolveRaceSnapshotForDisplay()`

但当前校准工作区仍然只做到：

- 在控制台里编辑 / 预览
- 导出 `track.profile.json`

还没有把当前校准结果写回当前赛事的 `trackConfigJson`。

## 范围

### 本轮纳入

- 在 `Screen Console / calibration` 中新增“保存到当前赛事”
- 把当前校准结果中的：
  - `startFinish`
  - `checkpoints`
  保存回 `Race.trackConfigJson`
- 嵌入校准器时，使用当前赛事的有效赛道配置作为初始值

### 本轮不纳入

- 不新增新的 Prisma 模型
- 不把完整 `TrackProfile` 写入数据库
- 不改 `Race.trackId` 的选择逻辑
- 不把 base track asset 覆盖回磁盘文件

## 当前缺口

### 1. 文档要求是“完成现场屏幕校准”，不是“只导出一个本地文件”

现在控制台已经能进入校准工作区，但如果结果不能回到当前赛事配置里，校准并不会真正影响这场赛事的大屏输出。

### 2. 现有 runtime 真正消费的是 `Race.trackConfigJson`

当前大屏链路里：

- `race-snapshot.ts`
  - 读取 `race.trackConfigJson`
- `track-config.ts`
  - 用 `trackId + trackConfigJson` 生成有效赛道配置

这说明当前应该收口到的真实入口不是“导出 profile 文件”，而是“更新当前赛事的赛道覆盖配置”。

## 方案选择

### 方案 A：继续只导出文件

优点：

- 完全不动服务层

缺点：

- 没有兑现“完成现场屏幕校准”
- 校准结果无法进入这场赛事的大屏 runtime

### 方案 B：保存当前 `startFinish + checkpoints` 到 `trackConfigJson`

优点：

- 最贴近现有 runtime
- 不需要新模型
- 与创建赛事时已有的 `trackConfigJson` 结构一致

缺点：

- 不会持久化完整 profile 的所有字段

### 推荐方案

采用 **方案 B：保存当前 `startFinish + checkpoints` 到 `trackConfigJson`**。

## 保存边界

本轮只保存：

- `startFinish`
- `checkpoints`

本轮不保存：

- `background`
- `centerline`
- `lanes`
- `viewBox`
- 任意导入 profile 的完整结构

理由：

- 当前数据库和 runtime 的正式入口就是 `trackConfigJson`
- 现有 `trackConfigJson` 只承载 start/finish 与 checkpoints 覆盖

## 页面结构

### 校准工作区

保留现有：

- 导入底图
- 导入 Profile
- 校验
- 导出当前 Profile

新增：

- `保存到当前赛事`
- 提示当前保存只会影响：
  - 起终点
  - 检查点

### 初始值

嵌入 `Screen Console` 时：

- 优先读取当前赛事的有效赛道配置
- 用它作为 `CalibratorClient` 初始状态

## 运行时规则

- 只有当前 managed race Organizer 或 Admin 可保存
- 保存后：
  - 更新 `Race.trackConfigJson`
  - 清除该赛事稳定 snapshot，避免 fallback 继续吃旧赛道配置
  - revalidate 当前 screen / jumbotron / live 相关页面

## 用户可见变化

本轮落地后，用户现在可以直接看到：

1. `Screen Console / calibration` 里新增 `保存到当前赛事`
2. 再次进入同一赛事校准页时，会回到这场赛事当前生效的起终点和检查点配置
3. 后续大屏和实况预览会消费这份新校准结果

## 测试对齐

需要覆盖：

- `src/app/_components/console/screen-console-controls.test.tsx`
  - `保存到当前赛事`
- `src/lib/services/race-track-calibration.test.ts`
  - organizer 可更新 `trackConfigJson`
  - 未授权用户被拒绝

## 验收对齐

本轮完成后，需要能证明：

1. 校准结果已经能写回当前赛事
2. 保存入口不引入新模型
3. runtime 正式入口仍是 `trackConfigJson`

## 一句话结论

这一刀要解决的不是“校准器能不能画线”，而是：既然当前赛事 runtime 真正消费的是 `trackConfigJson`，那 `Screen Console / calibration` 就必须能把结果写回这场赛事，而不是停留在工具导出层。
