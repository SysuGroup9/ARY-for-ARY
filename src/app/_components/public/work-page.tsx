export function WorkPageView({
  title,
  excerpt,
  raceTitle,
  raceSlug,
  author,
  judgeComments,
  score,
  demoUrl,
  repoUrl,
  techNotes,
  videoUrl,
  evidenceSummaries,
  awards,
}: {
  title: string;
  excerpt: string;
  raceTitle: string;
  raceSlug: string;
  author: string;
  judgeComments: Array<{ judgeName: string; summary: string }>;
  score: number;
  demoUrl: string;
  repoUrl: string;
  techNotes: string;
  videoUrl: string;
  evidenceSummaries: string[];
  awards: Array<{ awardName: string; rank: number }>;
}) {
  const hasMedia = demoUrl || repoUrl || videoUrl;

  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">作品详情</p>
        <h1>{title}</h1>
        <p className="muted">作者：{author}</p>
        <p className="muted">{excerpt}</p>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">作品概览</p>
          <h2>作品资产</h2>
          <div className="stack">
            <p className="muted">已发布分数信号：{score}</p>
            <p>
              当前页面围绕公开作品资产、已发布奖项、公开 Evidence 和评审上下文组织内容，用于承载赛后传播与复盘。
            </p>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">演示 / 媒体</p>
          <h2>公开链接</h2>
          <div className="stack">
            {demoUrl ? (
              <a className="button-secondary" href={demoUrl}>
                打开演示
              </a>
            ) : null}
            {repoUrl ? (
              <a className="button-secondary" href={repoUrl}>
                打开仓库
              </a>
            ) : null}
            {videoUrl ? (
              <a className="button-secondary" href={videoUrl}>
                打开视频
              </a>
            ) : null}
            {!hasMedia ? (
              <p className="muted">
                暂无已发布的公开演示、仓库或视频链接。
              </p>
            ) : null}
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">技术说明</p>
          <h2>方案说明</h2>
          <div className="stack">
            {techNotes ? (
              <p>{techNotes}</p>
            ) : (
              <p className="muted">暂无已发布的技术说明。</p>
            )}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">证据摘要</p>
          <h2>公开证据</h2>
          <div className="stack">
            {evidenceSummaries.length ? (
              evidenceSummaries.map((summary, index) => (
                <div className="public-link-card" key={`${index}-${summary}`}>
                  <span>{summary}</span>
                </div>
              ))
            ) : (
              <p className="muted">暂无已发布的公开证据。</p>
            )}
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">奖项</p>
          <h2>已发布奖项</h2>
          <div className="stack">
            {awards.length ? (
              awards.map((award) => (
                <div
                  className="public-link-card"
                  key={`${award.awardName}-${award.rank}`}
                >
                  <strong>{award.awardName}</strong>
                  <span>名次：{award.rank}</span>
                </div>
              ))
            ) : (
              <p className="muted">暂无已发布奖项。</p>
            )}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">评委评语</p>
          <h2>评审上下文</h2>
          <div className="stack">
            {judgeComments.length ? (
              judgeComments.map((comment, index) => (
                <div
                  className="public-link-card"
                  key={`${comment.judgeName}-${index}`}
                >
                  <strong>{comment.judgeName}</strong>
                  <span>{comment.summary}</span>
                </div>
              ))
            ) : (
              <p className="muted">暂无已发布的公开评委评语。</p>
            )}
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">赛事上下文</p>
          <h2>返回赛事</h2>
          <a className="button-secondary" href={`/races/${raceSlug}`}>
            返回 {raceTitle}
          </a>
        </section>
      </section>
    </div>
  );
}
