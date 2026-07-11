import { buildRaceSlug } from "@/lib/public-site";
import type { PublicRaceListItem } from "@/lib/services/public-routes";

export function ResultsPageView({
  race,
  awards,
  raceReport,
  ridingSkillHighlights,
}: {
  race: PublicRaceListItem;
  awards: Array<{
    awardName: string;
    decisionReason: string;
    rank: number;
    registration: { user: { username: string } };
    work: null | { title: string; href?: string; slug?: string };
  }>;
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

  const winningWorks = awards.filter((award) => award.work);

  return (
    <div className="stack">
      <div className="card">
        <p className="eyebrow">赛果</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前赛果页只读取已发布的 `Award` 与报告链路，不再把过程榜单当作最终结果来源。
        </p>
        {raceReport ? <p className="muted">{raceReport.summary}</p> : null}
      </div>

      <div className="card">
        <p className="eyebrow">奖项榜单</p>
        <h2>已发布奖项</h2>
        {awards.length === 0 ? (
          <p className="muted">暂无已发布的公开赛果。</p>
        ) : (
          <div className="stack" style={{marginTop:16}}>
            {[...groupedAwards.entries()].map(([awardName, rows]) => (
              <div className="card" key={awardName} style={{background:"var(--muted)"}}>
                <p className="eyebrow">{awardName}</p>
                <h2>{awardName}</h2>
                <div className="stack">
                  {rows.map((award) => (
                    <div
                      className="public-link-card"
                      key={`${awardName}-${award.rank}-${award.registration.user.username}`}
                    >
                      <strong>{award.registration.user.username}</strong>
                      <span className="muted text-sm">名次：{award.rank}</span>
                      <span className="text-sm">{award.work?.title ?? "未关联作品"}</span>
                      <span className="muted text-sm">{award.decisionReason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-3">
        <div className="card">
          <p className="eyebrow">获奖作品</p>
          <h2>获奖作品</h2>
          <div className="stack">
            {winningWorks.length ? (
              winningWorks.map((award) =>
                award.work?.href || award.work?.slug ? (
                  <a
                    className="public-link-card"
                    href={award.work.href ?? `/works/${award.work.slug}`}
                    key={`${award.awardName}-work-${award.work.title}`}
                  >
                    <strong>{award.work.title}</strong>
                    <span className="muted text-sm">{award.awardName}</span>
                    <span className="text-sm">{award.registration.user.username}</span>
                  </a>
                ) : (
                  <div
                    className="public-link-card"
                    key={`${award.awardName}-work-${award.work!.title}`}
                  >
                    <strong>{award.work!.title}</strong>
                    <span className="muted text-sm">{award.awardName}</span>
                    <span className="text-sm">{award.registration.user.username}</span>
                  </div>
                ),
              )
            ) : (
              <p className="muted">暂无公开获奖作品。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">骑行亮点</p>
          <h2>骑行亮点</h2>
          <div className="stack">
            {ridingSkillHighlights.length ? (
              ridingSkillHighlights.map((highlight, index) => (
                <div
                  className="public-link-card"
                  key={`${highlight.riderName}-${highlight.label}-${index}`}
                >
                  <strong>{highlight.riderName}</strong>
                  <span className="muted text-sm">{highlight.label}</span>
                </div>
              ))
            ) : (
              <p className="muted">暂无已发布的骑行亮点。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">评审总结入口</p>
          <h2>评审总结</h2>
          <a
            className="button-secondary"
            href={`/races/${buildRaceSlug(race.id, race.title)}/review`}
          >
            查看评审总结
          </a>
        </div>
      </div>
    </div>
  );
}
