import { RacePageView } from "@/app/_components/public/race-page";
import { aryStyles } from "@/app/_components/ary-shared";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function RacePage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  return (
    <main>
      <RacePageView race={race} raceSlug={raceSlug} />
      <style>{aryStyles}</style>
    </main>
  );
}
