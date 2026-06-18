import type { RaceListItem } from "@/lib/services/races";

export function LiveHallView({ race }: { race: RaceListItem }) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Live Hall</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前页面作为 `grs003` 第 1 片区的公开过程展示页，先用现有 read model 投影当前阶段、过程榜单和公开事件。
        </p>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Race Status</p>
          <h2>赛事状态</h2>
          <div className="stack">
            <p>当前阶段：{race.phase}</p>
            <p>参赛队伍：{race.teams.length}</p>
            <p>过程榜条目：{race.leaderboardEntries.length}</p>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Screen Entry</p>
          <h2>大屏入口</h2>
          <a className="button-secondary" href={`/jumbotron/${race.id}`}>
            打开 Jumbotron
          </a>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">Current Leaderboard</p>
        <h2>当前榜单</h2>
        {race.leaderboardEntries.length === 0 ? (
          <p className="muted">当前暂无过程榜单。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>排名</th>
                <th>队伍</th>
                <th>总分</th>
              </tr>
            </thead>
            <tbody>
              {race.leaderboardEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.rank}</td>
                  <td>{entry.team.name}</td>
                  <td>{entry.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
