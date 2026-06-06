import {
  HeroSection,
  PublicRaceSections,
  RaceBrowserPanel,
  aryStyles,
} from "@/app/_components/ary-shared";
import { groupRacesByPhase, listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

export default async function AudiencePage() {
  const races = await listRaces();
  const grouped = groupRacesByPhase(races);

  return (
    <main>
      <HeroSection mode="audience" />

      <section className="shell">
        <aside className="sidebar">
          <RaceBrowserPanel grouped={grouped} />
        </aside>

        <section className="content">
          {races.length === 0 ? (
            <section className="panel">
              <p className="eyebrow">Empty State</p>
              <h2>当前暂无赛事</h2>
              <div className="panel__body">
                <p>当前还没有可公开浏览的赛事。</p>
              </div>
            </section>
          ) : null}

          {races.map((race) => (
            <article className="race-panel" key={race.id}>
              <PublicRaceSections race={race} />
            </article>
          ))}
        </section>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
