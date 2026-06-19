"use client";

import JumbotronClient from "@/app/jumbotron/[raceId]/JumbotronClient";
import type { RaceSnapshot, TrackProfile } from "@/lib/jumbotron/track-runtime/types";

interface Props {
  raceId: string;
  snapshot: RaceSnapshot | null;
  trackProfile: TrackProfile | null;
}

export default function JumbotronInline({ raceId, snapshot, trackProfile }: Props) {
  if (!snapshot || !trackProfile) return null;

  return (
    <div
      data-race-id={raceId}
      style={{
        marginTop: 12,
        width: "100%",
        height: "clamp(480px, 70vh, 800px)",
        border: "2px solid #8b3a2e",
        borderRadius: 12,
        overflow: "hidden",
        background: "#1a1a2e",
      }}
    >
      <JumbotronClient snapshot={snapshot} trackProfile={trackProfile} />
    </div>
  );
}
