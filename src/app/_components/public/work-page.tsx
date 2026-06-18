export function WorkPageView({
  title,
  excerpt,
  raceTitle,
  raceSlug,
  author,
  codeSnippet,
  score,
}: {
  title: string;
  excerpt: string;
  raceTitle: string;
  raceSlug: string;
  author: string;
  codeSnippet: string;
  score: number;
}) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Work Page</p>
        <h1>{title}</h1>
        <p className="muted">作者：{author}</p>
        <p className="muted">{excerpt}</p>
      </section>
      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Work Summary</p>
          <h2>作品摘要</h2>
          <div className="stack">
            <p>公开成绩：{score}</p>
            <p>当前阶段用公开 highlight 作为作品亮点与说明来源。</p>
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Evidence</p>
          <h2>公开证据摘要</h2>
          <pre>{codeSnippet}</pre>
        </section>
      </section>
      <section className="panel">
        <p className="eyebrow">Race Context</p>
        <h2>赛事上下文入口</h2>
        <a className="button-secondary" href={`/races/${raceSlug}`}>
          返回 {raceTitle}
        </a>
      </section>
    </div>
  );
}
