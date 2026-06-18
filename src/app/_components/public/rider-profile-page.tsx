export function RiderProfilePageView({
  username,
  featuredRaceTitle,
  featuredWorkTitle,
  orgLabel,
  publicWorkLinks,
  raceCount,
  raceRecords,
  workCount,
}: {
  username: string;
  featuredRaceTitle: null | string;
  featuredWorkTitle: null | string;
  orgLabel: string;
  raceCount: number;
  raceRecords: Array<{
    raceId: string;
    raceSlug: string;
    raceTitle: string;
    phase: string;
    awardScore: null | number;
    workTitle: null | string;
    comment: null | string;
  }>;
  publicWorkLinks: Array<{
    title: string;
    href: string;
  }>;
  workCount: number;
}) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Rider Profile</p>
        <h1>{username}</h1>
      </section>
      <section className="panel">
        <p className="eyebrow">Public Asset</p>
        <h2>公开能力概览</h2>
        <div className="stack">
          <p>学校 / 单位：{orgLabel}</p>
          <p>代表赛事：{featuredRaceTitle ?? "待补充"}</p>
          <p>代表作品：{featuredWorkTitle ?? "待补充"}</p>
          <p>参赛场次：{raceCount}</p>
          <p>公开作品：{workCount}</p>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Agent Riding Skill</p>
        <h2>能力标签与表现摘要</h2>
        <ul className="bullet-list">
          <li>成本控制：基于公开成绩与作品数量做最小摘要</li>
          <li>进度表现：基于参赛记录阶段做最小摘要</li>
          <li>风险处理：当前仍待接入更细粒度公开证据</li>
          <li>纠偏案例：当前仍待接入更细粒度公开证据</li>
        </ul>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Race Records</p>
          <h2>参赛记录 / 获奖记录 / 作品记录</h2>
          <div className="stack">
            {raceRecords.map((record) => (
              <a className="public-link-card" href={`/races/${record.raceSlug}`} key={record.raceId}>
                <strong>{record.raceTitle}</strong>
                <span>阶段：{record.phase}</span>
                <span>成绩：{record.awardScore ?? "待补充"}</span>
                <span>作品：{record.workTitle ?? "待补充"}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Judge Comments / Evidence</p>
          <h2>评委评语与能力证据</h2>
          <div className="stack">
            {raceRecords.some((record) => record.comment) ? (
              raceRecords
                .filter((record) => record.comment)
                .map((record) => (
                  <blockquote className="comment-card" key={record.raceId}>
                    {record.comment}
                  </blockquote>
                ))
            ) : (
              <p className="muted">当前暂无公开评语，能力证据后续继续接入。</p>
            )}
          </div>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">Public Works</p>
        <h2>公开作品链接</h2>
        <div className="stack">
          {publicWorkLinks.length === 0 ? (
            <p className="muted">当前暂无公开作品链接。</p>
          ) : (
            publicWorkLinks.map((work) => (
              <a className="public-link-card" href={work.href} key={work.href}>
                <strong>{work.title}</strong>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
