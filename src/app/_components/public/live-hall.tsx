import JumbotronInline from "@/app/JumbotronInline";
import { StaticDisplayFallback } from "@/app/_components/public/static-display-fallback";
import type { TrackProfile, RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";
import { getRacePhaseLabel } from "@/lib/race-phase";
import type { PublicRaceListItem } from "@/lib/services/public-routes";

export function LiveHallView({
  race,
  raceSlug,
  jumbotronPreview,
}: {
  race: PublicRaceListItem;
  raceSlug?: string;
  jumbotronPreview?: {
    fallbackReason?: null | string;
    snapshot: RaceSnapshot | null;
    source: "live" | "stable" | "static";
    trackProfile: TrackProfile | null;
  };
}) {
  const raceProgress = parseProjection<{
    activeConnections: number;
    activeRegistrations: number;
    activeSessions: number;
    raceId: string;
    totalRegistrations: number;
  }>(
    race.projections.find((projection) => projection.type === "RACE_PROGRESS")
      ?.payloadJson,
  );

  const registrationStatus = parseProjection<
    Array<{
      aggregateIngestionStatus: string;
      caConnectionCount: number;
      raceProjectId: null | string;
      registrationId: string;
      registrationStatus: string;
      sessionCount: number;
      username: string;
    }>
  >(
    race.projections.find(
      (projection) => projection.type === "REGISTRATION_STATUS",
    )?.payloadJson,
  );

  const costProjection = parseProjection<
    Array<{
      registrationId: string;
      tokenCost: number;
      username?: string;
    }>
  >(race.projections.find((projection) => projection.type === "COST")?.payloadJson);

  const riskProjection = parseProjection<
    Array<{
      aggregateIngestionStatus: string;
      registrationId: string;
      username?: string;
    }>
  >(race.projections.find((projection) => projection.type === "RISK")?.payloadJson);

  const currentLeaderboard = parseProjection<
    Array<{
      entryId: string;
      progressPercent?: number;
      rank?: number;
      tokenCost?: number;
      totalScore?: number;
      username?: string;
      teamName?: string;
    }>
  >(
    race.projections.find(
      (projection) => projection.type === "CURRENT_LEADERBOARD",
    )?.payloadJson,
  );

  const eventStream = parseProjection<{
    items: Array<{
      createdAt: string;
      registrationId?: null | string;
      severity: string;
      summary: string;
      type: string;
      username?: null | string;
    }>;
    raceId: string;
  }>(
    race.projections.find(
      (projection) => projection.type === "EVENT_STREAM_READ_MODEL",
    )?.payloadJson,
  );

  const totalRegistrations =
    raceProgress?.totalRegistrations ?? race.registrations.length;
  const activeRegistrations =
    raceProgress?.activeRegistrations ??
    race.registrations.filter((registration) => registration.status === "APPROVED")
      .length;
  const activeConnections =
    raceProgress?.activeConnections ??
    race.registrations.reduce(
      (sum, registration) =>
        sum +
        (registration.raceProject?.caConnections.filter(
          (connection) => connection.ingestionStatus === "ACTIVE",
        ).length ?? 0),
      0,
    );
  const activeSessions =
    raceProgress?.activeSessions ??
    (registrationStatus?.reduce(
      (sum, registration) => sum + registration.sessionCount,
      0,
    ) ?? 0);
  const processLeaderboardCount = currentLeaderboard?.length ?? 0;
  const totalTokenCost =
    costProjection?.reduce((sum, item) => sum + item.tokenCost, 0) ?? 0;
  const averageProgressPercent =
    processLeaderboardCount > 0
      ? Math.round(
          (currentLeaderboard?.reduce(
            (sum, entry) => sum + (entry.progressPercent ?? 0),
            0,
          ) ?? 0) / processLeaderboardCount,
        )
      : 0;
  const riskCount =
    riskProjection?.filter(
      (item) => item.aggregateIngestionStatus === "FAILED",
    ).length ??
    race.registrations.filter(
      (registration) =>
        registration.raceProject?.aggregateIngestionStatus === "FAILED",
    ).length;
  const riderActivity =
    registrationStatus ??
    race.registrations.map((registration) => ({
      aggregateIngestionStatus:
        registration.raceProject?.aggregateIngestionStatus ?? "NOT_CONFIGURED",
      caConnectionCount: registration.raceProject?.caConnections.length ?? 0,
      raceProjectId: registration.raceProject?.id ?? null,
      registrationId: registration.id,
      registrationStatus: registration.status,
      sessionCount: 0,
      username: registration.user.username,
    }));
  const eventStreamItems = eventStream?.items ?? [];
  const latestAnnouncement = [...(race.announcements ?? [])]
    .filter((announcement) => announcement.visibility === "PUBLIC" && announcement.publishedAt)
    .sort(
      (left, right) =>
        right.publishedAt!.getTime() - left.publishedAt!.getTime(),
    )[0];

  return (
    <div className="stack">
      <section className="card">
        <p className="eyebrow">实况大厅</p>
        <h1>{race.title}</h1>
        <p className="muted">
          该页读取基于 `Registration / RaceProject / CAConnection / Session`
          聚合出的过程投影数据，用于公开实况展示。
        </p>
        <div className="button-row-inline" style={{ marginTop: 12 }}>
          <a className="button-secondary" href={`/jumbotron/${race.id}`}>
            打开大屏
          </a>
        </div>
        {jumbotronPreview?.source === "stable" ? (
          <p className="muted text-sm" style={{ marginTop: 12 }}>
            Jumbotron 预览当前回退到最近一次稳定快照，现场展示仍可继续。
          </p>
        ) : null}
        {jumbotronPreview?.source === "static" ? (
          <StaticDisplayFallback
            compact
            race={race}
            raceSlug={raceSlug}
            reason={jumbotronPreview.fallbackReason}
          />
        ) : null}
        {jumbotronPreview && jumbotronPreview.source !== "static" ? (
          <JumbotronInline
            raceId={race.id}
            snapshot={jumbotronPreview.snapshot}
            trackProfile={jumbotronPreview.trackProfile}
          />
        ) : null}
      </section>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">赛事状态</p>
          <h2>过程总览</h2>
          <div className="detail-grid">
            <div>
              <dt>阶段</dt>
              <dd>{getRacePhaseLabel(race.phase)}</dd>
            </div>
            <div>
              <dt>总报名数</dt>
              <dd>{totalRegistrations}</dd>
            </div>
            <div>
              <dt>活跃报名</dt>
              <dd>{activeRegistrations}</dd>
            </div>
            <div>
              <dt>活跃连接</dt>
              <dd>{activeConnections}</dd>
            </div>
            <div>
              <dt>活跃会话</dt>
              <dd>{activeSessions}</dd>
            </div>
            <div>
              <dt>过程榜单条目</dt>
              <dd>{processLeaderboardCount}</dd>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">过程指标</p>
          <h2>成本 / 进度 / 风险</h2>
          <div className="detail-grid">
            <div>
              <dt>总 Token</dt>
              <dd>{totalTokenCost}</dd>
            </div>
            <div>
              <dt>平均进度</dt>
              <dd>{averageProgressPercent}%</dd>
            </div>
            <div>
              <dt>风险数</dt>
              <dd>{riskCount}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <p className="eyebrow">骑手动态</p>
          <h2>报名状态</h2>
          <div className="stack">
            {riderActivity.length ? (
              riderActivity.slice(0, 8).map((item) => (
                <div className="public-link-card" key={item.registrationId}>
                  <strong>{item.username}</strong>
                  <span className="muted text-sm">
                    {item.aggregateIngestionStatus} / {item.sessionCount} 次会话
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">暂时还没有可展示的骑手动态。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">当前榜单</p>
          <h2>过程榜单</h2>
          {processLeaderboardCount === 0 ? (
            <p className="muted">暂时还没有可用的过程榜单。</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>对象</th>
                  <th>总分</th>
                </tr>
              </thead>
              <tbody>
                {currentLeaderboard?.map((entry, index) => (
                  <tr key={`${entry.entryId}-${index}`}>
                    <td>{entry.rank ?? index + 1}</td>
                    <td>{entry.teamName ?? entry.username ?? entry.entryId}</td>
                    <td>{entry.totalScore ?? `${entry.progressPercent ?? 0}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <p className="eyebrow">最近公告</p>
          <h2>阶段公告</h2>
          {latestAnnouncement ? (
            <div className="stack">
              <div className="public-link-card">
                <strong>{latestAnnouncement.title}</strong>
                <span className="muted text-sm">{latestAnnouncement.body}</span>
              </div>
            </div>
          ) : (
            <p className="muted">当前还没有已发布公告。</p>
          )}
        </div>

        <div className="card">
          <p className="eyebrow">事件流</p>
          <h2>最近事件</h2>
          <div className="stack">
            {eventStreamItems.length ? (
              eventStreamItems.map((item, index) => (
                <div
                  className="public-link-card"
                  key={`${item.type}-${item.createdAt}-${index}`}
                >
                  <strong>{item.username ?? item.type}</strong>
                  <span className="muted text-sm">{item.summary}</span>
                </div>
              ))
            ) : (
              <p className="muted">暂时还没有生成新的事件流条目。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseProjection<T>(payloadJson: string | undefined): null | T {
  if (!payloadJson) {
    return null;
  }

  try {
    return JSON.parse(payloadJson) as T;
  } catch {
    return null;
  }
}
