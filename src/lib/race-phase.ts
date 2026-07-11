import type { Race } from "@/generated/prisma/client";

export type RacePhase =
  // GRS003 8-state (explicit status)
  | "draft" | "published" | "registration" | "running"
  | "submitting" | "judging" | "completed" | "archived"
  // legacy time-based (for backward compat)
  | "preparation" | "active" | "frozen" | "finished";

/** GRS003 8-state phase. Uses explicit `race.status` when set, falls back to time-based 5-state. */
export function getRacePhase(
  race: Pick<Race, "signupStart" | "signupEnd" | "raceStart" | "raceEnd" | "enableFreeze" | "freezeMinutesBeforeEnd"> & { status?: string | null },
  now: Date = new Date(),
): RacePhase {
  if (race.status === "draft") return "draft";
  if (race.status === "archived") return "archived";
  if (race.status === "submitting") return "submitting";
  if (race.status === "judging") return "judging";
  if (race.status === "completed") return "completed";

  // published / registration / running and legacy null state continue to auto-advance by time windows
  if (now >= race.raceEnd) return "completed";
  if (now >= race.raceStart) return "running";
  if (now >= race.signupStart && now <= race.signupEnd) return "registration";
  return "published";
}

const LABELS: Record<RacePhase, string> = {
  draft: "草稿", published: "已发布", registration: "报名中",
  running: "比赛中", submitting: "提交中", judging: "评审中",
  completed: "已结束", archived: "已归档",
  // legacy
  preparation: "报名结束", active: "比赛中", frozen: "封榜中", finished: "比赛结束",
};

export function getRacePhaseLabel(phase: RacePhase | string): string {
  return LABELS[phase as RacePhase] ?? phase;
}

export function shouldHidePublicLeaderboard(phase: RacePhase): boolean {
  return phase === "judging" || phase === "submitting";
}

/** Validate phase transitions per domain invariants */
const VALID_TRANSITIONS: Record<RacePhase, RacePhase[]> = {
  draft: ["published"], published: ["registration"], registration: ["running"],
  running: ["submitting", "completed"], submitting: ["judging"],
  judging: ["completed"], completed: ["archived"], archived: [],
  // legacy
  preparation: ["active"], active: ["frozen", "finished"],
  frozen: ["finished"], finished: [],
};

export function isValidPhaseTransition(from: RacePhase, to: RacePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
