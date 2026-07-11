import {
  archiveRaceAction,
  approveRegistrationAction,
  assignJudgeToWorkAction,
  createAnnouncementDraftAction,
  disableCAConnectionAction,
  enableCAConnectionAction,
  generateAwardDraftsAction,
  generateReportsAction,
  generateRaceSnapshotAction,
  hideAnnouncementAction,
  markReportReviewedAction,
  hideWorkAction,
  lockWorkAction,
  publishAnnouncementAction,
  publishLeaderboardAction,
  publishRaceAction,
  publishReportAction,
  publishWorkAction,
  rebuildProcessModelsAction,
  rejectRegistrationAction,
  replyFeedbackAction,
  removeJudgeAssignmentAction,
  runCompatibilityHarnessEvalAction,
  runCompatibilityProgressEvalAction,
  updateAnnouncementDraftAction,
  updateAwardDraftAction,
  updateDisplayOptionsAction,
  updateOrganizerCommentAction,
  updateReportDraftAction,
  updateRaceAction,
  updateTeamCommentAction,
  withdrawRegistrationAction,
  withdrawPublishedAwardsAction,
} from "@/app/actions";
import { ErrorNotice, Panel } from "@/app/_components/ary-shared";
import { ReviewReadinessCard } from "@/app/_components/console/review-readiness-card";
import { RiderCodeVisibilityCheckbox } from "@/app/_components/rider-code-visibility-checkbox";
import { getRacePhaseLabel } from "@/lib/race-phase";
import { buildReviewReadinessSummary } from "@/lib/review-readiness-helpers";
import { getAgentLabel } from "@/lib/services/submissions";
import type { RaceListItem } from "@/lib/services/races";

