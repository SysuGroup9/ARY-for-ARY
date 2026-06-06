import {
  clearRaceAction,
  createRaceAction,
  logoutAction,
  publishLeaderboardAction,
  publishShowcaseAction,
  registerTeamAction,
  replyFeedbackAction,
  sendFeedbackAction,
  submitEntryAction,
  updateDisplayOptionsAction,
  updateOrganizerCommentAction,
  updateRaceAction,
  updateTeamCommentAction,
} from "@/app/actions";
import {
  CreateRaceForm,
  HeroSection,
  Panel,
  PublicRaceSections,
  RaceBrowserPanel,
  RunnerApiPanel,
  aryStyles,
} from "@/app/_components/ary-shared";
import { RiderCodeVisibilityCheckbox } from "@/app/_components/rider-code-visibility-checkbox";
import { loadDatabaseUser } from "@/lib/auth";
import { formatDateTime, formatRelativeRole } from "@/lib/format";
import {
  groupRacesByPhase,
  listRaces,
} from "@/lib/services/races";
import {
  formatRunnerTaskStatusLabel,
  formatRunnerTaskTypeLabel,
} from "@/lib/runner-task-helpers";
import { getTeamForCaptain } from "@/lib/services/teams";
import { getRoleCapabilities } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

type RiderTeamMap = Map<string, Awaited<ReturnType<typeof getTeamForCaptain>>>;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await loadDatabaseUser();
  if (!sessionUser) {
    redirect("/login");
  }

  const races = await listRaces();
  const grouped = groupRacesByPhase(races);
  const { canManage, canRide } = getRoleCapabilities(sessionUser.role);

  const riderTeams = canRide
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
      <HeroSection mode="member" />

      <section className="shell">
        <aside className="sidebar">
          <Panel title="账户中心" eyebrow="Auth">
            <div className="stack">
              <div className="identity-card">
                <strong>{sessionUser.username}</strong>
                <span>{formatRelativeRole(sessionUser.role)}</span>
              </div>
              <form action={logoutAction}>
                <button className="button-secondary" type="submit">
                  退出登录
                </button>
              </form>
            </div>
          </Panel>

          <RaceBrowserPanel grouped={grouped} />
          <RunnerApiPanel />
        </aside>

        <section className="content">
          {canManage ? (
            <Panel title="创建赛事" eyebrow="Organizer Studio">
              <CreateRaceForm action={createRaceAction} />
            </Panel>
          ) : null}

          {races.length === 0 ? (
            <Panel title="当前暂无赛事" eyebrow="Empty State">
              <p>先以 Organizer 身份创建比赛，然后 Rider 才能报名和提交。</p>
            </Panel>
          ) : null}

          {races.map((race) => {
            const riderTeam = teamMap.get(race.id) ?? null;
            const canManageRace = canManage && sessionUser.id === race.organizerId;

            return (
              <article className="race-panel" key={race.id}>
                <PublicRaceSections race={race} />

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
                          (thread) => thread.team.captainId === sessionUser.id,
                        )
                        .map((thread) => (
                          <div className="feedback-thread" key={thread.id}>
                            <div className="feedback-thread__top">
                              <strong>{thread.team.name}</strong>
                              <span>{thread.status}</span>
                            </div>
                            {thread.messages.map((message) => (
                              <div className="message" key={message.id}>
                                <strong>{message.author.username}</strong>
                                <p>{message.content}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </Panel>
                ) : null}

                {canManageRace ? (
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
                            <button type="submit">发起进度评测</button>
                          </form>
                          <form action={publishShowcaseAction}>
                            <input name="raceId" type="hidden" value={race.id} />
                            <button className="button-secondary" type="submit">
                              发起 Harness 评测
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
                        <form
                          action={updateDisplayOptionsAction}
                          className="form-grid"
                        >
                          <input name="raceId" type="hidden" value={race.id} />
                          <div className="check-grid">
                            <label className="checkbox">
                              <input
                                defaultChecked={race.displayShowTrainingData}
                                name="displayShowTrainingData"
                                type="checkbox"
                              />
                              公开训练数据
                            </label>
                            <label className="checkbox">
                              <input
                                defaultChecked={
                                  race.displayShowOrganizerComment
                                }
                                name="displayShowOrganizerComment"
                                type="checkbox"
                              />
                              公开 Organizer 评论
                            </label>
                            <label className="checkbox">
                              <input
                                defaultChecked={
                                  race.displayShowTopHighlights
                                }
                                name="displayShowTopHighlights"
                                type="checkbox"
                              />
                              展示 Top Highlights
                            </label>
                            <label className="checkbox">
                              <RiderCodeVisibilityCheckbox
                                defaultChecked={race.displayShowRiderCode}
                                name="displayShowRiderCode"
                              />
                              公开 Rider 代码
                            </label>
                          </div>
                          <label>
                            Highlight 数量
                            <input
                              defaultValue={race.displayHighlightCount}
                              min={0}
                              max={20}
                              name="displayHighlightCount"
                              type="number"
                            />
                          </label>
                          <button type="submit">保存展示选项</button>
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
                                    <strong>{message.author.username}</strong>
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
                  {race.runnerTasks.length === 0 ? (
                    <p className="muted">当前还没有 runner 任务。</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>队伍</th>
                          <th>任务类型</th>
                          <th>状态</th>
                          <th>提交 ID</th>
                          <th>总分</th>
                          <th>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {race.runnerTasks.map((task) => (
                          <tr key={task.id}>
                            <td>
                              {race.teams.find(
                                (team) => team.id === task.teamId,
                              )?.name ?? task.teamId}
                            </td>
                            <td>{formatRunnerTaskTypeLabel(task.taskType)}</td>
                            <td>{formatRunnerTaskStatusLabel(task.status)}</td>
                            <td>{task.submissionId}</td>
                            <td>{task.score ?? "-"}</td>
                            <td>{formatDateTime(task.createdAt)}</td>
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

      <style>{aryStyles}</style>
    </main>
  );
}
