import type { Checkpoint, RaceSnapshot, TrackProfile } from "@/lib/jumbotron/track-runtime/types";
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_TRACK_ID = "oval-track";
const VALID_TRACK_IDS = new Set([DEFAULT_TRACK_ID, "circuit-track"]);

export interface RaceTrackConfig {
  startFinish: { s: number };
  checkpoints: Checkpoint[];
}

export function normalizeTrackId(trackId: string | null | undefined): string {
  if (!trackId || !VALID_TRACK_IDS.has(trackId)) {
    return DEFAULT_TRACK_ID;
  }
  return hasTrackProfileAsset(trackId) ? trackId : DEFAULT_TRACK_ID;
}

export function parseRaceTrackConfigJson(value: string | null | undefined): RaceTrackConfig | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  const parsed = JSON.parse(raw) as {
    startFinish?: { s?: number };
    checkpoints?: Array<{ id?: string; name?: string; s?: number }>;
  };

  const startFinishS = parsed.startFinish?.s;
  if (typeof startFinishS !== "number" || startFinishS < 0 || startFinishS > 1) {
    throw new Error("起终点位置必须在 0~1 之间");
  }

  const checkpoints = Array.isArray(parsed.checkpoints)
    ? parsed.checkpoints.map((checkpoint, index) => {
        const id = checkpoint.id?.trim() || `checkpoint-${index + 1}`;
        const name = checkpoint.name?.trim() || `检查点 ${index + 1}`;
        const s = checkpoint.s;
        if (typeof s !== "number" || s < 0 || s > 1) {
          throw new Error(`检查点 ${index + 1} 的位置必须在 0~1 之间`);
        }
        return { id, name, s } satisfies Checkpoint;
      })
    : [];

  return {
    startFinish: { s: startFinishS },
    checkpoints,
  };
}

export function serializeRaceTrackConfig(config: RaceTrackConfig | null): string {
  return config ? JSON.stringify(config) : "";
}

export function loadTrackProfile(trackId: string): TrackProfile | null {
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

export function getEffectiveTrackProfile(
  trackId: string | null | undefined,
  trackConfig: RaceTrackConfig | null | undefined,
): TrackProfile | null {
  const normalizedTrackId = normalizeTrackId(trackId);
  const baseProfile = loadTrackProfile(normalizedTrackId);
  if (!baseProfile) return null;

  return {
    ...baseProfile,
    trackId: normalizedTrackId,
    startFinish: trackConfig?.startFinish ?? baseProfile.startFinish,
    checkpoints: trackConfig?.checkpoints?.length
      ? trackConfig.checkpoints
      : baseProfile.checkpoints,
  };
}

export function getEffectiveTrackProfileFromSnapshot(
  snapshot: RaceSnapshot,
): TrackProfile | null {
  return getEffectiveTrackProfile(snapshot.trackId, snapshot.trackConfig ?? null);
}

function hasTrackProfileAsset(trackId: string): boolean {
  const filePath = path.join(
    process.cwd(),
    "public",
    "assets",
    "tracks",
    trackId,
    "track.profile.json",
  );
  return fs.existsSync(filePath);
}
