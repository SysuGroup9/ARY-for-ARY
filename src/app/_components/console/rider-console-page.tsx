import {
  fetchCASnapshotAction,
  registerForRaceAction,
  registerCAConnectionAction,
  sendFeedbackAction,
  submitEntryAction,
  submitEntryForTestAction,
  submitFinalEntryAction,
} from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";
import FinalSubmissionFormClient from "@/app/_components/final-submission-form-client";
import SubmissionFormClient from "@/app/_components/submission-form-client";
import type { getRegistrationForUser } from "@/lib/services/registrations";
import type { getTeamForCaptain } from "@/lib/services/teams";
import type { RaceListItem } from "@/lib/services/races";

type RiderTeam = Awaited<ReturnType<typeof getTeamForCaptain>>;
type RiderRegistration = Awaited<ReturnType<typeof getRegistrationForUser>>;

export function RiderConsolePageView({
  race,
  registration,
  reviewSummary,
  riderReports,
  riderTeam,
  raceSlug,
  section,
}: {
  race: RaceListItem;
  registration: RiderRegistration;
  reviewSummary: null | { summary: string; title: string };
  riderReports: Array<{ summary: string; title: string }>;
  riderTeam: RiderTeam;
  raceSlug?: string;
  section:
    | "ca-setup"
    | "registration"
    | "report"
    | "review"
    | "riding"
    | "submission";
}) {
  const resolvedRaceSlug = raceSlug ?? race.id;

  return (
    <>
      <Panel title={riderSectionTitle[section]} eyebrow="Rider View">
        <p className="muted">
          赛事上下文始终保留在当前页面，骑手操作不再依赖公开首页入口。
        </p>
      </Panel>
      {renderRiderSection({
        race,
        raceSlug: resolvedRaceSlug,
        registration,
        reviewSummary,
        riderReports,
        riderTeam,
        section,
      })}
    </>
  );
}

const riderSectionTitle = {
  "ca-setup": "CA 接入",
  registration: "报名",
  report: "骑手报告",
  review: "评审结果",
  riding: "骑行状态",
  submission: "作品提交",
} as const;

