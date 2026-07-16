import {
  fetchCASnapshotAction,
  hideWorkAction,
  registerForRaceAction,
  registerCAConnectionAction,
  rotateCAConnectionSecretAction,
  sendFeedbackAction,
  saveWorkDraftAction,
  submitEntryAction,
  submitFinalEntryAction,
  withdrawRegistrationAction,
  createTaskAction,
  completeTaskAction,
  sendMessageAction,
  removeMemberAction,
  approveMemberAction,
  createTeamAction,
  joinTeamAction,
} from "@/app/actions";
import { ErrorNotice, Panel } from "@/app/_components/ary-shared";
import { ReviewReadinessCard } from "@/app/_components/console/review-readiness-card";
import FinalSubmissionFormClient from "@/app/_components/final-submission-form-client";
import SubmissionFormClient from "@/app/_components/submission-form-client";
import { getRacePhaseLabel } from "@/lib/race-phase";
import { buildReviewReadinessSummary } from "@/lib/review-readiness-helpers";
import type { getRegistrationForUser } from "@/lib/services/registrations";
import type { getTeamForCaptain } from "@/lib/services/teams";
import type { RaceListItem } from "@/lib/services/races";

type RiderTeam = Awaited<ReturnType<typeof getTeamForCaptain>>;
type RiderRegistration = Awaited<ReturnType<typeof getRegistrationForUser>>;

