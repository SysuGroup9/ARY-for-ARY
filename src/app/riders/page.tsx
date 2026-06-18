import { Panel, aryStyles } from "@/app/_components/ary-shared";
import { PublicHeader } from "@/app/_components/public/public-header";
import { loadDatabaseUser } from "@/lib/auth";
import { buildPublicSiteModel } from "@/lib/public-site";
import { listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

export default async function RidersIndexPage() {
  const sessionUser = await loadDatabaseUser();
  const races = await listRaces();
  const model = buildPublicSiteModel(races);

  return (
    <main>
      <PublicHeader hasSession={!!sessionUser} />
      <section className="shell shell--public-only">
        <section className="content content--public">
          <Panel title="Riders" eyebrow="Featured Riders">
            <div className="stack" style={{ marginBottom: "1rem" }}>
              <p className="muted">当前索引页优先展示公开骑手资产，不扩展成完整社交主页。</p>
            </div>
            <div className="stack">
              {model.featuredRiders.map((rider) => (
                <a className="public-link-card" href={`/riders/${rider.riderSlug}`} key={rider.id}>
                  <strong>{rider.username}</strong>
                  <span>{rider.orgLabel}</span>
                  <span>代表赛事：{rider.featuredRaceTitle ?? "待补充"}</span>
                  <span>代表作品：{rider.featuredWorkTitle ?? "待补充"}</span>
                  <span>{rider.raceCount} 场赛事 / {rider.workCount} 个公开作品</span>
                </a>
              ))}
            </div>
          </Panel>
        </section>
      </section>
      <style>{aryStyles}</style>
    </main>
  );
}
