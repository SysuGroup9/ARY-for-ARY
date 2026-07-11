import { formatDateTime } from "@/lib/format";
import { getRacePrimaryCta, groupPublicRacesByPhase } from "@/lib/public-site";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";
import { getRacePhaseLabel } from "@/lib/race-phase";

export function RacesIndexPageView({ model }: { model: ReturnTypeOfBuildPublicSiteModel }) {
  const grouped = groupPublicRacesByPhase(model.featuredRaces);
  const active = [...grouped.active, ...grouped.frozen];
  const upcoming = [...grouped.registration, ...grouped.preparation];

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section className="hero" style={{ textAlign: "left", padding: "32px 0 8px" }}>
        <div className="section-label"><span className="section-label__dot" />Races</div>
        <h1 style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>全部赛事</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: "100%" }}>赛事画廊的完整列表入口，按赛事阶段分组浏览。</p>
      </section>

      {model.featuredRaces.length > 0 && (
        <section>
          <div className="section-label"><span className="section-label__dot section-label__dot--live" />主推赛事</div>
          <div className="grid-3">
            {model.featuredRaces.map((race) => (
              <article className="public-card card-accent" key={race.id}>
                {(() => {
                  const primaryCta = getRacePrimaryCta(race);

                  return (
                    <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <strong>{race.title}</strong>
                  <span className="badge badge-accent">{getRacePhaseLabel(race.phase)}</span>
                </div>
                <p className="muted text-sm">{race.summary}</p>
                <small className="muted">{formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}</small>
                <div style={{ marginTop: 14 }}>
                  <a className="button-secondary" href={primaryCta.href} style={{ fontSize: 13, minHeight: 36 }}>
                    {primaryCta.label}
                  </a>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="section-label"><span className="section-label__dot section-label__dot--live" />进行中</div>
          <div className="stack" style={{ marginTop: 8 }}>
            {active.length === 0 ? <p className="muted text-sm">暂无进行中赛事。</p>
              : active.map((race) => {
                const cta = getRacePrimaryCta(race);

                return (
                <a className="public-link-card" href={cta.href} key={race.id}>
                  <strong>{race.title}</strong>
                  <span className="badge badge-accent">{getRacePhaseLabel(race.phase)}</span>
                  <span className="muted text-sm">{cta.label}</span>
                </a>
                );
              })}
          </div>
        </div>
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />报名中</div>
          <div className="stack" style={{ marginTop: 8 }}>
            {upcoming.length === 0 ? <p className="muted text-sm">暂无报名中赛事。</p>
              : upcoming.map((race) => {
                const cta = getRacePrimaryCta(race);

                return (
                <a className="public-link-card" href={cta.href} key={race.id}>
                  <strong>{race.title}</strong>
                  <span className="badge badge-accent">{getRacePhaseLabel(race.phase)}</span>
                  <span className="muted text-sm">{cta.label}</span>
                </a>
                );
              })}
          </div>
        </div>
      </div>

      {model.pastRaces.length > 0 && (
        <div className="card" style={{background:"var(--muted)",boxShadow:"var(--shadow-ring)"}}>
          <div className="section-label"><span className="section-label__dot" />往届赛事</div>
          <div className="grid-3" style={{ marginTop: 8 }}>
            {model.pastRaces.map((race) => (
              <a className="public-link-card" href={`/races/${race.slug}/results`} key={race.id}>
                <strong>{race.title}</strong>
                <span className="muted text-sm">{race.summary}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
