import { LiveAutoRefresh } from "@/app/_components/public/live-auto-refresh";
import { shouldEnableLiveAutoRefresh } from "@/app/_components/public/live-auto-refresh-phase";
import { LiveHallView } from "@/app/_components/public/live-hall";
import { aryStyles } from "@/app/_components/ary-shared";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import { resolveRaceSnapshotForDisplay } from "@/lib/services/race-snapshot";
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

  const snapshotResult = await resolveRaceSnapshotForDisplay(race.id);
  const trackProfile = snapshotResult.snapshot
    ? getEffectiveTrackProfileFromSnapshot(snapshotResult.snapshot)
    : null;
  const previewSource =
    snapshotResult.snapshot && trackProfile
      ? snapshotResult.source
      : "static";

  return (
    <main>
      <LiveAutoRefresh enabled={shouldEnableLiveAutoRefresh(race.phase)} />
      <LiveHallView
        race={race}
        raceSlug={raceSlug}
        jumbotronPreview={{
          fallbackReason:
            previewSource === "static"
              ? snapshotResult.fallbackReason ?? "track_profile_unavailable"
              : snapshotResult.fallbackReason,
          snapshot:
            previewSource === "static" ? null : snapshotResult.snapshot,
          source: previewSource,
          trackProfile: previewSource === "static" ? null : trackProfile,
        }}
      />
      <style>{aryStyles}</style>
    </main>
  );
}
