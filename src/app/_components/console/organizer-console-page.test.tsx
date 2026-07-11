import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizerConsolePageView } from "./organizer-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(
  overrides?: Partial<RaceListItem> & { securityAudits?: Array<unknown> },
): RaceListItem {
  return {
    awards: [],
    displayHighlightCount: 3,
    displayShowOrganizerComment: false,
    displayShowRiderCode: false,
    displayShowTopHighlights: false,
    displayShowTrainingData: false,
    feedbackThreads: [],
    harnessEntries: [],
    highlights: [],
    id: "race_active",
    organizerComment: "",
    phase: "active",
    projections: [],
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    registrations: [],
    reports: [],
    runnerTasks: [],
    securityAudits: [],
    submissions: [],
    teamComments: [],
    teams: [],
    title: "Sorting Challenge",
    leaderboardEntries: [],
    ...overrides,
  } as unknown as RaceListItem;
}

test("organizer console avoids exposing legacy compatibility wording in ca-status, judging, awards, and reports sections", () => {
  const html =
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="ca-status"
      />,
    ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="judging"
      />,
    ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="awards"
      />,
    ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="reports"
      />,
    );

  assert.doesNotMatch(html, /Legacy Compatibility/);
  assert.doesNotMatch(html, /Legacy Harness Compatibility/);
  assert.doesNotMatch(html, /Organizer Summary Fallback/);
  assert.doesNotMatch(html, /current live display compatibility layer/);
  assert.match(html, /Projection \/ Display Status/);
  assert.match(html, /兼容 Runner 工具/);
  assert.match(html, /兼容 Skill Signals/);
  assert.match(html, /正式榜单发布应基于 Award \/ Leaderboard/);
  assert.match(html, /Organizer Report Notes/);
  assert.doesNotMatch(html, /Process Evaluation/);
  assert.doesNotMatch(html, /Published Skill Signals/);
});

test("organizer judging section carries returnTo for compatibility runner controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      section="judging"
    />,
  );

  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/races\/race_active--sorting-challenge\/organizer\/judging"/,
  );
  assert.match(
    html,
    /type="hidden" name="raceSlug" value="race_active--sorting-challenge"/,
  );
});

test("organizer console overview and settings keep current localized copy", () => {
  const html =
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="overview"
      />,
    ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="settings"
      />,
    );

  assert.match(html, /主办方视图/);
  assert.match(html, /赛事概览/);
  assert.match(html, /下一步入口/);
  assert.match(html, /赛事内容/);
  assert.match(html, /显示选项/);
  assert.match(html, /赛事发布/);
  assert.match(html, /发布赛事/);
  assert.match(html, /保存赛事内容/);
  assert.match(html, /保存显示选项/);
  assert.match(html, /大屏控制台/);
  assert.match(html, /比赛中/);
  assert.match(html, /主办方可从这里进入大屏控制台，选择当前赛事需要的展示模式。/);
  assert.doesNotMatch(html, /Organizer View/);
  assert.doesNotMatch(html, /Race Summary/);
  assert.doesNotMatch(html, /Next Links/);
  assert.doesNotMatch(html, /Settings/);
  assert.doesNotMatch(html, /Save Race Content/);
  assert.doesNotMatch(html, /Save Display Options/);
  assert.doesNotMatch(html, />active</);
});

test("organizer console surfaces per-connector security controls in ca-status", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_1",
            raceProject: {
              aggregateIngestionStatus: "CONNECTED",
              caConnections: [
                {
                  caProjectId: "proj_1",
                  caType: "CODEX",
                  connectorId: "codex_connector_01",
                  disabledAt: null,
                  disabledReason: "",
                  handshakeCompletedAt: new Date("2026-06-20T10:15:00Z"),
                  id: "conn_1",
                  ingestionStatus: "ACTIVE",
                  secretRotatedAt: new Date("2026-06-20T10:00:00Z"),
                  secretVersion: 2,
                  sessions: [{ id: "session_1" }],
                },
                {
                  caProjectId: "proj_2",
                  caType: "OTHER",
                  connectorId: "codex_connector_02",
                  disabledAt: new Date("2026-06-20T11:00:00Z"),
                  disabledReason: "manual freeze",
                  handshakeCompletedAt: null,
                  id: "conn_2",
                  ingestionStatus: "CONNECTED",
                  secretRotatedAt: new Date("2026-06-20T10:30:00Z"),
                  secretVersion: 4,
                  sessions: [],
                },
              ],
            },
            status: "approved",
            user: { username: "rider01" },
          },
        ],
      })}
      raceSlug="race_active--sorting-challenge"
      section="ca-status"
    />,
  );

  assert.match(html, /连接器安全控制/);
  assert.match(html, /接入状态：活跃中/);
  assert.match(html, /密钥版本：2/);
  assert.match(html, /最近轮换时间：2026-06-20T10:00:00.000Z/);
  assert.match(html, /握手状态：已完成/);
  assert.match(html, /密钥版本：4/);
  assert.match(html, /禁用时间：2026-06-20T11:00:00.000Z/);
  assert.match(html, /禁用原因：manual freeze/);
  assert.match(html, /禁用连接器/);
  assert.match(html, /启用连接器/);
  assert.doesNotMatch(html, /Connector Security Controls/);
  assert.doesNotMatch(html, /Secret Version:/);
  assert.doesNotMatch(html, /Handshake State:/);
  assert.match(html, /name="reason"/);
});

