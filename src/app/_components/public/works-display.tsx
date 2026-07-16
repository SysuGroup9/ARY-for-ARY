import { buildWorkSlug } from "@/lib/public-site";
import type { PublicRaceListItem } from "@/lib/services/public-routes";

type DisplayWork = {
  author: string;
  awardLabel: null | string;
  decisionReason: null | string;
  demoStatus: string;
  excerpt: string;
  href: string;
  isAwarded: boolean;
  registrationId: string;
  stageLabel: string;
  submittedAt: number;
  title: string;
};

export function WorksDisplayView({ race }: { race: PublicRaceListItem }) {
  const publicWorks = race.registrations
    .filter((registration) => registration.team?.works?.[0])
    .map((registration) => {
      const work = registration.team!.works![0]!;
      const primaryAward = [...registration.awards].sort((left, right) => {
        if (left.rank !== right.rank) {
          return left.rank - right.rank;
        }
        return left.awardName.localeCompare(right.awardName);
      })[0];

      return {
        author: registration.user.username,
        awardLabel: primaryAward?.awardName ?? null,
        decisionReason: primaryAward?.decisionReason ?? null,
        demoStatus:
          work.demoUrl || work.videoUrl
            ? "已提供公开 Demo"
            : "当前未公开 Demo",
        excerpt: work.summary,
        href: `/works/${buildWorkSlug(
          race.id,
          work.id,
          work.title,
        )}`,
        isAwarded: registration.awards.length > 0,
        registrationId: registration.id,
        stageLabel: resolveWorkStageLabel({
          hasAward: registration.awards.length > 0,
          racePhase: race.phase,
        }),
        submittedAt: registration.createdAt.getTime(),
        title: work.title,
      } satisfies DisplayWork;
    })
    .sort((left, right) => {
      if (left.isAwarded !== right.isAwarded) {
        return Number(right.isAwarded) - Number(left.isAwarded);
      }

      if (left.submittedAt !== right.submittedAt) {
        return right.submittedAt - left.submittedAt;
      }

      return left.registrationId.localeCompare(right.registrationId);
    });

  const featuredWork = publicWorks[0] ?? null;
  const showcaseWorks = featuredWork ? publicWorks.slice(1, 5) : [];
  const awardedCount = publicWorks.filter((work) => work.isAwarded).length;
  const judgingCount = publicWorks.filter((work) => work.stageLabel === "评审中").length;

  return (
    <div style={layoutStyles}>
      <section style={titleBlockStyles}>
        <p style={pageLabelStyles}>作品展示</p>
        <h1 style={titleStyles}>{race.title}作品墙</h1>
        <p style={summaryStyles}>
          {publicWorks.length} 个作品 / {awardedCount} 个已获奖 / {judgingCount} 个评审中
        </p>
      </section>

      <section style={toolbarStyles} aria-label="作品筛选与排序">
        <span style={activeChipStyles}>全部公开作品</span>
        <span style={chipStyles}>精选</span>
        <span style={chipStyles}>已获奖</span>
        <span style={chipStyles}>评审中</span>
        <span style={sortMetaStyles}>排序：最新提交</span>
      </section>

      <div style={contentStyles}>
        <section style={showcaseGridStyles}>
          {featuredWork ? (
            <article style={heroCardStyles}>
              <span style={heroTagStyles}>精选作品</span>
              <h2 style={heroTitleStyles}>{featuredWork.title}</h2>
              <p style={heroBodyStyles}>{featuredWork.excerpt}</p>
              <strong style={heroMetaStyles}>
                {race.title} / {featuredWork.author}
              </strong>
              <div style={heroStatsStyles}>
                <span style={statPillStyles}>{featuredWork.awardLabel ?? featuredWork.stageLabel}</span>
                <span style={statPillStyles}>{featuredWork.demoStatus}</span>
              </div>
              <a href={featuredWork.href} style={linkButtonStyles}>
                查看作品详情
              </a>
            </article>
          ) : (
            <article style={emptyCardStyles}>
              <h2 style={heroTitleStyles}>作品展示</h2>
              <p style={heroBodyStyles}>当前还没有已公开作品可进入大屏展示。</p>
            </article>
          )}

          {showcaseWorks.map((work) => (
            <article key={work.registrationId} style={workCardStyles}>
              <span style={cardTagStyles}>{work.awardLabel ?? work.stageLabel}</span>
              <h2 style={cardTitleStyles}>{work.title}</h2>
              <p style={cardBodyStyles}>{work.excerpt}</p>
              <strong style={cardMetaStyles}>
                {race.title} / {work.author}
              </strong>
              <a href={work.href} style={cardLinkStyles}>
                查看作品详情
              </a>
            </article>
          ))}
        </section>

        <aside style={assetMatrixStyles}>
          <h2 style={asideTitleStyles}>作品橱窗</h2>
          <div style={matrixItemStyles}>
            <span>主作品</span>
            <b>
              {featuredWork
                ? `${featuredWork.title} / ${featuredWork.author}`
                : "等待作品公开"}
            </b>
          </div>
          <div style={matrixItemStyles}>
            <span>Demo 展示</span>
            <b>{featuredWork?.demoStatus ?? "当前未公开 Demo"}</b>
          </div>
          <div style={matrixItemStyles}>
            <span>路线故事</span>
            <b>{featuredWork?.excerpt ?? "当前还没有公开摘要"}</b>
          </div>
          <div style={matrixItemStyles}>
            <span>亮点时刻</span>
            <b>{featuredWork?.awardLabel ?? featuredWork?.stageLabel ?? "等待上墙"}</b>
          </div>
          <div style={matrixItemStyles}>
            <span>评委摘录</span>
            <b>{featuredWork?.decisionReason ?? "待公开评语"}</b>
          </div>
        </aside>
      </div>
    </div>
  );
}

