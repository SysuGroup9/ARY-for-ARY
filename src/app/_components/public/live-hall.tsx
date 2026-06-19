import type { RaceListItem } from "@/lib/services/races";

export function LiveHallView({ race }: { race: RaceListItem }) {
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
    race.registrations.reduce(
      (sum, registration) =>
        sum +
        (registration.raceProject?.caConnections.reduce(
          (inner, connection) =>
            inner +
            connection.sessions.filter((session) => session.endedAt === null).length,
          0,
        ) ?? 0),
      0,
    );
  const processLeaderboardCount = currentLeaderboard?.length ?? 0;
  const totalTokenCost =
    costProjection?.reduce((sum, item) => sum + item.tokenCost, 0) ??
    race.registrations.reduce(
      (sum, registration) =>
        sum +
        (registration.raceProject?.caConnections.reduce(
          (inner, connection) =>
            inner +
            connection.sessions.reduce(
              (sessionSum, session) => sessionSum + session.tokenCost,
              0,
            ),
          0,
        ) ?? 0),
      0,
    );
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
      sessionCount:
        registration.raceProject?.caConnections.reduce(
          (sum, connection) => sum + connection.sessions.length,
          0,
        ) ?? 0,
      username: registration.user.username,
    }));
  const eventStreamItems = eventStream?.items ?? [];

  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">实况大厅</p>
        <h1>{race.title}</h1>
        <p className="muted">
          该页读取基于 `Registration / RaceProject / CAConnection / Session`
          聚合出的过程投影数据，用于公开实况展示。
        </p>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">赛事状态</p>
          <h2>过程总览</h2>
          <div className="detail-grid">
            <div>
              <dt>阶段</dt>
              <dd>{race.phase}</dd>
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
        </section>

        <section className="panel">
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
        </section>

        <section className="panel">
          <p className="eyebrow">大屏入口</p>
          <h2>当前输出</h2>
          <div className="button-row-inline">
            <a className="button-secondary" href={`/jumbotron/${race.id}`}>
              打开大屏
            </a>
            <a
              className="button-secondary"
              href={`/console/screen/${race.id}--${slugifyTitle(race.title)}/jumbotron`}
            >
              打开大屏控制台
            </a>
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">骑手动态</p>
          <h2>报名状态</h2>
          <div className="stack">
            {riderActivity.length ? (
              riderActivity.slice(0, 8).map((item) => (
                <div className="public-link-card" key={item.registrationId}>
                  <strong>{item.username}</strong>
                  <span>
                    {item.aggregateIngestionStatus} / {item.sessionCount} 次会话
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">暂时还没有可展示的骑手动态。</p>
            )}
          </div>
        </section>

        <section className="panel">
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
        </section>

        <section className="panel">
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
                  <span>{item.summary}</span>
                </div>
              ))
            ) : (
              <p className="muted">暂时还没有生成新的事件流条目。</p>
            )}
          </div>
        </section>
      </section>
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

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}