test("organizer console surfaces registration-level trust and risk summaries in ca-status", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_failed",
            raceProject: {
              aggregateIngestionStatus: "FAILED",
              caConnections: [],
            },
            status: "approved",
            user: { username: "rider_failed" },
          },
          {
            evidences: [
              {
                confidenceLevel: "MEDIUM",
                id: "evidence_review",
                integrityStatus: "REVIEW_NEEDED",
                reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
                visibility: "INTERNAL",
              },
            ],
            id: "reg_review",
            raceProject: {
              aggregateIngestionStatus: "CONNECTED",
              caConnections: [
                {
                  caProjectId: "proj_review",
                  caType: "CODEX",
                  connectorId: "codex_connector_review",
                  disabledAt: new Date("2026-06-20T11:00:00Z"),
                  disabledReason: "manual freeze",
                  handshakeCompletedAt: null,
                  id: "conn_review",
                  ingestionStatus: "CONNECTED",
                  secretRotatedAt: new Date("2026-06-20T10:30:00Z"),
                  secretVersion: 4,
                  sessions: [
                    {
                      id: "session_review",
                      lastActiveAt: new Date("2026-06-20T12:00:00Z"),
                      riskLevel: "high",
                      riskReason: "signature_invalid",
                      startedAt: new Date("2026-06-20T11:45:00Z"),
                    },
                  ],
                },
              ],
            },
            status: "approved",
            user: { username: "rider_review" },
          },
          {
            evidences: [
              {
                confidenceLevel: "HIGH",
                id: "evidence_trusted",
                integrityStatus: "OK",
                reviewFlagJson: JSON.stringify([]),
                visibility: "INTERNAL",
              },
            ],
            id: "reg_trusted",
            raceProject: {
              aggregateIngestionStatus: "ACTIVE",
              caConnections: [
                {
                  caProjectId: "proj_trusted",
                  caType: "CODEX",
                  connectorId: "codex_connector_trusted",
                  disabledAt: null,
                  disabledReason: "",
                  handshakeCompletedAt: new Date("2026-06-20T10:15:00Z"),
                  id: "conn_trusted",
                  ingestionStatus: "ACTIVE",
                  secretRotatedAt: new Date("2026-06-20T10:00:00Z"),
                  secretVersion: 2,
                  sessions: [
                    {
                      id: "session_trusted",
                      lastActiveAt: new Date("2026-06-20T10:20:00Z"),
                      riskLevel: "low",
                      riskReason: "none",
                      startedAt: new Date("2026-06-20T10:00:00Z"),
                    },
                  ],
                },
              ],
            },
            status: "approved",
            user: { username: "rider_trusted" },
          },
        ],
      })}
      raceSlug="race_active--sorting-challenge"
      section="ca-status"
    />,
  );

  assert.match(html, /可信 \/ 风险摘要/);
  assert.match(html, /状态：接入失败/);
  assert.match(html, /状态：需要复核/);
  assert.match(html, /状态：可信/);
  assert.match(html, /CA 接入：接入失败/);
  assert.match(html, /证据完整性：需要复核/);
  assert.match(html, /最近会话风险：高/);
  assert.match(html, /风险原因：签名无效/);
  assert.match(html, /连接器就绪度：已禁用 1，待握手 1/);
  assert.match(html, /中可信度证据数：1/);
  assert.match(html, /复核原因：源事件需复核/);
  assert.doesNotMatch(html, /Trust \/ Risk Summary/);
  assert.doesNotMatch(html, /Status Badge:/);
  assert.doesNotMatch(html, /CA Ingestion:/);
});

