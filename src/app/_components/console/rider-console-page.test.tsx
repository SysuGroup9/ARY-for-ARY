import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiderConsolePageView } from "./rider-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    feedbackThreads: [],
    highlights: [],
    id: "race_active",
    leaderboardEntries: [],
    organizerComment: "",
    phase: "running",
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    submissions: [],
    teamComments: [],
    teamArchives: [],
    title: "Sorting Challenge",
    ...overrides,
  } as unknown as RaceListItem;
}

test("rider console registration and submission copy avoids legacy compatibility wording", () => {
  const html =
    renderToStaticMarkup(
      <RiderConsolePageView
        race={buildRace()}
        registration={null}
        reviewSummary={null}
        riderReports={[]}
        riderTeam={null}
        section="registration"
      />,
    ) +
    renderToStaticMarkup(
      <RiderConsolePageView
        race={buildRace()}
        registration={null}
        reviewSummary={null}
        riderReports={[]}
        riderTeam={null}
        section="submission"
      />,
    );

  assert.doesNotMatch(html, /Compatibility team/);
  assert.doesNotMatch(html, /compatibility team creation/);
  assert.doesNotMatch(html, /No compatibility submission container yet\./);
  assert.match(html, /报名状态/);
  assert.match(html, /你已经进入骑手工作台；下一步是对当前赛事提交正式报名/);
  assert.match(html, /提交已锁定/);
});

test("rider review section carries returnTo for feedback submission", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={
        {
          id: "reg_1",
          status: "APPROVED",
          user: { username: "alice" },
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={{ id: "team_1", name: "solo" } as never}
      raceSlug="race_active--sorting-challenge"
      section="review"
    />,
  );

  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/races\/race_active--sorting-challenge\/rider\/review"/,
  );
  assert.match(
    html,
    /type="hidden" name="raceSlug" value="race_active--sorting-challenge"/,
  );
});

test("rider submission section reflects the current in-race submit flow", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={{
        evidences: [],
        id: "reg_1",
        raceProject: { aggregateIngestionStatus: "ACTIVE" },
        status: "APPROVED",
        work: {
          id: "work_1",
          status: "DRAFT",
          summary: "先保存的草稿摘要。",
          title: "草稿作品",
          visibility: "PRIVATE",
        },
      } as never}
      reviewSummary={null}
      riderReports={[]}
      riderTeam={{ id: "team_1", name: "solo" } as never}
      section="submission"
    />,
  );

  assert.match(html, /作品提交/);
  assert.match(html, /提交代码/);
  assert.match(html, /当前作品资产/);
  assert.match(html, /比赛中/);
  assert.match(html, /状态：DRAFT/);
  assert.match(html, /可见性：PRIVATE/);
  assert.match(html, /隐藏当前草稿/);
  assert.match(html, /保存作品草稿/);
  assert.doesNotMatch(html, /赛中代码测试/);
  assert.doesNotMatch(html, /提交代码并发起赛中测试/);
});

test("rider submission section surfaces evidence-gap prompts without blocking submission", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={
        {
          evidences: [],
          id: "reg_1",
          raceProject: { aggregateIngestionStatus: "FAILED" },
          status: "APPROVED",
          work: null,
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={{ id: "team_1", name: "solo" } as never}
      section="submission"
    />,
  );

  assert.match(html, /提交前提示/);
  assert.match(html, /评审前风险提示/);
  assert.match(html, /CA 接入失败/);
  assert.match(html, /缺少内部证据/);
  assert.match(html, /提交代码/);
});

test("rider submission section no longer locks approved registrations just because the legacy team container is missing", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={
        {
          evidences: [],
          id: "reg_approved",
          raceProject: { aggregateIngestionStatus: "ACTIVE" },
          status: "APPROVED",
          work: null,
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={null}
      section="submission"
    />,
  );

  assert.match(html, /作品提交/);
  assert.match(html, /提交代码/);
  assert.match(html, /保存作品草稿/);
  assert.doesNotMatch(html, /需要先完成报名并生成参赛上下文/);
});

test("rider console keeps pending registrations out of ca-setup and submission flows", () => {
  const html =
    renderToStaticMarkup(
      <RiderConsolePageView
        race={buildRace({ phase: "registration" })}
        registration={
          {
            evidences: [],
            status: "SUBMITTED",
            user: { username: "alice" },
            raceProject: null,
          } as never
        }
        reviewSummary={null}
        riderReports={[]}
        riderTeam={null}
        section="registration"
      />,
    ) +
    renderToStaticMarkup(
      <RiderConsolePageView
        race={buildRace({ phase: "registration" })}
        registration={
          {
            evidences: [],
            status: "SUBMITTED",
            user: { username: "alice" },
            raceProject: null,
          } as never
        }
        reviewSummary={null}
        riderReports={[]}
        riderTeam={null}
        section="ca-setup"
      />,
    ) +
    renderToStaticMarkup(
      <RiderConsolePageView
        race={buildRace({ phase: "registration" })}
        registration={
          {
            evidences: [],
            status: "SUBMITTED",
            user: { username: "alice" },
            raceProject: null,
          } as never
        }
        reviewSummary={null}
        riderReports={[]}
        riderTeam={null}
        section="submission"
      />,
    );

  assert.match(html, /等待主办方审核/);
  assert.match(html, /当前报名尚未通过审核，暂不能配置 CA 接入/);
  assert.match(html, /当前报名尚未通过审核，作品提交入口暂未开放/);
  assert.match(html, /撤回报名/);
});

