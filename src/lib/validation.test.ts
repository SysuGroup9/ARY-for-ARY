import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalSubmissionSchema,
  createSubmissionSchema,
  registerSchema,
} from "./validation";

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

test("submission schema only accepts in-race code submission fields", () => {
  const parsed = createSubmissionSchema.parse({
    raceId: "race_001",
    codeLabel: "solution.ts",
    codeContent: "export const solve = () => 1;",
    tokenUsed: 12,
    agentType: "OPENAI",
  });

  assert.equal(parsed.codeLabel, "solution.ts");
  assert.equal(parsed.codeContent, "export const solve = () => 1;");
});

test("submission schema rejects non JavaScript or TypeScript file labels", () => {
  assert.throws(
    () =>
      createSubmissionSchema.parse({
        raceId: "race_001",
        codeLabel: "solution.py",
        codeContent: "print('hello')",
        tokenUsed: 12,
        agentType: "OPENAI",
      }),
    /JavaScript|TypeScript|JS|TS/,
  );
});

test("final submission schema requires both code and riding record", () => {
  const parsed = createFinalSubmissionSchema.parse({
    raceId: "race_001",
    codeLabel: "solution.ts",
    codeContent: "export const solve = () => 1;",
    recordLabel: "riding-record.txt",
    ridingRecord: "先澄清输入边界，再验证复杂度。",
    tokenUsed: 12,
    agentType: "OPENAI",
  });

  assert.equal(parsed.recordLabel, "riding-record.txt");
  assert.equal(parsed.ridingRecord, "先澄清输入边界，再验证复杂度。");
});
