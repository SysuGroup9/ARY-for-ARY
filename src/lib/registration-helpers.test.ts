import assert from "node:assert/strict";
import test from "node:test";
import {
  getCompatibilityTeamMode,
  getRaceProjectInitialStatus,
  planRegistrationBridgeFlow,
  shouldEnsureRaceProject,
  type RegistrationStatusLike,
} from "./registration-helpers";

test("creates registration, race project, and compatibility team for a new rider", () => {
  assert.deepEqual(
    planRegistrationBridgeFlow({
      hasCompatibilityTeam: false,
      hasRaceProject: false,
      registrationStatus: null,
    }),
    {
      ensureCompatibilityTeam: true,
      ensureRaceProject: true,
      nextRegistrationStatus: "APPROVED",
      shouldCreateRegistration: true,
    },
  );
});

test("keeps approved registration idempotent while backfilling missing race project", () => {
  assert.deepEqual(
    planRegistrationBridgeFlow({
      hasCompatibilityTeam: true,
      hasRaceProject: false,
      registrationStatus: "APPROVED",
    }),
    {
      ensureCompatibilityTeam: false,
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
