import assert from "node:assert/strict";
import test from "node:test";
import { getDemoCredentials } from "./demo-credentials";

test("returns the fixed demo credentials groups", () => {
  assert.deepEqual(getDemoCredentials(), [
    {
      label: "管理员 / 主办方",
      username: "organizer_demo",
      password: "organizer123",
      role: "ADMIN + ORGANIZER",
    },
    {
      label: "评委 Demo",
      username: "judge_demo",
      password: "rider123",
      role: "JUDGE",
    },
    {
      label: "骑手 Alice",
      username: "rider_alice",
      password: "rider123",
      role: "RIDER",
    },
    {
      label: "骑手 Bob",
      username: "rider_bob",
      password: "rider123",
      role: "RIDER",
    },
    {
      label: "管理员",
      username: "admin_demo",
      password: "organizer123",
      role: "ADMIN",
    },
  ]);
});
