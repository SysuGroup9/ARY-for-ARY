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
      <div className="card">
        <p className="eyebrow">骑手档案</p>
        <h1>{username}</h1>
      </div>

      <div className="card">
        <p className="eyebrow">公开资产</p>
        <h2>能力概览</h2>
        <div className="detail-grid" style={{marginTop:12}}>
          <div><dt>学校 / 组织</dt><dd>{orgLabel}</dd></div>
          <div><dt>代表赛事</dt><dd>{featuredRaceTitle ?? "待补充"}</dd></div>
          <div><dt>代表作品</dt><dd>{featuredWorkTitle ?? "待补充"}</dd></div>
          <div><dt>赛事数量</dt><dd>{raceCount}</dd></div>
          <div><dt>公开作品数</dt><dd>{workCount}</dd></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">骑行能力</p>
          <h2>能力标签</h2>
          <div className="flex-row" style={{marginTop:8}}>
            {skillTags.length ? (
              skillTags.map((tag) => (
                <span className="file-chip" key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <p className="muted text-sm">暂无已生成的能力标签。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">表现摘要</p>
          <h2>成本 / 进度 / 风险</h2>
          <div className="detail-grid" style={{marginTop:12}}>
            <div><dt>总 Tokens</dt><dd>{performanceSummary.totalTokens}</dd></div>
            <div><dt>平均进度</dt><dd>{performanceSummary.averageProgressPercent}%</dd></div>
            <div><dt>风险数量</dt><dd>{performanceSummary.riskCount}</dd></div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
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
                <span className="muted text-sm">阶段：{record.phase}</span>
                <span className="text-sm">获奖名次：{record.awardScore ?? "待补充"}</span>
                <span className="muted text-sm">
                  奖项：{record.awardNames.length ? record.awardNames.join(", ") : "无"}
                </span>
                <span className="text-sm">作品：{record.workTitle ?? "待补充"}</span>
                <span className="muted text-sm">证据数：{record.evidenceCount}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
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
              <p className="muted text-sm">暂无已发布的骑手报告。</p>
            )}
            {raceRecords
              .filter((record) => record.comment)
              .map((record) => (
                <blockquote className="comment-card" key={`${record.raceId}-comment`}>
                  {record.comment}
                </blockquote>
              ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
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
              <p className="muted text-sm">暂无公开评委评语。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">公开作品</p>
          <h2>作品链接</h2>
          <div className="stack">
            {publicWorkLinks.length === 0 ? (
              <p className="muted text-sm">暂无公开作品链接。</p>
            ) : (
              publicWorkLinks.map((work) => (
                <a className="public-link-card" href={work.href} key={work.href}>
                  <strong>{work.title}</strong>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
