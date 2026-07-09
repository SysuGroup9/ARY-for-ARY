# ARY-for-ARY GRS003 骑行记录

- 记录日期：2026-06-20
- 记录人：阮依成

## 本轮对项目的主要贡献

### 1. 从「能跑的大屏」推进到「接入真实数据的大屏」

6 月 18 日之后，我最先关注的不是页面是否存在，而是大屏背后的数据是否真实、语义是否正确。

当时我连续追问了几个问题：企业修改比赛后进度榜单和大屏是否会清零、参赛用户是否真实创建并可登录、进度/质量/风险的实现逻辑是否一致、企业创建比赛时的选项是否足够、大屏是否只被发布题目的企业看到。这些问题把大屏从一个视觉组件重新拉回到 GRS003 的核心要求：它应该是赛事过程展示的一部分，而不是只靠假数据撑起来的演示页。

围绕这个方向，Agent 帮我检查了：

- `LeaderboardEntry`、`TeamArchive`、`RaceSnapshot` 和 Jumbotron adapter 的数据映射关系。
- Seed 数据里是否真的创建了 organizer / rider 账号，以及这些账号是否能通过账号密码登录。
- Jumbotron 中进度、质量、风险的来源是否仍然存在 mock 成分。
- 当前大屏访问边界是否符合“企业、观众、参赛者都能看”的展示预期。

这一步让我意识到，大屏不是单独的 UI，它背后必须有一条可信的数据链：赛事事实 → 过程投影 / 快照 → adapter → 大屏渲染。后续围绕 CA 接入、Projection、Evidence、Report 的讨论，也都是从这里延伸出来的。

### 2. 重新确认登录页面与账号体系在 GRS003 中的必要性

6 月 19 日，我专门让 Agent 去看 `docs/grs003` 中的要求，确认登录页面是不是 GRS003 必需能力。

结论很明确：登录不是可选项。GRS003 要求后台访问必须登录，并且最终目标是 GitHub 登录、资料补全和多角色 `User.roles`。当时 Agent 对比了文档和当前代码，指出当前项目虽然已经有 `/login`，但仍是本地用户名 / 密码登录，和 GRS003 的 GitHub OAuth 目标不完全一致。

这轮讨论的价值在于，我不再把“登录页”理解成一个孤立页面，而是把它放进了 GRS003 的权限和角色体系中：

- Public 可以公开浏览赛事、作品、赛果和大屏展示。
- Rider、Organizer、Judge、Admin 必须通过登录进入各自控制台。
- 控制台访问不仅要看是否登录，还要看角色范围和资源归属。
- GitHub 登录和资料补全是后续正式 MVP 的方向。

后来项目里补齐 GitHub OAuth 主链路、Admin 控制台角色维护、以及多角色访问入口时，这次讨论提供了一个判断基线：登录页面不是为了“有一个入口”，而是为了支撑 GRS003 的整个权限闭环。

### 3. 推动大屏控制台从 Jumbotron 页面升级为 Screen Console 入口

GRS003 要求 Screen Console 是独立控制台，不应该混在普通 Race Console 或单个 Jumbotron 页面里。6 月 19 日之后，我多次围绕这个差距推进：先确认当前只有 `/jumbotron/[raceId]` 这种展示页，缺少真正的大屏控制台；再根据文档要求，把 Screen Console 理解为可以选择赛事、切换展示模式、进入校准、管理大屏输出的控制入口。

后续实现中，大屏控制台逐步具备了：

- `/console/screen` 作为大屏控制台入口。
- 按赛事进入 `/console/screen/[raceSlug]/[mode]`。
- 支持 `jumbotron / billboard / live / leaderboard / works / announcement / calibration` 等模式结构。
- 在 Jumbotron 模式中复用现有快照和 track runtime 做预览。
- 从控制台中打开大屏、打开校准器、打开公开赛事页。

