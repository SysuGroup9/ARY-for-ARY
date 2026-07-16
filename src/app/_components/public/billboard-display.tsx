import { getRacePhaseLabel } from "@/lib/race-phase";

export function BillboardDisplayView({
  awards,
  latestAnnouncement,
  race,
  screenFeedItems,
  ridingSkillHighlights,
  riskCount,
}: {
  awards: Array<{
    awardName: string;
    rank: number;
    registration: { user: { username: string } };
    work: null | { title: string };
  }>;
  latestAnnouncement: null | {
    body: string;
    title: string;
  };
  race: {
    phase: string;
    registrations: Array<{ id: string; team?: { works?: Array<{ id: string }> } | null }>;
    title: string;
  };
  screenFeedItems: Array<{
    summary: string;
    type:
      | "announcement"
      | "current_leaderboard_projection"
      | "leaderboard_read_model"
      | "session_summary"
      | "works";
  }>;
  ridingSkillHighlights: Array<{
    label: string;
    riderName: string;
  }>;
  riskCount: number;
}) {
  const publicWorkCount = race.registrations.filter((registration) => registration.team?.works?.[0]).length;
  const topAwards = awards.slice(0, 4);
  const topHighlights = ridingSkillHighlights.slice(0, 4);
  const topFeedItems = screenFeedItems.slice(0, 5);

  return (
    <div style={stackStyles}>
      <section style={heroCardStyles}>
        <p style={eyebrowStyles}>Billboard</p>
        <h2 style={heroTitleStyles}>{race.title}</h2>
        <p style={heroBodyStyles}>当前阶段：{getRacePhaseLabel(race.phase)}</p>
      </section>

      <div style={metricGridStyles}>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>已发布奖项</span>
          <strong style={metricValueStyles}>{awards.length}</strong>
        </div>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>公开作品</span>
          <strong style={metricValueStyles}>{publicWorkCount}</strong>
        </div>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>风险数</span>
          <strong style={metricValueStyles}>{riskCount}</strong>
        </div>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>feed 条目</span>
          <strong style={metricValueStyles}>{screenFeedItems.length}</strong>
        </div>
      </div>

      <div style={gridStyles}>
        <section style={cardStyles}>
          <p style={eyebrowStyles}>Screen Feed</p>
          <h3 style={sectionTitleStyles}>现场信息看板</h3>
          <div style={listStyles}>
            {topFeedItems.length ? (
              topFeedItems.map((item, index) => (
                <div key={`${item.type}-${index}`} style={listItemStyles}>
                  <strong>{mapFeedTypeLabel(item.type)}</strong>
                  <span>{item.summary}</span>
                </div>
              ))
            ) : (
              <p style={sectionBodyStyles}>当前还没有可用的 Screen Feed。</p>
            )}
          </div>
        </section>

        <section style={cardStyles}>
          <p style={eyebrowStyles}>最近公告</p>
          <h3 style={sectionTitleStyles}>{latestAnnouncement?.title ?? "当前还没有已发布公告"}</h3>
          <p style={sectionBodyStyles}>
            {latestAnnouncement?.body ?? "请先在主办方控制台发布公告。"}
          </p>
        </section>

        <section style={cardStyles}>
          <p style={eyebrowStyles}>榜单摘要</p>
          <h3 style={sectionTitleStyles}>已发布 Award</h3>
          <div style={listStyles}>
            {topAwards.length ? (
              topAwards.map((award) => (
                <div
                  key={`${award.awardName}-${award.rank}-${award.registration.user.username}`}
                  style={listItemStyles}
                >
                  <strong>{award.awardName}</strong>
                  <span>
                    #{award.rank} / {award.registration.user.username}
                    {award.work ? ` / ${award.work.title}` : ""}
                  </span>
                </div>
              ))
            ) : (
              <p style={sectionBodyStyles}>当前还没有已发布 Award。</p>
            )}
          </div>
        </section>

        <section style={cardStyles}>
          <p style={eyebrowStyles}>亮点摘要</p>
          <h3 style={sectionTitleStyles}>骑行亮点</h3>
          <div style={listStyles}>
            {topHighlights.length ? (
              topHighlights.map((highlight, index) => (
                <div key={`${highlight.riderName}-${highlight.label}-${index}`} style={listItemStyles}>
                  <strong>{highlight.label}</strong>
                  <span>{highlight.riderName}</span>
                </div>
              ))
            ) : (
              <p style={sectionBodyStyles}>当前还没有已发布亮点。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function mapFeedTypeLabel(
  type:
    | "announcement"
    | "current_leaderboard_projection"
    | "leaderboard_read_model"
    | "session_summary"
    | "works",
) {
  switch (type) {
    case "announcement":
      return "公告";
    case "current_leaderboard_projection":
      return "过程榜";
    case "leaderboard_read_model":
      return "最终榜";
    case "works":
      return "作品";
    case "session_summary":
    default:
      return "Session 摘要";
  }
}

const stackStyles: React.CSSProperties = {
  display: "grid",
  gap: 20,
};

const heroCardStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "22px 24px",
  borderRadius: 22,
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(10px)",
};

const heroTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 6vw, 68px)",
  lineHeight: 1.02,
};

const heroBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(18px, 2.4vw, 28px)",
};

const metricGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const metricCardStyles: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "18px 20px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.1)",
};

const metricLabelStyles: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.8,
};

const metricValueStyles: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 48px)",
  lineHeight: 1,
};

const gridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const cardStyles: React.CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "20px 22px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.08)",
};

const eyebrowStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.82,
};

const sectionTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(22px, 3vw, 34px)",
  lineHeight: 1.1,
};

const sectionBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.6,
};

const listStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const listItemStyles: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
};
