import { formatDateTime } from "@/lib/format";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";
type M = ReturnTypeOfBuildPublicSiteModel;

export function HomeGallery({ model, canManage, canRide }: { model: M; canManage: boolean; canRide: boolean }) {
  return (
    <div className="stack" style={{ gap: "var(--space-8)" }}>
      {/* 赛事画廊 */}
      <section>
        <div className="section-label"><span className="section-label__dot" />赛事画廊</div>
        <div className="grid-3">
          {model.featuredRaces.map((race) => (
            <article className="card card-accent" key={race.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <strong style={{ fontSize: "1rem", lineHeight: 1.3 }}>{race.title}</strong>
                <span className="badge badge-accent" style={{ flexShrink: 0 }}>{race.phase}</span>
              </div>
              <p className="muted text-sm" style={{ marginBottom: 12, lineHeight: 1.6 }}>{race.summary}</p>
              <small className="muted" style={{ fontSize: "0.8rem" }}>{formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}</small>
              <div className="flex-row" style={{ marginTop: 16 }}>
                <a className="button-secondary" href={`/races/${race.slug}`} style={{ fontSize: 13, minHeight: 36 }}>
                  进入赛事页
                </a>
                {race.phase === "active" || race.phase === "frozen" ? (
                  <a className="button-secondary" href={`/races/${race.slug}/live`} style={{ fontSize: 13, minHeight: 36 }}>实况大厅</a>
                ) : race.phase === "finished" ? (
                  <a className="button-secondary" href={`/races/${race.slug}/results`} style={{ fontSize: 13, minHeight: 36 }}>查看赛果</a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 赛果 + 作品 */}
      <div className="grid-2">
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />最新赛果</div>
          <div className="stack">
            {model.latestResults.length === 0 ? <p className="muted text-sm">暂无已结束赛事。</p>
              : model.latestResults.map((race) => (
                <a className="public-link-card" href={`/races/${race.slug}/results`} key={race.id}>
                  <strong style={{fontSize:"0.9375rem"}}>{race.title}</strong>
                  <span className="muted text-sm">{race.summary}</span>
                </a>
              ))}
          </div>
        </div>
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />精选作品</div>
          <div className="stack">
            {model.featuredWorks.length === 0 ? <p className="muted text-sm">暂无公开作品。</p>
              : model.featuredWorks.map((work) => (
                <a className="public-link-card" href={`/works/${work.id}`} key={work.id}>
                  <strong style={{fontSize:"0.9375rem"}}>{work.title}</strong>
                  <span className="muted text-sm">作者：{work.author}</span>
                </a>
              ))}
          </div>
        </div>
      </div>

      {/* 骑手 + 合作 */}
      <div className="grid-2" style={{alignItems:"start"}}>
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />优秀骑手</div>
          <div className="stack">
            {model.featuredRiders.slice(0, 4).map((rider) => (
              <a className="public-link-card" href={`/riders/${rider.riderSlug}`} key={rider.id}>
                <strong style={{fontSize:"0.9375rem"}}>{rider.username}</strong>
                <span className="muted text-sm">{rider.orgLabel} · {rider.raceCount} 场赛事 / {rider.workCount} 个作品</span>
              </a>
            ))}
            {model.featuredRiders.length > 4 && (
              <a className="public-link-card" href="/riders" style={{textAlign:"center"}}>
                <span className="muted text-sm">查看全部 {model.featuredRiders.length} 位骑手 →</span>
              </a>
            )}
          </div>
        </div>
        <div className="card" style={{display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:200}}>
          <div>
            <div className="section-label"><span className="section-label__dot" />合作入口</div>
            <p className="muted text-sm" style={{lineHeight:1.7}}>
              合作入口独立存在，不埋在赛事面板或后台说明中。无论你是想办赛、赞助还是技术合作，我们都欢迎你加入。
            </p>
          </div>
          <a className="button" href="/cooperation" style={{marginTop:16}}>进入合作页面 →</a>
        </div>
      </div>

      {/* 往届赛事 */}
      {model.pastRaces.length > 0 && (
        <div className="card" style={{background:"var(--muted)",boxShadow:"var(--shadow-ring)"}}>
          <div className="section-label"><span className="section-label__dot" />往届赛事</div>
          <div className="grid-3" style={{ marginTop: 8 }}>
            {model.pastRaces.map((race) => (
              <a className="public-link-card" href={`/races/${race.slug}/results`} key={race.id}>
                <strong style={{fontSize:"0.9375rem"}}>{race.title}</strong>
                <span className="muted text-sm">{race.summary}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 创作团队 */}
      <div className="section-dark" style={{ padding: "var(--space-8) var(--space-10)" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: 8, fontSize: "1.5rem" }}>Sysu-Group9</h2>
          <p style={{ marginBottom: 4, fontSize: "0.9375rem" }}>
            中山大学 · 软件工程 2024 级
          </p>
          <p style={{ fontSize: "0.8125rem", opacity: 0.6 }}>
            Agent Racing Yard — AI 编程代理竞赛平台
          </p>
        </div>
      </div>
    </div>
  );
}