最近一轮我又要求把 `OrganizerConsolePageView` 里加上和 `screen-console-page.tsx` 一样的大屏控制台入口，让 ORGANIZER 也能进入大屏控制台。这个改动最终落到三处：

- `src/app/_components/console/organizer-console-page.tsx`：主办方「下一步入口」新增「大屏控制台」按钮。
- `src/lib/viewer-access.ts`：允许 `ORGANIZER` 使用和看到 Screen Console。
- `src/lib/services/console-routes.ts`：`ADMIN` 可看全部赛事，`ORGANIZER` 只看自己主办的赛事。

这件事对我来说很重要，因为它把“现场大屏操作”从管理员代管，调整回主办方的真实工作流：主办方创建并运营赛事，也应该能进入自己赛事的大屏控制台。

### 4. 大屏控制台与校准器的修复和权限收口

大屏展示不是只有最终画面，还包括赛道校准工具。GRS002 / GRS003 的 Jumbotron 设计里，Calibrator 是保证赛道资产可信、路径可运行的关键工具。

在后续修复中，我重点关注两件事：

1. **校准器访问权限**  
   当前 `src/app/calibrator/page.tsx` 已明确只允许 `ORGANIZER` 与 `ADMIN` 访问。这符合校准器作为设计 / 资产生产工具的定位：它不是公开展示页，而是主办方和管理员用于调试赛道、验证 track profile 的内部工具。

2. **Screen Console 与 Calibrator 的连接**  
   大屏控制台中的「输出目标」区域提供「打开校准器」入口，使主办方在调试大屏时可以从同一个控制台上下文进入赛道校准工具，而不是在路由之间手工跳转。

这类修复看起来不像新增大功能，但它让大屏链路更完整：

```text
Screen Console
→ 选择赛事与展示模式
→ 打开 Jumbotron 大屏
→ 必要时进入 Calibrator 调整赛道 profile
→ 回到大屏验证实际展示效果
```

我印象深刻的是，这里真正要修的不是一个按钮，而是“控制台入口、权限边界、展示页、校准器”之间的关系。

### 5. 防伪与防篡改方案从早期设想调整到 GRS003 语义

6 月 19 日后，我还回头检查了自己早期写的 `docs/grs003/防伪与防篡改安全计划.md`。这份文档是在还没完整读 GRS003 时写的，所以我让 Agent 判断是否需要修改。

Agent 的结论是：安全目标本身可以保留，但需要按 GRS003 重写落点。早期版本里有很多旧模型表述，例如 `teamId`、`submissionId`、Runner 拉取提交、违规后直接 DQ、大屏红色公示等；而 GRS003 的正式主线更强调：

- `Registration`
- `RaceProject`
- `CAConnection`
- `Session`
- `Evidence`
- `Projection`
- `Report`
- Review Flag / Review Readiness

这次对照让我明确了一件事：GRS003 的安全机制不是为了自动判罚选手，而是为了建立可信证据链。接入异常、证据缺口和风险提示应该进入 Organizer / Judge 的评审前工作流，而不是由底层检测直接替代人工裁决。

## 最重要的对话记录

### 关键追问 1：大屏到底是不是在读真实赛事数据

6 月 18 日，我对同学已有实现提出连续追问：进度榜单和大屏是否随企业改题清零、参赛用户是否真实存在、进度/质量/风险逻辑是否一致、大屏是否只给企业看。

这组问题把后续工作方向从“页面是否好看”转向“数据和权限是否可信”。大屏如果只是静态演示，不符合 GRS003；只有当它读取真实赛事、真实选手、真实进度或 Projection 时，才是 ARY 的过程展示能力。

### 关键判断 2：登录页面需要，但不能停留在本地账号

6 月 19 日，我问登录页面是不是需要。Agent 对照 GRS003 后指出：需要登录，而且最终应该是 GitHub OAuth、资料补全、多角色体系。这个判断帮助我把 `/login` 从“演示账号入口”升级理解为“控制台权限入口”。

