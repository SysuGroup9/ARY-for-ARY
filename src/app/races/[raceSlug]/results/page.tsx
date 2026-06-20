import { ResultsPageView } from "@/app/_components/public/results-page";
import { aryStyles } from "@/app/_components/ary-shared";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { getPublishedRaceReportForRace } from "@/lib/services/reports";
import { buildPublicResultsModel } from "@/lib/services/results";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function RaceResultsPage({ params }: Props) {
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
      <ResultsPageView
        awards={resultsModel.awards}
        race={race}
        raceReport={raceReport}
        ridingSkillHighlights={resultsModel.ridingSkillHighlights}
      />
      <style>{aryStyles}</style>
    </main>
  );
}
