import assert from "node:assert/strict";
import test from "node:test";
import { createSubmissionSchema, registerSchema } from "./validation";

test("register schema falls back displayName to username when field is omitted", () => {
  const parsed = registerSchema.parse({
    username: "new_user",
    password: "password123",
    role: "RIDER",
  });

  assert.equal(parsed.displayName, "new_user");
});

test("submission schema allows empty riding record and clears record label", () => {
  const parsed = createSubmissionSchema.parse({
    raceId: "race_001",
    codeLabel: "solution.ts",
    codeContent: "export const solve = () => 1;",
    recordLabel: "",
    ridingRecord: "",
    tokenUsed: 12,
    agentType: "OPENAI",
  });

  assert.equal(parsed.recordLabel, null);
  assert.equal(parsed.ridingRecord, null);
});
