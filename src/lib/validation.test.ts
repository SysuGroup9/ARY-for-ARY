import assert from "node:assert/strict";
import test from "node:test";
import { createSubmissionSchema, registerSchema } from "./validation";

test("register schema only keeps username, password, and role", () => {
  const parsed = registerSchema.parse({
    username: "new_user",
    password: "password123",
    role: "RIDER",
  });

  assert.deepEqual(parsed, {
    username: "new_user",
    password: "password123",
    role: "RIDER",
  });
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

test("submission schema rejects non JavaScript or TypeScript file labels", () => {
  assert.throws(
    () =>
      createSubmissionSchema.parse({
        raceId: "race_001",
        codeLabel: "solution.py",
        codeContent: "print('hello')",
        recordLabel: "",
        ridingRecord: "",
        tokenUsed: 12,
        agentType: "OPENAI",
      }),
    /JavaScript|TypeScript|JS|TS/,
  );
});