export function OrganizerConsolePageView({
  feedback,
  judgeAssignments,
  judges,
  race,
  raceSlug,
  section,
}: {
  feedback?: { message: string; title: string } | null;
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
    | "announcements"
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
      {feedback ? <ErrorNotice message={feedback.message} title={feedback.title} /> : null}
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
  announcements: "公告",
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

function formatConnectionTimestamp(value: Date | null | undefined) {
  return value ? value.toISOString() : "尚未发生";
}

function getHandshakeStateLabel(value: Date | null | undefined) {
  return value ? "已完成" : "需重新握手";
}

type OrganizerRegistration = RaceListItem["registrations"][number];
type OrganizerConnection =
  NonNullable<OrganizerRegistration["raceProject"]>["caConnections"][number];
type OrganizerSession = OrganizerConnection["sessions"][number];

function parseReviewFlags(reviewFlagJson: string | null | undefined) {
  if (!reviewFlagJson) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(reviewFlagJson);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseAuditDetails(detailsJson: string | null | undefined) {
  if (!detailsJson) {
    return {} as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(detailsJson);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function getLatestSession(connections: OrganizerConnection[]) {
  return connections
    .flatMap((connection) => connection.sessions)
    .sort(
      (left, right) =>
        (right.lastActiveAt ?? right.startedAt ?? new Date(0)).getTime() -
        (left.lastActiveAt ?? left.startedAt ?? new Date(0)).getTime(),
    )[0] as OrganizerSession | undefined;
}

function buildTrustRiskSummary(registration: OrganizerRegistration) {
  const aggregateIngestionStatus =
    registration.raceProject?.aggregateIngestionStatus ?? "NOT_CONFIGURED";
  const connections = registration.raceProject?.caConnections ?? [];
  const internalEvidences = registration.evidences.filter(
    (evidence) => evidence.visibility === "INTERNAL",
  );
  const reviewNeededEvidenceCount = internalEvidences.filter(
    (evidence) => String(evidence.integrityStatus ?? "").toUpperCase() !== "OK",
  ).length;
  const mediumConfidenceEvidenceCount = internalEvidences.filter(
    (evidence) => String(evidence.confidenceLevel ?? "").toUpperCase() === "MEDIUM",
  ).length;
  const reviewFlags = [
    ...new Set(
      internalEvidences.flatMap((evidence) => parseReviewFlags(evidence.reviewFlagJson)),
    ),
  ];
  const latestSession = getLatestSession(connections);
  const latestSessionRiskLevel = String(latestSession?.riskLevel ?? "none").toLowerCase();
  const latestSessionRiskReason = String(latestSession?.riskReason ?? "");
  const disabledConnectionCount = connections.filter(
    (connection) => connection.disabledAt,
  ).length;
  const pendingHandshakeCount = connections.filter(
    (connection) => !connection.handshakeCompletedAt,
  ).length;
  const hasElevatedSessionRisk =
    latestSessionRiskLevel === "medium" || latestSessionRiskLevel === "high";
  const hasEvidenceReview = reviewNeededEvidenceCount > 0;
  const status =
    aggregateIngestionStatus === "FAILED"
      ? "failed"
      : hasEvidenceReview ||
          hasElevatedSessionRisk ||
          disabledConnectionCount > 0 ||
          pendingHandshakeCount > 0
        ? "review_needed"
        : "trusted";
  const evidenceIntegrityLabel = hasEvidenceReview
    ? "review_needed"
    : mediumConfidenceEvidenceCount > 0
      ? "medium_confidence"
      : "trusted";
  const reasonItems = [
    ...reviewFlags,
    ...(hasElevatedSessionRisk &&
    latestSessionRiskReason &&
    latestSessionRiskReason.toLowerCase() !== "none"
      ? [latestSessionRiskReason]
      : []),
    ...(disabledConnectionCount > 0 ? ["disabled_connector"] : []),
    ...(pendingHandshakeCount > 0 ? ["handshake_pending"] : []),
  ];

  return {
    aggregateIngestionStatus,
    disabledConnectionCount,
    evidenceIntegrityLabel,
    latestSessionRiskLevel,
    latestSessionRiskReason,
    mediumConfidenceEvidenceCount,
    pendingHandshakeCount,
    reasonItems: [...new Set(reasonItems)],
    reviewNeededEvidenceCount,
    status,
  };
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

function getTrustRiskStatusLabel(status: string) {
  switch (String(status).trim().toLowerCase()) {
    case "failed":
      return "接入失败";
    case "review_needed":
      return "需要复核";
    case "trusted":
      return "可信";
    default:
      return status;
  }
}

function getEvidenceIntegrityLabel(value: string) {
  switch (String(value).trim().toLowerCase()) {
    case "review_needed":
      return "需要复核";
    case "medium_confidence":
      return "中可信度";
    case "trusted":
      return "可信";
    default:
      return value;
  }
}

function getSessionRiskLevelLabel(level: string) {
  switch (String(level).trim().toLowerCase()) {
    case "none":
      return "无";
    case "low":
      return "低";
    case "medium":
      return "中";
    case "high":
      return "高";
    default:
      return level;
  }
}

function getTrustRiskReasonLabel(reason: string) {
  switch (String(reason).trim().toLowerCase()) {
    case "none":
      return "无";
    case "signature_invalid":
      return "签名无效";
    case "disabled_connector":
      return "连接器已禁用";
    case "handshake_pending":
      return "待完成握手";
    case "source_event_review_needed":
      return "源事件需复核";
    default:
      return reason;
  }
}

function getConnectorAuditResultLabel(result: string) {
  switch (String(result).trim().toLowerCase()) {
    case "accepted":
      return "已接受";
    case "rejected":
      return "已拒绝";
    case "review_needed":
      return "需要复核";
    case "integrity_gap":
      return "完整性缺口";
    default:
      return result;
  }
}

function getRegistrationSecurityAudits({
  race,
  registration,
}: {
  race: RaceListItem;
  registration: OrganizerRegistration;
}) {
  const connectionIds = new Set(
    (registration.raceProject?.caConnections ?? []).map((connection) => connection.id),
  );

  return (race.securityAudits ?? []).filter(
    (audit) =>
      audit.registrationId === registration.id ||
      (audit.caConnectionId ? connectionIds.has(audit.caConnectionId) : false),
  );
}

function buildConnectorAuditOverview({
  race,
  registration,
}: {
  race: RaceListItem;
  registration: OrganizerRegistration;
}) {
  const audits = getRegistrationSecurityAudits({ race, registration });
  const rejectedEventCount = audits.filter((audit) => audit.result === "rejected").length;
  const reviewEventCount = audits.filter(
    (audit) =>
      audit.result === "review_needed" || audit.result === "integrity_gap",
  ).length;
  const recentAudits = audits.slice(0, 5).map((audit) => {
    const details = parseAuditDetails(audit.detailsJson);
    return {
      ...audit,
      connectorId: typeof details.connectorId === "string" ? details.connectorId : "",
    };
  });

  return {
    recentAudits,
    recentEventCount: audits.length,
    rejectedEventCount,
    reviewEventCount,
  };
}

function TrustRiskSummaryCard({
  registration,
}: {
  registration: OrganizerRegistration;
}) {
  const trustRiskSummary = buildTrustRiskSummary(registration);

  return (
    <div className="public-link-card">
      <strong>可信 / 风险摘要</strong>
      <span>状态：{getTrustRiskStatusLabel(trustRiskSummary.status)}</span>
      <span>
        CA 接入：
        {getAggregateIngestionStatusLabel(trustRiskSummary.aggregateIngestionStatus)}
      </span>
      <span>
        证据完整性：{getEvidenceIntegrityLabel(trustRiskSummary.evidenceIntegrityLabel)}
      </span>
      <span>
        最近会话风险：
        {getSessionRiskLevelLabel(trustRiskSummary.latestSessionRiskLevel)}
      </span>
      {trustRiskSummary.latestSessionRiskReason &&
      trustRiskSummary.latestSessionRiskReason.toLowerCase() !== "none" ? (
        <span>
          风险原因：
          {getTrustRiskReasonLabel(trustRiskSummary.latestSessionRiskReason)}
        </span>
      ) : null}
      <span>
        连接器就绪度：已禁用 {trustRiskSummary.disabledConnectionCount}，待握手{" "}
        {trustRiskSummary.pendingHandshakeCount}
      </span>
      {trustRiskSummary.reviewNeededEvidenceCount > 0 ? (
        <span>需复核证据数：{trustRiskSummary.reviewNeededEvidenceCount}</span>
      ) : null}
      {trustRiskSummary.mediumConfidenceEvidenceCount > 0 ? (
        <span>中可信度证据数：{trustRiskSummary.mediumConfidenceEvidenceCount}</span>
      ) : null}
      {trustRiskSummary.reasonItems.length ? (
        <div className="stack">
          {trustRiskSummary.reasonItems.map((reason) => (
            <span key={`${registration.id}-${reason}`}>
              复核原因：{getTrustRiskReasonLabel(reason)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ConnectorAuditOverviewCard({
  race,
  registration,
}: {
  race: RaceListItem;
  registration: OrganizerRegistration;
}) {
  const connectorAuditOverview = buildConnectorAuditOverview({ race, registration });

  return (
    <div className="public-link-card">
      <strong>连接器审计摘要</strong>
      <span>最近审计事件数：{connectorAuditOverview.recentEventCount}</span>
      <span>拒绝事件数：{connectorAuditOverview.rejectedEventCount}</span>
      <span>需复核事件数：{connectorAuditOverview.reviewEventCount}</span>
      {connectorAuditOverview.recentAudits.length ? (
        <div className="stack">
          {connectorAuditOverview.recentAudits.map((audit) => (
            <div className="public-link-card" key={`${registration.id}-${audit.id}`}>
              <span>
                审计事件：{audit.createdAt.toISOString()} {audit.action}{" "}
                {getConnectorAuditResultLabel(audit.result)}
              </span>
              {audit.reason ? <span>审计原因：{audit.reason}</span> : null}
              {audit.connectorId ? (
                <span>审计连接器：{audit.connectorId}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <span>暂无连接器审计事件。</span>
      )}
    </div>
  );
}

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
                <dd>{getRacePhaseLabel(race.phase)}</dd>
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
              <a className="button-secondary" href={`/console/screen/${raceSlug}/jumbotron`}>
                大屏控制台
              </a>
            </div>
            <p className="muted">
              主办方可从这里进入大屏控制台，选择当前赛事需要的展示模式。
            </p>
          </Panel>
        </section>
      );
    case "settings":
      return (
        <section className="grid">
          <Panel title="赛事发布" eyebrow="设置">
            <div className="stack">
              <span>当前阶段：{getRacePhaseLabel(race.phase)}</span>
              <p className="muted">
                发布后赛事会进入公开页，并按时间自动推进到报名、进行和赛后阶段。
              </p>
              <form action={publishRaceAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <input name="raceSlug" type="hidden" value={raceSlug} />
                <input
                  name="returnTo"
                  type="hidden"
                  value={`/console/races/${raceSlug}/organizer/settings`}
                />
                <button disabled={race.phase !== "draft"} type="submit">
                  发布赛事
                </button>
              </form>
            </div>
          </Panel>

          <Panel title="赛事内容" eyebrow="设置">
            <form action={updateRaceAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <input name="raceSlug" type="hidden" value={raceSlug} />
              <input
                name="returnTo"
                type="hidden"
                value={`/console/races/${raceSlug}/organizer/settings`}
              />
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
              <input name="raceSlug" type="hidden" value={raceSlug} />
              <input
                name="returnTo"
                type="hidden"
                value={`/console/races/${raceSlug}/organizer/settings`}
              />
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
                  {String(registration.status).toUpperCase() === "SUBMITTED" ? (
                    <div className="button-row-inline">
                      <form action={approveRegistrationAction}>
                        <input
                          name="registrationId"
                          type="hidden"
                          value={registration.id}
                        />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/registrations`}
                        />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <button type="submit">批准报名</button>
                      </form>
                      <form action={rejectRegistrationAction}>
                        <input
                          name="registrationId"
                          type="hidden"
                          value={registration.id}
                        />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/registrations`}
                        />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <button type="submit">拒绝报名</button>
                      </form>
                    </div>
                  ) : String(registration.status).toUpperCase() === "APPROVED" ? (
                    <div className="button-row-inline">
                      <form action={withdrawRegistrationAction}>
                        <input
                          name="registrationId"
                          type="hidden"
                          value={registration.id}
                        />
                        <input
                          name="feedbackReturnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/registrations`}
                        />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <button type="submit">标记退赛</button>
                      </form>
                    </div>
                  ) : null}
                  <ReviewReadinessCard
                    summary={buildReviewReadinessSummary({
                      aggregateIngestionStatus:
                        registration.raceProject?.aggregateIngestionStatus ??
                        "NOT_CONFIGURED",
                      evidences: registration.evidences,
                      hasWork: Boolean(registration.work),
                      phase: race.phase,
                      workSummary: registration.work?.summary,
                      workTitle: registration.work?.title,
                    })}
                  />
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
                    <span>状态：{getRegistrationStatusLabel(registration.status)}</span>
                    <span>
                      聚合状态：
                      {registration.raceProject
                        ? getAggregateIngestionStatusLabel(
                            registration.raceProject.aggregateIngestionStatus,
                          )
                        : "未生成"}
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
                    <TrustRiskSummaryCard registration={registration} />
                    <ConnectorAuditOverviewCard
                      race={race}
                      registration={registration}
                    />
                    {registration.raceProject?.caConnections.length ? (
                      <div className="stack">
                        {registration.raceProject.caConnections.map((connection) => (
                          <div className="public-link-card" key={connection.id}>
                            <strong>连接器安全控制</strong>
                            <span>连接器 ID：{connection.connectorId}</span>
                            <span>CA 类型：{connection.caType}</span>
                            <span>
                              接入状态：
                              {getAggregateIngestionStatusLabel(connection.ingestionStatus)}
                            </span>
                            <span>密钥版本：{connection.secretVersion}</span>
                            <span>
                              最近轮换时间：
                              {formatConnectionTimestamp(connection.secretRotatedAt)}
                            </span>
                            <span>
                              握手状态：
                              {getHandshakeStateLabel(connection.handshakeCompletedAt)}
                            </span>
                            <span>是否禁用：{connection.disabledAt ? "是" : "否"}</span>
                            {connection.disabledAt ? (
                              <span>
                                禁用时间：
                                {formatConnectionTimestamp(connection.disabledAt)}
                              </span>
                            ) : null}
                            <span>
                              禁用原因：{connection.disabledReason || "正常"}
                            </span>
                            <span>会话数：{connection.sessions.length}</span>
                            <form
                              action={disableCAConnectionAction}
                              className="form-grid"
                            >
                              <input
                                name="caConnectionId"
                                type="hidden"
                                value={connection.id}
                              />
                              <input name="raceId" type="hidden" value={race.id} />
                              <input name="raceSlug" type="hidden" value={raceSlug} />
                              <input
                                name="returnTo"
                                type="hidden"
                                value={`/console/races/${raceSlug}/organizer/ca-status`}
                              />
                              <label>
                                禁用原因
                                <input
                                  defaultValue={
                                    connection.disabledReason || "手动安全冻结"
                                  }
                                  name="reason"
                                  required
                                />
                              </label>
                              <button type="submit">禁用连接器</button>
                            </form>
                            {connection.disabledAt ? (
                              <form
                                action={enableCAConnectionAction}
                                className="button-row-inline"
                              >
                                <input
                                  name="caConnectionId"
                                  type="hidden"
                                  value={connection.id}
                                />
                                <input name="raceId" type="hidden" value={race.id} />
                                <input
                                  name="raceSlug"
                                  type="hidden"
                                  value={raceSlug}
                                />
                                <input
                                  name="returnTo"
                                  type="hidden"
                                  value={`/console/races/${raceSlug}/organizer/ca-status`}
                                />
                                <button type="submit">启用连接器</button>
                              </form>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
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
                <input name="raceSlug" type="hidden" value={raceSlug} />
                <input
                  name="returnTo"
                  type="hidden"
                  value={`/console/races/${raceSlug}/organizer/ca-status`}
                />
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
                      <span>可见性：{registration.work!.visibility}</span>
                      <div className="button-row-inline">
                        {String(registration.work!.visibility).toUpperCase() === "PUBLIC" &&
                        String(registration.work!.status).toUpperCase() !== "HIDDEN" ? (
                          <form action={hideWorkAction}>
                            <input
                              name="workId"
                              type="hidden"
                              value={registration.work!.id}
                            />
                            <input
                              name="returnTo"
                              type="hidden"
                              value={`/console/races/${raceSlug}/organizer/works`}
                            />
                            <input name="raceSlug" type="hidden" value={raceSlug} />
                            <button type="submit">隐藏作品</button>
                          </form>
                        ) : (
                          <form action={publishWorkAction}>
                            <input
                              name="workId"
                              type="hidden"
                              value={registration.work!.id}
                            />
                            <input
                              name="returnTo"
                              type="hidden"
                              value={`/console/races/${raceSlug}/organizer/works`}
                            />
                            <input name="raceSlug" type="hidden" value={raceSlug} />
                            <button type="submit">公开作品</button>
                          </form>
                        )}
                        {String(registration.work!.status).toUpperCase() !== "LOCKED" ? (
                          <form action={lockWorkAction}>
                            <input
                              name="workId"
                              type="hidden"
                              value={registration.work!.id}
                            />
                            <input
                              name="returnTo"
                              type="hidden"
                              value={`/console/races/${raceSlug}/organizer/works`}
                            />
                            <input name="raceSlug" type="hidden" value={raceSlug} />
                            <button type="submit">锁定作品</button>
                          </form>
                        ) : null}
                      </div>
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
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/console/races/${raceSlug}/organizer/judges`}
                  />
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
                {judgeAssignments.find(
                  (assignment) => assignment.work.id === registration.work!.id,
                ) ? (
                  <form action={removeJudgeAssignmentAction} className="button-row-inline">
                    <input
                      name="assignmentId"
                      type="hidden"
                      value={
                        judgeAssignments.find(
                          (assignment) => assignment.work.id === registration.work!.id,
                        )!.id
                      }
                    />
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <input
                      name="returnTo"
                      type="hidden"
                      value={`/console/races/${raceSlug}/organizer/judges`}
                    />
                    <button type="submit">移除分配</button>
                  </form>
                ) : null}
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

          <Panel title="兼容 Runner 工具" eyebrow="兼容链路">
            <div className="stack">
              <p className="muted">
                正式榜单发布应基于 Award / Leaderboard 与评委提交的 JudgingRecord。
                以下按钮只保留给兼容 Runner 评估链路，不是当前主裁决路径。
              </p>
              <div className="button-row-inline">
                <form action={runCompatibilityProgressEvalAction}>
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/console/races/${raceSlug}/organizer/judging`}
                  />
                  <button type="submit">运行兼容过程评估</button>
                </form>
                <form action={runCompatibilityHarnessEvalAction}>
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/console/races/${raceSlug}/organizer/judging`}
                  />
                  <button className="button-secondary" type="submit">
                    运行兼容 Harness 评估
                  </button>
                </form>
              </div>
            </div>
          </Panel>
        </>
      );
    case "announcements":
      return (
        <section className="grid">
          <Panel title="创建公告草稿" eyebrow="公告">
            <div className="stack">
              <p className="muted">
                赛事公告是独立于 Report / Award 的公开展示内容。先以草稿形式保存，确认后再发布到 Live Hall 与 Announcement Display。
              </p>
              <form action={createAnnouncementDraftAction} className="form-grid">
                <input name="raceId" type="hidden" value={race.id} />
                <input name="raceSlug" type="hidden" value={raceSlug} />
                <input
                  name="returnTo"
                  type="hidden"
                  value={`/console/races/${raceSlug}/organizer/announcements`}
                />
                <label className="full">
                  标题
                  <input name="title" type="text" />
                </label>
                <label className="full">
                  正文
                  <textarea name="body" rows={5} />
                </label>
                <button type="submit">创建公告草稿</button>
              </form>
              <a className="button-secondary" href={`/screen/${raceSlug}/announcement`}>
                打开 Announcement Display
              </a>
            </div>
          </Panel>
          <Panel title="公告草稿" eyebrow="公告">
            <div className="stack">
              {race.announcements?.filter((announcement) => announcement.visibility !== "PUBLIC")
                .length ? (
                race.announcements
                  .filter((announcement) => announcement.visibility !== "PUBLIC")
                  .map((announcement) => (
                    <div className="public-link-card" key={`draft-${announcement.id}`}>
                      <strong>{announcement.title}</strong>
                      <span>{announcement.body}</span>
                      <form action={updateAnnouncementDraftAction} className="form-grid">
                        <input name="announcementId" type="hidden" value={announcement.id} />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/announcements`}
                        />
                        <label className="full">
                          标题
                          <input defaultValue={announcement.title} name="title" type="text" />
                        </label>
                        <label className="full">
                          正文
                          <textarea defaultValue={announcement.body} name="body" rows={5} />
                        </label>
                        <button type="submit">保存公告草稿</button>
                      </form>
                      <form action={publishAnnouncementAction}>
                        <input name="announcementId" type="hidden" value={announcement.id} />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/announcements`}
                        />
                        <button type="submit">发布公告</button>
                      </form>
                    </div>
                  ))
              ) : (
                <p className="muted">当前还没有公告草稿。</p>
              )}
            </div>
          </Panel>
          <Panel title="已发布公告" eyebrow="公告">
            <div className="stack">
              {race.announcements?.filter((announcement) => announcement.visibility === "PUBLIC")
                .length ? (
                race.announcements
                  .filter((announcement) => announcement.visibility === "PUBLIC")
                  .map((announcement) => (
                    <div className="public-link-card" key={`published-${announcement.id}`}>
                      <strong>{announcement.title}</strong>
                      <span>{announcement.body}</span>
                      <span>
                        发布时间：
                        {announcement.publishedAt?.toISOString() ?? "not yet"}
                      </span>
                      <form action={hideAnnouncementAction}>
                        <input name="announcementId" type="hidden" value={announcement.id} />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/announcements`}
                        />
                        <button type="submit">隐藏公告</button>
                      </form>
                    </div>
                  ))
              ) : (
                <p className="muted">当前还没有已发布公告。</p>
              )}
            </div>
          </Panel>
        </section>
      );
    case "awards":
      return (
        <section className="grid">
          <Panel title="正式榜单发布" eyebrow="奖项">
            <div className="stack">
              <p className="muted">
                正式榜单发布应基于评委已提交的 JudgingRecord，并以 Award / Leaderboard 作为公开结果事实源。当前可以先生成 Award 草稿，再发布正式榜单；已发布榜单也可以撤回回草稿状态。
              </p>
              <div className="button-row-inline">
                <form action={generateAwardDraftsAction}>
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/console/races/${raceSlug}/organizer/awards`}
                  />
                  <button type="submit">生成 Award 草稿</button>
                </form>
                <form action={publishLeaderboardAction}>
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/console/races/${raceSlug}/organizer/awards`}
                  />
                  <button type="submit">按 JudgingRecord 发布正式榜单</button>
                </form>
                <form action={withdrawPublishedAwardsAction}>
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value={`/console/races/${raceSlug}/organizer/awards`}
                  />
                  <button type="submit">撤回已发布榜单</button>
                </form>
              </div>
            </div>
          </Panel>
          <Panel title="奖项草稿" eyebrow="奖项">
            <div className="stack">
              {race.awards.filter((award) => !award.publishedAt).length ? (
                race.awards
                  .filter((award) => !award.publishedAt)
                  .map((award) => (
                    <div className="public-link-card" key={`draft-${award.id}`}>
                      <strong>{award.awardName}</strong>
                      <span>排名：{award.rank}</span>
                      <span>骑手：{award.registration.user.username}</span>
                      <span>{award.work?.title ?? "未关联作品"}</span>
                      <span>{award.decisionReason}</span>
                      <form action={updateAwardDraftAction} className="form-grid">
                        <input name="awardId" type="hidden" value={award.id} />
                        <input name="raceSlug" type="hidden" value={raceSlug} />
                        <input
                          name="returnTo"
                          type="hidden"
                          value={`/console/races/${raceSlug}/organizer/awards`}
                        />
                        <label className="full">
                          奖项名称
                          <input
                            defaultValue={award.awardName}
                            name="awardName"
                            type="text"
                          />
                        </label>
                        <label>
                          排名
                          <input defaultValue={award.rank} min={1} name="rank" type="number" />
                        </label>
                        <label className="full">
                          决策说明
                          <textarea
                            defaultValue={award.decisionReason}
                            name="decisionReason"
                            rows={4}
                          />
                        </label>
                        <button type="submit">保存 Award 草稿</button>
                      </form>
                    </div>
                  ))
              ) : (
                <p className="muted">当前还没有 Award 草稿。</p>
              )}
            </div>
          </Panel>
          <Panel title="已发布奖项" eyebrow="奖项">
            {race.awards.filter((award) => award.publishedAt).length === 0 ? (
              race.leaderboardEntries.length === 0 ? (
                <p className="muted">当前还没有已发布奖项。</p>
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
                {race.awards
                  .filter((award) => award.publishedAt)
                  .map((award) => (
                    <div className="public-link-card" key={`published-${award.id}`}>
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
          <Panel title="兼容 Skill Signals" eyebrow="兼容链路">
            {race.harnessEntries.length === 0 ? (
              <p className="muted">当前还没有兼容 skill-signal 行。</p>
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
          <Panel title="Report Controls" eyebrow="报告">
            <div className="stack">
              <p className="muted">
                閲嶆柊鐢熸垚浼氳鐩栨湭鍙戝竷鎶ュ憡鑽夌锛屽苟鎶婄姸鎬侀噸缃负 GENERATED銆?
              </p>
              <form action={generateReportsAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <input name="raceSlug" type="hidden" value={raceSlug} />
                <input
                  name="returnTo"
                  type="hidden"
                  value={`/console/races/${raceSlug}/organizer/reports`}
                />
                <button type="submit">生成报告草稿</button>
              </form>
              {race.reports
                .filter((report) => report.status !== "PUBLISHED")
                .map((report) => (
                  <div className="public-link-card" key={`edit-${report.id}`}>
                    <strong>{report.title}</strong>
                    <span>{report.type}</span>
                    <span>{report.status}</span>
                    <form action={updateReportDraftAction} className="form-grid">
                      <input name="reportId" type="hidden" value={report.id} />
                      <input name="raceSlug" type="hidden" value={raceSlug} />
                      <input
                        name="returnTo"
                        type="hidden"
                        value={`/console/races/${raceSlug}/organizer/reports`}
                      />
                      <label className="full">
                        鏍囬
                        <input defaultValue={report.title} name="title" type="text" />
                      </label>
                      <label className="full">
                        鎽樿
                        <textarea defaultValue={report.summary} name="summary" rows={3} />
                      </label>
                      <label className="full">
                        姝ｆ枃
                        <textarea defaultValue={report.body} name="body" rows={8} />
                      </label>
                      <button type="submit">淇濆瓨鎶ュ憡鑽夌</button>
                    </form>
                    <form action={markReportReviewedAction} className="button-row-inline">
                      <input name="reportId" type="hidden" value={report.id} />
                      <input name="raceSlug" type="hidden" value={raceSlug} />
                      <input
                        name="returnTo"
                        type="hidden"
                        value={`/console/races/${raceSlug}/organizer/reports`}
                      />
                      <button type="submit">鏍囪涓?reviewed</button>
                    </form>
                    {report.type !== "RIDER_REPORT" && report.status !== "REVIEWED" ? (
                      <p className="muted">鍏堟爣璁颁负 reviewed 鍐嶅彂甯冨叕寮€鎶ュ憡銆?</p>
                    ) : null}
                  </div>
                ))}
              {race.reports
                .filter(
                  (report) =>
                    report.type !== "RIDER_REPORT" && report.status !== "PUBLISHED",
                )
                .map((report) => (
                  <form action={publishReportAction} key={`publish-${report.id}`}>
                    <input name="reportId" type="hidden" value={report.id} />
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <input
                      name="returnTo"
                      type="hidden"
                      value={`/console/races/${raceSlug}/organizer/reports`}
                    />
                    <button disabled={report.status !== "REVIEWED"} type="submit">
                      {report.type === "RACE_REPORT"
                        ? "发布 race_report"
                        : "发布 review_summary"}
                    </button>
                  </form>
                ))}
            </div>
          </Panel>
          <Panel title="Organizer Report Notes" eyebrow="报告">
            <form action={updateOrganizerCommentAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <input name="raceSlug" type="hidden" value={raceSlug} />
              <input
                name="returnTo"
                type="hidden"
                value={`/console/races/${raceSlug}/organizer/reports`}
              />
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
              {race.teams.length === 0 && race.teamComments.length === 0 ? (
                <p className="muted">暂时还没有可编辑的团队评语。</p>
              ) : null}
              {(race.teams.length > 0
                ? race.teams
                : race.teamComments.map((comment) => comment.team)
              ).map((team) => {
                const existingComment = race.teamComments.find(
                  (comment) => comment.teamId === team.id,
                );

                return (
                  <div className="public-link-card" key={`team-comment-${team.id}`}>
                    <strong>{team.name}</strong>
                    <form action={updateTeamCommentAction} className="form-grid">
                      <input name="raceId" type="hidden" value={race.id} />
                      <input name="raceSlug" type="hidden" value={raceSlug} />
                      <input name="teamId" type="hidden" value={team.id} />
                      <input
                        name="returnTo"
                        type="hidden"
                        value={`/console/races/${raceSlug}/organizer/reports`}
                      />
                      <label className="full">
                        团队评语
                        <textarea
                          defaultValue={existingComment?.content ?? ""}
                          name="content"
                          rows={4}
                        />
                      </label>
                      <button type="submit">保存团队评语</button>
                    </form>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel title="选手反馈" eyebrow="报告">
            <div className="stack">
              {race.feedbackThreads.length === 0 ? (
                <p className="muted">暂时还没有选手反馈线程。</p>
              ) : (
                race.feedbackThreads.map((thread) => (
                  <div className="public-link-card" key={thread.id}>
                    <strong>
                      {thread.team?.name
                        ? `反馈线程 / ${thread.team.name}`
                        : "反馈线程"}
                    </strong>
                    <span>状态：{thread.status}</span>
                    <div className="stack">
                      {thread.messages.map((message) => (
                        <div className="public-link-card" key={message.id}>
                          <strong>{message.author.username}</strong>
                          <span>{message.content}</span>
                        </div>
                      ))}
                    </div>
                    <form action={replyFeedbackAction} className="form-grid">
                      <input name="threadId" type="hidden" value={thread.id} />
                      <input name="raceSlug" type="hidden" value={raceSlug} />
                      <input
                        name="returnTo"
                        type="hidden"
                        value={`/console/races/${raceSlug}/organizer/reports`}
                      />
                      <label className="full">
                        回复内容
                        <textarea
                          defaultValue="已收到你的反馈，我们会在下一轮评审或展示前同步处理。"
                          name="content"
                          rows={3}
                        />
                      </label>
                      <label className="checkbox">
                        <input name="markResolved" type="checkbox" />
                        回复后标记为已解决
                      </label>
                      <button type="submit">发送回复</button>
                    </form>
                  </div>
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
                <input name="raceSlug" type="hidden" value={raceSlug} />
                <input
                  name="returnTo"
                  type="hidden"
                  value={`/console/races/${raceSlug}/organizer/maintenance`}
                />
                <button type="submit">生成大屏快照</button>
              </form>
            </div>
            <p className="muted">
              大屏控制台当前由管理员代理访问；主办方可先生成快照，再由管理员进入大屏控制台联调展示。
            </p>
          </Panel>
          <Panel title="危险操作" eyebrow="维护">
            <form action={archiveRaceAction}>
              <input name="raceId" type="hidden" value={race.id} />
              <input name="raceSlug" type="hidden" value={raceSlug} />
              <input
                name="returnTo"
                type="hidden"
                value={`/console/races/${raceSlug}/organizer/maintenance`}
              />
              <button className="button-danger" type="submit">
                归档赛事
              </button>
            </form>
            <p className="muted">
              归档后会保留赛果、作品与复盘资产，并把赛事状态切换为已归档。
            </p>
          </Panel>
        </section>
      );
  }
}

