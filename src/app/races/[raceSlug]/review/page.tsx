import { ReviewPageView } from "@/app/_components/public/review-page";
import { aryStyles } from "@/app/_components/ary-shared";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { getPublishedReviewSummaryForRace } from "@/lib/services/reports";
import { buildPublicReviewModel } from "@/lib/services/review";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function RaceReviewPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const [reviewModel, reviewReport] = await Promise.all([
    buildPublicReviewModel(race.id),
    getPublishedReviewSummaryForRace(race.id),
  ]);

  return (
    <main>
      <ReviewPageView
        awards={reviewModel.awards}
        evidenceHighlights={reviewModel.evidenceHighlights}
        judgingRecords={reviewModel.judgingRecords}
        race={race}
        reviewReport={reviewReport}
      />
      <style>{aryStyles}</style>
    </main>
  );
}