### 关键落地 3：大屏控制台和校准器要属于主办方工作流

我最后要求在 Organizer 控制台加入大屏控制台入口，是因为只让 Admin 进入大屏控制台并不符合真实办赛流程。主办方负责赛事，自然也应该负责自己赛事的大屏展示和校准联调。

这次修改恢复了 Organizer 的 Screen Console 入口，同时保留了权限边界：Organizer 只看自己主办的赛事，Admin 仍看全部赛事。

## 原始精彩对话摘录

> 以下摘录只选取 `agent_riding_ruanyicheng.md` 中 2026-06-18 及之后的 GRS003 相关对话。为了保留 riding record 的现场感，这里尽量保留原始语气，只做少量排版整理。

### 片段 1：6 月 18 日，追问大屏是不是只有“看起来能跑”

**User · 2026-06-18**

> 观察下现在这是我小组同学做的，
> （1）她现在当企业修改比赛过后进度榜单、大屏幕会清零吗
> （2）她的参赛用户是真的有创建，可以用账号密码登入的吗，我好像没看见
> （3）她的进度、质量、风险的实现逻辑和我是一样的吗
> （4）企业创建比赛时的选项有多吗
> (5)以及我发现她现在做的屏幕只有发布题目的企业才能看，正确应该是企业、观众、参赛者都能看，这时应该要改的

**Assistant · 2026-06-18**

> 我会按当前仓库实现来检查，不混用旧上下文。重点看五件事：
>
> 1. 企业修改比赛后是否真的清空进度榜单和大屏快照；
> 2. seed 里是否创建了真实 Rider / Organizer 账号，以及是否能通过账号密码登录；
> 3. Jumbotron 的进度、质量、风险是否来自和你原设计一致的数据逻辑；
> 4. 创建比赛表单是否覆盖足够多的赛事配置项；
> 5. Jumbotron / 大屏是否被 Organizer-only 权限限制。

**Assistant 结论摘录 · 2026-06-18**

> 至少要做到：
>
> 1. 首页或比赛卡片里，**所有角色都能看到 Jumbotron 入口**；
> 2. Jumbotron 页面本身**不做 Organizer-only 权限限制**；
> 3. 不依赖“只有 Organizer 先点生成快照”才能看；
> 4. Rider / Audience 打开后也能直接看到当前比赛大屏。
>
> 最关键的一句总结：你同学这版不是“全错”，但**它更像 GRS002 早期 PoC / mock 版**；你现在这版才更接近你要求的正式评分口径：**真实账号、真实数据流、Jumbotron 面向所有人公开可见、进度/质量严格分离、Calibrator 与 runtime 共用引擎**。

**User · 2026-06-18**

> 不用管，现在决定第二周的屏幕就是用她的，你要做的是 debug，看和我相比以上那些点，她有什么 bug，现在仓库里应该都是她实现的，你不要因为上下文弄混了。

这一段对我来说很关键。因为我不是简单要求 Agent “继续实现大屏”，而是明确要求它回到当前仓库，围绕真实 bug 和真实差距做 debug。这里也第一次把“第二周的大屏 PoC”和“GRS003 正式语义”区分开：可以沿用已有屏幕，但必须知道它哪些地方是假数据、权限或模型不对。

### 片段 2：6 月 19 日，确认登录页面不是可有可无

**User · 2026-06-19**

