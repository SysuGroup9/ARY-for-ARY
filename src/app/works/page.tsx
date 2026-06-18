import { Panel, aryStyles } from "@/app/_components/ary-shared";
import { PublicHeader } from "@/app/_components/public/public-header";
import { loadDatabaseUser } from "@/lib/auth";
import { buildPublicSiteModel, sortFeaturedWorks } from "@/lib/public-site";
import { listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

export default async function WorksIndexPage() {
  const sessionUser = await loadDatabaseUser();
  const races = await listRaces();
  const model = buildPublicSiteModel(races);
  const works = sortFeaturedWorks(model.featuredWorks, "score");

  return (
    <main>
      <PublicHeader hasSession={!!sessionUser} />
      <section className="shell shell--public-only">
        <section className="content content--public">
          <Panel title="Works" eyebrow="Public Works">
            <div className="stack" style={{ marginBottom: "1rem" }}>
              <p className="muted">
                当前先提供最小排序视图：按分数降序展示公开作品。筛选器后续再补到完整 `grs003` 语义。
              </p>
            </div>
          </Panel>

          <section className="grid">
            <Panel title="赛事上下文" eyebrow="Race Context">
              <div className="stack">
                <p className="muted">
                  当前公开作品来自已结束赛事的 highlights 数据，后续会进一步区分不同 Race 的公开作品集合。
                </p>
                <a className="button-secondary" href="/races">
                  返回 Races
                </a>
              </div>
            </Panel>

            <Panel title="筛选与排序" eyebrow="Filter / Sort">
              <div className="stack">
                <span className="file-chip">排序：按分数降序</span>
                <span className="file-chip">范围：仅公开作品</span>
              </div>
            </Panel>
          </section>

          <Panel title="作品卡片" eyebrow="Work Cards">
            <div className="stack">
              {works.length === 0 ? (
                <p className="muted">暂无公开作品。</p>
              ) : (
                works.map((work) => (
                  <a className="public-link-card" href={`/works/${work.id}`} key={work.id}>
                    <strong>{work.title}</strong>
                    <span>作者：{work.author}</span>
                    <span>所属赛事：{work.raceTitle}</span>
                    <span>评审结果摘要：{work.score}</span>
                    <span>{work.excerpt}</span>
                  </a>
                ))
              )}
            </div>
          </Panel>

          <Panel title="精选作品" eyebrow="Featured Works">
            <div className="stack">
              {works.length === 0 ? (
                <p className="muted">当前暂无精选作品。</p>
              ) : (
                works.slice(0, 3).map((work) => (
                  <div className="public-link-card" key={`${work.id}-featured`}>
                    <strong>{work.title}</strong>
                    <span>作者：{work.author}</span>
                    <span>评审结果摘要：{work.score}</span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>
      </section>
      <style>{aryStyles}</style>
    </main>
  );
}