test("organizer console surfaces review readiness prompts in registrations", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        phase: "judging",
        registrations: [
          {
            evidences: [],
            id: "reg_missing",
            raceProject: {
              aggregateIngestionStatus: "NOT_CONFIGURED",
              caConnections: [],
            },
            status: "approved",
            user: { username: "rider_missing" },
            work: null,
          },
          {
            evidences: [
              {
                confidenceLevel: "HIGH",
                id: "evidence_ok",
                integrityStatus: "OK",
                reviewFlagJson: JSON.stringify([]),
                visibility: "INTERNAL",
              },
            ],
            id: "reg_ready",
            raceProject: {
              aggregateIngestionStatus: "ACTIVE",
              caConnections: [],
            },
            status: "approved",
            user: { username: "rider_ready" },
            work: {
              summary: "完整作品摘要",
              title: "Ready Work",
            },
          },
        ],
      })}
      raceSlug="race_active--sorting-challenge"
      section="registrations"
    />,
  );

  assert.match(html, /评审前风险提示/);
  assert.match(html, /状态：需要复核/);
  assert.match(html, /CA 接入：未接入/);
  assert.match(html, /复核原因：未接入 CA（高）/);
  assert.match(html, /复核原因：缺少内部证据（高）/);
  assert.match(html, /复核原因：缺少作品（高）/);
  assert.match(html, /复核原因：无/);
});

test("organizer console shows approve and reject actions for submitted registrations", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_submitted",
            raceProject: null,
            status: "SUBMITTED",
            user: { username: "rider_pending" },
            userId: "rider_pending",
            work: null,
          },
        ],
        teams: [],
      })}
      raceSlug="race_active--sorting-challenge"
      section="registrations"
    />,
  );

  assert.match(html, /批准报名/);
  assert.match(html, /拒绝报名/);
  assert.match(html, /name="registrationId"/);
  assert.match(
    html,
    /type="hidden" name="raceSlug" value="race_active--sorting-challenge"/,
  );
});

test("organizer console shows withdraw action for approved registrations", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_approved",
            raceProject: {
              aggregateIngestionStatus: "ACTIVE",
              caConnections: [],
            },
            status: "APPROVED",
            user: { username: "rider_active" },
            userId: "rider_active",
            work: null,
          },
        ],
        teams: [],
      })}
      raceSlug="race_active--sorting-challenge"
      section="registrations"
    />,
  );

  assert.match(html, /标记退赛/);
});

test("organizer judges section shows remove action for existing assignments", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[
        {
          assignedAt: new Date("2026-07-11T08:00:00Z"),
          assignedByUser: { username: "organizer_demo" },
          id: "assignment_1",
          judge: { username: "judge_demo" },
          judgingRecord: null,
          work: { id: "work_1", title: "Assigned Work" },
        },
      ]}
      judges={[{ id: "judge_1", username: "judge_demo" }]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_work_1",
            raceProject: null,
            status: "APPROVED",
            user: { username: "rider_one" },
            userId: "rider_one",
            work: {
              id: "work_1",
              title: "Assigned Work",
            },
          },
        ],
      })}
      raceSlug="race_active--sorting-challenge"
      section="judges"
    />,
  );

  assert.match(html, /保存分配/);
  assert.match(html, /移除分配/);
  assert.match(html, /name="assignmentId"/);
});

test("organizer works section shows work visibility lifecycle controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_work_public",
            raceProject: null,
            status: "APPROVED",
            user: { username: "rider_public" },
            userId: "rider_public",
            work: {
              id: "work_public",
              status: "SUBMITTED",
              title: "Public Work",
              visibility: "PUBLIC",
            },
          },
          {
            evidences: [],
            id: "reg_work_hidden",
            raceProject: null,
            status: "APPROVED",
            user: { username: "rider_hidden" },
            userId: "rider_hidden",
            work: {
              id: "work_hidden",
              status: "HIDDEN",
              title: "Hidden Work",
              visibility: "PRIVATE",
            },
          },
        ],
      })}
      raceSlug="race_active--sorting-challenge"
      section="works"
    />,
  );

  assert.match(html, /可见性：PUBLIC/);
  assert.match(html, /可见性：PRIVATE/);
  assert.match(html, /隐藏作品/);
  assert.match(html, /公开作品/);
  assert.match(html, /锁定作品/);
});

