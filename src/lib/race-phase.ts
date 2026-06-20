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
  if (race.status) return race.status as RacePhase;

  // legacy time-based fallback (5-state) — mapped to closest 8-state
  if (now >= race.raceEnd) return "completed";
  if (now >= race.raceStart) return "running";
  if (now > race.signupEnd || now < race.signupStart) return "published";
  return "registration";
}

const LABELS: Record<RacePhase, string> = {
  draft: "草稿", published: "已发布", registration: "报名中",
  running: "比赛中", submitting: "提交中", judging: "评审中",
  completed: "已结束", archived: "已归档",
  // legacy
  preparation: "报名结束", active: "比赛中", frozen: "封榜中", finished: "比赛结束",
};

export function getRacePhaseLabel(phase: RacePhase): string {
  return LABELS[phase] ?? phase;
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
