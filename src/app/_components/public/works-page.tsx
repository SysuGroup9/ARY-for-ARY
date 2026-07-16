import { buildWorkSlug } from "@/lib/public-site";
import type { PublicRaceListItem } from "@/lib/services/public-routes";

export function WorksPageView({ race }: { race: PublicRaceListItem }) {
  const publicWorks = race.registrations
    .filter((registration) => registration.team?.works?.[0])
    .map((registration) => {
      const work = registration.team!.works![0]!;
      return {
        author: registration.user.username,
        excerpt: work.summary,
        href: `/works/${buildWorkSlug(
          race.id,
          work.id,
          work.title,
        )}`,
        registrationId: registration.id,
        title: work.title,
      };
    });

  return (
    <div className="stack">
      <div className="card">
        <p className="eyebrow">作品</p>
        <h1>{race.title}</h1>
        <p className="muted">
          当前页面展示这场赛事已发布的公开作品，数据来源为 `Registration / Work`。
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">精选作品</p>
        <h2>已发布作品</h2>
        <p className="muted">
          这些公开作品卡片与作品详情页、骑手档案页共用同一条结果链路。
        </p>
        <div className="flex-row" style={{ marginBottom: "1rem" }}>
          <span className="file-chip">排序：按发布时间</span>
          <span className="file-chip">范围：仅公开作品</span>
        </div>
        <div className="grid-3" style={{marginTop:8}}>
          {publicWorks.length === 0 ? (
            <p className="muted">暂无已发布的公开作品。</p>
          ) : (
            publicWorks.map((work) => (
              <a className="public-link-card" href={work.href} key={work.registrationId}>
                <strong>{work.title}</strong>
                <span className="muted text-sm">作者：{work.author}</span>
                <span className="text-sm">{work.excerpt}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
