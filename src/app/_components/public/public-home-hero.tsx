import { formatDateTime } from "@/lib/format";
import { getRacePrimaryCta } from "@/lib/public-site";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";

export function PublicHomeHero({ model }: { model: ReturnTypeOfBuildPublicSiteModel }) {
  const featured = model.featuredRaces[0] ?? null;
  if (!featured) return null;
  const cta = getRacePrimaryCta(featured);

  return (
    <section className="hero">
      <div className="section-label">
        <span className="section-label__dot section-label__dot--live" />主推赛事
      </div>
      <h1>
        <span className="gradient-text">{featured.title}</span>
      </h1>
      <p>{featured.summary}</p>

      <div className="card" style={{
        maxWidth: 720,
        margin: "0 auto",
        marginTop: 32,
        padding: "24px 32px",
      }}>
        <div className="detail-grid">
          <div><dt>当前状态</dt><dd>{featured.phase}</dd></div>
          <div><dt>赛事时间</dt><dd style={{fontSize:"0.8125rem"}}>{formatDateTime(featured.raceStart)} - {formatDateTime(featured.raceEnd)}</dd></div>
          <div><dt>活跃骑手</dt><dd>{featured.activeRiderCount} 人</dd></div>
          <div><dt>已提交作品</dt><dd>{featured.workCount} 件</dd></div>
          <div><dt>当前进度</dt><dd>{featured.currentProgressPercent}%</dd></div>
        </div>
      </div>

      <div className="flex-row" style={{ justifyContent: "center", marginTop: 28 }}>
        <a className="button" href={cta.href} style={{height:52,paddingLeft:32,paddingRight:32,fontSize:"1rem"}}>
          {cta.label} →
        </a>
        <a className="button-secondary" href={`/races/${featured.slug}`} style={{height:52,fontSize:"0.9375rem"}}>
          进入赛事页
        </a>
      </div>

      {model.liveRaces.length > 1 && (
        <div style={{ marginTop: 32 }}>
          <strong style={{fontSize:14,color:"var(--muted-foreground)"}}>进行中赛事</strong>
          <div className="flex-row" style={{justifyContent:"center",marginTop:8}}>
            {model.liveRaces.map((race) => (
              <a className="button-ghost" href={`/races/${race.slug}/live`} key={race.id}
                style={{fontSize:13,padding:"6px 16px",minHeight:36,borderRadius:"var(--radius-full)"}}>
                {race.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
