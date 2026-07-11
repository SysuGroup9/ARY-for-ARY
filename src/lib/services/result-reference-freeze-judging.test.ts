import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { upsertJudgingRecord } from "@/lib/services/judging";

test("upsertJudgingRecord stores frozen work and evidence refs", async () => {
  const assignment = await prisma.judgeAssignment.findFirstOrThrow({
    where: {
      work: {
        registration: {
          raceId: "race_finished",
        },
      },
    },
    include: {
      judge: true,
    },
  });

  await upsertJudgingRecord({
    assignmentId: assignment.id,
    comments: "freeze reference check",
    judgeUserId: assignment.judgeId,
    scoreResultTotal: 88,
    scoreRidingTotal: 91,
    submit: true,
  });

  const stored = await prisma.judgingRecord.findUniqueOrThrow({
    where: {
      judgeAssignmentId: assignment.id,
    },
  });

  assert.match(stored.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(stored.sourceRefJson, /work/);
  assert.match(stored.sourceRefJson, /evidences/);
});