test("rider console shows approved registrations can still withdraw during registration phase", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace({ phase: "registration" })}
      registration={
        {
          id: "reg_approved",
          status: "APPROVED",
          user: { username: "alice" },
          raceProject: { aggregateIngestionStatus: "ACTIVE" },
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={{ id: "team_1", name: "solo" } as never}
      raceSlug="race_active--sorting-challenge"
      section="registration"
    />,
  );

  assert.match(html, /撤回报名/);
  assert.match(
    html,
    /type="hidden" name="feedbackReturnTo" value="\/console\/races\/race_active--sorting-challenge\/rider\/registration"/,
  );
});

test("rider console shows withdrawn registrations as exited participation context", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={
        {
          status: "WITHDRAWN",
          user: { username: "alice" },
          raceProject: null,
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={null}
      section="registration"
    />,
  );

  assert.match(html, /这条报名已经撤回/);
  assert.doesNotMatch(html, /撤回报名/);
});

test("rider report section prefers rider report semantics over transitional titles", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace({
        organizerComment: "主办方总结。",
        teamArchives: [
          {
            teamId: "team_1",
            totalScore: 91,
          } as RaceListItem["teamArchives"][number],
        ],
      })}
      registration={
        {
          evidences: [
            {
              id: "ev_1",
              summary: "公开证据摘要。",
              title: "会话摘要",
              type: "SUMMARY",
            },
          ],
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={
        {
          id: "team_1",
          name: "solo",
        } as never
      }
      section="report"
    />,
  );

  assert.match(html, /骑手报告/);
  assert.match(html, /最终得分/);
  assert.doesNotMatch(html, /Transitional Read Model/);
  assert.doesNotMatch(html, /Highlight/);
});

test("rider console surfaces connector rotation and disabled state in ca-setup", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={
        {
          evidences: [],
          raceProject: {
            aggregateIngestionStatus: "CONNECTED",
            caConnections: [
              {
                caProjectId: "proj_1",
                caType: "CODEX",
                connectorId: "codex_connector_01",
                connectorSecret: "secret_v2",
                disabledAt: new Date("2026-06-20T10:05:00Z"),
                disabledReason: "manual security freeze",
                handshakeCompletedAt: null,
                id: "conn_1",
                ingestionStatus: "CONNECTED",
                secretRotatedAt: new Date("2026-06-20T10:00:00Z"),
                secretVersion: 2,
                sessions: [],
              },
            ],
            id: "project_1",
          },
          status: "APPROVED",
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={null}
      raceSlug="race_active--sorting-challenge"
      section="ca-setup"
    />,
  );

  assert.match(html, /骑手视图/);
  assert.match(html, /聚合接入状态：已连接/);
  assert.match(html, /连接器密钥：secret_v2/);
  assert.match(html, /密钥版本：2/);
  assert.match(html, /最近轮换时间：2026-06-20T10:00:00.000Z/);
  assert.match(html, /是否禁用：是/);
  assert.match(html, /禁用原因：manual security freeze/);
  assert.match(html, /握手状态：需重新握手/);
  assert.match(html, /轮换连接器密钥/);
  assert.match(html, /CA 会话 ID/);
  assert.doesNotMatch(html, /Rider View/);
  assert.doesNotMatch(html, /Secret Version:/);
  assert.doesNotMatch(html, /Rotate Connector Secret/);
  assert.match(html, /name="raceSlug" value="race_active--sorting-challenge"/);
  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/races\/race_active--sorting-challenge\/rider\/ca-setup"/,
  );
});

test("rider knowledge base shows download link when team has submissions", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace({ phase: "active" })}
      registration={
        {
          id: "reg_1",
          status: "APPROVED",
          userId: "u_leader",
          user: { username: "rider_alice" },
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={
        {
          id: "team_1",
          name: "Alpha Team",
          leaderId: "u_leader",
          leader: { id: "u_leader", username: "rider_alice" },
          members: [
            { id: "m1", role: "LEADER", status: "APPROVED", userId: "u_leader", user: { id: "u_leader", username: "rider_alice" } },
          ],
          submissions: [{ id: "sub_1" }],
        } as never
      }
      section="collaboration"
    />,
  );

  assert.match(html, /知识库/);
  assert.match(html, /<a[^>]*>下载最新代码<\/a>/);
  assert.doesNotMatch(html, /暂无代码提交记录/);
});

test("rider knowledge base shows prompt when team has no submissions", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace({ phase: "active" })}
      registration={
        {
          id: "reg_1",
          status: "APPROVED",
          userId: "u_leader",
          user: { username: "rider_alice" },
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={
        {
          id: "team_1",
          name: "Empty Team",
          leaderId: "u_leader",
          leader: { id: "u_leader", username: "rider_alice" },
          members: [
            { id: "m1", role: "LEADER", status: "APPROVED", userId: "u_leader", user: { id: "u_leader", username: "rider_alice" } },
          ],
          submissions: [],
        } as never
      }
      section="collaboration"
    />,
  );

  assert.match(html, /暂无代码提交记录/);
  assert.match(html, /知识库/);
  assert.doesNotMatch(html, /<a[^>]*>下载最新代码<\/a>/);
});

test("rider console can render a friendly inline action error notice", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      feedback={{
        message: "快照抓取失败，请稍后重试或检查连接器服务。",
        title: "CA 接入未完成",
      }}
      race={buildRace()}
      registration={null}
      reviewSummary={null}
      riderReports={[]}
      riderTeam={null}
      raceSlug="race_active--sorting-challenge"
      section="ca-setup"
    />,
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /CA 接入未完成/);
  assert.match(html, /快照抓取失败，请稍后重试或检查连接器服务。/);
});
