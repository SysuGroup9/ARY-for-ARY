import assert from "node:assert/strict";
import test from "node:test";
import {
  getCompatibilityTeamMode,
  getRaceProjectInitialStatus,
  planRegistrationBridgeFlow,
  shouldEnsureRaceProject,
  type RegistrationStatusLike,
} from "./registration-helpers";

test("creates a submitted registration first and waits for approval before provisioning rider context", () => {
  assert.deepEqual(
    planRegistrationBridgeFlow({
      hasCompatibilityTeam: false,
      hasRaceProject: false,
      registrationStatus: null,
    }),
    {
      ensureCompatibilityTeam: false,
      ensureRaceProject: false,
      nextRegistrationStatus: "SUBMITTED",
      shouldCreateRegistration: true,
    },
  );
});

test("keeps approved registration idempotent while backfilling missing race project", () => {
  assert.deepEqual(
    planRegistrationBridgeFlow({
      hasCompatibilityTeam: false,
      hasRaceProject: false,
      registrationStatus: "APPROVED",
    }),
    {
      ensureCompatibilityTeam: true,
      ensureRaceProject: true,
      nextRegistrationStatus: "APPROVED",
      shouldCreateRegistration: false,
    },
  );
});

test("does not create race project for rejected or withdrawn registrations", () => {
  for (const status of ["REJECTED", "WITHDRAWN"] as RegistrationStatusLike[]) {
    assert.equal(shouldEnsureRaceProject(status), false);
  }
});

test("uses not_configured as the transitional initial ingestion state", () => {
  assert.equal(getRaceProjectInitialStatus(), "NOT_CONFIGURED");
});

test("treats team as a secondary compatibility layer", () => {
  assert.equal(getCompatibilityTeamMode(), "secondary");
});
