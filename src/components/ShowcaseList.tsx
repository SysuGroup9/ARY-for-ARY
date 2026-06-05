import type { RidingHighlight, TeamComment } from "../types";

interface ShowcaseListProps {
  highlights: RidingHighlight[];
  teamComments: TeamComment[];
}

export function ShowcaseList({
  highlights,
  teamComments,
}: ShowcaseListProps) {
  return (
    <div className="showcase-grid">
      <div className="panel">
        <h3>Riding Highlights</h3>
        {highlights.length === 0 ? (
          <p className="muted">Organizer 尚未发布亮点。</p>
        ) : (
          highlights.map((highlight, index) => (
            <article className="highlight-card" key={highlight.teamId}>
              <div className="highlight-card__header">
                <strong>
                  #{index + 1} {highlight.teamName}
                </strong>
                <span>{highlight.agentType}</span>
              </div>
              <p>{highlight.excerpt}</p>
              <pre>{highlight.codeSnippet}</pre>
            </article>
          ))
        )}
      </div>

      <div className="panel">
        <h3>Organizer Team Comments</h3>
        {teamComments.length === 0 ? (
          <p className="muted">暂无针对队伍的赛后评论。</p>
        ) : (
          teamComments.map((item) => (
            <article className="comment-card" key={item.teamId}>
              <strong>{item.teamId}</strong>
              <p>{item.content}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
