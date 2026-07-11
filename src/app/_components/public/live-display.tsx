import JumbotronInline from "@/app/JumbotronInline";
import { StaticDisplayFallback } from "@/app/_components/public/static-display-fallback";
import type { TrackProfile, RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";
import { getRacePhaseLabel } from "@/lib/race-phase";
import type { PublicRaceListItem } from "@/lib/services/public-routes";

export function LiveDisplayView({
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
  const costProjection = parseProjection<
    Array<{
      registrationId: string;
      tokenCost: number;
    }>
  >(race.projections.find((projection) => projection.type === "COST")?.payloadJson);
  const riskProjection = parseProjection<
    Array<{
      aggregateIngestionStatus: string;
      registrationId: string;
    }>
  >(race.projections.find((projection) => projection.type === "RISK")?.payloadJson);
  const currentLeaderboard = parseProjection<
    Array<{
      entryId: string;
      progressPercent?: number;
      rank?: number;
      username?: string;
    }>
  >(
    race.projections.find(
      (projection) => projection.type === "CURRENT_LEADERBOARD",
    )?.payloadJson,
  );
  const eventStream = parseProjection<{
    items: Array<{
      createdAt: string;
      summary: string;
      type: string;
      username?: null | string;
    }>;
  }>(
    race.projections.find(
      (projection) => projection.type === "EVENT_STREAM_READ_MODEL",
    )?.payloadJson,
  );

  const latestAnnouncement = [...(race.announcements ?? [])]
    .filter((announcement) => announcement.visibility === "PUBLIC" && announcement.publishedAt)
    .sort(
      (left, right) =>
        right.publishedAt!.getTime() - left.publishedAt!.getTime(),
    )[0];
  const activeRiders =
    raceProgress?.activeRegistrations ??
    race.registrations.filter((registration) => registration.status === "APPROVED")
      .length;
  const sessions = raceProgress?.activeSessions ?? 0;
  const riskCount =
    riskProjection?.filter(
      (item) =>
        item.aggregateIngestionStatus === "FAILED" ||
        item.aggregateIngestionStatus === "NOT_CONFIGURED",
    ).length ?? 0;
  const totalTokenCost =
    costProjection?.reduce((sum, item) => sum + item.tokenCost, 0) ?? 0;
  const averageProgressPercent =
    currentLeaderboard?.length
      ? Math.round(
          currentLeaderboard.reduce(
            (sum, item) => sum + (item.progressPercent ?? 0),
            0,
          ) / currentLeaderboard.length,
        )
      : 0;
  const submitLeft = formatRemainingTime(race.raceEnd);
  const topEntries = (currentLeaderboard ?? []).slice(0, 3);
  const latestEvents = (eventStream?.items ?? []).slice(0, 3);

  return (
    <div style={layoutStyles}>
      <section style={outputStyles}>
        <div style={topBarStyles}>
          <span>{race.title}</span>
          <b>{getRacePhaseLabel(race.phase)}</b>
        </div>
        <h1 style={titleStyles}>Live Riding Board</h1>
        {jumbotronPreview?.source === "stable" ? (
          <p style={noticeStyles}>稳定快照 fallback</p>
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
        <div style={metricRowStyles}>
          <article style={metricCardStyles}>
            <span>active riders</span>
            <b>{activeRiders}</b>
          </article>
          <article style={metricCardStyles}>
            <span>sessions</span>
            <b>{sessions}</b>
          </article>
          <article style={metricCardStyles}>
            <span>风险数</span>
            <b>{riskCount}</b>
          </article>
          <article style={metricCardStyles}>
            <span>submit left</span>
            <b>{submitLeft}</b>
          </article>
        </div>
      </section>

      <aside style={asideStyles}>
        <section style={asideCardStyles}>
          <h2 style={asideTitleStyles}>Display Preview</h2>
          <p style={asideBodyStyles}>
            本页只表达现场输出，控制面保留在 Screen Console。
          </p>
        </section>
        <section style={asideCardStyles}>
          <h2 style={asideTitleStyles}>过程指标</h2>
          <div style={miniListStyles}>
            <div style={miniItemStyles}>
              <strong>平均进度</strong>
              <span>{averageProgressPercent}%</span>
            </div>
            <div style={miniItemStyles}>
              <strong>Total Token</strong>
              <span>{totalTokenCost}</span>
            </div>
          </div>
        </section>
        <section style={asideCardStyles}>
          <h2 style={asideTitleStyles}>最近公告</h2>
          {latestAnnouncement ? (
            <div style={miniListStyles}>
              <div style={miniItemStyles}>
                <strong>{latestAnnouncement.title}</strong>
                <span>{latestAnnouncement.body}</span>
              </div>
            </div>
          ) : (
            <p style={asideBodyStyles}>当前还没有已发布公告。</p>
          )}
        </section>
        <section style={asideCardStyles}>
          <h2 style={asideTitleStyles}>过程榜前三</h2>
          <div style={miniListStyles}>
            {topEntries.length ? (
              topEntries.map((entry, index) => (
                <div key={`${entry.entryId}-${index}`} style={miniItemStyles}>
                  <strong>
                    #{entry.rank ?? index + 1} {entry.username ?? entry.entryId}
                  </strong>
                  <span>{entry.progressPercent ?? 0}%</span>
                </div>
              ))
            ) : (
              <p style={asideBodyStyles}>当前还没有可用过程榜。</p>
            )}
          </div>
        </section>
        <section style={asideCardStyles}>
          <h2 style={asideTitleStyles}>最近事件</h2>
          <div style={miniListStyles}>
            {latestEvents.length ? (
              latestEvents.map((item, index) => (
                <div key={`${item.type}-${item.createdAt}-${index}`} style={miniItemStyles}>
                  <strong>{item.username ?? item.type}</strong>
                  <span>{item.summary}</span>
                </div>
              ))
            ) : (
              <p style={asideBodyStyles}>当前还没有新的事件。</p>
            )}
          </div>
        </section>
      </aside>
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

function formatRemainingTime(targetDate: Date) {
  const diffMs = Math.max(targetDate.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

const layoutStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(280px, 0.7fr)",
  gap: 20,
  alignItems: "start",
};

const outputStyles: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const topBarStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 14,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 5vw, 72px)",
  lineHeight: 1,
};

const noticeStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
};

const metricRowStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const metricCardStyles: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "16px 18px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.1)",
};

const asideStyles: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const asideCardStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "18px 20px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.08)",
};

const asideTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.15,
};

const asideBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.6,
};

const miniListStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const miniItemStyles: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
};
