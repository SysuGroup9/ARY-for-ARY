import { getRacePhaseLabel } from "@/lib/race-phase";

export function LeaderboardDisplayView({
  awards,
  race,
  raceReport,
  ridingSkillHighlights,
}: {
  awards: Array<{
    awardName: string;
    decisionReason: string;
    rank: number;
    registration: { user: { username: string } };
    work: null | { title: string };
  }>;
  race: {
    phase: string;
    title: string;
  };
  raceReport: null | { summary: string; title: string };
  ridingSkillHighlights: Array<{
    label: string;
    riderName: string;
  }>;
}) {
  const groupedAwards = new Map<string, typeof awards>();
  for (const award of awards) {
    const bucket = groupedAwards.get(award.awardName) ?? [];
    bucket.push(award);
    groupedAwards.set(award.awardName, bucket);
  }

  const winningWorks = awards.filter((award) => award.work).slice(0, 6);

  return (
    <div style={layoutStyles}>
      <section style={heroStyles}>
        <p style={eyebrowStyles}>Leaderboard Display</p>
        <h1 style={titleStyles}>{race.title}</h1>
        <p style={summaryStyles}>
          当前阶段：{getRacePhaseLabel(race.phase)}
          {raceReport ? ` / ${raceReport.summary}` : ""}
        </p>
      </section>

      <div style={gridStyles}>
        <section style={cardStyles}>
          <h2 style={sectionTitleStyles}>Award Leaderboards</h2>
          <div style={awardGroupListStyles}>
            {[...groupedAwards.entries()].map(([awardName, rows]) => (
              <div key={awardName} style={awardGroupStyles}>
                <strong style={awardGroupTitleStyles}>{awardName}</strong>
                <div style={awardRowListStyles}>
                  {rows.map((award) => (
                    <div
                      key={`${awardName}-${award.rank}-${award.registration.user.username}`}
                      style={awardRowStyles}
                    >
                      <span>#{award.rank}</span>
                      <strong>{award.registration.user.username}</strong>
                      <span>{award.work?.title ?? "未关联作品"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={cardStyles}>
          <h2 style={sectionTitleStyles}>Winning Works</h2>
          <div style={miniListStyles}>
            {winningWorks.map((award) => (
              <div
                key={`${award.awardName}-${award.work?.title ?? award.registration.user.username}`}
                style={miniItemStyles}
              >
                <strong>{award.work?.title ?? "未关联作品"}</strong>
                <span>
                  {award.awardName} / {award.registration.user.username}
                </span>
                <span>{award.decisionReason}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={cardStyles}>
          <h2 style={sectionTitleStyles}>Riding Skill Highlights</h2>
          <div style={miniListStyles}>
            {ridingSkillHighlights.length ? (
              ridingSkillHighlights.map((highlight, index) => (
                <div
                  key={`${highlight.riderName}-${highlight.label}-${index}`}
                  style={miniItemStyles}
                >
                  <strong>{highlight.label}</strong>
                  <span>{highlight.riderName}</span>
                </div>
              ))
            ) : (
              <p style={emptyStyles}>当前还没有已发布骑行亮点。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const layoutStyles: React.CSSProperties = {
  display: "grid",
  gap: 22,
};

const heroStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "20px 22px",
  borderRadius: 22,
  background: "rgba(255,255,255,0.1)",
};

const eyebrowStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.84,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 5vw, 68px)",
  lineHeight: 1.02,
};

const summaryStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.5,
};

const gridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr 0.8fr",
  gap: 18,
};

const cardStyles: React.CSSProperties = {
  display: "grid",
  gap: 14,
  padding: "20px 22px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.08)",
};

const sectionTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 3vw, 38px)",
  lineHeight: 1.08,
};

const awardGroupListStyles: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const awardGroupStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const awardGroupTitleStyles: React.CSSProperties = {
  fontSize: 22,
};

const awardRowListStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const awardRowStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "68px 1fr 1fr",
  gap: 12,
  alignItems: "center",
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  fontSize: 18,
};

const miniListStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const miniItemStyles: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  fontSize: 17,
};

const emptyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  lineHeight: 1.6,
};
