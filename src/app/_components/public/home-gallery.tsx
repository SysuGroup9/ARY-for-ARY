import { formatDateTime } from "@/lib/format";
import type { RaceListItem } from "@/lib/services/races";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";

type PublicHomeModel = ReturnTypeOfBuildPublicSiteModel;

export function HomeGallery({
  model,
  canManage,
  canRide,
}: {
  model: PublicHomeModel;
  canManage: boolean;
  canRide: boolean;
}) {
  return (
    <div className="public-gallery">
      <section className="panel">
        <p className="eyebrow">主推赛事</p>
        <h2>赛事画廊</h2>
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
                {(race.phase === "active" || race.phase === "frozen") && (
                  <a className="button-secondary" href={`/races/${race.slug}/live`}>
                    查看实况大厅
                  </a>
                )}
                {race.phase === "finished" && (
                  <a className="button-secondary" href={`/races/${race.slug}/results`}>
                    查看赛果
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">最新赛果</p>
          <h2>最新赛果</h2>
          <div className="stack">
            {model.latestResults.length === 0 ? (
              <p className="muted">暂无已结束赛事。</p>
            ) : (
              model.latestResults.map((race) => (
                <a className="public-link-card" href={`/races/${race.slug}/results`} key={race.id}>
                  <strong>{race.title}</strong>
                  <span>{race.summary}</span>
                </a>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">精选作品</p>
          <h2>精选作品</h2>
          <div className="stack">
            {model.featuredWorks.length === 0 ? (
              <p className="muted">暂无公开作品。</p>
            ) : (
              model.featuredWorks.map((work) => (
                <a className="public-link-card" href={`/works/${work.id}`} key={work.id}>
                  <strong>{work.title}</strong>
                  <span>作者：{work.author}</span>
                  <span>{work.excerpt}</span>
                </a>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">优秀骑手</p>
          <h2>优秀骑手</h2>
          <div className="stack">
            {model.featuredRiders.map((rider) => (
              <a className="public-link-card" href={`/riders/${rider.riderSlug}`} key={rider.id}>
                <strong>{rider.username}</strong>
                <span>{rider.orgLabel}</span>
                <span>代表赛事：{rider.featuredRaceTitle ?? "待补充"}</span>
                <span>代表作品：{rider.featuredWorkTitle ?? "待补充"}</span>
                <span>{rider.raceCount} 场赛事 / {rider.workCount} 个公开作品</span>
              </a>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">合作入口</p>
          <h2>合作入口</h2>
          <div className="stack">
            <p className="muted">
              按 `grs003` 的公开站要求，合作入口应独立存在，而不是埋在赛事面板或后台说明中。
            </p>
            <a className="button" href="/cooperation">
              进入合作页面
            </a>
            {(canManage || canRide) && (
              <p className="muted">
                控制台 / 工作台入口保留为次级能力，不占公开首页主视觉。
              </p>
            )}
          </div>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">往届赛事</p>
        <h2>往届赛事</h2>
        <div className="stack">
          {model.pastRaces.length === 0 ? (
            <p className="muted">暂无已归档赛事。</p>
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

      <section className="panel">
        <p className="eyebrow">行动入口</p>
        <h2>骑手注册 / 报名 / 办赛 / 合作</h2>
        <div className="stack">
          <p className="muted">
            公开站先完成骑手注册或登录，再进入具体赛事执行报名；控制台入口只对具备对应角色的用户显示。
          </p>
          <div className="button-row-inline">
            <a className="button-secondary" href="/login">
              骑手注册 / 登录
            </a>
            <a className="button-secondary" href="/races">
              查看赛事报名页
            </a>
            {canRide ? (
              <a className="button-secondary" href="/console/races">
                继续参赛
              </a>
            ) : null}
            {canRide ? (
              <a className="button-secondary" href="/console/races">
                提交赛后材料
              </a>
            ) : null}
            <a className="button-secondary" href="/races/new">
              我要办赛
            </a>
            <a className="button-secondary" href="/cooperation">
              我要赞助
            </a>
            <a className="button-secondary" href="/cooperation">
              我要合作
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export type HomeGalleryRace = RaceListItem & { slug: string };
