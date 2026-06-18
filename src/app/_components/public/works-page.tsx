import { buildWorkSlug } from "@/lib/public-site";
import type { RaceListItem } from "@/lib/services/races";

export function WorksPageView({ race }: { race: RaceListItem }) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Works</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前页面是按 `grs003` 拆出的公开作品集合页，第一阶段先复用 highlights 作为公开作品入口。
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Featured Works</p>
        <h2>作品列表</h2>
        <p className="muted">
          当前阶段先补最小排序和公开作品集合；完整筛选器后续继续收口。
        </p>
        <div className="button-row-inline" style={{ marginBottom: "1rem" }}>
          <span className="file-chip">排序：按分数降序</span>
          <span className="file-chip">范围：仅公开作品</span>
        </div>
        <div className="stack">
          {race.highlights.length === 0 ? (
            <p className="muted">当前暂无公开作品。</p>
          ) : (
            race.highlights.map((highlight) => (
              <a
                className="public-link-card"
                href={`/works/${buildWorkSlug(race.id, highlight.teamId, highlight.team.name)}`}
                key={highlight.id}
              >
                <strong>{highlight.team.name}</strong>
                <span>
                  作者：
                  {race.teams.find((team) => team.id === highlight.teamId)?.captain.username ??
                    "未知"}
                </span>
                <span>{highlight.excerpt}</span>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
