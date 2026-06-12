import { loadRaceSnapshot } from "@/lib/services/race-snapshot";
import { notFound } from "next/navigation";
import JumbotronClient from "./JumbotronClient";
import fs from "node:fs";
import path from "node:path";
import type { TrackProfile } from "@/lib/jumbotron/track-runtime/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceId: string }>;
}

function loadTrackProfile(trackId: string): TrackProfile | null {
  const filePath = path.join(
    process.cwd(),
    "public",
    "assets",
    "tracks",
    trackId,
    "track.profile.json",
  );
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TrackProfile;
}

export default async function JumbotronPage({ params }: Props) {
  const { raceId } = await params;

  const snapshot = loadRaceSnapshot(raceId);
  if (!snapshot) {
    return (
      <div style={emptyStyles}>
        <h1>ARY Jumbotron</h1>
        <p>赛事 {raceId} 尚未生成快照。</p>
        <p>请 Organizer 先在首页点击「生成 Jumbotron 快照」。</p>
      </div>
    );
  }

  const trackProfile = loadTrackProfile(snapshot.trackId);
  if (!trackProfile) {
    return (
      <div style={emptyStyles}>
        <h1>ARY Jumbotron</h1>
        <p>赛道 {snapshot.trackId} 的 track.profile.json 不存在。</p>
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
