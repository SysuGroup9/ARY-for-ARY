import { formatDateTime } from "@/lib/format";
import { getRacePrimaryCta } from "@/lib/public-site";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";

export function PublicHomeHero({
  model,
}: {
  model: ReturnTypeOfBuildPublicSiteModel;
}) {
  const featured = model.featuredRaces[0] ?? null;

  if (!featured) {
    return null;
  }

  const cta = getRacePrimaryCta(featured);

  return (
    <section className="panel">
      <p className="eyebrow">Hero / Featured Races</p>
      <h1>{featured.title}</h1>
      <p className="muted">{featured.summary}</p>
      <div className="detail-grid" style={{ marginTop: "1rem" }}>
        <div>
          <dt>当前状态</dt>
          <dd>{featured.phase}</dd>
        </div>
        <div>
          <dt>赛事时间</dt>
          <dd>
            {formatDateTime(featured.raceStart)} - {formatDateTime(featured.raceEnd)}
          </dd>
        </div>
        <div>
          <dt>活跃骑手数</dt>
          <dd>{featured.activeRiderCount}</dd>
        </div>
        <div>
          <dt>已提交作品数</dt>
          <dd>{featured.workCount}</dd>
        </div>
        <div>
          <dt>当前进度</dt>
          <dd>{featured.currentProgressPercent}%</dd>
        </div>
      </div>
      <div className="button-row-inline" style={{ marginTop: "1rem" }}>
        <a className="button" href={cta.href}>
          {cta.label}
        </a>
        <a className="button-secondary" href={`/races/${featured.slug}`}>
          进入赛事页
        </a>
      </div>
      {model.liveRaces.length > 1 ? (
        <div className="stack" style={{ marginTop: "1rem" }}>
          <strong>Live Race Switcher</strong>
          <div className="button-row-inline">
            {model.liveRaces.map((race) => (
              <a className="button-secondary" href={`/races/${race.slug}/live`} key={race.id}>
                {race.title}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
