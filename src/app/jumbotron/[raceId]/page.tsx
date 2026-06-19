import JumbotronBanner from "@/app/JumbotronBanner";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import { buildRaceSnapshot } from "@/lib/services/race-snapshot";
import { listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceId: string }>;
}

export default async function JumbotronPage({ params }: Props) {
  const { raceId } = await params;

  const races = await listRaces();
  const liveRaces = races.filter(
    (race) => race.phase === "active" || race.phase === "frozen",
  );
  const bannerRaces = liveRaces.length
    ? liveRaces
    : races.filter((race) => race.id === raceId);

  const items = (
    await Promise.all(
      bannerRaces.map(async (race) => {
        const snapshot = await buildRaceSnapshot(race.id);
        const trackProfile = getEffectiveTrackProfileFromSnapshot(snapshot);
        if (!trackProfile) {
          return null;
        }

        return {
          raceId: race.id,
          raceTitle: race.title,
          snapshot,
          trackProfile,
        };
      }),
    )
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) {
    return (
      <div style={emptyStyles}>
        <h1>ARY Jumbotron</h1>
        <p>默认赛道资源加载失败，请检查 oval-track 资产。</p>
      </div>
    );
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
