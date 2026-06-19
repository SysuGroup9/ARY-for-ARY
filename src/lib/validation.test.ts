import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalSubmissionSchema,
  createSubmissionSchema,
  judgingRecordSchema,
  registerSchema,
} from "./validation";

test("register schema only keeps username and password for public signup", () => {
  const parsed = registerSchema.parse({
    username: "new_user",
    password: "password123",
  });

  assert.deepEqual(parsed, {
    username: "new_user",
    password: "password123",
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
    ridingRecord: "Clarify edges, verify complexity, and summarize validation results.",
    tokenUsed: 12,
    agentType: "OPENAI",
  });

  assert.equal(parsed.recordLabel, "riding-record.txt");
  assert.equal(
    parsed.ridingRecord,
    "Clarify edges, verify complexity, and summarize validation results.",
  );
});

test("judging schema accepts bounded result/riding scores and comments", () => {
  const parsed = judgingRecordSchema.parse({
    assignmentId: "assign_01",
    comments: "Solid work with clear tradeoff discussion.",
    scoreResultTotal: 88,
    scoreRidingTotal: 91,
    submit: true,
  });

  assert.equal(parsed.assignmentId, "assign_01");
  assert.equal(parsed.scoreResultTotal, 88);
  assert.equal(parsed.scoreRidingTotal, 91);
  assert.equal(parsed.submit, true);
});
