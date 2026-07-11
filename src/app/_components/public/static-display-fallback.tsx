import type { PublicRaceListItem } from "@/lib/services/public-routes";
import type { RaceListItem } from "@/lib/services/races";

export function StaticDisplayFallback({
  compact = false,
  reason,
  race,
  raceSlug,
}: {
  compact?: boolean;
  race: PublicRaceListItem | RaceListItem;
  raceSlug?: string;
  reason?: null | string;
}) {
  const themeStyles = resolveStaticFallbackThemeStyles(race.screenDisplay?.theme);
  const registrations = race.registrations ?? [];
  const leaderboardRows = buildFallbackLeaderboardRows(race).slice(0, 5);
  const featuredWorks = registrations
    .filter((registration) => registration.work)
    .slice(0, 3)
    .map((registration) => ({
      id: registration.id,
      title: registration.work!.title,
      username: registration.user.username,
    }));
  const latestAnnouncement = [...(race.announcements ?? [])]
    .filter((announcement) => announcement.visibility === "PUBLIC" && announcement.publishedAt)
    .sort(
      (left, right) =>
        right.publishedAt!.getTime() - left.publishedAt!.getTime(),
    )[0];
  const summary =
    latestAnnouncement?.body.trim() ||
    race.organizerComment?.trim() ||
    race.summary?.trim() ||
    "Projection 当前不可用，请先切回静态公告或稍后重新生成稳定快照。";

  return (
    <section
      style={
        compact
          ? { ...compactStyles, ...themeStyles.compact }
          : { ...fullscreenStyles, ...themeStyles.fullscreen }
      }
    >
      <p style={eyebrowStyles}>静态展示 fallback</p>
      <h1 style={titleStyles}>{race.title}</h1>
      <p style={bodyStyles}>
        Projection 当前不可用，页面已回退到静态公告 / 榜单，不直接读取原始 CA Session。
      </p>
      <div style={metaGridStyles}>
        <div style={metaCardStyles}>
          <span style={metaLabelStyles}>赛事阶段</span>
          <strong style={metaValueStyles}>{formatRacePhase(race.phase)}</strong>
        </div>
        <div style={metaCardStyles}>
          <span style={metaLabelStyles}>展示来源</span>
          <strong style={metaValueStyles}>静态 fallback</strong>
        </div>
      </div>
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>阶段公告</h2>
        <p style={sectionBodyStyles}>{summary}</p>
      </div>
      {leaderboardRows.length ? (
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>静态榜单</h2>
          <ol style={listStyles}>
            {leaderboardRows.map((row) => (
              <li key={row.key} style={listItemStyles}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {featuredWorks.length ? (
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>公开作品入口</h2>
          <ul style={listStyles}>
            {featuredWorks.map((work) => (
              <li key={work.id} style={listItemStyles}>
                <span>{work.title}</span>
                <strong>{work.username}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {raceSlug ? (
        <div style={linkRowStyles}>
          <a href={`/races/${raceSlug}/works`} style={linkStyles}>
            查看作品
          </a>
          <a href={`/races/${raceSlug}/results`} style={linkStyles}>
            查看赛果
          </a>
        </div>
      ) : null}
      {reason ? (
        <p style={reasonStyles}>fallback 原因：{reason}</p>
      ) : null}
    </section>
  );
}

function buildFallbackLeaderboardRows(
  race: PublicRaceListItem | RaceListItem,
): Array<{
  key: string;
  label: string;
  value: string;
}> {
  const leaderboardEntries = race.leaderboardEntries ?? [];
  const registrations = race.registrations ?? [];
  const awards = race.awards ?? [];

  if (leaderboardEntries.length) {
    return leaderboardEntries.map((entry, index) => {
      const registration = registrations.find(
        (item) => item.id === entry.registrationId,
      );
      return {
        key: entry.id,
        label:
          registration?.work?.title ||
          registration?.user.username ||
          entry.team?.name ||
          entry.id,
        value: `${
          "rank" in entry && typeof entry.rank === "number"
            ? entry.rank
            : index + 1
        } / ${entry.totalScore ?? 0}`,
      };
    });
  }

  return awards.map((award) => ({
    key: award.id,
    label:
      award.work?.title ||
      award.registration?.user.username ||
      award.awardName,
    value: `${award.awardName} #${award.rank}`,
  }));
}

function formatRacePhase(phase: string): string {
  return (
    {
      active: "进行中",
      archived: "已归档",
      completed: "已完成",
      draft: "草稿",
      finished: "已结束",
      frozen: "封榜中",
      judging: "评审中",
      preparation: "准备中",
      published: "已发布",
      registration: "报名中",
      running: "进行中",
      submitting: "提交中",
    }[phase] ?? phase
  );
}

const fullscreenStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "48px",
  gap: "16px",
  background:
    "linear-gradient(160deg, rgba(24,30,54,1) 0%, rgba(31,53,86,1) 48%, rgba(185,77,56,1) 100%)",
  color: "#fff6eb",
  fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
};

const compactStyles: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "20px",
  borderRadius: 16,
  border: "1px solid rgba(139,58,46,0.18)",
  background:
    "linear-gradient(160deg, rgba(255,247,239,1) 0%, rgba(252,238,224,1) 100%)",
  color: "#493526",
};

const eyebrowStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.82,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 5vw, 56px)",
  lineHeight: 1.05,
};

const bodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.6,
  maxWidth: 720,
  opacity: 0.94,
};

const metaGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 220px))",
  gap: 12,
};

const metaCardStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "14px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
};

const metaLabelStyles: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.78,
};

const metaValueStyles: React.CSSProperties = {
  fontSize: 18,
};

const sectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const sectionTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
};

const sectionBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.7,
  maxWidth: 760,
};

const listStyles: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 8,
};

const listItemStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const linkRowStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const linkStyles: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  fontWeight: 700,
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid currentColor",
};

const reasonStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  opacity: 0.76,
};

function resolveStaticFallbackThemeStyles(theme: string | undefined): {
  compact: React.CSSProperties;
  fullscreen: React.CSSProperties;
} {
  const normalized = (theme ?? "").trim().toLowerCase();

  if (normalized.includes("night") || normalized.includes("dark")) {
    return {
      compact: {
        background:
          "linear-gradient(160deg, rgba(34,42,61,1) 0%, rgba(48,61,84,1) 100%)",
        color: "#fff1e6",
      },
      fullscreen: {
        background:
          "linear-gradient(160deg, rgba(24,30,54,1) 0%, rgba(31,53,86,1) 48%, rgba(185,77,56,1) 100%)",
      },
    };
  }

  return {
    compact: {},
    fullscreen: {
      background:
        "linear-gradient(160deg, rgba(245,237,225,1) 0%, rgba(239,214,183,1) 46%, rgba(200,106,57,1) 100%)",
      color: "#3f2a1c",
    },
  };
}
