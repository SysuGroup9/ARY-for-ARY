import type { ReactNode } from "react";
import { getDemoCredentials } from "@/lib/demo-credentials";
import CreateRaceFormClient from "@/app/_components/create-race-form-client";
import { formatDateTime } from "@/lib/format";
import {
  getRacePhaseLabel,
  shouldHidePublicLeaderboard,
  type RacePhase,
} from "@/lib/race-phase";
import { type RaceListItem } from "@/lib/services/races";
import { getAgentLabel } from "@/lib/services/submissions";

type FormAction = (formData: FormData) => void | Promise<void>;

type GroupedRaces = Record<RacePhase, RaceListItem[]>;

export function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function HeroSection({
  mode,
}: {
  mode: "member" | "auth" | "audience";
}) {
  const content = {
    member: {
      lede:
        "当前版本已经从前端 localStorage PoC 重构为真实全栈应用。账号、赛事、队伍、提交、反馈和榜单落在 SQLite，但 Organizer 的私有评测代码仍然不进入 ARY。",
      items: [
        "Organizer 可创建赛事并配置赛后披露边界。",
        "Rider 可真实注册、报名、提交代码和 Riding Record。",
        "Runner 可通过 API 拉取任务并回传评分。",
        "Audience 可直接在首页查看公开赛事与榜单。",
      ],
    },
    auth: {
      lede:
        "登录页现在只承担身份进入。Organizer 和 Rider 登录后进入完整工作区；公开观众浏览统一在首页完成，不再保留单独观众入口。",
      items: [
        "Organizer 登录后可进入赛事创建与管理区。",
        "Rider 登录后可报名、提交代码和发送反馈。",
        "公开赛事浏览统一收敛到首页。",
        "Runner API 仍独立使用 bearer token，不受网页登录门禁影响。",
      ],
    },
    audience: {
      lede:
        "当前是公开观众视图，只展示无需登录即可公开的赛事信息、公开榜单和赛后展示内容。",
      items: [
        "可浏览按状态分组的公开赛事。",
        "可查看公开榜单与封榜后的隐藏状态。",
        "可查看 Organizer 主动披露的赛后展示。",
        "如需报名、提交或管理赛事，请返回登录入口。",
      ],
    },
  }[mode];

  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow">ARY GRS 001</p>
        <h1>Public Yard, Private Race Source.</h1>
        <p className="hero__lede">{content.lede}</p>
        <div className="hero__chips">
          <span>Next.js 16</span>
          <span>Prisma 7</span>
          <span>SQLite</span>
          <span>真实 Session Cookie</span>
        </div>
      </div>
      <div className="hero__card">
        <h2>当前能力</h2>
        <ul>
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AuthTabsPanel({
  loginAction,
  registerAction,
}: {
  loginAction: FormAction;
  registerAction: FormAction;
}) {
  return (
    <div className="auth-tabs">
      <input
        className="auth-tabs__toggle"
        defaultChecked
        id="auth-tab-login"
        name="auth-tab"
        type="radio"
      />
      <input
        className="auth-tabs__toggle"
        id="auth-tab-register"
        name="auth-tab"
        type="radio"
      />

      <div className="auth-tabs__switches">
        <label className="auth-tabs__switch" htmlFor="auth-tab-login">
          登录
        </label>
        <label className="auth-tabs__switch" htmlFor="auth-tab-register">
          注册
        </label>
      </div>

      <div className="auth-tabs__panel auth-tabs__panel--login">
        <AuthForm
          action={loginAction}
          description="已有账号可直接登录"
          submitLabel="登录"
          title="登录"
        />
      </div>

      <div className="auth-tabs__panel auth-tabs__panel--register">
        <AuthForm
          action={registerAction}
          description="现场创建 Organizer 或 Rider 账号"
          includeRegisterFields
          submitLabel="注册"
          title="注册"
        />
      </div>
    </div>
  );
}

export function SeedAccountsPanel() {
  const credentials = getDemoCredentials();

  return (
    <Panel title="演示账号" eyebrow="Seed">
      <div className="seed-grid">
        {credentials.map((credential) => (
          <div key={credential.label}>
            <strong>{credential.label}</strong>
            <p>username: {credential.username}</p>
            <p>password: {credential.password}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RaceBrowserPanel({ grouped }: { grouped: GroupedRaces }) {
  return (
    <Panel title="赛事浏览" eyebrow="Race Browser">
      {(Object.entries(grouped) as [RacePhase, RaceListItem[]][]).map(
        ([phase, items]) => (
          <div className="race-group" key={phase}>
            <h3>{getRacePhaseLabel(phase)}</h3>
            {items.length === 0 ? (
              <p className="muted">暂无赛事</p>
            ) : (
              items.map((race) => (
                <article className="race-card" key={race.id}>
                  <div className="race-card__top">
                    <strong>{race.title}</strong>
                    <span>{race.teams.length} 队</span>
                  </div>
                  <p>{race.summary}</p>
                  <small>
                    {formatDateTime(race.raceStart)} -{" "}
                    {formatDateTime(race.raceEnd)}
                  </small>
                </article>
              ))
            )}
          </div>
        ),
      )}
    </Panel>
  );
}

export function RunnerApiPanel() {
  return (
    <Panel title="Runner API" eyebrow="Integration">
      <div className="stack">
        <code>GET /api/runner/tasks/pull?raceId=&lt;id&gt;</code>
        <code>POST /api/runner/tasks/result</code>
        <p className="muted">
          Header 使用 <code>Authorization: Bearer ary-runner-dev-secret</code>
        </p>
      </div>
    </Panel>
  );
}

export function PublicRaceSections({ race }: { race: RaceListItem }) {
  const isRunningPhase = race.phase === "active" || race.phase === "frozen";
  const isFinishedPhase = race.phase === "finished";

  return (
    <>
      <header className="race-panel__header">
        <div>
          <p className="eyebrow">{getRacePhaseLabel(race.phase)}</p>
          <h2>{race.title}</h2>
          <p>{race.summary}</p>
        </div>
        <div className="meta-pills">
          <span>{race.teams.length} 支队伍</span>
          <span>{race.submissionIntervalHours}h 提交冷却</span>
          <span>Top {race.displayHighlightCount} Highlight</span>
        </div>
      </header>

      <section className="grid">
        <Panel title="公开规则" eyebrow="Public Projection">
          <dl className="detail-grid">
            <div>
              <dt>题目包</dt>
              <dd>
                {race.taskPackageLabel}
                {race.cloudStudioUrl ? (
                  <span> · <a href={race.cloudStudioUrl}>打开任务入口</a></span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>赛道</dt>
              <dd>{race.trackId}</dd>
            </div>
            <div>
              <dt>CloudStudio</dt>
              <dd>{race.cloudStudioUrl || "未设置"}</dd>
            </div>
            <div>
              <dt>报名时间</dt>
              <dd>
                {formatDateTime(race.signupStart)} -{" "}
                {formatDateTime(race.signupEnd)}
              </dd>
            </div>
            <div>
              <dt>比赛时间</dt>
              <dd>
                {formatDateTime(race.raceStart)} -{" "}
                {formatDateTime(race.raceEnd)}
              </dd>
            </div>
            <div>
              <dt>评测说明</dt>
              <dd>{race.evaluationNotes}</dd>
            </div>
            <div>
              <dt>关键词</dt>
              <dd>{race.keywords.join(" / ")}</dd>
            </div>
          </dl>
        </Panel>

        {isRunningPhase ? (
          <Panel title="过程榜单" eyebrow="Leaderboard">
            {shouldHidePublicLeaderboard(race.phase) ? (
              <p className="muted">当前处于封榜阶段，公开榜单暂时隐藏。</p>
            ) : race.leaderboardEntries.length === 0 ? (
              <p className="muted">尚未同步榜单。</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>队伍</th>
                    <th>总分</th>
                    <th>任务</th>
                    <th>Token</th>
                    <th>对话</th>
                    <th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {race.leaderboardEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.rank}</td>
                      <td>{entry.team.name}</td>
                      <td>{entry.totalScore}</td>
                      <td>{entry.taskScore ?? "-"}</td>
                      <td>{entry.tokenScore ?? "-"}</td>
                      <td>{entry.dialogueScore ?? "-"}</td>
                      <td>{getAgentLabel(entry.agentType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        ) : isFinishedPhase ? (
          <Panel title="最终公开结果" eyebrow="Final Result">
            {race.harnessEntries.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>队伍</th>
                    <th>Harness</th>
                    <th>Reasoning</th>
                    <th>Keyword</th>
                  </tr>
                </thead>
                <tbody>
                  {race.harnessEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.team.name}</td>
                      <td>{entry.harnessScore}</td>
                      <td>{entry.reasoningScore ?? "-"}</td>
                      <td>{entry.keywordScore ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : race.leaderboardEntries.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>队伍</th>
                    <th>总分</th>
                    <th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {race.leaderboardEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.rank}</td>
                      <td>{entry.team.name}</td>
                      <td>{entry.totalScore}</td>
                      <td>{getAgentLabel(entry.agentType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">最终公开结果尚未发布。</p>
            )}
          </Panel>
        ) : (
          <Panel title="当前阶段说明" eyebrow="Stage">
            <div className="stack">
              <p className="muted">
                当前阶段主要展示赛事说明、报名时间和任务入口；过程榜单与赛马大屏将在比赛开始后开放。
              </p>
              <p>
                当前默认赛道模板：{race.trackId}。即使比赛尚未开始，也已经绑定了统一底图，不是缺少背景图。
              </p>
              <p>
                如果你是参赛者，请在比赛开始前完成组队、环境准备和题目理解。
              </p>
            </div>
          </Panel>
        )}
      </section>

      <section className="grid">
        <Panel title="题目与披露边界" eyebrow="Boundary">
          <div className="stack">
            <p>{race.taskDescription}</p>
            <p>
              训练数据：
              {race.displayShowTrainingData
                ? ` ${race.trainingDataSummary || "未填写"}`
                : " Organizer 未公开"}
            </p>
            <ul className="bullet-list">
              <li>
                Organizer 评论：
                {race.displayShowOrganizerComment ? "公开" : "不公开"}
              </li>
              <li>
                Rider 代码：
                {race.displayShowRiderCode ? "公开" : "不公开"}
              </li>
              <li>
                Top Highlights：
                {race.displayShowTopHighlights
                  ? `公开前 ${race.displayHighlightCount} 条`
                  : "不公开"}
              </li>
            </ul>
          </div>
        </Panel>

        {isFinishedPhase ? (
          <Panel title="赛后展示" eyebrow="Showcase">
            {race.highlights.length === 0 && race.harnessEntries.length === 0 ? (
              <p className="muted">尚未发布赛后展示。</p>
            ) : (
              <div className="stack">
                {race.highlights.map((highlight) => (
                  <div className="highlight-card" key={highlight.id}>
                    <div className="highlight-card__top">
                      <strong>{highlight.team.name}</strong>
                      <span>
                        {getAgentLabel(highlight.agentType)} / {highlight.score}
                      </span>
                    </div>
                    <p>{highlight.excerpt}</p>
                    {race.displayShowRiderCode ? (
                      <pre>{highlight.codeSnippet}</pre>
                    ) : null}
                  </div>
                ))}

                {race.displayShowOrganizerComment && race.organizerComment ? (
                  <blockquote className="comment-card">
                    {race.organizerComment}
                  </blockquote>
                ) : null}
              </div>
            )}
          </Panel>
        ) : isRunningPhase ? (
          <Panel title="比赛进行提示" eyebrow="Live Race">
            <div className="stack">
              <p className="muted">
                当前比赛处于进行中阶段，首页会展示过程榜单与赛马大屏；赛后披露内容将在比赛结束后按 Organizer 配置公开。
              </p>
              <p>
                若处于封榜阶段，公开榜单会暂时隐藏，但比赛动态仍可通过大屏继续观看。
              </p>
            </div>
          </Panel>
        ) : (
          <Panel title="报名与准备提示" eyebrow="Preparation">
            <div className="stack">
              <p className="muted">
                当前仍在报名或准备阶段，首页不展示赛马大屏，避免把尚未开始的比赛误呈现为实时竞速。
              </p>
              <p>
                公开可见的内容以赛事说明、时间安排和任务入口为主。
              </p>
            </div>
          </Panel>
        )}
      </section>
    </>
  );
}

export function CreateRaceForm({ action }: { action: FormAction }) {
  return <CreateRaceFormClient action={action} />;
}

function AuthForm({
  action,
  description,
  includeRegisterFields = false,
  submitLabel,
  title,
}: {
  action: FormAction;
  description: string;
  includeRegisterFields?: boolean;
  submitLabel: string;
  title: string;
}) {
  return (
    <form action={action} className="form-grid">
      <div className="stack">
        <strong>{title}</strong>
        <p className="muted">{description}</p>
      </div>
      {includeRegisterFields ? (
        <>
          <label>
            角色
            <select defaultValue="RIDER" name="role">
              <option value="ORGANIZER">Organizer</option>
              <option value="RIDER">Rider</option>
            </select>
          </label>
        </>
      ) : null}
      <label>
        用户名
        <input name="username" placeholder="username" required />
      </label>
      <label>
        密码
        <input
          name="password"
          placeholder="password"
          required
          type="password"
        />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export const aryStyles = `
  .hero {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  .hero__copy,
  .hero__card,
  .panel,
  .race-panel {
    background: var(--panel);
    backdrop-filter: blur(14px);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow);
  }

  .hero__copy {
    padding: 36px;
    position: relative;
    overflow: hidden;
  }

  .hero__copy::after {
    content: "";
    position: absolute;
    inset: auto -60px -80px auto;
    width: 220px;
    height: 220px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(195, 78, 54, 0.24), transparent 70%);
  }

  .hero__eyebrow,
  .eyebrow {
    margin: 0 0 8px;
    color: var(--accent);
    font-family: var(--font-display), sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .hero h1,
  .panel h2,
  .race-panel h2 {
    margin: 0;
    font-family: var(--font-display), sans-serif;
    line-height: 1;
  }

  .hero h1 {
    max-width: 10ch;
    font-size: clamp(3rem, 7vw, 5.5rem);
  }

  .hero__lede {
    max-width: 56ch;
    margin: 18px 0 0;
    color: var(--muted);
    line-height: 1.75;
  }

  .hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  .hero__chips span,
  .meta-pills span {
    border-radius: 999px;
    padding: 0.5rem 0.8rem;
    background: var(--accent-soft);
    color: var(--accent-dark);
    font-size: 0.92rem;
    font-weight: 600;
  }

  .hero__card {
    padding: 28px;
  }

  .hero__card h2 {
    margin-bottom: 16px;
  }

  .hero__card ul {
    padding-left: 1.2rem;
    color: var(--muted);
    line-height: 1.8;
  }

  .shell {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .auth-entry-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) 320px;
    gap: 20px;
    align-items: start;
  }

  .sidebar,
  .content,
  .stack,
  .auth-stack,
  .feedback-list {
    display: grid;
    gap: 16px;
  }

  .content {
    gap: 20px;
  }

  .panel,
  .race-panel {
    padding: 22px;
  }

  .panel__body {
    margin-top: 14px;
  }

  .seed-grid,
  .grid,
  .detail-grid,
  .button-row,
  .weights-grid,
  .check-grid {
    display: grid;
    gap: 14px;
  }

  .seed-grid,
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .race-group {
    display: grid;
    gap: 10px;
  }

  .race-group h3 {
    margin: 0;
    font-size: 1rem;
  }

  .race-card,
  .identity-card,
  .feedback-thread,
  .highlight-card,
  .comment-card {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(59, 43, 27, 0.1);
    background: var(--panel-strong);
    padding: 16px;
  }

  .identity-card,
  .feedback-thread,
  .highlight-card,
  .message {
    display: grid;
    gap: 8px;
  }

  .race-card__top,
  .highlight-card__top,
  .feedback-thread__top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .race-card p,
  .muted,
  .message p,
  .comment-card {
    color: var(--muted);
  }

  .shell code {
    display: block;
    overflow-x: auto;
    border-radius: 12px;
    background: #261d18;
    color: #f7eee7;
    padding: 0.85rem 1rem;
  }

  .race-panel {
    display: grid;
    gap: 18px;
  }

  .race-panel__header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
  }

  .meta-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 8px;
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid dt {
    font-size: 0.88rem;
    color: var(--muted);
  }

  .detail-grid dd {
    margin: 6px 0 0;
    font-weight: 600;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th,
  .table td {
    text-align: left;
    padding: 0.75rem 0.6rem;
    border-bottom: 1px solid rgba(50, 39, 28, 0.1);
    font-size: 0.95rem;
  }

  .table th {
    color: var(--muted);
    font-weight: 600;
  }

  .form-grid {
    display: grid;
    gap: 14px;
  }

  .form-grid label {
    display: grid;
    gap: 8px;
    font-weight: 600;
  }

  .form-grid .full {
    grid-column: 1 / -1;
  }

  .button-row {
    grid-template-columns: repeat(auto-fit, minmax(180px, max-content));
    align-items: center;
  }

  .weights-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .check-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .checkbox {
    display: flex !important;
    align-items: center;
    gap: 10px;
    font-weight: 500 !important;
  }

  .checkbox input {
    width: auto;
  }

  .bullet-list {
    margin: 0;
    padding-left: 1.2rem;
    line-height: 1.8;
  }

  .comment-card {
    margin: 0;
    line-height: 1.8;
  }

  .highlight-card pre {
    overflow-x: auto;
    white-space: pre-wrap;
    margin: 0;
    border-radius: 12px;
    background: #271f19;
    color: #f6ece1;
    padding: 12px;
  }

  .local-picker-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .picker-card {
    display: grid;
    gap: 10px;
    border-radius: 16px;
    border: 1px solid rgba(59, 43, 27, 0.1);
    background: var(--panel-strong);
    padding: 16px;
  }

  .button-row-inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .file-chip {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-dark);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .track-preview {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(59, 43, 27, 0.12);
    background: #f4ede4;
  }

  .track-preview img {
    display: block;
    width: 100%;
    height: 180px;
    object-fit: cover;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .auth-tabs {
    display: grid;
    gap: 14px;
    position: relative;
  }

  .auth-tabs__toggle {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .auth-tabs__switches {
    display: inline-grid;
    grid-template-columns: repeat(2, minmax(0, max-content));
    gap: 8px;
    padding: 6px;
    border-radius: 999px;
    background: rgba(239, 229, 217, 0.85);
    width: fit-content;
  }

  .auth-tabs__switch {
    border-radius: 999px;
    padding: 0.65rem 1rem;
    color: var(--muted);
    font-weight: 700;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease;
  }

  .auth-tabs__panel {
    display: none;
  }

  #auth-tab-login:checked ~ .auth-tabs__switches label[for="auth-tab-login"],
  #auth-tab-register:checked ~ .auth-tabs__switches label[for="auth-tab-register"] {
    background: var(--accent);
    color: #fff;
  }

  #auth-tab-login:checked ~ .auth-tabs__panel--login,
  #auth-tab-register:checked ~ .auth-tabs__panel--register {
    display: grid;
  }

  @media (max-width: 1100px) {
    .hero,
    .shell,
    .auth-entry-layout,
    .seed-grid,
    .grid,
    .detail-grid,
    .weights-grid,
    .check-grid,
    .local-picker-grid {
      grid-template-columns: 1fr;
    }

    .race-panel__header {
      flex-direction: column;
    }

    .meta-pills {
      justify-content: start;
    }
  }
`;
