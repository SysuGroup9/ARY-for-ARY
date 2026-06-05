import type { Race } from "@/generated/prisma/client";

export type RacePhase =
  | "registration"
  | "preparation"
  | "active"
  | "frozen"
  | "finished";

export function getRacePhase(race: Pick<Race, "signupStart" | "signupEnd" | "raceStart" | "raceEnd" | "enableFreeze" | "freezeMinutesBeforeEnd">, now: Date = new Date()): RacePhase {
  if (now >= race.raceEnd) {
    return "finished";
  }

  if (now >= race.raceStart) {
    if (!race.enableFreeze) {
      return "active";
    }

    const freezeTime = new Date(
      race.raceEnd.getTime() - race.freezeMinutesBeforeEnd * 60 * 1000,
    );
    return now >= freezeTime ? "frozen" : "active";
  }

  if (now > race.signupEnd || now < race.signupStart) {
    return "preparation";
  }

  return "registration";
}

export function getRacePhaseLabel(phase: RacePhase): string {
  switch (phase) {
    case "registration":
      return "报名中";
    case "preparation":
      return "报名结束";
    case "active":
      return "比赛中";
    case "frozen":
      return "封榜中";
    case "finished":
      return "比赛结束";
  }
}

export function shouldHidePublicLeaderboard(phase: RacePhase): boolean {
  return phase === "frozen";
}