function renderRiderSection({
  race,
  raceSlug,
  registration,
  reviewSummary,
  riderReports,
  riderTeam,
  section,
}: {
  race: RaceListItem;
  raceSlug: string;
  registration: RiderRegistration;
  reviewSummary: null | { summary: string; title: string };
  riderReports: Array<{ summary: string; title: string }>;
  riderTeam: RiderTeam;
  section: keyof typeof riderSectionTitle;
}) {
  const riderRegistrationHref = `/console/races/${raceSlug}/rider/registration`;
  const riderSubmissionHref = `/console/races/${raceSlug}/rider/submission`;

  switch (section) {
    case "registration":
      return (
        <Panel title="报名状态" eyebrow="Rider View">
          {registration ? (
            <div className="stack">
              <strong>状态：{registration.status}</strong>
              <span>报名用户：{registration.user.username}</span>
              <span>
                RaceProject：{registration.raceProject ? registration.raceProject.aggregateIngestionStatus : "未生成"}
              </span>
              {riderTeam ? <span>当前提交容器：{riderTeam.name}</span> : null}
            </div>
          ) : (
            <div className="stack">
              <p className="muted">
                你已经进入骑手工作台；下一步是对当前赛事提交正式报名，报名成功后才会生成后续参赛上下文。
              </p>
              <form action={registerForRaceAction} className="form-grid">
                <input name="raceId" type="hidden" value={race.id} />
                <input name="returnTo" type="hidden" value={riderRegistrationHref} />
                <button type="submit">报名参赛</button>
              </form>
            </div>
          )}
        </Panel>
      );

    case "ca-setup":
      return (
        <>
          <Panel title="CA 接入" eyebrow="Rider View">
            {!registration?.raceProject ? (
              <p className="muted">当前还没有生成 RaceProject。</p>
            ) : (
              <div className="stack">
                <p className="muted">
                  聚合接入状态：{registration.raceProject.aggregateIngestionStatus}
                </p>
                <form action={registerCAConnectionAction} className="form-grid">
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceProjectId" type="hidden" value={registration.raceProject.id} />
                  <label>
                    CA 类型
                    <select defaultValue="CODEX" name="caType">
                      <option value="CODEX">CODEX</option>
                      <option value="CLAUDE_CODE">CLAUDE_CODE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </label>
                  <label>
                    Connector ID
                    <input name="connectorId" placeholder="codex_connector_001" required />
                  </label>
                  <label>
                    Connector Base URL
                    <input name="connectorBaseUrl" placeholder="https://connector.example" />
                  </label>
                  <label>
                    Connector Version
                    <input defaultValue="0.1.0" name="connectorVersion" />
                  </label>
                  <label>
                    CA Project ID
                    <input name="caProjectId" placeholder="codex_project_demo" required />
                  </label>
                  <button type="submit">登记 CA 连接</button>
                </form>
              </div>
            )}
          </Panel>

          <Panel title="CA 连接" eyebrow="Rider View">
            <div className="stack">
              {registration?.raceProject?.caConnections.length ? (
                registration.raceProject.caConnections.map((connection) => (
                  <div className="public-link-card" key={connection.id}>
                    <strong>{connection.caType}</strong>
                    <span>状态：{connection.ingestionStatus}</span>
                    <span>Connector：{connection.connectorId}</span>
                    <span>Connector Secret：{connection.connectorSecret}</span>
                    <span>Project：{connection.caProjectId}</span>
                    <span>
                      握手：{connection.handshakeCompletedAt ? "已完成" : "待完成"}
                    </span>
                    <span>Sessions：{connection.sessions.length}</span>
                    <p className="muted">
                      先让 connector 调用 handshake API 完成登记确认；只有出现 session 后，ARY 才能抓取对应 snapshot。
                    </p>
                    <form action={fetchCASnapshotAction} className="form-grid">
                      <input name="caConnectionId" type="hidden" value={connection.id} />
                      <input name="raceId" type="hidden" value={race.id} />
                      <label>
                        CA Session ID
                        <input name="caSessionId" placeholder="codex_session_demo_001" required />
                      </label>
                      <button type="submit">抓取快照</button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="muted">暂无 CA 连接。</p>
              )}
            </div>
          </Panel>

          <Panel title="会话摘要证据" eyebrow="Rider View">
            <div className="stack">
              {registration?.evidences.length ? (
                registration.evidences.map((evidence) => (
                  <div className="public-link-card" key={evidence.id}>
                    <strong>{evidence.title}</strong>
                    <span>{evidence.type}</span>
                    <span>{evidence.summary}</span>
                  </div>
                ))
              ) : (
                <p className="muted">暂无已生成的会话摘要证据。</p>
              )}
            </div>
          </Panel>
        </>
      );

    case "riding": {
      const riderRegistrationId = registration?.id ?? null;
      const teamEntry = riderRegistrationId
        ? race.leaderboardEntries.find(
            (entry) =>
              entry.registrationId === riderRegistrationId ||
              entry.teamId === riderTeam?.id,
          )
        : riderTeam
          ? race.leaderboardEntries.find((entry) => entry.teamId === riderTeam.id)
          : null;

      return (
        <Panel title="骑行状态" eyebrow="Rider View">
          <div className="detail-grid">
            <div>
              <dt>阶段</dt>
              <dd>{race.phase}</dd>
            </div>
            <div>
              <dt>榜单名次</dt>
              <dd>{teamEntry?.rank ?? "-"}</dd>
            </div>
            <div>
              <dt>总分</dt>
              <dd>{teamEntry?.totalScore ?? "-"}</dd>
            </div>
            <div>
              <dt>提交次数</dt>
              <dd>
                {riderRegistrationId
                  ? race.submissions.filter(
                      (submission) =>
                        submission.registrationId === riderRegistrationId ||
                        submission.teamId === riderTeam?.id,
                    ).length
                  : riderTeam
                    ? race.submissions.filter(
                        (submission) => submission.teamId === riderTeam.id,
                      ).length
                    : 0}
              </dd>
            </div>
          </div>
        </Panel>
      );
    }

    case "submission":
      return (
        <>
          {!riderTeam ? (
            <Panel title="提交已锁定" eyebrow="Rider View">
              <p className="muted">需要先完成报名并生成参赛上下文，作品提交入口才会解锁。</p>
            </Panel>
          ) : race.phase === "active" ||
            race.phase === "frozen" ||
            race.phase === "running" ||
            race.phase === "submitting" ? (
            <>
              <Panel title="提交作品" eyebrow="Rider View">
                <SubmissionFormClient
                  action={submitEntryAction}
                  raceId={race.id}
                  returnTo={riderSubmissionHref}
                />
              </Panel>
              <Panel title="赛中代码测试" eyebrow="Rider View">
                <SubmissionFormClient
                  action={submitEntryForTestAction}
                  raceId={race.id}
                  returnTo={riderSubmissionHref}
                  submitLabel="提交代码并发起赛中测试"
                />
              </Panel>
            </>
          ) : race.phase === "finished" || race.phase === "completed" ? (
            <Panel title="提交赛后代码与记录" eyebrow="Rider View">
              <FinalSubmissionFormClient
                action={submitFinalEntryAction}
                raceId={race.id}
                returnTo={riderSubmissionHref}
              />
            </Panel>
          ) : (
            <Panel title="提交窗口" eyebrow="Rider View">
              <p className="muted">作品提交会在赛事进入比赛中或提交中阶段后开放；赛后代码与 Riding Record 会在赛事结束后开放。</p>
            </Panel>
          )}

          <Panel title="最近提交" eyebrow="Rider View">
            <div className="stack">
              {!riderTeam ? (
                <p className="muted">当前还没有可用的作品提交记录。</p>
              ) : (
                race.submissions
                  .filter((submission) =>
                    registration?.id
                      ? submission.registrationId === registration.id ||
                        submission.teamId === riderTeam.id
                      : submission.teamId === riderTeam.id,
                  )
                  .map((submission) => (
                    <div className="public-link-card" key={submission.id}>
                      <strong>{submission.codeLabel}</strong>
                      <span>状态：{submission.status}</span>
                    </div>
                  ))
              )}
            </div>
          </Panel>
        </>
      );

    case "review": {
      const thread = registration?.id
        ? race.feedbackThreads.find(
            (item) =>
              item.registrationId === registration.id || item.teamId === riderTeam?.id,
          )
        : riderTeam
          ? race.feedbackThreads.find((item) => item.teamId === riderTeam.id)
          : null;

      return (
        <section className="grid">
          <Panel title="发给主办方的反馈" eyebrow="Rider View">
            <form action={sendFeedbackAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <label className="full">
                反馈内容
                <textarea
                  defaultValue="请在下一次提交窗口前，进一步明确当前评估说明。"
                  name="content"
                  required
                  rows={3}
                />
              </label>
              <button type="submit">发送反馈</button>
            </form>
          </Panel>
          <Panel title="评审结果" eyebrow="Rider View">
            <div className="stack">
              {reviewSummary ? (
                <blockquote className="comment-card">
                  <strong>{reviewSummary.title}</strong>
                  <span>{reviewSummary.summary}</span>
                </blockquote>
              ) : (
                <p className="muted">暂无已发布的评审总结。</p>
              )}
              {thread ? (
                thread.messages.map((message) => (
                  <div className="public-link-card" key={message.id}>
                    <strong>{message.author.username}</strong>
                    <span>{message.content}</span>
                  </div>
                ))
              ) : null}
            </div>
          </Panel>
        </section>
      );
    }

    case "report":
      return (
        <Panel title="骑手报告" eyebrow="Rider View">
          <div className="stack">
            {riderReports.length ? (
              riderReports.map((report, index) => (
                <div className="public-link-card" key={`${report.title}-${index}`}>
                  <strong>{report.title}</strong>
                  <span>{report.summary}</span>
                </div>
              ))
            ) : null}
            {registration?.evidences.slice(0, 3).map((evidence) => (
              <div className="public-link-card" key={evidence.id}>
                <strong>{evidence.title}</strong>
                <span>{evidence.summary}</span>
              </div>
            ))}
            {riderTeam
              ? race.teamArchives
                  .filter((item) =>
                    registration?.id
                      ? item.registrationId === registration.id || item.teamId === riderTeam.id
                      : item.teamId === riderTeam.id,
                  )
                  .slice(0, 1)
                  .map((archive) => (
                    <div className="public-link-card" key={`${archive.id}-final-score`}>
                      <strong>最终得分</strong>
                      <span>{archive.totalScore}</span>
                    </div>
                  ))
              : null}
            {race.organizerComment ? (
              <blockquote className="comment-card">{race.organizerComment}</blockquote>
            ) : riderReports.length === 0 ? (
              <p className="muted">暂无已发布的主办方总结。</p>
            ) : null}
          </div>
        </Panel>
      );
  }
}
