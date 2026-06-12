"use client";

import { useState } from "react";
import JumbotronClient from "@/app/jumbotron/[raceId]/JumbotronClient";
import type { RaceSnapshot, TrackProfile } from "@/lib/jumbotron/track-runtime/types";

interface Props {
  raceId: string;
  snapshot: RaceSnapshot | null;
  trackProfile: TrackProfile | null;
}

export default function JumbotronInline({ raceId, snapshot, trackProfile }: Props) {
  const [open, setOpen] = useState(false);

  if (!snapshot || !trackProfile) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 18px",
          border: "1px solid #d6d3ce",
          borderRadius: 8,
          background: open ? "#8b3a2e" : "#fff",
          color: open ? "#fff" : "#8b3a2e",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {open ? "收起赛马大屏 ▲" : "查看赛马大屏 ▼"}
      </button>

      {open && (
        <div
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
      )}
    </div>
  );
}
