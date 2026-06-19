import type { RacePhase } from "@/lib/race-phase";

export type CAConnectionStatusLike =
  | "ACTIVE"
  | "CONNECTED"
  | "FAILED"
  | "NOT_CONFIGURED";

export function canRegisterCAConnectionForPhase(phase: RacePhase): boolean {
  return phase === "active" || phase === "frozen";
}

export function getDefaultCAConnectionStatus(): "CONNECTED" {
  return "CONNECTED";
}

export function getAggregateIngestionStatus(
  statuses: readonly CAConnectionStatusLike[],
): CAConnectionStatusLike {
  if (statuses.length === 0) {
    return "NOT_CONFIGURED";
  }

  if (statuses.some((status) => status === "ACTIVE")) {
    return "ACTIVE";
  }

  if (statuses.some((status) => status === "CONNECTED")) {
    return "CONNECTED";
  }

  if (statuses.every((status) => status === "FAILED")) {
    return "FAILED";
  }

  return "FAILED";
}

export function isConnectionEligibleForValidData(input: {
  disabledAt: Date | null;
  handshakeCompletedAt: Date | null;
  ingestionStatus: CAConnectionStatusLike;
}): boolean {
  if (input.disabledAt) {
    return false;
  }

  if (!input.handshakeCompletedAt) {
    return false;
  }

  return (
    input.ingestionStatus === "CONNECTED" ||
    input.ingestionStatus === "ACTIVE"
  );
}
