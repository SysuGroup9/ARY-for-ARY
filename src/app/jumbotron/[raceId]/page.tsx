import { buildRaceSnapshot } from "@/lib/services/race-snapshot";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import JumbotronClient from "./JumbotronClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceId: string }>;
}

export default async function JumbotronPage({ params }: Props) {
  const { raceId } = await params;

  const snapshot = await buildRaceSnapshot(raceId);

  const trackProfile = getEffectiveTrackProfileFromSnapshot(snapshot);
  if (!trackProfile) {
    return (
      <div style={emptyStyles}>
        <h1>ARY Jumbotron</h1>
        <p>默认赛道资源加载失败，请检查 oval-track 资产。</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <JumbotronClient snapshot={snapshot} trackProfile={trackProfile} />
    </div>
  );
}

const emptyStyles: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  height: "100vh", fontFamily: "sans-serif", color: "#65584b", background: "#f2eadf",
};
