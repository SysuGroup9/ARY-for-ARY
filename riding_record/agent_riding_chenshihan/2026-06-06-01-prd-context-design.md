# 2026-06-06 计划摘抄 01：ARY PRD 上下文设计

来源：

- `docs/superpowers/specs/2026-06-06-ary-prd-context-design.md`

类型：

- 上下文设计 / 约束说明

核心结论：

- 后续开发必须先读 `PRD.md`，再读这份上下文设计，再看实际代码。
- 不要从 `README.md` 或 `ROADMAP.md` 反推产品定义。
- `PRD.md` 仍然是需求基线，但当前仓库已经是可运行的全栈 PoC，不再是浏览器 localStorage 版。

关键阅读顺序：

1. `PRD.md`
2. `docs/superpowers/specs/2026-06-06-ary-prd-context-design.md`
3. `src/lib/services/submissions.ts`
4. `src/lib/services/scoring.ts`
5. `src/app/api/runner/tasks/` 下的接口

必须明确说清的现实差异：

1. `PRD.md` 还写着 localStorage，但当前实现已经是 SQLite。
2. `PRD.md` 的 Runner 接口是概念说明，当前仓库里的接口才是真实协议。
3. 公开榜单刷新目前仍是 Organizer 手动触发，不是自动调度。
4. 当前 Harness 展示仍是 PoC 级别的派生能力，不是独立二次评测流水线。
5. ARY 当前仍会保留最佳归档代码与 Riding Record，这是 PoC 折中，不应被表述成“完全不保存原始提交”。

数据讨论时必须分清三类：

- `Public Projection`
  - 公开赛事描述、公开榜单、公开展示、公开通知
- `Process Metadata`
  - 账号、队伍、提交状态、时间戳、反馈、发布检查点
- `Private Artifacts`
  - Organizer 测试代码、Organizer Runner 逻辑、Rider 原始代码、Riding Record、隐藏评测细节

后续改动要求：

- 任何涉及 artifact 的改动，都要明确回答：
  - 谁能看到
  - 谁来保存
  - 什么时候删除
  - 是否会转成公开投影

对未来工作的建议方向：

1. 榜单刷新节奏与 PRD 对齐
2. Harness 语义从当前 showcase 派生逻辑中分离
3. 进一步收紧归档保留策略
4. 加强 Runner 鉴权和协议分层