export function RiderConsolePageView({
  availableTeams,
  feedback,
  race,
  registration,
  reviewSummary,
  riderReports,
  riderTeam,
  raceSlug,
  section,
  teamMessages,
  teamTasks,
}: {
  availableTeams?: Awaited<ReturnType<typeof import("@/lib/services/teams").listTeamsForRace>>;
  feedback?: { message: string; title: string } | null;
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
    | "submission"
    | "collaboration";
  teamMessages?: Awaited<ReturnType<typeof import("@/lib/services/collaboration").listMessagesForTeam>>;
  teamTasks?: Awaited<ReturnType<typeof import("@/lib/services/team-tasks").listTasksForTeam>>;
}) {
  const resolvedRaceSlug = raceSlug ?? race.id;

  return (
    <>
      {feedback ? <ErrorNotice message={feedback.message} title={feedback.title} /> : null}
      <Panel title={riderSectionTitle[section]} eyebrow={riderEyebrow}>
        <p className="muted">
          赛事上下文始终保留在当前页面，骑手操作不再依赖公开首页入口。
        </p>
      </Panel>
      {renderRiderSection({
        availableTeams,
        race,
        raceSlug: resolvedRaceSlug,
        registration,
        reviewSummary,
        riderReports,
        riderTeam,
        section,
        teamMessages,
        teamTasks,
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
  collaboration: "团队协作",
} as const;

const riderEyebrow = "骑手视图";

function formatConnectionTimestamp(value: Date | null | undefined) {
  return value ? value.toISOString() : "尚未发生";
}

function getHandshakeStateLabel(value: Date | null | undefined) {
  return value ? "已完成" : "需重新握手";
}

function getRegistrationStatusLabel(status: string) {
  switch (String(status).trim().toUpperCase()) {
    case "APPROVED":
      return "已通过";
    case "SUBMITTED":
      return "待审核";
    case "REJECTED":
      return "已拒绝";
    case "WITHDRAWN":
      return "已撤回";
    default:
      return status;
  }
}

function getAggregateIngestionStatusLabel(status: string) {
  switch (String(status).trim().toUpperCase()) {
    case "ACTIVE":
      return "活跃中";
    case "CONNECTED":
      return "已连接";
    case "FAILED":
      return "接入失败";
    case "NOT_CONFIGURED":
      return "未接入";
    default:
      return status;
  }
}

function renderRiderSection({
  availableTeams,
  race,
  raceSlug,
  registration,
  reviewSummary,
  riderReports,
  riderTeam,
  section,
  teamMessages,
  teamTasks,
}: {
  availableTeams?: Awaited<ReturnType<typeof import("@/lib/services/teams").listTeamsForRace>>;
  race: RaceListItem;
  raceSlug: string;
  registration: RiderRegistration;
  reviewSummary: null | { summary: string; title: string };
  riderReports: Array<{ summary: string; title: string }>;
  riderTeam: RiderTeam;
  section: keyof typeof riderSectionTitle;
  teamMessages?: Awaited<ReturnType<typeof import("@/lib/services/collaboration").listMessagesForTeam>>;
  teamTasks?: Awaited<ReturnType<typeof import("@/lib/services/team-tasks").listTasksForTeam>>;
}) {
  const riderRegistrationHref = `/console/races/${raceSlug}/rider/registration`;
  const riderCASetupHref = `/console/races/${raceSlug}/rider/ca-setup`;
  const riderSubmissionHref = `/console/races/${raceSlug}/rider/submission`;
  const registrationStatus = String(registration?.status ?? "").toUpperCase();
  const currentWork = riderTeam?.works?.[0] ?? null;
  const workDefaults = {
    demoUrl: currentWork?.demoUrl ?? "",
    repoUrl: currentWork?.repoUrl ?? registration?.raceProject?.githubRepoUrl ?? "",
    techNotes: currentWork?.techNotes ?? "",
    videoUrl: currentWork?.videoUrl ?? "",
    workSummary: currentWork?.summary ?? "",
    workTitle: currentWork?.title ?? "",
  };
  const submissionReadiness = registration
    ? buildReviewReadinessSummary({
        aggregateIngestionStatus:
          registration.raceProject?.aggregateIngestionStatus ?? "NOT_CONFIGURED",
        evidences: registration.evidences ?? [],
        hasWork: Boolean(currentWork),
        phase: race.phase,
        workSummary: currentWork?.summary,
        workTitle: currentWork?.title,
      })
    : null;
  const riderSubmissionRecords =
    registration?.id
      ? race.submissions.filter(
          (submission) =>
            submission.registrationId === registration.id ||
            submission.teamId === riderTeam?.id,
        )
      : riderTeam
        ? race.submissions.filter((submission) => submission.teamId === riderTeam.id)
        : [];

  switch (section) {
    case "registration":
      return (
        <Panel title="报名状态" eyebrow={riderEyebrow}>
          {registration ? (
            registrationStatus === "APPROVED" ? (
              <div className="stack">
                <strong>状态：{getRegistrationStatusLabel(registration.status)}</strong>
                <span>报名用户：{registration.user.username}</span>
                <span>
                  RaceProject：
                  {registration.raceProject
                    ? getAggregateIngestionStatusLabel(
                        registration.raceProject.aggregateIngestionStatus,
                      )
                    : "未生成"}
                </span>
                {riderTeam ? <span>当前提交容器：{riderTeam.name}</span> : null}
                {race.phase === "registration" ? (
                  <form action={withdrawRegistrationAction}>
                    <input
                      name="registrationId"
                      type="hidden"
                      value={registration.id}
                    />
                    <input
                      name="feedbackReturnTo"
                      type="hidden"
                      value={riderRegistrationHref}
                    />
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <button type="submit">撤回报名</button>
                  </form>
                ) : null}
              </div>
            ) : registrationStatus === "SUBMITTED" ? (
              <div className="stack">
                <strong>状态：{getRegistrationStatusLabel(registration.status)}</strong>
                <span>报名用户：{registration.user.username}</span>
                <p className="muted">
                  报名已提交，正在等待主办方审核。审核通过后，系统才会生成 RaceProject 和作品提交上下文。
                </p>
                {race.phase === "registration" ? (
                  <form action={withdrawRegistrationAction}>
                    <input
                      name="registrationId"
                      type="hidden"
                      value={registration.id}
                    />
                    <input
                      name="feedbackReturnTo"
                      type="hidden"
                      value={riderRegistrationHref}
                    />
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <button type="submit">撤回报名</button>
                  </form>
                ) : null}
              </div>
            ) : registrationStatus === "WITHDRAWN" ? (
              <div className="stack">
                <strong>状态：{getRegistrationStatusLabel(registration.status)}</strong>
                <span>报名用户：{registration.user.username}</span>
                <p className="muted">
                  这条报名已经撤回，当前不会进入正式参赛上下文。
                </p>
              </div>
            ) : (
              <div className="stack">
                <strong>状态：{getRegistrationStatusLabel(registration.status)}</strong>
                <span>报名用户：{registration.user.username}</span>
                <p className="muted">
                  当前报名还没有进入正式参赛上下文；如需继续参赛，请联系主办方。
                </p>
              </div>
            )
          ) : (
            <div className="stack">
              <p className="muted">
                你已经进入骑手工作台；下一步是对当前赛事提交正式报名，报名成功后才会生成后续参赛上下文。
              </p>
              <form action={registerForRaceAction} className="form-grid">
                <input
                  name="feedbackReturnTo"
                  type="hidden"
                  value={riderRegistrationHref}
                />
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
          <Panel title="CA 接入" eyebrow={riderEyebrow}>
            {!registration ? (
              <p className="muted">请先完成报名并等待审核通过。</p>
            ) : registrationStatus !== "APPROVED" ? (
              <p className="muted">当前报名尚未通过审核，暂不能配置 CA 接入。</p>
            ) : !registration.raceProject ? (
              <p className="muted">当前还没有生成 RaceProject。</p>
            ) : (
              <div className="stack">
                <p className="muted">
                  聚合接入状态：
                  {getAggregateIngestionStatusLabel(
                    registration.raceProject.aggregateIngestionStatus,
                  )}
                </p>
                <form action={registerCAConnectionAction} className="form-grid">
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input name="raceProjectId" type="hidden" value={registration.raceProject.id} />
                  <input name="returnTo" type="hidden" value={riderCASetupHref} />
                  <label>
                    CA 类型
                    <select defaultValue="CODEX" name="caType">
                      <option value="CODEX">CODEX</option>
                      <option value="CLAUDE_CODE">CLAUDE_CODE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </label>
                  <label>
                    连接器 ID
                    <input name="connectorId" placeholder="codex_connector_001" required />
                  </label>
                  <label>
                    连接器 Base URL
                    <input name="connectorBaseUrl" placeholder="https://connector.example" />
                  </label>
                  <label>
                    连接器版本
                    <input defaultValue="0.1.0" name="connectorVersion" />
                  </label>
                  <label>
                    CA 项目 ID
                    <input name="caProjectId" placeholder="codex_project_demo" required />
                  </label>
                  <button type="submit">登记 CA 连接</button>
                </form>
              </div>
            )}
          </Panel>

          <Panel title="CA 连接" eyebrow={riderEyebrow}>
            <div className="stack">
              {registration?.raceProject?.caConnections.length ? (
                registration.raceProject.caConnections.map((connection) => (
                  <div className="public-link-card" key={connection.id}>
                    <strong>{connection.caType}</strong>
                    <span>状态：{getAggregateIngestionStatusLabel(connection.ingestionStatus)}</span>
                    <span>连接器：{connection.connectorId}</span>
                    <span>连接器密钥：{connection.connectorSecret}</span>
                    <span>项目 ID：{connection.caProjectId}</span>
                    <span>密钥版本：{connection.secretVersion}</span>
                    <span>
                      最近轮换时间：{formatConnectionTimestamp(connection.secretRotatedAt)}
                    </span>
                    <span>是否禁用：{connection.disabledAt ? "是" : "否"}</span>
                    {connection.disabledAt ? (
                      <span>
                        禁用时间：{formatConnectionTimestamp(connection.disabledAt)}
                      </span>
                    ) : null}
                    <span>禁用原因：{connection.disabledReason || "正常"}</span>
                    <span>
                      握手：{connection.handshakeCompletedAt ? "已完成" : "待完成"}
                    </span>
                    <span>
                      握手状态：{getHandshakeStateLabel(connection.handshakeCompletedAt)}
                    </span>
                    <span>会话数：{connection.sessions.length}</span>
                    <p className="muted">
                      先让连接器调用 handshake API 完成登记确认；只有出现会话后，ARY 才能抓取对应快照。
                    </p>
                    {!connection.handshakeCompletedAt ? (
                      <p className="muted">
                        密钥轮换或重新启用连接器后，需要重新完成握手，才能继续抓取快照。
                      </p>
                    ) : null}
                    <form action={rotateCAConnectionSecretAction} className="button-row-inline">
                      <input name="caConnectionId" type="hidden" value={connection.id} />
                      <input name="raceId" type="hidden" value={race.id} />
                      <input name="raceSlug" type="hidden" value={raceSlug} />
                      <input name="returnTo" type="hidden" value={riderCASetupHref} />
                      <button type="submit">轮换连接器密钥</button>
                    </form>
                    <form action={fetchCASnapshotAction} className="form-grid">
                      <input name="caConnectionId" type="hidden" value={connection.id} />
                      <input name="raceId" type="hidden" value={race.id} />
                      <input name="raceSlug" type="hidden" value={raceSlug} />
                      <input name="returnTo" type="hidden" value={riderCASetupHref} />
                      <label>
                        CA 会话 ID
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

          <Panel title="会话摘要证据" eyebrow={riderEyebrow}>
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
        <Panel title="骑行状态" eyebrow={riderEyebrow}>
          <div className="detail-grid">
            <div>
              <dt>阶段</dt>
              <dd>{getRacePhaseLabel(race.phase)}</dd>
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
          <Panel title="作品提交" eyebrow={riderEyebrow}>
            <div className="stack">
              <span>当前阶段：{getRacePhaseLabel(race.phase)}</span>
              <p className="muted">
                赛事上下文始终保留在当前页面，骑手操作不再依赖公开首页入口。
              </p>
            </div>
          </Panel>

          {submissionReadiness ? (
            <Panel title="提交前提示" eyebrow={riderEyebrow}>
              <ReviewReadinessCard summary={submissionReadiness} />
            </Panel>
          ) : null}

          <Panel title="当前作品资产" eyebrow={riderEyebrow}>
            {currentWork ? (
              <div className="stack">
                <strong>{currentWork.title}</strong>
                <span>状态：{currentWork.status}</span>
                <span>可见性：{currentWork.visibility}</span>
                <span>{currentWork.summary}</span>
                {String(currentWork.status).toUpperCase() === "DRAFT" ? (
                  <form action={hideWorkAction}>
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <input name="workId" type="hidden" value={currentWork.id} />
                    <button type="submit">隐藏当前草稿</button>
                  </form>
                ) : null}
                <p className="muted">
                  作品提交会更新这条正式 Work 资产；进入公开站点仍需主办方执行发布。
                </p>
              </div>
            ) : (
              <p className="muted">
                当前还没有正式作品资产；可以先保存作品草稿，再提交正式代码材料。
              </p>
            )}
          </Panel>

          {!registration ? (
            <Panel title="提交已锁定" eyebrow={riderEyebrow}>
              <p className="muted">需要先完成报名并等待审核通过，作品提交入口才会解锁。</p>
            </Panel>
          ) : registrationStatus !== "APPROVED" ? (
            <Panel title="提交已锁定" eyebrow={riderEyebrow}>
              <p className="muted">当前报名尚未通过审核，作品提交入口暂未开放。</p>
            </Panel>
          ) : race.phase === "active" ||
            race.phase === "frozen" ||
            race.phase === "running" ||
            race.phase === "submitting" ? (
            <Panel title="作品提交" eyebrow={riderEyebrow}>
              <SubmissionFormClient
                action={submitEntryAction}
                raceId={race.id}
                raceSlug={raceSlug}
                returnTo={riderSubmissionHref}
                saveDraftAction={saveWorkDraftAction}
                submitLabel="提交代码"
                workDefaults={workDefaults}
              />
            </Panel>
          ) : race.phase === "finished" || race.phase === "completed" ? (
            <Panel title="作品提交" eyebrow={riderEyebrow}>
              <FinalSubmissionFormClient
                action={submitFinalEntryAction}
                raceId={race.id}
                raceSlug={raceSlug}
                returnTo={riderSubmissionHref}
                saveDraftAction={saveWorkDraftAction}
                workDefaults={workDefaults}
              />
            </Panel>
          ) : (
            <Panel title="提交窗口" eyebrow={riderEyebrow}>
              <p className="muted">作品提交会在比赛开始后开放；比赛结束后可继续补交代码与 Riding Record。</p>
            </Panel>
          )}

          <Panel title="最近提交" eyebrow={riderEyebrow}>
            <div className="stack">
              {riderSubmissionRecords.length === 0 ? (
                <p className="muted">当前还没有可用的作品提交记录。</p>
              ) : (
                riderSubmissionRecords.map((submission) => (
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
          <Panel title="发给主办方的反馈" eyebrow={riderEyebrow}>
            <form action={sendFeedbackAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <input name="raceSlug" type="hidden" value={raceSlug} />
              <input
                name="returnTo"
                type="hidden"
                value={`/console/races/${raceSlug}/rider/review`}
              />
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
          <Panel title="评审结果" eyebrow={riderEyebrow}>
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

    case "collaboration": {
      if (!riderTeam) {
        const riderCollaborationHref = `/console/races/${raceSlug}/rider/collaboration`;
        const teams = availableTeams ?? [];
        return (
          <section className="grid">
            <Panel title="创建队伍" eyebrow={riderEyebrow}>
              <p className="muted">
                {registration
                  ? "报名成功！现在可以创建自己的队伍（你将自动成为队长），或加入已有队伍。"
                  : "请先在「报名」标签页完成赛事报名，然后再创建或加入队伍。"}
              </p>
              {registration ? (
                <form action={createTeamAction} className="form-grid">
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                  <input name="feedbackReturnTo" type="hidden" value={riderCollaborationHref} />
                  <label className="full">
                    队伍名称
                    <input name="teamName" placeholder="输入队伍名称" required />
                  </label>
                  <button type="submit">创建队伍</button>
                </form>
              ) : null}
            </Panel>
            <Panel title="加入队伍" eyebrow={riderEyebrow}>
              {teams.length === 0 ? (
                <p className="muted">当前赛事暂无开放队伍。你可以创建一支新队伍。</p>
              ) : (
                <div className="stack">
                  <p className="muted">选择一个已有队伍加入（需队长审批）：</p>
                  {teams.map((team) => (
                    <div className="public-link-card" key={team.id}>
                      <strong>{team.name}</strong>
                      <span>
                        队长：{team.leader?.username ?? "—"}
                        {" · "}
                        {team.members.filter((m) => m.status === "APPROVED").length} 人
                      </span>
                      {registration ? (
                        <form action={joinTeamAction}>
                          <input name="raceId" type="hidden" value={race.id} />
                          <input name="teamId" type="hidden" value={team.id} />
                          <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                          <input name="feedbackReturnTo" type="hidden" value={riderCollaborationHref} />
                          <button type="submit">申请加入</button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </section>
        );
      }

      const isLeader = riderTeam.leaderId === registration?.userId;
      const members = riderTeam.members ?? [];
      const approvedMembers = members.filter((m) => m.status === "APPROVED");
      const currentMember = members.find((m) => m.userId === registration?.userId);
      const isApprovedMember = currentMember?.status === "APPROVED" || isLeader;

      // GRS004: 非 APPROVED 成员（PENDING/REJECTED TeamMember）只能看到队伍基本信息
      // 不能发送消息、不能查看任务详情
      const tasks = teamTasks ?? [];
      const messages = teamMessages ?? [];
      const riderCollaborationHref = `/console/races/${raceSlug}/rider/collaboration`;

      return (
        <section className="grid">
          {/* Team Info */}
          <Panel title="队伍信息" eyebrow={riderEyebrow}>
            <div className="stack">
              <div className="detail-grid">
                <div>
                  <dt>队伍名称</dt>
                  <dd>{riderTeam.name}</dd>
                </div>
                <div>
                  <dt>队长</dt>
                  <dd>{riderTeam.leader?.username ?? "—"}</dd>
                </div>
                <div>
                  <dt>人数</dt>
                  <dd>{approvedMembers.length}</dd>
                </div>
              </div>
              <div className="stack">
                <strong>成员列表</strong>
                {members.length === 0 ? (
                  <p className="muted">暂无成员</p>
                ) : (
                  members.map((member) => (
                    <div className="public-link-card" key={member.id}>
                      <strong>
                        {member.user?.username ?? "—"}
                        {member.role === "LEADER" ? " · 队长" : " · 队员"}
                      </strong>
                      <span>
                        状态：{member.status === "APPROVED" ? "已加入" : member.status === "PENDING" ? "待审批" : member.status === "REJECTED" ? "已拒绝" : member.status}
                      </span>
                      {isLeader && member.role !== "LEADER" && member.status === "PENDING" ? (
                        <div className="inline-actions">
                          <form action={approveMemberAction}>
                            <input name="teamId" type="hidden" value={riderTeam.id} />
                            <input name="memberId" type="hidden" value={member.id} />
                            <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                            <button type="submit">批准入队</button>
                          </form>
                        </div>
                      ) : null}
                      {isLeader && member.role !== "LEADER" && member.status === "APPROVED" ? (
                        <div className="inline-actions">
                          <form action={removeMemberAction}>
                            <input name="teamId" type="hidden" value={riderTeam.id} />
                            <input name="memberId" type="hidden" value={member.id} />
                            <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                            <input name="feedbackReturnTo" type="hidden" value={riderCollaborationHref} />
                            <button type="submit">移出队伍</button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>

          {/* Tasks */}
          {isApprovedMember ? (
            <Panel title="任务看板" eyebrow={riderEyebrow}>
              <div className="stack">
                {tasks.length === 0 ? (
                  <p className="muted">暂无任务。队长可以发布任务给队员。</p>
                ) : (
                  tasks.map((task) => (
                    <div className="public-link-card" key={task.id}>
                      <strong>
                        {task.status === "DONE" ? "✓ " : "○ "}
                        {task.title}
                      </strong>
                      <span>
                        分配给：{task.assignee?.username ?? "—"}
                         · 发布于 {new Date(task.createdAt).toLocaleString("zh-CN")}
                        {task.status === "DONE" && task.completedAt
                          ? ` · 已完成于 ${new Date(task.completedAt).toLocaleString("zh-CN")}`
                          : ""}
                      </span>
                    {task.description ? <span className="muted">{task.description}</span> : null}
                    {task.status === "TODO" ? (
                      <form action={completeTaskAction}>
                        <input name="taskId" type="hidden" value={task.id} />
                        <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                        <input name="feedbackReturnTo" type="hidden" value={riderCollaborationHref} />
                        <button type="submit">标记完成</button>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
              {isLeader ? (
                <form action={createTaskAction} className="form-grid">
                  <input name="teamId" type="hidden" value={riderTeam.id} />
                  <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                  <input name="feedbackReturnTo" type="hidden" value={riderCollaborationHref} />
                  <label className="full">
                    任务标题
                    <input name="title" placeholder="例如：优化模型参数" required />
                  </label>
                  <label className="full">
                    任务描述
                    <textarea name="description" rows={2} />
                  </label>
                  <label className="full">
                    分配给
                    <select name="assigneeId" required>
                      <option value="">选择队员...</option>
                      {members
                        .filter((m) => m.status === "APPROVED")
                        .map((m) => (
                          <option key={m.userId ?? m.id} value={m.userId ?? ""}>
                            {m.user?.username ?? "—"}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button type="submit">发布任务</button>
                </form>
              ) : null}
            </div>
          </Panel>
          ) : (
            <Panel title="任务看板" eyebrow={riderEyebrow}>
              <p className="muted">
                你的入队申请尚未通过队长审批，通过后可查看任务看板。
              </p>
            </Panel>
          )}

          {/* Messages */}
          {isApprovedMember ? (
            <Panel title="协作消息" eyebrow={riderEyebrow}>
              <div className="stack">
                <form action={sendMessageAction} className="form-grid">
                  <input name="teamId" type="hidden" value={riderTeam.id} />
                  <input name="returnTo" type="hidden" value={riderCollaborationHref} />
                  <input name="feedbackReturnTo" type="hidden" value={riderCollaborationHref} />
                  <label className="full">
                    发送给
                    <select name="receiverId" required>
                      <option value="">选择队员...</option>
                      {members
                        .filter((m) => m.userId !== registration?.userId && m.status === "APPROVED")
                        .map((m) => (
                          <option key={m.userId ?? m.id} value={m.userId ?? ""}>
                            {m.user?.username ?? "—"}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="full">
                    消息内容
                    <textarea name="content" placeholder="输入消息..." required rows={2} />
                  </label>
                  <button type="submit">发送消息</button>
                </form>
                {messages.length === 0 ? (
                  <p className="muted">暂无消息记录。</p>
                ) : (
                  <div className="stack">
                    <strong>最近消息</strong>
                    {messages.slice(0, 10).map((msg) => (
                      <div className="public-link-card" key={msg.id}>
                        <strong>
                          {msg.sender?.username ?? "—"} → {msg.receiver?.username ?? "—"}
                        </strong>
                        <span>{msg.content}</span>
                        <span className="muted">
                          {new Date(msg.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="协作消息" eyebrow={riderEyebrow}>
              <p className="muted">
                你的入队申请尚未通过队长审批，通过后可查看和发送协作消息。
              </p>
            </Panel>
          )}

          {/* Knowledge Base Downloads */}
          {isApprovedMember ? (
            <Panel title="知识库" eyebrow={riderEyebrow}>
              <div className="stack">
                <p className="muted">
                  聚合队伍的所有作品、提交历史、任务看板和协作消息。比赛结束后可导出完整 ZIP，赛中可以下载最新代码。
                </p>
                <div className="inline-actions">
                  {riderTeam.submissions && riderTeam.submissions.length > 0 ? (
                    <a
                      className="button"
                      href={`/api/knowledge-base/${riderTeam.id}/code`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      下载最新代码
                    </a>
                  ) : (
                    <p className="muted">暂无代码提交记录</p>
                  )}
                  <a
                    className="button"
                    href={`/api/knowledge-base/${riderTeam.id}/export`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    导出知识库 ZIP
                  </a>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title="知识库" eyebrow={riderEyebrow}>
              <p className="muted">
                你的入队申请尚未通过队长审批，通过后可查看知识库。
              </p>
            </Panel>
          )}
        </section>
      );
    }

    case "report":
      return (
        <Panel title="骑手报告" eyebrow={riderEyebrow}>
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
