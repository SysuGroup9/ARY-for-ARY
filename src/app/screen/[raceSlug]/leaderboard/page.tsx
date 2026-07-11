import { LeaderboardDisplayView } from "@/app/_components/public/leaderboard-display";
import { ScreenDisplayShell } from "@/app/_components/public/screen-display-shell";
import { aryStyles } from "@/app/_components/ary-shared";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { getPublishedRaceReportForRace } from "@/lib/services/reports";
import { buildPublicResultsModel } from "@/lib/services/results";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ScreenLeaderboardDisplayPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const [resultsModel, raceReport] = await Promise.all([
    buildPublicResultsModel(race.id),
    getPublishedRaceReportForRace(race.id),
  ]);

  return (
    <main>
      <ScreenDisplayShell
        modeLabel="Leaderboard Display"
        raceTitle={race.title}
        theme={race.screenDisplay?.theme}
      >
        <LeaderboardDisplayView
          awards={resultsModel.awards}
          race={race}
          raceReport={raceReport}
          ridingSkillHighlights={resultsModel.ridingSkillHighlights}
        />
      </ScreenDisplayShell>
      <style>{aryStyles}</style>
    </main>
  );
}
