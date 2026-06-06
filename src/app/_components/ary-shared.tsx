import Link from "next/link";
import type { ReactNode } from "react";
import { getDemoCredentials } from "@/lib/demo-credentials";
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
        "Audience 可通过观众入口查看公开赛事与榜单。",
      ],
    },
    auth: {
      lede:
        "网站入口已统一收敛到登录页。Organizer 和 Rider 登录后进入完整工作区，Audience 可从这里直接进入公开观众视图。",
      items: [
        "Organizer 登录后可进入赛事创建与管理区。",
        "Rider 登录后可报名、提交代码和发送反馈。",
        "Audience 无需账号，可直接进入公开观众入口。",
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

export function AudienceEntryPanel() {
  return (
    <Panel title="观众入口" eyebrow="Audience">
      <div className="stack">
        <p className="muted">
          不需要账号即可进入公开观众视图，查看公开赛事、公开榜单和赛后展示。
        </p>
        <Link className="button button-secondary audience-link" href="/audience">
          以 Audience 进入
        </Link>
      </div>
    </Panel>
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
              <dd>{race.taskPackageLabel}</dd>
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

        <Panel title="公开榜单" eyebrow="Leaderboard">
          {shouldHidePublicLeaderboard(race.phase) ? (
            <p className="muted">当前处于封榜阶段，公开榜单暂时隐藏。</p>
          ) : race.leaderboardEntries.length === 0 ? (
            <p className="muted">尚未同步榜单。</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
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
      </section>

      <section className="grid">
        <Panel title="题目与赛后披露" eyebrow="Boundary">
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

        <Panel title="赛后展示" eyebrow="Showcase">
          {race.highlights.length === 0 && race.harnessEntries.length === 0 ? (
            <p className="muted">尚未发布赛后展示。</p>
          ) : (
            <div className="stack">
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
              ) : null}

              {race.highlights.map((highlight) => (
                <div className="highlight-card" key={highlight.id}>
                  <div className="highlight-card__top">
                    <strong>{highlight.team.name}</strong>
                    <span>
                      {getAgentLabel(highlight.agentType)} / {highlight.score}
                    </span>
                  </div>
                  <p>{highlight.excerpt}</p>
                  <pre>{highlight.codeSnippet}</pre>
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
      </section>
    </>
  );
}

export function CreateRaceForm({ action }: { action: FormAction }) {
  return (
    <form action={action} className="form-grid">
      <label>
        赛事名称
        <input defaultValue="排序算法挑战赛" name="title" required />
      </label>
      <label>
        赛事简介
        <input
          defaultValue="验证 Agent 在算法问题上的实现、推理与成本控制能力。"
          name="summary"
          required
        />
      </label>
      <label>
        题目包标签
        <input defaultValue="sort-task-v1.zip" name="taskPackageLabel" required />
      </label>
      <label>
        CloudStudio URL
        <input defaultValue="https://cloudstudio.net/" name="cloudStudioUrl" />
      </label>
      <label className="full">
        题目描述
        <textarea
          defaultValue="实现一个稳定排序模块，支持整数数组升序输出，并在边界输入下保持正确性。"
          name="taskDescription"
          required
          rows={4}
        />
      </label>
      <label className="full">
        训练数据说明
        <textarea
          defaultValue="训练数据包含小规模样例、重复元素、逆序输入和空数组。"
          name="trainingDataSummary"
          rows={3}
        />
      </label>
      <label className="full">
        评测说明
        <textarea
          defaultValue="Runner 根据通过率、代码质量、推理过程和关键词覆盖度综合评分。"
          name="evaluationNotes"
          required
          rows={3}
        />
      </label>
      <label className="full">
        关键词
        <textarea
          defaultValue="需求分析, 时间复杂度, 边界条件, 稳定性, 测试验证"
          name="keywordsText"
          required
          rows={3}
        />
      </label>
      <label>
        报名开始
        <input
          defaultValue="2026-06-05T08:00"
          name="signupStart"
          required
          type="datetime-local"
        />
      </label>
      <label>
        报名结束
        <input
          defaultValue="2026-06-06T08:00"
          name="signupEnd"
          required
          type="datetime-local"
        />
      </label>
      <label>
        比赛开始
        <input
          defaultValue="2026-06-06T09:00"
          name="raceStart"
          required
          type="datetime-local"
        />
      </label>
      <label>
        比赛结束
        <input
          defaultValue="2026-06-08T18:00"
          name="raceEnd"
          required
          type="datetime-local"
        />
      </label>
      <label>
        Token 上限
        <input defaultValue={4000} min={0} name="tokenLimit" type="number" />
      </label>
      <label>
        榜单刷新粒度（分钟）
        <input
          defaultValue={30}
          min={1}
          name="updateGranularityMinutes"
          type="number"
        />
      </label>
      <label>
        每组人数上限
        <input defaultValue={5} min={1} name="maxTeamSize" type="number" />
      </label>
      <label>
        提交间隔（小时）
        <input
          defaultValue={24}
          min={1}
          name="submissionIntervalHours"
          type="number"
        />
      </label>
      <label>
        封榜提前量（分钟）
        <input
          defaultValue={30}
          min={0}
          name="freezeMinutesBeforeEnd"
          type="number"
        />
      </label>
      <label>
        Highlight 数量
        <input
          defaultValue={3}
          min={0}
          name="displayHighlightCount"
          type="number"
        />
      </label>

      <div className="full check-grid">
        <label className="checkbox">
          <input defaultChecked name="hasTrainingData" type="checkbox" />
          有训练数据
        </label>
        <label className="checkbox">
          <input defaultChecked name="enableFreeze" type="checkbox" />
          启用封榜
        </label>
        <label className="checkbox">
          <input
            defaultChecked
            name="displayShowTrainingData"
            type="checkbox"
          />
          赛后公开训练数据
        </label>
        <label className="checkbox">
          <input
            defaultChecked
            name="displayShowOrganizerComment"
            type="checkbox"
          />
          赛后公开 Organizer 评论
        </label>
        <label className="checkbox">
          <input
            defaultChecked
            name="displayShowTopHighlights"
            type="checkbox"
          />
          展示 Top Highlights
        </label>
        <label className="checkbox">
          <input defaultChecked name="displayShowRiderCode" type="checkbox" />
          赛后公开 Rider 代码
        </label>
      </div>

      <div className="full weights-grid">
        <label>
          passRate 权重
          <input
            defaultValue={0.5}
            min={0.1}
            name="weightTaskPassRate"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          codeReview 权重
          <input
            defaultValue={0.5}
            min={0.1}
            name="weightCodeReview"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          reasoning 权重
          <input
            defaultValue={0.7}
            min={0.1}
            name="weightReasoning"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          keyword 权重
          <input
            defaultValue={0.3}
            min={0.1}
            name="weightKeywords"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          totalTask 权重
          <input
            defaultValue={0.5}
            min={0.1}
            name="weightTotalTask"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          totalToken 权重
          <input
            defaultValue={0.3}
            min={0.1}
            name="weightTotalToken"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          totalDialogue 权重
          <input
            defaultValue={0.2}
            min={0.1}
            name="weightTotalDialogue"
            step="0.1"
            type="number"
          />
        </label>
      </div>

      <button type="submit">创建赛事</button>
    </form>
  );
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

  .audience-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    .check-grid {
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