function resolveWorkStageLabel({
  hasAward,
  racePhase,
}: {
  hasAward: boolean;
  racePhase: string;
}) {
  if (hasAward) {
    return "已获奖";
  }

  if (racePhase === "judging") {
    return "评审中";
  }

  if (racePhase === "completed" || racePhase === "finished" || racePhase === "archived") {
    return "已完成";
  }

  if (racePhase === "running" || racePhase === "active" || racePhase === "submitting") {
    return "已提交";
  }

  return "已公开";
}

const layoutStyles: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const titleBlockStyles: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "18px 20px",
  borderRadius: 24,
  background: "rgba(255,255,255,0.1)",
};

const pageLabelStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  opacity: 0.84,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 5vw, 68px)",
  lineHeight: 1.04,
};

const summaryStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.5,
};

const toolbarStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
};

const chipBaseStyles: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  fontSize: 14,
  letterSpacing: "0.04em",
};

const activeChipStyles: React.CSSProperties = {
  ...chipBaseStyles,
  background: "rgba(255,255,255,0.18)",
  fontWeight: 700,
};

const chipStyles: React.CSSProperties = {
  ...chipBaseStyles,
  background: "rgba(255,255,255,0.08)",
};

const sortMetaStyles: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 14,
  opacity: 0.84,
};

const contentStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.55fr) minmax(280px, 0.75fr)",
  gap: 18,
  alignItems: "start",
};

const showcaseGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const heroCardStyles: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridColumn: "1 / span 2",
  padding: "24px 26px",
  borderRadius: 24,
  background: "rgba(255,255,255,0.14)",
};

const emptyCardStyles: React.CSSProperties = {
  ...heroCardStyles,
  alignItems: "start",
};

const heroTagStyles: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.84,
};

const heroTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 4vw, 54px)",
  lineHeight: 1.02,
};

const heroBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 19,
  lineHeight: 1.65,
};

const heroMetaStyles: React.CSSProperties = {
  fontSize: 18,
};

const heroStatsStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const statPillStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.1)",
  fontSize: 14,
};

const linkButtonStyles: React.CSSProperties = {
  justifySelf: "start",
  padding: "12px 18px",
  borderRadius: 999,
  background: "#fff4ea",
  color: "#2c1b10",
  fontSize: 15,
  fontWeight: 700,
  textDecoration: "none",
};

const workCardStyles: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "18px 20px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.08)",
};

const cardTagStyles: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.82,
};

const cardTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.08,
};

const cardBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.6,
};

const cardMetaStyles: React.CSSProperties = {
  fontSize: 15,
};

const cardLinkStyles: React.CSSProperties = {
  color: "inherit",
  fontSize: 15,
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: "4px",
};

const assetMatrixStyles: React.CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "20px 22px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.08)",
};

const asideTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 3vw, 38px)",
  lineHeight: 1.08,
};

const matrixItemStyles: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  fontSize: 16,
};
