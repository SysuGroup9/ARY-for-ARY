import {
  clearRaceAction,
  createRaceAction,
  loginAction,
  logoutAction,
  publishLeaderboardAction,
  publishShowcaseAction,
  registerAction,
  registerTeamAction,
  replyFeedbackAction,
  sendFeedbackAction,
  submitEntryAction,
  updateOrganizerCommentAction,
  updateRaceAction,
  updateTeamCommentAction,
} from "@/app/actions";
import { loadDatabaseUser } from "@/lib/auth";
import { formatDateTime, formatRelativeRole } from "@/lib/format";
import {
  getRacePhaseLabel,
  shouldHidePublicLeaderboard,
  type RacePhase,
} from "@/lib/race-phase";
import {
  groupRacesByPhase,
  listRaces,
  type RaceListItem,
} from "@/lib/services/races";
import { getAgentLabel } from "@/lib/services/submissions";
import { getTeamForCaptain } from "@/lib/services/teams";
import { listUsersByRole } from "@/lib/services/users";

type RiderTeamMap = Map<string, Awaited<ReturnType<typeof getTeamForCaptain>>>;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sessionUser, races, organizers, riders] = await Promise.all([
    loadDatabaseUser(),
    listRaces(),
    listUsersByRole("ORGANIZER"),
    listUsersByRole("RIDER"),
  ]);

  const grouped = groupRacesByPhase(races);
  const riderTeams =
    sessionUser?.role === "RIDER"
      ? await Promise.all(
          races.map(async (race) => ({
            raceId: race.id,
            team: await getTeamForCaptain(race.id, sessionUser.id),
          })),
        )
      : [];

  const teamMap: RiderTeamMap = new Map(
    riderTeams.map((item) => [item.raceId, item.team]),
  );

  return (
    <main>
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">ARY GRS 001</p>
          <h1>Public Yard, Private Race Source.</h1>
          <p className="hero__lede">
            当前版本已经从前端 localStorage PoC 重构为真实全栈应用。
            账号、赛事、队伍、提交、反馈和榜单落在 SQLite，
            但 Organizer 的私有评测代码仍然不进入 ARY。
          </p>
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
            <li>Organizer 可创建赛事并配置赛后披露边界。</li>
            <li>Rider 可真实注册、报名、提交代码和 Riding Record。</li>
            <li>Runner 可通过 API 拉取任务并回传评分。</li>
            <li>Audience 无需登录即可查看公开赛事与榜单。</li>
          </ul>
        </div>
      </section>

      <section className="shell">
        <aside className="sidebar">
          <Panel title="账户中心" eyebrow="Auth">
            {sessionUser ? (
              <div className="stack">
                <div className="identity-card">
                  <strong>{sessionUser.displayName}</strong>
                  <span>{sessionUser.username}</span>
                  <span>{formatRelativeRole(sessionUser.role)}</span>
                </div>
                <form action={logoutAction}>
                  <button className="button-secondary" type="submit">
                    退出登录
                  </button>
                </form>
              </div>
            ) : (
              <div className="auth-stack">
                <AuthForm
                  action={loginAction}
                  description="已有账号可直接登录"
                  submitLabel="登录"
                  title="登录"
                />
                <AuthForm
                  action={registerAction}
                  description="现场创建 Organizer 或 Rider 账号"
                  includeRegisterFields
                  submitLabel="注册"
                  title="注册"
                />
              </div>
            )}
          </Panel>

          <Panel title="演示账号" eyebrow="Seed">
            <div className="seed-grid">
              <div>
                <strong>Organizer</strong>
                {organizers.map((user) => (
                  <p key={user.id}>
                    {user.username} / {user.displayName}
                  </p>
                ))}
              </div>
              <div>
                <strong>Rider</strong>
                {riders.map((user) => (
                  <p key={user.id}>
                    {user.username} / {user.displayName}
                  </p>
                ))}
              </div>
            </div>
          </Panel>

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

          <Panel title="Runner API" eyebrow="Integration">
            <div className="stack">
              <code>GET /api/runner/tasks/pull?raceId=&lt;id&gt;</code>
              <code>POST /api/runner/tasks/result</code>
              <p className="muted">
                Header 使用 <code>Authorization: Bearer ary-runner-dev-secret</code>
              </p>
            </div>
          </Panel>
        </aside>

        <section className="content">
          {sessionUser?.role === "ORGANIZER" ? (
            <Panel title="创建赛事" eyebrow="Organizer Studio">
              <CreateRaceForm />
            </Panel>
          ) : null}

          {races.length === 0 ? (
            <Panel title="当前暂无赛事" eyebrow="Empty State">
              <p>先以 Organizer 身份创建比赛，然后 Rider 才能报名和提交。</p>
            </Panel>
          ) : null}

          {races.map((race) => {
            const riderTeam = teamMap.get(race.id) ?? null;
            const canManage =
              sessionUser?.role === "ORGANIZER" &&
              sessionUser.id === race.organizerId;
            const canRide = sessionUser?.role === "RIDER";

            return (
              <article className="race-panel" key={race.id}>
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
                              <td>{entry.taskScore}</td>
                              <td>{entry.tokenScore}</td>
                              <td>{entry.dialogueScore}</td>
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
                    {race.highlights.length === 0 &&
                    race.harnessEntries.length === 0 ? (
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
                                  <td>{entry.reasoningScore}</td>
                                  <td>{entry.keywordScore}</td>
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
                                {getAgentLabel(highlight.agentType)} /{" "}
                                {highlight.score}
                              </span>
                            </div>
                            <p>{highlight.excerpt}</p>
                            <pre>{highlight.codeSnippet}</pre>
                          </div>
                        ))}

                        {race.displayShowOrganizerComment &&
                        race.organizerComment ? (
                          <blockquote className="comment-card">
                            {race.organizerComment}
                          </blockquote>
                        ) : null}
                      </div>
                    )}
                  </Panel>
                </section>

                {canRide ? (
                  <section className="grid">
                    <Panel
                      title={riderTeam ? "当前队伍" : "报名参赛"}
                      eyebrow="Rider"
                    >
                      {riderTeam ? (
                        <div className="stack">
                          <strong>{riderTeam.name}</strong>
                          <ul className="bullet-list">
                            {riderTeam.members.map((member) => (
                              <li key={member.id}>{member.displayName}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <form action={registerTeamAction} className="form-grid">
                          <input name="raceId" type="hidden" value={race.id} />
                          <label>
                            队伍名称
                            <input
                              name="teamName"
                              placeholder="比如：排序小分队"
                              required
                            />
                          </label>
                          <label>
                            组员列表
                            <textarea
                              name="membersText"
                              placeholder="每行一个名字，或用逗号分隔"
                              required
                              rows={4}
                            />
                          </label>
                          <button type="submit">提交报名</button>
                        </form>
                      )}
                    </Panel>

                    <Panel
                      title="提交代码与 Riding Record"
                      eyebrow="Submission"
                    >
                      <form action={submitEntryAction} className="form-grid">
                        <input name="raceId" type="hidden" value={race.id} />
                        <label>
                          代码文件名
                          <input
                            defaultValue="solution.ts"
                            name="codeLabel"
                            required
                          />
                        </label>
                        <label>
                          Record 文件名
                          <input
                            defaultValue="riding-record.txt"
                            name="recordLabel"
                            required
                          />
                        </label>
                        <label>
                          Agent 类型
                          <select defaultValue="OPENAI" name="agentType">
                            <option value="CLAUDE">Claude</option>
                            <option value="COPILOT">Copilot</option>
                            <option value="DEEPSEEK">DeepSeek</option>
                            <option value="ZHIPU">Zhipu</option>
                            <option value="OPENAI">OpenAI</option>
                            <option value="CUSTOM">Custom</option>
                          </select>
                        </label>
                        <label>
                          Token 消耗
                          <input
                            defaultValue={1200}
                            min={0}
                            name="tokenUsed"
                            type="number"
                          />
                        </label>
                        <label className="full">
                          代码内容
                          <textarea
                            defaultValue={
                              "export function solve(input: number[]) {\n  return [...input].sort((a, b) => a - b);\n}"
                            }
                            name="codeContent"
                            required
                            rows={8}
                          />
                        </label>
                        <label className="full">
                          Riding Record
                          <textarea
                            defaultValue="先澄清输入边界，再验证复杂度，最后用正反例检查排序稳定性。"
                            name="ridingRecord"
                            required
                            rows={6}
                          />
                        </label>
                        <button type="submit">进入待评测队列</button>
                      </form>
                    </Panel>
                  </section>
                ) : null}

                {canRide ? (
                  <Panel title="反馈 Organizer" eyebrow="Feedback">
                    <form action={sendFeedbackAction} className="form-grid">
                      <input name="raceId" type="hidden" value={race.id} />
                      <label className="full">
                        反馈内容
                        <textarea
                          defaultValue="题目描述第 2 段对输入规模的说明仍有歧义，请补充边界条件。"
                          name="content"
                          required
                          rows={3}
                        />
                      </label>
                      <button type="submit">发送反馈</button>
                    </form>

                    <div className="feedback-list">
                      {race.feedbackThreads
                        .filter(
                          (thread) => thread.team.captainId === sessionUser?.id,
                        )
                        .map((thread) => (
                          <div className="feedback-thread" key={thread.id}>
                            <div className="feedback-thread__top">
                              <strong>{thread.team.name}</strong>
                              <span>{thread.status}</span>
                            </div>
                            {thread.messages.map((message) => (
                              <div className="message" key={message.id}>
                                <strong>{message.author.displayName}</strong>
                                <p>{message.content}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </Panel>
                ) : null}

                {canManage ? (
                  <>
                    <section className="grid">
                      <Panel title="赛事维护" eyebrow="Organizer Console">
                        <form action={updateRaceAction} className="form-grid">
                          <input name="raceId" type="hidden" value={race.id} />
                          <label className="full">
                            题目描述
                            <textarea
                              defaultValue={race.taskDescription}
                              name="taskDescription"
                              rows={5}
                            />
                          </label>
                          <label className="full">
                            训练数据说明
                            <textarea
                              defaultValue={race.trainingDataSummary}
                              name="trainingDataSummary"
                              rows={4}
                            />
                          </label>
                          <button type="submit">保存并广播通知</button>
                        </form>
                      </Panel>

                      <Panel title="榜单与赛后展示" eyebrow="Organizer Publish">
                        <div className="button-row">
                          <form action={publishLeaderboardAction}>
                            <input name="raceId" type="hidden" value={race.id} />
                            <button type="submit">同步公开榜单</button>
                          </form>
                          <form action={publishShowcaseAction}>
                            <input name="raceId" type="hidden" value={race.id} />
                            <button className="button-secondary" type="submit">
                              生成赛后展示
                            </button>
                          </form>
                        </div>
                        <form
                          action={updateOrganizerCommentAction}
                          className="form-grid"
                        >
                          <input name="raceId" type="hidden" value={race.id} />
                          <label className="full">
                            Organizer 赛后总评
                            <textarea
                              defaultValue={race.organizerComment}
                              name="organizerComment"
                              rows={4}
                            />
                          </label>
                          <button type="submit">保存总评</button>
                        </form>
                        <form action={clearRaceAction}>
                          <input name="raceId" type="hidden" value={race.id} />
                          <button className="button-danger" type="submit">
                            一键清空比赛
                          </button>
                        </form>
                      </Panel>
                    </section>

                    <section className="grid">
                      <Panel title="反馈中心" eyebrow="Organizer Inbox">
                        {race.feedbackThreads.length === 0 ? (
                          <p className="muted">暂无反馈。</p>
                        ) : (
                          <div className="feedback-list">
                            {race.feedbackThreads.map((thread) => (
                              <div className="feedback-thread" key={thread.id}>
                                <div className="feedback-thread__top">
                                  <strong>{thread.team.name}</strong>
                                  <span>{thread.status}</span>
                                </div>
                                {thread.messages.map((message) => (
                                  <div className="message" key={message.id}>
                                    <strong>{message.author.displayName}</strong>
                                    <p>{message.content}</p>
                                  </div>
                                ))}
                                <form
                                  action={replyFeedbackAction}
                                  className="form-grid"
                                >
                                  <input
                                    name="threadId"
                                    type="hidden"
                                    value={thread.id}
                                  />
                                  <label className="full">
                                    回复
                                    <textarea
                                      name="content"
                                      required
                                      rows={3}
                                    />
                                  </label>
                                  <label className="checkbox">
                                    <input
                                      name="markResolved"
                                      type="checkbox"
                                    />
                                    同时标记为 resolved
                                  </label>
                                  <button type="submit">回复反馈</button>
                                </form>
                              </div>
                            ))}
                          </div>
                        )}
                      </Panel>

                      <Panel title="队伍评语" eyebrow="Post Race Comment">
                        {race.teams.length === 0 ? (
                          <p className="muted">当前还没有队伍报名。</p>
                        ) : (
                          <div className="stack">
                            {race.teams.map((team) => {
                              const existing = race.teamComments.find(
                                (comment) => comment.teamId === team.id,
                              );
                              return (
                                <form
                                  action={updateTeamCommentAction}
                                  className="form-grid"
                                  key={team.id}
                                >
                                  <input
                                    name="raceId"
                                    type="hidden"
                                    value={race.id}
                                  />
                                  <input
                                    name="teamId"
                                    type="hidden"
                                    value={team.id}
                                  />
                                  <label className="full">
                                    {team.name}
                                    <textarea
                                      defaultValue={existing?.content ?? ""}
                                      name="content"
                                      rows={3}
                                    />
                                  </label>
                                  <button type="submit">保存队伍评语</button>
                                </form>
                              );
                            })}
                          </div>
                        )}
                      </Panel>
                    </section>
                  </>
                ) : null}

                <Panel title="提交流程状态" eyebrow="Runner Queue">
                  {race.submissions.length === 0 ? (
                    <p className="muted">当前还没有提交。</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>队伍</th>
                          <th>状态</th>
                          <th>Agent</th>
                          <th>Token</th>
                          <th>总分</th>
                          <th>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {race.submissions.map((submission) => (
                          <tr key={submission.id}>
                            <td>
                              {race.teams.find(
                                (team) => team.id === submission.teamId,
                              )?.name ?? submission.teamId}
                            </td>
                            <td>{submission.status}</td>
                            <td>{getAgentLabel(submission.agentType)}</td>
                            <td>{submission.tokenUsed}</td>
                            <td>{submission.totalScore ?? "-"}</td>
                            <td>{formatDateTime(submission.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Panel>
              </article>
            );
          })}
        </section>
      </section>

      <style>{styles}</style>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <div className="panel__body">{children}</div>
    </section>
  );
}

function AuthForm({
  action,
  description,
  includeRegisterFields = false,
  submitLabel,
  title,
}: {
  action: (formData: FormData) => void | Promise<void>;
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
            显示名
            <input name="displayName" placeholder="比如：Owen" required />
          </label>
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

function CreateRaceForm() {
  return (
    <form action={createRaceAction} className="form-grid">
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

const styles = `
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

  @media (max-width: 1100px) {
    .hero,
    .shell,
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
