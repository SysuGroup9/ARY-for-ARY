import JumbotronBanner from "@/app/JumbotronBanner";
import { StaticDisplayFallback } from "@/app/_components/public/static-display-fallback";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import {
  loadRaceSnapshot,
  resolveRaceSnapshotForDisplay,
} from "@/lib/services/race-snapshot";
import { listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceId: string }>;
  searchParams?: Promise<{ source?: string }>;
}

export default async function JumbotronPage({ params, searchParams }: Props) {
  const { raceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sourcePreference = resolvedSearchParams?.source ?? "auto";

  const races = await listRaces();
  const liveRaces = races.filter(
    (race) => race.phase === "active" || race.phase === "frozen",
  );
  const bannerRaces = liveRaces.length
    ? liveRaces
    : races.filter((race) => race.id === raceId);
  const targetRace =
    bannerRaces.find((race) => race.id === raceId) ?? bannerRaces[0] ?? null;

  if (!targetRace) {
    return (
      <div style={emptyStyles}>
        <h1>ARY Jumbotron</h1>
        <p>当前没有可展示的赛事。</p>
      </div>
    );
  }

  const targetSnapshotResult =
    sourcePreference === "stable"
      ? {
          fallbackReason: "screen_display_stable_projection",
          snapshot: loadRaceSnapshot(targetRace.id),
          source: "stable" as const,
        }
      : await resolveRaceSnapshotForDisplay(targetRace.id);
  const targetTrackProfile = targetSnapshotResult.snapshot
    ? getEffectiveTrackProfileFromSnapshot(targetSnapshotResult.snapshot)
    : null;

  if (!targetSnapshotResult.snapshot || !targetTrackProfile) {
    return (
      <StaticDisplayFallback
        race={targetRace}
        reason={
          targetSnapshotResult.fallbackReason ?? "track_profile_unavailable"
        }
      />
    );
  }

  const items = (
    await Promise.all(
      bannerRaces.map(async (race) => {
        const snapshotResult = await resolveRaceSnapshotForDisplay(race.id);
        if (snapshotResult.source === "static" || !snapshotResult.snapshot) {
          return null;
        }

        const trackProfile = getEffectiveTrackProfileFromSnapshot(
          snapshotResult.snapshot,
        );
        if (!trackProfile) {
          return null;
        }

        const source: "live" | "stable" =
          snapshotResult.source === "stable" ? "stable" : "live";

        return {
          fallbackReason: snapshotResult.fallbackReason,
          raceId: race.id,
          raceTitle: race.title,
          snapshot: snapshotResult.snapshot,
          source,
          trackProfile,
        };
      }),
    )
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) {
    return <StaticDisplayFallback race={targetRace} reason="track_profile_unavailable" />;
  }

  const initialIndex = Math.max(
    items.findIndex((item) => item.raceId === raceId),
    0,
  );

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <JumbotronBanner
        initialIndex={initialIndex}
        items={items}
      />
    </div>
  );
}

const emptyStyles: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  height: "100vh", fontFamily: "sans-serif", color: "#65584b", background: "#f2eadf",
};
