import type { RaceListItem } from "@/lib/services/races";

export function ReviewPageView({ race }: { race: RaceListItem }) {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Review</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前页面先以现有 organizer comment 和公开 highlight 数据承接 `grs003` 的 Review Summary / Featured Cases 骨架。
        </p>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Review Summary</p>
          <h2>评审总结</h2>
          {race.organizerComment ? (
            <blockquote className="comment-card">{race.organizerComment}</blockquote>
          ) : (
            <p className="muted">当前还没有已发布的公开 Review 内容。</p>
          )}
        </section>

        <section className="panel">
          <p className="eyebrow">Featured Cases</p>
          <h2>典型案例</h2>
          <div className="stack">
            {race.highlights.length === 0 ? (
              <p className="muted">当前暂无公开案例。</p>
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
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Award Rationale</p>
          <h2>获奖说明</h2>
          <p className="muted">
            当前先以公开赛果和 organizer 总评承接获奖说明，后续再接入正式 review summary。
          </p>
        </section>

        <section className="panel">
          <p className="eyebrow">Judge Comments</p>
          <h2>评委观点</h2>
          {race.teamComments.length === 0 ? (
            <p className="muted">当前暂无公开评委评语。</p>
          ) : (
            <div className="stack">
              {race.teamComments.map((comment) => (
                <blockquote className="comment-card" key={comment.id}>
                  {comment.team.name}：{comment.content}
                </blockquote>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">Next Race Suggestion</p>
        <h2>下一场建议</h2>
        <a className="button-secondary" href="/races">
          返回 Races 继续浏览
        </a>
      </section>
    </div>
  );
}
