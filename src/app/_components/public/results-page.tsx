import { buildRaceSlug } from "@/lib/public-site";
import type { RaceListItem } from "@/lib/services/races";
import { getAgentLabel } from "@/lib/services/submissions";

export function ResultsPageView({ race }: { race: RaceListItem }) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Results</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前页面作为最终结果页，明确与过程展示分离，不再把过程榜单伪装成赛后结果。
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Award Leaderboard</p>
        <h2>最终榜单</h2>
        {race.leaderboardEntries.length === 0 ? (
          <p className="muted">最终公开结果尚未发布。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>排名</th>
                <th>队伍</th>
                <th>总分</th>
                <th>Agent</th>
              </tr>
            </thead>
            <tbody>
              {race.leaderboardEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.rank}</td>
                  <td>{entry.team.name}</td>
                  <td>{entry.totalScore}</td>
                  <td>{getAgentLabel(entry.agentType)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Winning Works</p>
          <h2>获奖作品</h2>
          <div className="stack">
            {race.highlights.length === 0 ? (
              <p className="muted">当前暂无公开获奖作品。</p>
            ) : (
              race.highlights.map((highlight) => (
                <div className="public-link-card" key={highlight.id}>
                  <strong>{highlight.team.name}</strong>
                  <span>{highlight.excerpt}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Review Entry</p>
          <h2>评审总结入口</h2>
          <a className="button-secondary" href={`/races/${buildRaceSlug(race.id, race.title)}/review`}>
            查看 Review
          </a>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">Riding Skill Highlights</p>
        <h2>骑行能力亮点</h2>
        <div className="stack">
          {race.highlights.length === 0 ? (
            <p className="muted">当前暂无公开骑行能力亮点。</p>
          ) : (
            race.highlights.map((highlight) => (
              <div className="public-link-card" key={`${highlight.id}-skill`}>
                <strong>{highlight.team.name}</strong>
                <span>{highlight.excerpt}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
