import assert from "node:assert/strict";
import test from "node:test";
import { registerSchema } from "./validation";

test("register schema falls back displayName to username when field is omitted", () => {
  const parsed = registerSchema.parse({
    username: "new_user",
    password: "password123",
    role: "RIDER",
  });

  assert.equal(parsed.displayName, "new_user");
});