> 查看一下 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\grs003` 里面的要求，登录页面是需要的吗？

**Assistant · 2026-06-19**

> 对照 GRS003，登录能力是需要的，而且不是一个纯装饰入口。文档里要求：
>
> - 基础账号能力：GitHub 登录、个人资料补全；
> - 后台访问必须经过登录和 `User.roles` 权限校验；
> - Race Console、Admin Console、Screen Console 的访问边界必须隔离；
> - Public 只能访问公开资源，Rider / Judge / Organizer / Admin 进入各自控制台。
>
> 当前代码里虽然已有 `/login`，但实现还是本地 username / password 登录，不是 GitHub OAuth；角色也是旧的单角色模型，不是 GRS003 要求的 `User.roles` 多角色体系。所以结论是：**登录页需要保留，但长期要从本地账号入口升级到 GitHub OAuth + profile completion + 多角色权限入口。**

**后续对照结论摘录 · 2026-06-19**

> 登录虽然“需要”，但方式不符合 GRS003。
>
> 当前实现：
>
> - 本地用户名 / 密码注册登录；
> - 单一 `User.role`；
> - 不是 GitHub OAuth；
> - 没有 profile completion 流程。
>
> 所以这块待办是：
>
> - 改成 **GitHub 登录**；
> - 增加 **个人资料补全**；
> - 改成 **`User.roles[]` 多角色**，不是单个 role。

这一段让我意识到，登录页面不是“用户能不能进系统”的简单问题，而是 GRS003 所有后台和控制台权限的入口。后面再看 Admin Console、Race Console、Screen Console，就不能只看页面有没有做出来，还要看角色、资源归属和权限边界是否对齐。

### 片段 3：6 月 19 日，对照 GRS003 后重新理解 Screen Console

**User · 2026-06-19**

> 对比下 GRS003 的要求，看一下现在还有哪些要做的。

**Assistant 摘录 · 2026-06-19**

> 对比下来，**现在离 GRS003 还差的不是几个小页面，而是还有一整层产品结构和领域模型没有落地**。
>
> 最大缺口是整体 IA 还没切到 GRS003。现在的实现还是把公开页、Rider、Organizer 操作混在首页 `/` 上。  
> 但 GRS003 要的是：
>
> - Public Site：首页 / Race Gallery、Race Page、Live Hall、Works、Work Page、Results、Review、Rider Profile、Cooperation；
> - Console：`/console/...`、Race Console（Organizer / Rider / Judge）、Admin Console、Screen Console。
>
> 现在的大屏更像是 **Screen Display**，但 **Screen Console** 还没有真正做出来。

**Assistant 对 Screen Console 的待办摘录 · 2026-06-19**

> Screen Console 需要具备：
>
> - 赛事选择；
> - Jumbotron / Billboard / Live / Leaderboard / Works / Announcement 等模式；
> - Theme / Calibration；
> - fullscreen / fallback control；
> - 可以展示赛事实况、榜单、作品或公告。

这一段是我后来坚持“大屏控制台”和“Jumbotron 展示页”必须分开的原因。`/jumbotron/[raceId]` 只能说明大屏能显示，但 GRS003 需要的是 Screen Console：能选赛事、切模式、进校准、控制现场展示。

### 片段 4：6 月 19 日，防伪防篡改文档从旧模型改回 GRS003 语义

**User · 2026-06-19**

> 我现在这个文档是在还没整体阅读 GRS003 的时候写的：`C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\grs003\防伪与防篡改安全计划.md`，现在需要改吗？

**Assistant · 2026-06-19**

> 要改，而且我建议 **改**，不是小修。
>
> 这份文档不是“完全不能用”，但它是在没完整读 GRS003 前写的，所以现在和 GRS003 的主线有几处**结构性冲突**。
>
> - **安全目标本身可以保留**：来源认证、完整性保护、防重放、审计追踪。
> - 但**方案落点、数据模型、处罚方式、对象命名**都需要按 GRS003 重写。

**Assistant 关键判断摘录 · 2026-06-19**

> 最大的问题是它还是旧模型：`team / submission / runner`。
>
> 你这份文档的核心对象还是：
>
> - `teamId`
> - `submissionId`
> - Runner 拉取提交
> - 违规后直接 DQ
>
> 但 GRS003 后面的主线是：
>
> - `Registration`
> - `RaceProject`
> - `CAConnection`
> - `Session`
> - `Evidence`
> - `Projection`
> - `Report`

**Assistant 关于处罚方式的判断 · 2026-06-19**

> “违规直接取消资格”和 GRS003 的产品约束冲突。
>
> GRS003 的主线约束是：
>
> - CA 接入失败、无 CA 数据、接入异常，不自动取消提交、评审或 Award 资格；
> - 应该进入评审前风险提示；
> - Projection 不是真实最终事实源。
>
> 所以这里最大的问题不是“安不安全”，而是你的文档把安全事件直接绑定成了**自动判罚机制**。GRS003 更偏向：
>
> - 先形成 risk / review readiness / evidence gap；
> - 是否取消资格，应该进入 Organizer / Judge 的治理流程，而不是底层接入层自动做掉。

这个片段很能代表我对 GRS003 的理解变化：早期我会把防伪防篡改理解为发现异常就公示、DQ、排名移除；读完 GRS003 后才知道，更合理的方式是把异常变成可信证据链中的风险信号，让 Organizer / Judge 在评审工作流中处理。

### 片段 5：6 月 20 日，校准器和 Organizer 大屏控制台入口的最终修复

**User · 2026-06-20**

> 别再读来读去了，现在我已经把文件修改了，Admin 可以正确访问了：
>
> ```ts
> import { loadDatabaseUser } from "@/lib/auth";
> import { hasRole } from "@/lib/user-roles";
> import { redirect } from "next/navigation";
> import CalibratorClient from "./CalibratorClient";
>
> export const dynamic = "force-dynamic";
>
> export default async function CalibratorPage() {
>   const user = await loadDatabaseUser();
>
>   // 仅 Organizer 与 ADMIN 可访问
>   if (!user || !(hasRole(user.roles, "ORGANIZER") || hasRole(user.roles, "ADMIN"))) {
>     redirect("/");
>   }
>
>   return <CalibratorClient />;
> }
> ```
>
> 你现在再直接帮我把 Organizer 那里也加上和 Admin 相同的大屏控制台，让它也可以控制大屏，别读文档了！

**User · 2026-06-20**

> 修改 `src/app/_components/console/organizer-console-page.tsx`，在里面加上和 `screen-console-page.tsx` 一样的大屏控制台入口，让 ORGANIZER 也能进入大屏控制台。

**Assistant 修改摘录 · 2026-06-20**

> 在 `src/app/_components/console/organizer-console-page.tsx` 的主办方「下一步入口」里新增了 **大屏控制台** 按钮，跳转到：
>
> - `/console/screen/${raceSlug}/jumbotron`
>
> 同步把说明文案改成主办方可进入大屏控制台。
>
> 为了让 ORGANIZER 实际能访问大屏控制台，也同步更新了权限逻辑：
>
> - `src/lib/viewer-access.ts`
>   - `canUseScreen` 允许 `ADMIN` 或 `ORGANIZER`；
>   - 控制台首页 section 允许 ORGANIZER 看到「大屏控制台」；
>   - `/console/screen` 访问权限允许 ORGANIZER。
> - `src/lib/services/console-routes.ts`
>   - `ADMIN` 仍可看到全部赛事；
>   - `ORGANIZER` 只能看到自己主办的赛事。

**Assistant 验证摘录 · 2026-06-20**

> 尝试运行 `npm test -- --runInBand src/app/_components/console/console-copy.test.tsx`，但项目没有 `test` script，失败信息为 `Missing script: "test"`。
>
> `npm run lint` 已完成，但失败原因是仓库里已有多处 lint error；输出中没有看到本次修改文件的新增 lint 错误。

这段对话是一个很典型的“最后一公里”修复：校准器权限已经由我改成 Organizer / Admin 可访问，但如果 Organizer 控制台里没有入口，主办方仍然不能自然进入大屏控制台。最终修复不是只加一个按钮，而是连同 `viewer-access.ts` 和 `console-routes.ts` 一起改，确保入口、权限和赛事范围都一致。

### 片段 6：6 月 19 日，把“当前实现”和 GRS003 缺口做成可执行清单

**User · 2026-06-19**

> 对比下 GRS003 的要求，看一下现在还有哪些要做的。

**Agent 子任务结论摘录 · 2026-06-19**

> Below are the concrete MVP/P0 items that still look implementation-actionable, grouped by area.
>
> ### Public site
> - Build Gallery-first home, Race Page, Live Hall, Works list/detail, Results, Rider Profile, Review, Cooperation.
> - Acceptance: 2-click entry to featured race / Live Hall / Results / Works; homepage has no standalone leaderboard.
>
> ### Race console
> - Implement Organizer View, Rider View, Judge View.
> - Acceptance: race lifecycle closes end-to-end; approved registration auto-creates one RaceProject; CA failure doesn’t cancel eligibility.
>
> ### Admin console
> - Build `/console/admin` for user list, profile completion, and `User.roles` maintenance.
>
> ### Screen console
> - Build Screen Console with race selection, Jumbotron / Billboard / Live / Leaderboard / Works / Announcement modes, theme / calibration, fullscreen / fallback.
>
> ### Auth
> - Replace password login with GitHub login + profile completion; enforce login for all consoles.
>
> ### Riding intelligence
> - Implement CAData ingestion, RaceProject, CAConnection registration / handshake, risk flags, Evidence, Projection, reports.

**Agent 对当前代码的对照摘录 · 2026-06-19**

> Current app surface, from code:
>
> - Home/public hub is a single mixed page at `src/app/page.tsx`。它同时承载 public browsing、auth state、organizer tools、rider tools、runner queue 和 in-page Jumbotron previews。
> - Login/auth is local username/password, not GitHub OAuth。
> - `/login` 是唯一 dedicated auth page。
> - `/audience` 只是 redirect 到 `/`。
> - Organizer support exists in-page on `/` and as a dedicated create page `/races/new`。
> - Rider support exists in-page on `/`。
> - Judge / admin are not separate routes。
> - Screen/console support is the Jumbotron route `/jumbotron/[raceId]`。
> - Results / works / review / rider pages are not separate routes。
>
> Major shortcut: this app deliberately collapses “public home + console” into one single-page home, and uses local session auth instead of GitHub.

**Assistant 总结摘录 · 2026-06-19**

> 对比下来，**现在离 GRS003 还差的不是几个小页面，而是还有一整层产品结构和领域模型没有落地**。
>
> 如果按“现在最该做什么”排序：
>
> 1. **IA 重构**：Public Site / Race Console / Admin Console / Screen Console 分开；
> 2. **GitHub 登录 + 资料补全 + 多角色**；
> 3. **Race Console 三视图独立化**：Organizer / Rider / Judge；
> 4. **Admin Console**；
> 5. **Screen Console**；
> 6. **领域模型迁移到 GRS003**：Registration / RaceProject / CAConnection / Award / Evidence / Report；
> 7. **Works / Review / Rider Profile / Cooperation 独立页面化**；
> 8. **真正的 Riding Intelligence**：CA 接入、Projection、Evidence、Report。
>
> 一句话结论：现在不是“还差几个小功能”，而是“当前 demo 已经做出了一个可跑的 ARY-like 原型，但距离 GRS003 要求的正式 MVP 架构，还差 IA 分层、GitHub 登录、多角色、Console 体系、核心领域模型和 Riding Intelligence 主链路”。

这一段是我后续做取舍的重要依据。它把“还没做完”从模糊感觉变成了清单：哪些属于页面 IA，哪些属于权限，哪些属于领域模型，哪些属于底层 CA / Projection 能力。没有这个对照，后面很容易在 UI、小修小补和真正 GRS003 差距之间混淆优先级。

### 片段 7：6 月 20 日，要求快速生成防伪防篡改实现检查文档

**User · 2026-06-20**

> 这些存在的问题不用你改，你快点给我对照 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\grs003\防伪与防篡改安全计划.md` 看差距在哪，文档里的内容会不会过时，最后在 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY` 里面快速生成现有防伪防篡改实现以及下一步实现的 md 文档！！！！！！

**Assistant · 2026-06-20**

> 我先快速定位现有防伪 / 防篡改实现和目标文档内容，先做差距盘点，再直接在项目根目录生成一份现状与下一步的汇总文档。

**Assistant 检查过程摘录 · 2026-06-20**

> 我现在要回答两个具体问题：
>
> 1. 当前代码里到底已经有什么 anti-tamper / integrity / source authenticity 能力；
> 2. 它和 `防伪与防篡改安全计划.md` 的差距在哪里。
>
> 目前能看到的现有实现主要是：
>
> - session cookie / `SESSION_SECRET` 保护登录态；
> - runner bearer secret；
> - Rider 代码公开开关的二次确认；
> - CAConnection / RaceProject / Evidence / Projection 等模型已经出现；
> - CA handshake / ingestion / snapshot fetch 相关 service 和 route 已经存在；
> - 但签名、公钥、nonce、消息级验签、内容 hash、Runner 输入输出 hash 追踪等还没有完整落地。

**User · 2026-06-20**

> 将结果生成防伪、防篡改实现检查的 md 文件。

这一段体现的是我当时很明确的验收压力：不是继续空谈“安全计划”，而是要把文档和代码对上，看当前仓库究竟实现了什么。这里的关键词是“现有实现”和“下一步实现”，也就是把防伪防篡改从方案文档推进成工程状态检查。

### 片段 8：6 月 20 日，追问 Projection 重建是不是太重

**Assistant 过程摘录 · 2026-06-20**

> I’m tracing the ingestion path now. The key question is whether each accepted signal is triggering whole-race rebuilds where a narrower projection update would do.
>
> I’m checking the ingestion and action paths side by side to see where evidence/projection rebuilds are triggered and whether any path is doing duplicate work.

**Assistant 结论摘录 · 2026-06-20**

> `rebuildRaceProcessProjections(raceId)` is already triggered in the three places that matter for CA data updates:
>
> - Registration flow: inside `registerForRaceAction`；
> - Manual CA snapshot fetch: inside `fetchCASnapshotAction`；
> - CA connection creation: inside `registerCAConnectionAction`。
>
> It is also invoked inside the lower-level ingestion services after data is written:
>
> - Ingestion event handling；
> - Snapshot fetch service。
>
> So if your concern was “are projections rebuilt after CA updates?”, the answer is yes, and in fact they’re rebuilt both from the server actions and again from the service layer. That duplication may be intentional for safety, but it also means some paths are doing the rebuild twice.

这一段虽然不是页面功能，但它和“让大屏接入真实数据”高度相关。因为大屏、Live Hall、Race Console 的过程展示最终都要读 Projection。如果 CA 更新后 Projection 不重建，大屏就是旧数据；如果每次都全量重建，又可能带来性能和重复计算问题。这让我看到：真实数据大屏不只是“有数据源”，还要有合适的重建时机和成本控制。

### 片段 9：6 月 20 日，把完成内容写回状态文档

**User · 2026-06-20**

> 帮我更新以上做的修改到 `C:\Users\ruanyicheng\Desktop\ARY-for-ARY\docs\superpowers\status.md` 文件里面。

**Assistant 摘录 · 2026-06-20**

> 已更新 `docs/superpowers/status.md`，内容包括：
>
> - 修改「当前状态」里关于大屏控制台权限的描述：
>   - 现在记录为 `Organizer` 已恢复大屏控制台入口；
>   - `Organizer` 只能看到自己主办的赛事；
>   - `Admin` 仍可查看全部赛事。
>
> - 新增章节：
>   - `2026-06-20 Organizer 大屏控制台入口恢复`
>   - 记录了这次改动的背景、涉及文件和验证结果。
>
> - 标注旧章节：
>   - `2026-06-19 大屏控制台权限边界收口`
>   - 已改为历史记录，并注明已被 2026-06-20 的新决策覆盖。

这个片段说明我不仅要求改代码，也要求把状态文档同步更新。因为 GRS003 后期改动很多，如果状态文档不更新，很容易出现“代码已经恢复 Organizer 入口，但文档还写只允许 Admin”的矛盾。这个习惯也影响了后续 riding record 的整理：不只记录结果，还记录为什么某个旧决策被新决策覆盖。

### 片段 10：6 月 20 日，整理个人 Riding Record 时明确只取 6 月 18 日之后

**User · 2026-06-20**

> 请帮我完成以下任务：
>
> 1. 先阅读参考文件 `riding_record_grs003/陈诗翰's riding_record.md`，学习它的写法和结构。
> 2. 再阅读原始对话记录 `agent_riding_ruanyicheng.md`，提取从 6 月 18 日开始的 GRS003 相关记录，忽略 6 月 15 日以前的内容。
> 3. 在 `riding_record_grs003/` 目录下生成一份新的文件 `阮依成's riding_record.md`，重点记录以下我印象深刻的内容：
>    - 让大屏接入真实数据
>    - 登录页面的添加
>    - 大屏控制台与校准器的修复
> 4. 根据 `riding_record_grs003/` 目录下现有的内容，修改该目录下的 `README.md` 文件，更新目录结构说明。
>
> 注意：
> - 仿照 `陈诗翰's riding_record.md` 的格式和风格
> - 只总结 6 月 18 日及之后的记录

