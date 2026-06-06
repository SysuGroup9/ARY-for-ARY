import assert from "node:assert/strict";
import test from "node:test";
import { getDemoCredentials } from "./demo-credentials";

test("returns the fixed organizer and rider demo credentials", () => {
  assert.deepEqual(getDemoCredentials(), [
    {
      label: "Organizer",
      username: "organizer_demo",
      password: "organizer123",
    },
    {
      label: "Rider",
      username: "rider_demo",
      password: "rider123",
    },
  ]);
});
