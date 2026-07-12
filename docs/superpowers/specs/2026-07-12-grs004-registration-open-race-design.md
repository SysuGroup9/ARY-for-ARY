# GRS004 / 可报名赛事 Design

## 问题

现有 seed 中的 `race_signup`（API Design Race）使用的是2026年6月的固定日期：

- `signupStart`: 2026-06-16
- `signupEnd`: 2026-06-28
- `raceStart`: 2026-06-29
- `raceEnd`: 2026-06-30

今日（2026-07-12）所有日期均已过期。虽然 `status` 字段写死为 `"registration"`，但 `getRacePhase()` 对 `published / registration / running` 三类状态仍按时间窗口自动推进，导致公开页面实际展示的赛事阶段已不是"报名中"。

## 解决方案

新增 `race_registration_open`，所有时间字段改用 `addDays(now, ...)` 相对偏移，保证每次 `npm run db:seed` 都能生成一个当前处于报名窗口内的赛事。

## 时间窗口设计

| 字段 | 相对偏移 | 语义 |
|---|---|---|
| `signupStart` | `addDays(now, -3)` | 3天前开始报名 |
| `signupEnd` | `addDays(now, +4)` | 4天后报名截止 |
| `raceStart` | `addDays(now, +5)` | 5天后比赛开始 |
| `raceEnd` | `addDays(now, +12)` | 12天后比赛结束 |

这样不论何时运行 `db:seed`，当天都在 `signupStart` 到 `signupEnd` 的窗口内，`getRacePhase()` 将返回 `"registration"`。

## 赛事基本信息

| 字段 | 值 |
|---|---|
| `id` | `race_registration_open` |
| `title` | `📝 NLP 推理挑战赛` |
| `status` | `"registration"` |
| `trackId` | `"oval-track"`（继承 raceBase） |
| `taskDescription` | 文本摘要与关键信息抽取，支持长文本上下文与多粒度输出 |

## 验收

- `npm run db:seed` 后，公开站首页或赛事列表中能看到"📝 NLP 推理挑战赛"处于"报名中"状态
- `/races/{slug}/register` 页面可正常打开并允许已登录 Rider 提交报名
- `getRacePhase(race)` 对此赛事返回 `"registration"`
