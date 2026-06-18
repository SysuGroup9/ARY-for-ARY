import assert from "node:assert/strict";
import test from "node:test";
import { getDemoCredentials } from "./demo-credentials";

test("returns the fixed demo credentials groups", () => {
  assert.deepEqual(getDemoCredentials(), [
    {
      label: "Organizer",
      username: "organizer_demo",
      password: "organizer123",
    },
    {
      label: "Rider Captains",
      username: "rider_alice ~ rider_olivia",
      password: "rider123",
    },
    {
      label: "Rider Members",
      username: "rider_active_assistant_01 ~ rider_finished_member_06",
      password: "rider123",
    },
  ]);
});
