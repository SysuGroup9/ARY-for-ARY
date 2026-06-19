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
import { formatDateTime } from "@/lib/format";
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
      <Panel title={organizerSectionTitle[section]} eyebrow="Organizer View">
        <p className="muted">
          Managed race: <a href={`/races/${raceSlug}`}>{race.title}</a>
        </p>
      </Panel>
      {renderOrganizerSection({ judgeAssignments, judges, race, raceSlug, section })}
    </>
  );
}

const organizerSectionTitle = {
  awards: "Awards",
  "ca-status": "CA Status",
  judges: "Judges",
  judging: "Judging",
  maintenance: "Maintenance",
  overview: "Overview",
  registrations: "Registrations",
  reports: "Reports",
  riders: "Riders",
  settings: "Settings",
  works: "Works",
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
          <Panel title="Race Summary" eyebrow="Overview">
            <div className="detail-grid">
              <div>
                <dt>Phase</dt>
                <dd>{race.phase}</dd>
              </div>
              <div>
                <dt>Teams</dt>
                <dd>{race.teams.length}</dd>
              </div>
              <div>
                <dt>Submissions</dt>
                <dd>{race.submissions.length}</dd>
              </div>
              <div>
                <dt>Runner Tasks</dt>
                <dd>{race.runnerTasks.length}</dd>
              </div>
            </div>
          </Panel>
          <Panel title="Next Links" eyebrow="Context Entry">
            <div className="button-row-inline">
              <a className="button-secondary" href={`/console/races/${raceSlug}/organizer/settings`}>
                Settings
              </a>
              <a className="button-secondary" href={`/console/races/${raceSlug}/organizer/judging`}>
                Judging
              </a>
              <a className="button-secondary" href={`/console/races/${raceSlug}/organizer/reports`}>
                Reports
              </a>
              <a className="button-secondary" href={`/console/screen/${raceSlug}/jumbotron`}>
                Screen Console
              </a>
            </div>
          </Panel>
        </section>
      );
    case "settings":
      return (
        <section className="grid">
          <Panel title="Race Content" eyebrow="Settings">
            <form action={updateRaceAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <label className="full">
                Task Description
                <textarea defaultValue={race.taskDescription} name="taskDescription" rows={5} />
              </label>
              <label className="full">
                Training Data Summary
                <textarea defaultValue={race.trainingDataSummary} name="trainingDataSummary" rows={4} />
              </label>
              <button type="submit">Save Race Content</button>
            </form>
          </Panel>

          <Panel title="Display Options" eyebrow="Settings">
            <form action={updateDisplayOptionsAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <div className="check-grid">
                <label className="checkbox">
                  <input defaultChecked={race.displayShowTrainingData} name="displayShowTrainingData" type="checkbox" />
                  Show training data
                </label>
                <label className="checkbox">
                  <input defaultChecked={race.displayShowOrganizerComment} name="displayShowOrganizerComment" type="checkbox" />
                  Show organizer comment
                </label>
                <label className="checkbox">
                  <input defaultChecked={race.displayShowTopHighlights} name="displayShowTopHighlights" type="checkbox" />
                  Show top highlights
                </label>
                <label className="checkbox">
                  <RiderCodeVisibilityCheckbox defaultChecked={race.displayShowRiderCode} name="displayShowRiderCode" />
                  Show rider code
                </label>
              </div>
              <label>
                Highlight count
                <input defaultValue={race.displayHighlightCount} max={20} min={0} name="displayHighlightCount" type="number" />
              </label>
              <button type="submit">Save Display Options</button>
            </form>
          </Panel>
        </section>
      );
    case "registrations":
      return (
        <Panel title="Registrations" eyebrow="Organizer View">
          <div className="stack">
            {race.registrations.length === 0 ? (
              <p className="muted">No registrations yet.</p>
            ) : (
              race.registrations.map((registration) => (
                <div className="public-link-card" key={registration.id}>
                  <strong>{registration.user.username}</strong>
                  <span>Status: {registration.status}</span>
                  <span>
                    RaceProject: {registration.raceProject ? registration.raceProject.aggregateIngestionStatus : "not generated"}
                  </span>
                  <span>
                    Compatibility team: {race.teams.find((team) => team.captainId === registration.userId)?.name ?? "missing"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      );
    case "riders":
      return (
        <Panel title="Riders" eyebrow="Organizer View">
          <div className="stack">
            {race.teams.map((team) => (
              <div className="public-link-card" key={`${team.id}-rider`}>
                <strong>{team.captain.username}</strong>
                <span>Team: {team.name}</span>
                <span>Race: {race.title}</span>
              </div>
            ))}
          </div>
        </Panel>
      );
    case "ca-status":
      return (
        <section className="grid">
          <Panel title="RaceProject CA Status" eyebrow="Organizer View">
            <div className="stack">
              {race.registrations.length === 0 ? (
                <p className="muted">No registrations yet.</p>
              ) : (
                race.registrations.map((registration) => (
                  <div className="public-link-card" key={`${registration.id}-ca`}>
                    <strong>{registration.user.username}</strong>
                    <span>Status: {registration.status}</span>
                    <span>
                      Aggregate: {registration.raceProject?.aggregateIngestionStatus ?? "not generated"}
                    </span>
                    <span>
                      Connections: {registration.raceProject?.caConnections.length ?? 0}
                    </span>
                    <span>
                      Sessions: {registration.raceProject?.caConnections.reduce((sum, connection) => sum + connection.sessions.length, 0) ?? 0}
                    </span>
                    <span>
                      Evidence: {registration.evidences.length}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>
          <Panel title="Projection / Display Status" eyebrow="CA Status">
            <div className="stack">
              <p className="muted">
                CA 接入、Projection、快照与公开展示链路都在这里集中观察与手动重建。
              </p>
              <form action={rebuildProcessModelsAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button type="submit">Rebuild Evidence and Projection</button>
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
                Open Jumbotron
              </a>
            </div>
          </Panel>
        </section>
      );
    case "works":
      return (
        <section className="grid">
          <Panel title="Work Assets" eyebrow="Works">
            <div className="stack">
              {race.registrations.filter((registration) => registration.work).length === 0 ? (
                race.submissions.length === 0 ? (
                  <p className="muted">No submissions or work assets yet.</p>
                ) : (
                  race.submissions.slice(0, 10).map((submission) => (
                    <div className="public-link-card" key={submission.id}>
                      <strong>{submission.codeLabel}</strong>
                      <span>
                        Team: {race.teams.find((team) => team.id === submission.teamId)?.name ?? submission.teamId}
                      </span>
                      <span>Status: {submission.status}</span>
                    </div>
                  ))
                )
              ) : (
                race.registrations
                  .filter((registration) => registration.work)
                  .map((registration) => (
                    <div className="public-link-card" key={registration.work!.id}>
                      <strong>{registration.work!.title}</strong>
                      <span>Rider: {registration.user.username}</span>
                      <span>Status: {registration.work!.status}</span>
                    </div>
                  ))
              )}
            </div>
          </Panel>
          <Panel title="Highlights" eyebrow="Works">
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
              ) : (
                race.highlights.length === 0 ? (
                  <p className="muted">No highlights published yet.</p>
                ) : (
                  race.highlights.map((highlight) => (
                    <div className="public-link-card" key={highlight.id}>
                      <strong>{highlight.team.name}</strong>
                      <span>{getAgentLabel(highlight.agentType)}</span>
                      <span>{highlight.excerpt}</span>
                    </div>
                  ))
                )
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
                eyebrow={`Rider ${registration.user.username}`}
              >
                <form action={assignJudgeToWorkAction} className="form-grid">
                  <input name="workId" type="hidden" value={registration.work!.id} />
                  <label>
                    Assign Judge
                    <select defaultValue={judgeAssignments.find((assignment) => assignment.work.id === registration.work!.id)?.judge.username ? judges.find((judge) => judge.username === judgeAssignments.find((assignment) => assignment.work.id === registration.work!.id)?.judge.username)?.id : ""} name="judgeId">
                      <option value="" disabled>
                        Select judge
                      </option>
                      {judges.map((judge) => (
                        <option key={judge.id} value={judge.id}>
                          {judge.username}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit">Assign</button>
                </form>
              </Panel>
            ))}
        </section>
      );
    case "judging":
      return (
        <>
          <Panel title="Judge Assignments" eyebrow="Judging">
            {judgeAssignments.length === 0 ? (
              <p className="muted">No judge assignments yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Work</th>
                    <th>Judge</th>
                    <th>Status</th>
                    <th>Assigned By</th>
                  </tr>
                </thead>
                <tbody>
                  {judgeAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.work.title}</td>
                      <td>{assignment.judge.username}</td>
                      <td>{assignment.judgingRecord?.submittedAt ? "Submitted" : "Draft / Pending"}</td>
                      <td>{assignment.assignedByUser.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Process Evaluation" eyebrow="Judging">
            <div className="button-row-inline">
              <form action={publishLeaderboardAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button type="submit">Run Progress Eval</button>
              </form>
              <form action={publishShowcaseAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button className="button-secondary" type="submit">Run Harness Eval</button>
              </form>
            </div>
          </Panel>
        </>
      );
    case "awards":
      return (
        <section className="grid">
          <Panel title="Published Awards" eyebrow="Awards">
            {race.awards.length === 0 ? (
              race.leaderboardEntries.length === 0 ? (
                <p className="muted">No published awards yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team</th>
                      <th>Total</th>
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
                    <span>Rank: {award.rank}</span>
                    <span>Rider: {award.registration.user.username}</span>
                    <span>{award.work?.title ?? "No linked work"}</span>
                    <span>{award.decisionReason}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Published Skill Signals" eyebrow="Awards">
            {race.harnessEntries.length === 0 ? (
              <p className="muted">No published skill-signal rows yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Team</th>
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
            )}
          </Panel>
        </section>
      );
    case "reports":
      return (
        <section className="grid">
          <Panel title="Published Reports" eyebrow="Reports">
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
                <p className="muted">No report entities published yet.</p>
              )}
            </div>
          </Panel>
          <Panel title="Organizer Report Notes" eyebrow="Reports">
            <form action={updateOrganizerCommentAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <label className="full">
                Organizer Summary
                <textarea defaultValue={race.organizerComment} name="organizerComment" rows={5} />
              </label>
              <button type="submit">Save Organizer Summary</button>
            </form>
          </Panel>
          <Panel title="Team Comments" eyebrow="Reports">
            <div className="stack">
              {race.teamComments.length === 0 ? (
                <p className="muted">No team comments yet.</p>
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
          <Panel title="Snapshot and Display" eyebrow="Maintenance">
            <div className="button-row-inline">
              <form action={generateRaceSnapshotAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <button type="submit">Generate Jumbotron Snapshot</button>
              </form>
              <a className="button-secondary" href={`/console/screen/${raceSlug}/jumbotron`}>
                Open Screen Console
              </a>
            </div>
          </Panel>
          <Panel title="Danger Zone" eyebrow="Maintenance">
            <form action={clearRaceAction}>
              <input name="raceId" type="hidden" value={race.id} />
              <button className="button-danger" type="submit">Clear Race</button>
            </form>
          </Panel>
        </section>
      );
  }
}
