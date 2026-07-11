export type RegistrationStatusLike =
  | "APPROVED"
  | "REJECTED"
  | "SUBMITTED"
  | "WITHDRAWN";

export function shouldEnsureRaceProject(
  status: RegistrationStatusLike | null,
): boolean {
  return status === "APPROVED";
}

export function getRaceProjectInitialStatus():
  | "ACTIVE"
  | "CONNECTED"
  | "FAILED"
  | "NOT_CONFIGURED" {
  return "NOT_CONFIGURED";
}

export function getCompatibilityTeamMode(): "secondary" {
  return "secondary";
}

export function planRegistrationBridgeFlow(input: {
  hasCompatibilityTeam: boolean;
  hasRaceProject: boolean;
  registrationStatus: RegistrationStatusLike | null;
}): {
  ensureCompatibilityTeam: boolean;
  ensureRaceProject: boolean;
  nextRegistrationStatus: RegistrationStatusLike;
  shouldCreateRegistration: boolean;
} {
  const nextRegistrationStatus: RegistrationStatusLike =
    input.registrationStatus ?? "SUBMITTED";

  return {
    ensureCompatibilityTeam:
      getCompatibilityTeamMode() === "secondary" &&
      nextRegistrationStatus === "APPROVED" &&
      !input.hasCompatibilityTeam,
    ensureRaceProject:
      shouldEnsureRaceProject(nextRegistrationStatus) && !input.hasRaceProject,
    nextRegistrationStatus,
    shouldCreateRegistration: input.registrationStatus === null,
  };
}