**Assistant 摘录 · 2026-06-20**

> 已完成：
>
> 1. 阅读并参考了 `riding_record_grs003/陈诗翰's riding_record.md` 的结构和风格。
> 2. 阅读 `agent_riding_ruanyicheng.md`，只提取了 2026-06-18 及之后的 GRS003 相关内容。
> 3. 新增文件：`riding_record_grs003/阮依成's riding_record.md`。
> 4. 已更新：`riding_record_grs003/README.md`。

这段是当前 riding record 产生的直接背景。我特意限制“只总结 6 月 18 日及之后”，是因为前面的 Jumbotron / GRS002 对话虽然也很多，但这份记录要聚焦 GRS003 期间我真正印象深刻的几条线：真实数据大屏、登录和权限、大屏控制台、校准器、防伪防篡改语义调整。

## 仍需继续关注的缺口

- 大屏虽然已经从 Jumbotron 页面升级到 Screen Console 结构，但不同模式目前仍有过渡实现，后续还需要继续把 Projection、榜单、公告和作品展示真正做实。
- GitHub 登录已经进入项目主链路，但仍要持续确认本地演示账号、GitHub OAuth、profile completion、多角色之间的关系是否清晰。
- 校准器目前能作为内部工具访问，但还需要继续修复 lint / React 规则层面的历史问题，并提升它和 track profile 导出链路的稳定性。
- 防伪与防篡改文档已经按 GRS003 语义调整方向，但后续仍需要把安全计划真正落到模型字段、接入校验、审计记录和 Review Flag 上。

## 简短结论

这段 GRS003 骑行中，我最核心的贡献不是单独写某个页面，而是不断追问“这个功能是否符合 GRS003 的真实语义”：

1. 大屏不能只是假展示，必须接入真实赛事数据或可重建的 Projection。
2. 登录页不是装饰入口，而是 Console 权限、多角色和 GitHub OAuth 的基础。
3. 大屏控制台和校准器应该形成主办方可操作的真实工作流。
4. 防伪防篡改不能停在旧的 Team / Submission / Runner 模型上，而要回到 Registration / RaceProject / CAConnection / Evidence 的可信链。

如果用一句话概括：这轮工作让我从“做一个能看的演示”转向“让演示背后的数据、权限和控制台结构尽量贴近 GRS003”。
