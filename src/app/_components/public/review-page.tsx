import type { PublicRaceListItem } from "@/lib/services/public-routes";

export function ReviewPageView({
  race,
  awards,
  evidenceHighlights,
  judgingRecords,
  reviewReport,
}: {
  race: PublicRaceListItem;
  awards: Array<{
    awardName: string;
    decisionReason: string;
    registration: { user: { username: string } };
  }>;
  evidenceHighlights: Array<{
    summary: string;
    title: string;
  }>;
  judgingRecords: Array<{
    comments: string;
    judgeAssignment: { judge: { username: string }; work: { title: string } };
  }>;
  reviewReport: null | { body: string; summary: string; title: string };
}) {
  return (
    <div className="stack">
      <div className="card">
        <p className="eyebrow">评审总结</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前评审总结页只读取已发布的 `review_summary`、评委评语、公开 Evidence 和已发布奖项。
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">总结摘要</p>
          <h2>已发布总结</h2>
          {reviewReport ? (
            <div className="stack">
              <strong>{reviewReport.title}</strong>
              <p className="text-sm">{reviewReport.summary}</p>
              <blockquote className="comment-card">{reviewReport.body}</blockquote>
            </div>
          ) : (
            <p className="muted text-sm">暂无已发布的公开评审总结。</p>
          )}
        </div>

        <div className="card">
          <p className="eyebrow">获奖说明</p>
          <h2>已发布奖项</h2>
          <div className="stack">
            {awards.length ? (
              awards.map((award, index) => (
                <div className="public-link-card" key={`${award.awardName}-${index}`}>
                  <strong>{award.awardName}</strong>
                  <span className="muted text-sm">{award.registration.user.username}</span>
                  <span className="text-sm">{award.decisionReason}</span>
                </div>
              ))
            ) : (
              <p className="muted text-sm">暂无已发布奖项。</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">评委评语</p>
          <h2>评审记录</h2>
          <div className="stack">
            {judgingRecords.length ? (
              judgingRecords.map((record, index) => (
                <blockquote
                  className="comment-card"
                  key={`${record.judgeAssignment.work.title}-${index}`}
                >
                  {record.judgeAssignment.judge.username}: {record.comments}
                </blockquote>
              ))
            ) : (
              <p className="muted text-sm">暂无评委评语。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">典型案例</p>
          <h2>作品案例</h2>
          <div className="stack">
            {judgingRecords.length ? (
              judgingRecords.map((record, index) => (
                <div
                  className="public-link-card"
                  key={`${record.judgeAssignment.work.title}-case-${index}`}
                >
                  <strong>{record.judgeAssignment.work.title}</strong>
                  <span className="muted text-sm">{record.comments}</span>
                </div>
              ))
            ) : (
              <p className="muted text-sm">暂无公开典型案例。</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">证据摘要</p>
        <h2>公开证据摘要</h2>
        <div className="stack">
          {evidenceHighlights.length ? (
            evidenceHighlights.map((item, index) => (
              <div className="public-link-card" key={`${item.title}-${index}`}>
                <strong>{item.title}</strong>
                <span className="muted text-sm">{item.summary}</span>
              </div>
            ))
          ) : (
            <p className="muted text-sm">暂无公开证据摘要。</p>
          )}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">下一场建议</p>
        <h2>浏览更多赛事</h2>
        <a className="button-secondary" href="/races">
          返回赛事列表
        </a>
      </div>
    </div>
  );
}
