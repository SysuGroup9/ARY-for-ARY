# ARY GRS003 浏览器验收检查清单

## 准备

```bash
npm run db:seed
npm run dev
# 打开 http://localhost:3000
```

测试账号：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| Organizer | `organizer_demo` | `organizer123` |
| Admin | `admin_demo` | `organizer123` |
| Judge | `judge_demo` | `rider123` |
| Rider | `rider_alice` ~ `rider_kate` | `rider123` |

---

## 一、公开端（未登录）

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| 1 | 首页 Gallery | `/` | 页面加载无报错；赛事卡片可见；公开导航栏显示 Races / Works / Riders / Cooperation |
| 2 | Race 详情页 | `/races/sorting-challenge` | 赛事标题/状态/时间线正确；CTA 按钮「报名参赛」可见（未登录态） |
| 3 | Live Hall | `/races/sorting-challenge/live` | 实况大厅加载；能看见 Rider 动态/Projection 数据 |
| 4 | Works | `/races/sorting-challenge/works` | 作品列表渲染；无 JS 报错 |
| 5 | Works（已结束） | `/races/performance-marathon/works` | 已结束赛事作品正常展示 |
| 6 | Results | `/races/performance-marathon/results` | 最终赛果页面；Award 榜单/排名表可见 |
| 7 | Review | `/races/performance-marathon/review` | 评审总结页加载 |
| 8 | Rider 列表 | `/riders` | 骑手列表页加载 |
| 9 | Rider Profile | `/riders/rider_alice` | 单骑手详情页：Skill Tag / 参赛记录 / 作品 |
| 10 | Cooperation | `/cooperation` | 合作页加载，无报错 |
| 11 | 报名页 | `/races/api-design-race/register` | 未登录态显示「请先登录」或跳转登录 |

---

## 二、登录流程

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| 12 | 登录页 | 打开 `/login` | 页面有「身份入口」标题；本地账号登录表单可见；GitHub 登录按钮可见 |
| 13 | 本地登录 | 用 `organizer_demo / organizer123` 登录 | 登录成功跳转到 `/`；顶部不再显示登录入口 |
| 14 | OAuth 错误处理 | 点 GitHub 按钮（未配 App 时） | 不应白屏；应重定向到 `/login?oauthError=github_callback_failed` 并显示中文错误提示 |
| 15 | 退出 | 退出登录 | 回到公开 Gallery 状态 |

---

## 三、Console 控制台（各角色登录后）

### Organizer（`organizer_demo`）

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| 16 | Console 入口 | `/console` | 显示控制台首页；列出「赛事控制台」入口 |
| 17 | 赛事列表 | `/console/races` | 只显示 `organizer_demo` 创建的赛事（Sorting Challenge / API Design / Performance Marathon） |
| 18 | Organizer 视图 | `/console/races/sorting-challenge/organizer/overview` | 赛事概览页加载；不报错 |
| 19 | 报名管理 | Organizer 视图内切到 registrations | 报名列表可见 |
| 20 | 大屏控制台 | `/console/screen` | **不应可见**（大屏仅 Admin） |

### Rider（`rider_alice / rider123`）

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| 21 | Console 入口 | `/console` | 显示「骑手控制台」入口 |
| 22 | Rider 视图 | `/console/races/sorting-challenge/rider/overview` | 骑手视图加载：报名状态 / 作品提交 / 评审结果 / 骑手报告 |
| 23 | 只看自己的数据 | Rider 视图 | 不应看到其他 Rider 的 CA 连接或提交详情 |

### Judge（`judge_demo / rider123`）

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| 24 | Console 入口 | `/console` | 显示「评委控制台」入口 |
| 25 | Judge 视图 | `/console/races/sorting-challenge/judge/assigned` | 评委列表加载；只显示分配给 `judge_demo` 的作品 |

### Admin（`admin_demo / organizer123`）

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| 26 | Console 入口 | `/console` | 显示「管理控制台」入口 |
| 27 | Admin 页面 | `/console/admin/users` | 用户列表/资料补全/角色维护 三个区块；角色标签显示中文（管理员/评委/主办方/骑手） |
| 28 | 大屏控制台 | `/console/screen` | **可见**（Admin 有权限）；列出可控制大屏的赛事 |

---

## 四、大屏与 Jumbotron（Admin 登录后）

| # | 检查项 | URL | 验证要点 |
|---|--------|-----|---------|
| 29 | Screen Console | `/console/screen` | 赛事列表可见；可进入各赛事的大屏控制面 |
| 30 | Screen Display | `/console/screen/sorting-challenge/live` | 大屏展示面加载；7 种模式可切换（Live/Leaderboard/Works/Announcement 等） |
| 31 | Jumbotron 兼容 | `/jumbotron/race_active` | 赛马画面加载；🐎 在赛道上；TOP3/KPI/Ticker 正常 |

---

## 五、赛马大屏交互（Jumbotron）

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| 32 | 赛马画面 | 打开 `/jumbotron/race_active` | 8 匹马在赛道上可见 |
| 33 | KPI 点击 | 点击「完成度」KPI | 展开各队明细表 |
| 34 | 马匹点击 | 点击赛道上任意一匹马 | 弹出 drill-down 详情面板 |
| 35 | Debug 模式 | 按 D 键 | 显示红色中心线 + 采样点 + s 值 |
| 36 | 全屏 | 点 🔲 全屏 | 新标签页满屏 |

---

## 六、Calibrator 赛道编辑器（Organizer 登录后）

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| 37 | 入口 | 打开 `/calibrator` | 欢迎页和赛道编辑界面 |
| 38 | 控制点可见 | — | 12 个预设控制点 + 蓝色路径线可见 |
| 39 | 拖拽 | 左键拖拽任一控制点 | 点跟随鼠标移动 |
| 40 | 删除 | 右键点击控制点 | 点被删除 |
| 41 | 添加 | 双击空白区域 | 新增控制点出现 |
| 42 | 预览 | 拖动底部进度条 | 马沿赛道移动 |
| 43 | 校验 | 点 ✓ Validate | Inspector 显示校验结果 |
| 44 | 导出 | 点 ⬇ Export | 下载 JSON 文件 |

---

## 七、Race 8 状态机验证

| # | 赛事 | 预期状态 | URL |
|---|------|---------|-----|
| 45 | Sorting Challenge | `running`（比赛中） | `/races/sorting-challenge` |
| 46 | API Design Race | `registration`（报名中） | `/races/api-design-race` |
| 47 | Performance Marathon | `completed`（已结束） | `/races/performance-marathon` |

每个赛事页面上应显示对应的中文状态标签。

---

## 八、异常与边界

| # | 检查项 | 操作 | 验证要点 |
|---|--------|------|---------|
| 48 | 404 | 访问 `/races/nonexistent` | 应返回 404 或友好提示，非白屏 |
| 49 | 未登录访问 Console | 未登录直接访问 `/console` | 重定向到 `/login` |
| 50 | Rider 无权限访问 Organizer 视图 | Rider 登录后访问 `/console/races/sorting-challenge/organizer/overview` | 重定向或拒绝访问 |

---

**检查完成后，在每项后面标记 ✅ 或 ❌，有问题记下截图和 URL 反馈给我。**