test("organizer console surfaces connector audit overviews in ca-status", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        registrations: [
          {
            evidences: [],
            id: "reg_audit",
            raceProject: {
              aggregateIngestionStatus: "ACTIVE",
              caConnections: [
                {
                  caProjectId: "proj_audit",
                  caType: "CODEX",
                  connectorId: "codex_connector_audit",
                  disabledAt: null,
                  disabledReason: "",
                  handshakeCompletedAt: new Date("2026-06-20T10:15:00Z"),
                  id: "conn_audit",
                  ingestionStatus: "ACTIVE",
                  secretRotatedAt: new Date("2026-06-20T10:00:00Z"),
                  secretVersion: 2,
                  sessions: [],
                },
              ],
            },
            status: "approved",
            user: { username: "rider_audit" },
          },
          {
            evidences: [],
            id: "reg_empty",
            raceProject: {
              aggregateIngestionStatus: "CONNECTED",
              caConnections: [
                {
                  caProjectId: "proj_empty",
                  caType: "OTHER",
                  connectorId: "codex_connector_empty",
                  disabledAt: null,
                  disabledReason: "",
                  handshakeCompletedAt: null,
                  id: "conn_empty",
                  ingestionStatus: "CONNECTED",
                  secretRotatedAt: new Date("2026-06-20T10:30:00Z"),
                  secretVersion: 1,
                  sessions: [],
                },
              ],
            },
            status: "approved",
            user: { username: "rider_empty" },
          },
        ],
        securityAudits: [
          {
            action: "ca_connection.disabled",
            actorKind: "USER",
            caConnectionId: "conn_audit",
            createdAt: new Date("2026-06-20T12:10:00Z"),
            detailsJson: JSON.stringify({
              connectorId: "codex_connector_audit",
              reason: "manual freeze",
            }),
            id: "audit_disabled",
            raceId: "race_active",
            raceProjectId: "proj_audit",
            reason: "",
            registrationId: "reg_audit",
            result: "accepted",
            targetId: "conn_audit",
            targetType: "CAConnection",
            userId: "organizer_1",
          },
          {
            action: "ca_connection.handshake",
            actorKind: "CONNECTOR",
            caConnectionId: "conn_audit",
            createdAt: new Date("2026-06-20T12:05:00Z"),
            detailsJson: JSON.stringify({
              connectorId: "codex_connector_audit",
            }),
            id: "audit_handshake_rejected",
            raceId: "race_active",
            raceProjectId: "proj_audit",
            reason: "unauthorized",
            registrationId: "reg_audit",
            result: "rejected",
            targetId: "conn_audit",
            targetType: "CAConnection",
            userId: "rider_audit",
          },
          {
            action: "ca_signal.ingest",
            actorKind: "CONNECTOR",
            caConnectionId: "conn_audit",
            createdAt: new Date("2026-06-20T12:00:00Z"),
            detailsJson: JSON.stringify({
              caSessionId: "session_audit",
              connectorId: "codex_connector_audit",
            }),
            id: "audit_integrity_gap",
            raceId: "race_active",
            raceProjectId: "proj_audit",
            reason: "payload_digest_conflict",
            registrationId: "reg_audit",
            result: "integrity_gap",
            targetId: "event_audit",
            targetType: "CAIngestionEvent",
            userId: "rider_audit",
          },
          {
            action: "ca_connection.enabled",
            actorKind: "USER",
            caConnectionId: "conn_leak",
            createdAt: new Date("2026-06-20T12:15:00Z"),
            detailsJson: JSON.stringify({
              connectorId: "codex_connector_leak",
            }),
            id: "audit_leak",
            raceId: "race_active",
            raceProjectId: "proj_leak",
            reason: "",
            registrationId: "reg_leak",
            result: "accepted",
            targetId: "conn_leak",
            targetType: "CAConnection",
            userId: "organizer_1",
          },
        ],
      })}
      raceSlug="race_active--sorting-challenge"
      section="ca-status"
    />,
  );

  assert.match(html, /连接器审计摘要/);
  assert.match(html, /最近审计事件数：3/);
  assert.match(html, /拒绝事件数：1/);
  assert.match(html, /需复核事件数：1/);
  assert.match(
    html,
    /审计事件：2026-06-20T12:10:00.000Z ca_connection.disabled 已接受/,
  );
  assert.match(html, /审计原因：unauthorized/);
  assert.match(html, /审计原因：payload_digest_conflict/);
  assert.match(html, /审计连接器：codex_connector_audit/);
  assert.match(html, /暂无连接器审计事件。/);
  assert.doesNotMatch(html, /Connector Audit Overview/);
  assert.doesNotMatch(html, /Audit Event:/);
  assert.doesNotMatch(html, /codex_connector_leak/);
});

test("organizer awards section exposes a formal publish entry alongside compatibility outputs", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      section="awards"
    />,
  );

  assert.match(html, /JudgingRecord/);
  assert.match(html, /Award \/ Leaderboard/);
});

test("organizer reports section exposes report generation and publication controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        reports: [
          {
            id: "report_race",
            status: "GENERATED",
            summary: "draft race report",
            title: "Race Report",
            type: "RACE_REPORT",
          },
          {
            id: "report_review",
            status: "GENERATED",
            summary: "draft review summary",
            title: "Review Summary",
            type: "REVIEW_SUMMARY",
          },
        ] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      section="reports"
    />,
  );

  assert.match(html, /生成报告草稿/);
  assert.match(html, /发布 race_report/);
  assert.match(html, /发布 review_summary/);
});
