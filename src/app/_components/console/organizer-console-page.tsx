import {
  clearRaceAction,
  assignJudgeToWorkAction,
  generateRaceSnapshotAction,
  publishLeaderboardAction,
  publishShowcaseAction,
  rebuildProcessModelsAction,
  updateDisplayOptionsAction,
  updateOrganizerCommentAction,
  updateRaceAction,
} from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";
import { RiderCodeVisibilityCheckbox } from "@/app/_components/rider-code-visibility-checkbox";
import { getAgentLabel } from "@/lib/services/submissions";
import type { RaceListItem } from "@/lib/services/races";

export function OrganizerConsolePageView({
  judgeAssignments,
  judges,
  race,
  raceSlug,
  section,
}: {
  judgeAssignments: Array<{
    assignedByUser: { username: string };
    assignedAt: Date;
    id: string;
    judge: { username: string };
    judgingRecord: null | { submittedAt: Date | null };
    work: { id: string; title: string };
  }>;
  judges: Array<{ id: string; username: string }>;
  race: RaceListItem;
  raceSlug: string;
  section:
    | "awards"
    | "ca-status"
    | "judges"
    | "judging"
    | "maintenance"
    | "overview"
    | "registrations"
    | "reports"
    | "riders"
    | "settings"
    | "works";
}) {
  return (
    <>
      <Panel title={organizerSectionTitle[section]} eyebrow="主办方视图">
        <p className="muted">
          当前赛事：
          <a href={`/races/${raceSlug}`}>{race.title}</a>
        </p>
      </Panel>
      {renderOrganizerSection({ judgeAssignments, judges, race, raceSlug, section })}
    </>
  );
}

const organizerSectionTitle = {
  awards: "奖项",
  "ca-status": "CA 状态",
  judges: "评委分配",
  judging: "评审进度",
  maintenance: "维护",
  overview: "赛事概览",
  registrations: "报名",
  reports: "报告",
  riders: "骑手",
  settings: "设置",
  works: "作品",
} as const;

