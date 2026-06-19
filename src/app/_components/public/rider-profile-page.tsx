export function RiderProfilePageView({
  username,
  featuredRaceTitle,
  featuredWorkTitle,
  judgeComments,
  orgLabel,
  performanceSummary,
  publicWorkLinks,
  raceCount,
  raceRecords,
  reportSummaries,
  skillTags,
  workCount,
}: {
  username: string;
  featuredRaceTitle: null | string;
  featuredWorkTitle: null | string;
  judgeComments: Array<{
    raceTitle: string;
    summary: string;
  }>;
  orgLabel: string;
  performanceSummary: {
    averageProgressPercent: number;
    riskCount: number;
    totalTokens: number;
  };
  raceCount: number;
  raceRecords: Array<{
    raceId: string;
    raceSlug: string;
    raceTitle: string;
    phase: string;
    awardScore: null | number;
    awardNames: string[];
    comment: null | string;
    evidenceCount: number;
    workTitle: null | string;
  }>;
  publicWorkLinks: Array<{
    title: string;
    href: string;
  }>;
  reportSummaries: string[];
  skillTags: string[];
  workCount: number;
}) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">骑手档案</p>
        <h1>{username}</h1>
      </section>

      <section className="panel">
        <p className="eyebrow">公开资产</p>
        <h2>能力概览</h2>
        <div className="stack">
          <p>学校 / 组织：{orgLabel}</p>
          <p>代表赛事：{featuredRaceTitle ?? "待补充"}</p>
          <p>代表作品：{featuredWorkTitle ?? "待补充"}</p>
          <p>赛事数量：{raceCount}</p>
          <p>公开作品数：{workCount}</p>
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">骑行能力</p>
          <h2>能力标签</h2>
          <div className="stack">
            {skillTags.length ? (
              skillTags.map((tag) => (
                <span className="file-chip" key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <p className="muted">暂无已生成的能力标签。</p>
            )}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">表现摘要</p>
          <h2>成本 / 进度 / 风险</h2>
          <div className="stack">
            <p>总 Tokens：{performanceSummary.totalTokens}</p>
            <p>平均进度：{performanceSummary.averageProgressPercent}%</p>
            <p>风险数量：{performanceSummary.riskCount}</p>
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">参赛记录</p>
          <h2>报名、获奖与作品</h2>
          <div className="stack">
            {raceRecords.map((record) => (
              <a
                className="public-link-card"
                href={`/races/${record.raceSlug}`}
                key={record.raceId}
              >
                <strong>{record.raceTitle}</strong>
                <span>阶段：{record.phase}</span>
                <span>获奖名次：{record.awardScore ?? "待补充"}</span>
                <span>
                  奖项：{record.awardNames.length ? record.awardNames.join(", ") : "无"}
                </span>
                <span>作品：{record.workTitle ?? "待补充"}</span>
                <span>证据数：{record.evidenceCount}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">报告与摘要</p>
          <h2>已发布摘要</h2>
          <div className="stack">
            {reportSummaries.length ? (
              reportSummaries.map((summary, index) => (
                <blockquote className="comment-card" key={`${index}-${summary}`}>
                  {summary}
                </blockquote>
              ))
            ) : (
              <p className="muted">暂无已发布的骑手报告。</p>
            )}
            {raceRecords
              .filter((record) => record.comment)
              .map((record) => (
                <blockquote className="comment-card" key={`${record.raceId}-comment`}>
                  {record.comment}
                </blockquote>
              ))}
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">评委评语</p>
          <h2>评审记录</h2>
          <div className="stack">
            {judgeComments.length ? (
              judgeComments.map((comment, index) => (
                <blockquote className="comment-card" key={`${comment.raceTitle}-${index}`}>
                  {comment.raceTitle}: {comment.summary}
                </blockquote>
              ))
            ) : (
              <p className="muted">暂无公开评委评语。</p>
            )}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">公开作品</p>
          <h2>作品链接</h2>
          <div className="stack">
            {publicWorkLinks.length === 0 ? (
              <p className="muted">暂无公开作品链接。</p>
            ) : (
              publicWorkLinks.map((work) => (
                <a className="public-link-card" href={work.href} key={work.href}>
                  <strong>{work.title}</strong>
                </a>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
