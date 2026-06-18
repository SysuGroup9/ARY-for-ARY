import { formatDateTime } from "@/lib/format";
import { groupPublicRacesByPhase } from "@/lib/public-site";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";

export function RacesIndexPageView({
  model,
}: {
  model: ReturnTypeOfBuildPublicSiteModel;
}) {
  const grouped = groupPublicRacesByPhase(model.featuredRaces);

  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Races</p>
        <h1>All Races</h1>
        <p className="muted">
          `/races` 是 `grs003` 里 Home / Race Gallery 的完整赛事列表入口，不应只是首页的副本。
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Featured Races</p>
        <h2>当前主推赛事</h2>
        <div className="public-cards">
          {model.featuredRaces.map((race) => (
            <article className="public-card" key={race.id}>
              <div className="public-card__top">
                <strong>{race.title}</strong>
                <span>{race.phase}</span>
              </div>
              <p>{race.summary}</p>
              <small>
                {formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}
              </small>
              <div className="button-row-inline" style={{ marginTop: "0.9rem" }}>
                <a className="button-secondary" href={`/races/${race.slug}`}>
                  进入赛事页
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Active / Registration</p>
          <h2>当前赛事分组</h2>
          <div className="stack">
            <div>
              <strong>进行中 / 封榜中</strong>
              <div className="stack">
                {[...grouped.active, ...grouped.frozen].map((race) => (
                  <a className="public-link-card" href={`/races/${race.slug}`} key={race.id}>
                    <strong>{race.title}</strong>
                    <span>{race.phase}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <strong>报名中 / 准备中</strong>
              <div className="stack">
                {[...grouped.registration, ...grouped.preparation].map((race) => (
                  <a className="public-link-card" href={`/races/${race.slug}`} key={race.id}>
                    <strong>{race.title}</strong>
                    <span>{race.phase}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Past Races</p>
          <h2>已结束赛事</h2>
          <div className="stack">
            {model.pastRaces.length === 0 ? (
              <p className="muted">暂无往届赛事。</p>
            ) : (
              model.pastRaces.map((race) => (
                <a className="public-link-card" href={`/races/${race.slug}/results`} key={race.id}>
                  <strong>{race.title}</strong>
                  <span>{race.summary}</span>
                </a>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
