import { getRacePhaseLabel } from "@/lib/race-phase";

export function AnnouncementDisplayView({
  announcement,
  race,
  raceSlug,
  theme = "default",
}: {
  announcement: null | {
    body: string;
    publishedAt: Date | null;
    title: string;
  };
  race: {
    organizerComment?: string;
    phase: string;
    summary?: string;
    title: string;
  };
  raceSlug?: string;
  theme?: string;
}) {
  const themeStyles = resolveAnnouncementThemeStyles(theme);

  if (!announcement) {
    return (
      <section style={{ ...screenStyles, ...themeStyles.section }}>
        <p style={eyebrowStyles}>Announcement Display</p>
        <h1 style={titleStyles}>{race.title}</h1>
        <p style={bodyStyles}>当前还没有已发布公告。</p>
        <p style={bodyStyles}>
          {race.organizerComment?.trim() || race.summary?.trim() || "请先在主办方控制台发布公告。"}
        </p>
        {raceSlug ? (
          <a href={`/races/${raceSlug}`} style={linkStyles}>
            返回赛事页
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <section style={{ ...screenStyles, ...themeStyles.section }}>
      <p style={eyebrowStyles}>Announcement Display</p>
      <h1 style={titleStyles}>{announcement.title}</h1>
      <p style={metaStyles}>
        {race.title} / {getRacePhaseLabel(race.phase)} / {announcement.publishedAt?.toISOString() ?? "not yet"}
      </p>
      <p style={bodyStyles}>{announcement.body}</p>
      {raceSlug ? (
        <a href={`/races/${raceSlug}`} style={linkStyles}>
          返回赛事页
        </a>
      ) : null}
    </section>
  );
}

const screenStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 18,
  padding: "48px",
  background:
    "linear-gradient(155deg, rgba(22,28,43,1) 0%, rgba(38,63,95,1) 45%, rgba(194,99,55,1) 100%)",
  color: "#fff6ec",
  fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
};

function resolveAnnouncementThemeStyles(theme: string): {
  section: React.CSSProperties;
} {
  const normalized = theme.trim().toLowerCase();

  if (normalized.includes("night") || normalized.includes("dark")) {
    return {
      section: {
        background:
          "linear-gradient(155deg, rgba(22,28,43,1) 0%, rgba(38,63,95,1) 45%, rgba(194,99,55,1) 100%)",
      },
    };
  }

  return {
    section: {
      background:
        "linear-gradient(160deg, rgba(252,244,231,1) 0%, rgba(248,226,202,1) 48%, rgba(208,111,61,1) 100%)",
      color: "#3f2a1c",
    },
  };
}

const eyebrowStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.84,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 6vw, 72px)",
  lineHeight: 1.04,
};

const metaStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  opacity: 0.82,
};

const bodyStyles: React.CSSProperties = {
  margin: 0,
  maxWidth: 860,
  fontSize: "clamp(18px, 2.6vw, 28px)",
  lineHeight: 1.7,
};

const linkStyles: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  color: "inherit",
  textDecoration: "none",
  border: "1px solid currentColor",
  borderRadius: 999,
  padding: "10px 16px",
  fontWeight: 700,
};
