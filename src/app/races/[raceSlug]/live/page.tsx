import { LiveHallView } from "@/app/_components/public/live-hall";
import { aryStyles } from "@/app/_components/ary-shared";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import { buildRaceSnapshot } from "@/lib/services/race-snapshot";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function RaceLivePage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const snapshot = await buildRaceSnapshot(race.id);
  const trackProfile = getEffectiveTrackProfileFromSnapshot(snapshot);

  return (
    <main>
      <LiveHallView
        race={race}
        jumbotronPreview={{ snapshot, trackProfile }}
      />
      <style>{aryStyles}</style>
    </main>
  );
}