function renderOrganizerSection({
  judgeAssignments,
  judges,
  race,
  raceSlug,
  section,
}: {
  judgeAssignments: Array<{
    assignedByUser: { username: string };
    assignedAt: Date;
    id: string;
    judge: { username: string };
    judgingRecord: null | { submittedAt: Date | null };
    work: { id: string; title: string };
  }>;
  judges: Array<{ id: string; username: string }>;
  race: RaceListItem;
  raceSlug: string;
  section: keyof typeof organizerSectionTitle;
}) {
  switch (section) {
    case "overview":
      return (
        <section className="grid">
          <Panel title="赛事概览" eyebrow="概览">
            <div className="detail-grid">
              <div>
                <dt>阶段</dt>
                <dd>{race.phase}</dd>
              </div>
              <div>
                <dt>队伍数</dt>
                <dd>{race.teams.length}</dd>
              </div>
              <div>
                <dt>提交数</dt>
                <dd>{race.submissions.length}</dd>
              </div>
              <div>
                <dt>Runner 任务数</dt>
                <dd>{race.runnerTasks.length}</dd>
              </div>
            </div>
          </Panel>
          <Panel title="下一步入口" eyebrow="上下文入口">
            <div className="button-row-inline">
              <a
                className="button-secondary"
                href={`/console/races/${raceSlug}/organizer/settings`}
              >
                设置
              </a>
              <a
                className="button-secondary"
                href={`/console/races/${raceSlug}/organizer/judging`}
              >
                评审进度
              </a>
              <a
                className="button-secondary"
                href={`/console/races/${raceSlug}/organizer/reports`}
              >
                报告
              </a>
            </div>
            <p className="muted">
              企业能力尚未独立建模；当前大屏控制台仅向管理员开放，后续再从独立企业权限收口。
            </p>
          </Panel>
        </section>
      );
    case "settings":
      return (
        <section className="grid">
          <Panel title="赛事内容" eyebrow="设置">
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
              <button type="submit">保存赛事内容</button>
            </form>
          </Panel>

          <Panel title="显示选项" eyebrow="设置">
            <form action={updateDisplayOptionsAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <div className="check-grid">
                <label className="checkbox">
                  <input
                    defaultChecked={race.displayShowTrainingData}
                    name="displayShowTrainingData"
                    type="checkbox"
                  />
                  显示训练数据
                </label>
                <label className="checkbox">
                  <input
                    defaultChecked={race.displayShowOrganizerComment}
                    name="displayShowOrganizerComment"
                    type="checkbox"
                  />
                  显示主办方评语
                </label>
                <label className="checkbox">
                  <input
                    defaultChecked={race.displayShowTopHighlights}
                    name="displayShowTopHighlights"
                    type="checkbox"
                  />
                  显示精选亮点
                </label>
                <label className="checkbox">
                  <RiderCodeVisibilityCheckbox
                    defaultChecked={race.displayShowRiderCode}
                    name="displayShowRiderCode"
                  />
                  显示骑手代码
                </label>
              </div>
              <label>
                Highlight 数量
                <input
                  defaultValue={race.displayHighlightCount}
                  max={20}
                  min={0}
                  name="displayHighlightCount"
                  type="number"
                />
              </label>
              <button type="submit">保存显示选项</button>
            </form>
          </Panel>
        </section>
      );
    case "registrations":
      return (
        <Panel title="报名" eyebrow="主办方视图">
          <div className="stack">
            {race.registrations.length === 0 ? (
              <p className="muted">暂时还没有报名记录。</p>
            ) : (
              race.registrations.map((registration) => (
                <div className="public-link-card" key={registration.id}>
                  <strong>{registration.user.username}</strong>
                  <span>状态：{registration.status}</span>
                  <span>
                    RaceProject：
                    {registration.raceProject
                      ? registration.raceProject.aggregateIngestionStatus
                      : "未生成"}
                  </span>
                  <span>
                    兼容提交容器：
                    {race.teams.find((team) => team.captainId === registration.userId)
                      ?.name ?? "缺失"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      );
    case "riders":
      return (
        <Panel title="骑手" eyebrow="主办方视图">
          <div className="stack">
            {race.teams.map((team) => (
              <div className="public-link-card" key={`${team.id}-rider`}>
                <strong>{team.captain.username}</strong>
                <span>队伍：{team.name}</span>
                <span>赛事：{race.title}</span>
              </div>
            ))}
          </div>
        </Panel>
      );
    case "ca-status":
      return (
        <section className="grid">
          <Panel title="RaceProject CA 状态" eyebrow="主办方视图">
            <div className="stack">
              {race.registrations.length === 0 ? (
                <p className="muted">暂时还没有报名记录。</p>
              ) : (
                race.registrations.map((registration) => (
                  <div className="public-link-card" key={`${registration.id}-ca`}>
                    <strong>{registration.user.username}</strong>
                    <span>状态：{registration.status}</span>
                    <span>
                      聚合状态：
                      {registration.raceProject?.aggregateIngestionStatus ?? "未生成"}
                    </span>
                    <span>
                      连接数：{registration.raceProject?.caConnections.length ?? 0}
                    </span>
                    <span>
                      会话数：
                      {registration.raceProject?.caConnections.reduce(
                        (sum, connection) => sum + connection.sessions.length,
                        0,
                      ) ?? 0}
                    </span>
                    <span>证据数：{registration.evidences.length}</span>
                  </div>
                ))
              )}
            </div>
          </Panel>
          <Panel title="Projection / Display Status" eyebrow="CA 状态">
            <div className="stack">
              <p className="muted">
                CA 接入、Projection、快照和公开显示链路都在这里集中观察与手动重建。
              </p>
              <form action={rebuildProcessModelsAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button type="submit">重建证据与过程投影</button>
              </form>
              <div className="stack">
                {race.projections.map((projection) => (
                  <div className="public-link-card" key={projection.id}>
                    <strong>{projection.type}</strong>
                    <span>{projection.asOfAt.toISOString()}</span>
                  </div>
                ))}
              </div>
              <a className="button-secondary" href={`/jumbotron/${race.id}`}>
                打开大屏
              </a>
            </div>
          </Panel>
        </section>
      );
    case "works":
      return (
        <section className="grid">
          <Panel title="作品资产" eyebrow="作品">
            <div className="stack">
              {race.registrations.filter((registration) => registration.work).length ===
              0 ? (
                race.submissions.length === 0 ? (
                  <p className="muted">暂时还没有提交或作品资产。</p>
                ) : (
                  race.submissions.slice(0, 10).map((submission) => {
                    const registration = race.registrations.find(
                      (item) => item.id === submission.registrationId,
                    );
                    const containerLabel = registration
                      ? registration.user.username
                      : race.teams.find((team) => team.id === submission.teamId)?.name ??
                        submission.teamId;

                    return (
                      <div className="public-link-card" key={submission.id}>
                        <strong>{submission.codeLabel}</strong>
                        <span>队伍：{containerLabel}</span>
                        <span>状态：{submission.status}</span>
                      </div>
                    );
                  })
                )
              ) : (
                race.registrations
                  .filter((registration) => registration.work)
                  .map((registration) => (
                    <div className="public-link-card" key={registration.work!.id}>
                      <strong>{registration.work!.title}</strong>
                      <span>骑手：{registration.user.username}</span>
                      <span>状态：{registration.work!.status}</span>
                    </div>
                  ))
              )}
            </div>
          </Panel>
          <Panel title="亮点" eyebrow="作品">
            <div className="stack">
              {race.registrations.some((registration) => registration.evidences.length) ? (
                race.registrations
                  .filter((registration) => registration.evidences.length)
                  .flatMap((registration) =>
                    registration.evidences.slice(0, 2).map((evidence) => (
                      <div className="public-link-card" key={evidence.id}>
                        <strong>{registration.user.username}</strong>
                        <span>{evidence.type}</span>
                        <span>{evidence.summary}</span>
                      </div>
                    )),
                  )
              ) : race.highlights.length === 0 ? (
                <p className="muted">暂时还没有已发布亮点。</p>
              ) : (
                race.highlights.map((highlight) => {
                  const registration = race.registrations.find(
                    (item) => item.id === highlight.registrationId,
                  );
                  const containerLabel = registration?.user.username ?? highlight.team.name;

                  return (
                    <div className="public-link-card" key={highlight.id}>
                      <strong>{containerLabel}</strong>
                      <span>{getAgentLabel(highlight.agentType)}</span>
                      <span>{highlight.excerpt}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </section>
      );
    case "judges":
      return (
        <section className="stack">
          {race.registrations
            .filter((registration) => registration.work)
            .map((registration) => (
              <Panel
                key={registration.id}
                title={registration.work!.title}
                eyebrow={`骑手 ${registration.user.username}`}
              >
                <form action={assignJudgeToWorkAction} className="form-grid">
                  <input name="workId" type="hidden" value={registration.work!.id} />
                  <label>
                    分配评委
                    <select
                      defaultValue={
                        judgeAssignments.find(
                          (assignment) =>
                            assignment.work.id === registration.work!.id,
                        )?.judge.username
                          ? judges.find(
                              (judge) =>
                                judge.username ===
                                judgeAssignments.find(
                                  (assignment) =>
                                    assignment.work.id === registration.work!.id,
                                )?.judge.username,
                            )?.id
                          : ""
                      }
                      name="judgeId"
                    >
                      <option value="" disabled>
                        选择评委
                      </option>
                      {judges.map((judge) => (
                        <option key={judge.id} value={judge.id}>
                          {judge.username}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit">保存分配</button>
                </form>
              </Panel>
            ))}
        </section>
      );
    case "judging":
      return (
        <>
          <Panel title="评委分配" eyebrow="评审进度">
            {judgeAssignments.length === 0 ? (
              <p className="muted">暂时还没有评委分配记录。</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>作品</th>
                    <th>评委</th>
                    <th>状态</th>
                    <th>分配人</th>
                  </tr>
                </thead>
                <tbody>
                  {judgeAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.work.title}</td>
                      <td>{assignment.judge.username}</td>
                      <td>
                        {assignment.judgingRecord?.submittedAt
                          ? "已提交"
                          : "草稿 / 待完成"}
                      </td>
                      <td>{assignment.assignedByUser.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Process Evaluation" eyebrow="评审进度">
            <div className="button-row-inline">
              <form action={publishLeaderboardAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button type="submit">运行过程评估</button>
              </form>
              <form action={publishShowcaseAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button className="button-secondary" type="submit">
                  运行 Harness 评估
                </button>
              </form>
            </div>
          </Panel>
        </>
      );
    case "awards":
      return (
        <section className="grid">
          <Panel title="已发布奖项" eyebrow="奖项">
            {race.awards.length === 0 ? (
              race.leaderboardEntries.length === 0 ? (
                <p className="muted">No published awards yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>队伍</th>
                      <th>总分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {race.leaderboardEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.rank}</td>
                        <td>{entry.team.name}</td>
                        <td>{entry.totalScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <div className="stack">
                {race.awards.map((award) => (
                  <div className="public-link-card" key={award.id}>
                    <strong>{award.awardName}</strong>
                    <span>排名：{award.rank}</span>
                    <span>骑手：{award.registration.user.username}</span>
                    <span>{award.work?.title ?? "未关联作品"}</span>
                    <span>{award.decisionReason}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Published Skill Signals" eyebrow="奖项">
            {race.harnessEntries.length === 0 ? (
              <p className="muted">No published skill-signal rows yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>队伍</th>
                    <th>Harness</th>
                    <th>推理</th>
                    <th>关键词</th>
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
            )}
          </Panel>
        </section>
      );
    case "reports":
      return (
        <section className="grid">
          <Panel title="已发布报告" eyebrow="报告">
            <div className="stack">
              {race.reports.length ? (
                race.reports.map((report) => (
                  <div className="public-link-card" key={report.id}>
                    <strong>{report.title}</strong>
                    <span>{report.type}</span>
                    <span>{report.status}</span>
                    <span>{report.summary}</span>
                  </div>
                ))
              ) : (
                <p className="muted">暂时还没有已发布报告。</p>
              )}
            </div>
          </Panel>
          <Panel title="Organizer Report Notes" eyebrow="报告">
            <form action={updateOrganizerCommentAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <label className="full">
                主办方总结
                <textarea
                  defaultValue={race.organizerComment}
                  name="organizerComment"
                  rows={5}
                />
              </label>
              <button type="submit">保存主办方总结</button>
            </form>
          </Panel>
          <Panel title="团队评语" eyebrow="报告">
            <div className="stack">
              {race.teamComments.length === 0 ? (
                <p className="muted">暂时还没有团队评语。</p>
              ) : (
                race.teamComments.map((comment) => (
                  <blockquote className="comment-card" key={comment.id}>
                    {comment.team.name}: {comment.content}
                  </blockquote>
                ))
              )}
            </div>
          </Panel>
        </section>
      );
    case "maintenance":
      return (
        <section className="grid">
          <Panel title="快照与显示" eyebrow="维护">
            <div className="button-row-inline">
              <form action={generateRaceSnapshotAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button type="submit">生成大屏快照</button>
              </form>
            </div>
            <p className="muted">
              大屏控制台当前由管理员代理访问；主办方可先生成快照，再由管理员进入大屏控制台联调展示。
            </p>
          </Panel>
          <Panel title="危险操作" eyebrow="维护">
            <form action={clearRaceAction}>
              <input name="raceId" type="hidden" value={race.id} />
              <button className="button-danger" type="submit">
                清空赛事
              </button>
            </form>
          </Panel>
        </section>
      );
  }
}
