import HeroCarousel from "@/app/_components/hero-carousel";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";
type M = ReturnTypeOfBuildPublicSiteModel;

export function HomeGallery({ model, canManage, canRide }: { model: M; canManage: boolean; canRide: boolean }) {
  return (
    <div className="stack" style={{ gap: "var(--space-8)" }}>
      {/* 赛事画廊 — 双排反向自动滚动 */}
      <section>
        <div className="section-label"><span className="section-label__dot section-label__dot--live" />赛事画廊</div>
        <HeroCarousel races={model.featuredRaces} />
      </section>

      {/* 赛果 + 作品 — 双卡并排 */}
      {model.latestResults.length > 0 && (
        <section>
          <div className={model.featuredWorks.length > 0 ? "grid-2" : ""} style={{alignItems:"start"}}>
            <div className="card">
              <div className="section-label"><span className="section-label__dot" />🏆 最新赛果</div>
              <div className="stack" style={{marginTop:12}}>
                {model.latestResults.slice(0, 3).map((race) => (
                  <a className="public-link-card" href={`/races/${race.slug}/results`} key={race.id}>
                    <strong style={{fontSize:"0.9375rem"}}>{race.title}</strong>
                    <span className="muted text-sm">{race.summary}</span>
                  </a>
                ))}
                {model.latestResults.length > 3 && (
                  <a className="public-link-card" href="/races" style={{textAlign:"center"}}>
                    <span className="muted text-sm">查看全部 {model.latestResults.length} 场赛果 →</span>
                  </a>
                )}
              </div>
            </div>
            {model.featuredWorks.length > 0 && (
              <div className="card">
                <div className="section-label"><span className="section-label__dot" />⭐ 精选作品</div>
                <div className="stack" style={{marginTop:12}}>
                  {model.featuredWorks.slice(0, 3).map((work) => (
                    <a className="public-link-card" href={`/works/${work.id}`} key={work.id}>
                      <strong style={{fontSize:"0.9375rem"}}>{work.title}</strong>
                      <span className="muted text-sm">作者：{work.author}</span>
                    </a>
                  ))}
                  {model.featuredWorks.length > 3 && (
                    <a className="public-link-card" href="/works" style={{textAlign:"center"}}>
                      <span className="muted text-sm">查看全部 {model.featuredWorks.length} 件作品 →</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 优秀骑手 */}
      {model.featuredRiders.length > 0 && (
        <section>
          <div className="card">
            <div className="section-label"><span className="section-label__dot" />优秀骑手</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginTop:12}}>
              {model.featuredRiders.slice(0, 6).map((rider) => (
                <a
                  href={`/riders/${rider.riderSlug}`} key={rider.id}
                  style={{
                    display:"flex", alignItems:"center", gap:12, padding:12,
                    borderRadius:"var(--radius-md)", textDecoration:"none", color:"inherit",
                  }}
                  className="rider-row"
                >
                  <div style={{
                    width:40, height:40, borderRadius:"var(--radius-full)",
                    background:"linear-gradient(135deg,var(--accent),var(--accent-secondary))",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontWeight:700, fontSize:16, flexShrink:0,
                  }}>
                    {rider.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{minWidth:0}}>
                    <strong style={{fontSize:"0.9375rem",display:"block"}}>{rider.username}</strong>
                    <span className="muted text-xs">{rider.raceCount} 赛事 · {rider.workCount} 作品</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

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
