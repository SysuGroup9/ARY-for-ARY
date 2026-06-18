import {
  clearRaceAction,
  createRaceAction,
  generateRaceSnapshotAction,
  logoutAction,
  publishLeaderboardAction,
  publishShowcaseAction,
  registerTeamAction,
  replyFeedbackAction,
  sendFeedbackAction,
  submitEntryAction,
  submitFinalEntryAction,
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
import FinalSubmissionFormClient from "@/app/_components/final-submission-form-client";
import SubmissionFormClient from "@/app/_components/submission-form-client";
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
import JumbotronInline from "@/app/JumbotronInline";
import JumbotronBanner from "@/app/JumbotronBanner";
import { buildRaceSnapshot } from "@/lib/services/race-snapshot";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";

type RiderTeamMap = Map<string, Awaited<ReturnType<typeof getTeamForCaptain>>>;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await loadDatabaseUser();

  const races = await listRaces();
  const grouped = groupRacesByPhase(races);
  const { canManage, canRide } = getRoleCapabilities(sessionUser?.role ?? null);

  // 加载各赛事的 Jumbotron 快照（如果已生成）
  const jumbotronEntries = await Promise.all(
    races.map(async (race) => {
      const snapshot = await buildRaceSnapshot(race.id);
      const trackProfile = getEffectiveTrackProfileFromSnapshot(snapshot);
      return [race.id, { snapshot, trackProfile }] as const;
    }),
  );

  const jumbotronMap = new Map(jumbotronEntries);

  const riderTeams = canRide
    ? await Promise.all(
        races.map(async (race) => ({
          raceId: race.id,
          team: sessionUser ? await getTeamForCaptain(race.id, sessionUser.id) : null,
        })),
      )
    : [];

  const teamMap: RiderTeamMap = new Map(
    riderTeams.map((item) => [item.raceId, item.team]),
  );

  // Jumbotron 轮播数据
  const bannerItems = races
    .filter((race) => {
      const jt = jumbotronMap.get(race.id);
      return jt?.snapshot && jt?.trackProfile;
    })
    .map((race) => {
      const jt = jumbotronMap.get(race.id)!;
      return {
        raceId: race.id,
        raceTitle: race.title,
        snapshot: jt.snapshot!,
        trackProfile: jt.trackProfile!,
      };
    });

  return (
    <main>
      <JumbotronBanner items={bannerItems} />
      <HeroSection mode={sessionUser ? "member" : "audience"} />

      <section className="shell">
        <aside className="sidebar">
          <Panel title="账户中心" eyebrow="Auth">
            {sessionUser ? (
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
            ) : (
              <div className="stack">
                <strong style={{ fontSize: "1.1rem" }}>报名、提交代码、管理赛事都需要先登录。</strong>
                <p className="muted" style={{ fontSize: "1rem", lineHeight: 1.8 }}>
                  当前首页只负责公开展示；如果你要作为 Organizer 或 Rider 操作比赛，请直接进入登录页。
                </p>
                <a className="button button-cta-large" href="/login">
                  立即前往登录
                </a>
              </div>
            )}
          </Panel>

          <RaceBrowserPanel grouped={grouped} />
          {sessionUser ? <RunnerApiPanel /> : null}
        </aside>

        <section className="content">
          {canManage ? (
            <Panel title="Organizer Studio" eyebrow="Organizer Entry">
              <div className="stack">
                <p className="muted">
                  创建赛事已经拆分到独立页面，避免首页和公开赛事信息混在一起。
                </p>
                <a className="button" href="/races/new">
                  进入创建赛事页面
                </a>
              </div>
            </Panel>
          ) : null}

          {races.length === 0 ? (
            <Panel title="当前暂无赛事" eyebrow="Empty State">
              <p>先以 Organizer 身份创建比赛，然后 Rider 才能报名和提交。</p>
            </Panel>
          ) : null}

          {races.map((race) => {
            const riderTeam = teamMap.get(race.id) ?? null;
            const canManageRace =
              canManage && sessionUser ? sessionUser.id === race.organizerId : false;

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

                    {race.phase === "active" || race.phase === "frozen" ? (
                      <Panel title="比赛中提交代码" eyebrow="Submission">
                        <SubmissionFormClient action={submitEntryAction} raceId={race.id} />
                      </Panel>
                    ) : race.phase === "finished" ? (
                      <Panel title="赛后提交代码与 Riding Record" eyebrow="Final Submission">
                        <FinalSubmissionFormClient action={submitFinalEntryAction} raceId={race.id} />
                      </Panel>
                    ) : (
                      <Panel title="提交通道说明" eyebrow="Submission">
                        <div className="stack">
                          <p className="muted">
                            比赛开始后，选手在比赛中只提交代码；比赛结束后，再单独提交最终代码与 Riding Record 用于赛后 Harness 评测和展示。
                          </p>
                        </div>
                      </Panel>
                    )}
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
                          (thread) => sessionUser && thread.team.captainId === sessionUser.id,
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
                          <form action={generateRaceSnapshotAction}>
                            <input name="raceId" type="hidden" value={race.id} />
                            <button className="button-secondary" type="submit">
                              生成 Jumbotron 快照
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

                {race.phase === "active" || race.phase === "frozen" ? (
                  (() => {
                    const jt = jumbotronMap.get(race.id);
                    return (
                      <JumbotronInline
                        raceId={race.id}
                        snapshot={jt?.snapshot ?? null}
                        trackProfile={jt?.trackProfile ?? null}
                      />
                    );
                  })()
                ) : null}
              </article>
            );
          })}
        </section>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
