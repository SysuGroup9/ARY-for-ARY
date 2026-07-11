import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";

test("seeded awards, reports, and judging records carry frozen source refs", async () => {
  const award = await prisma.award.findFirstOrThrow({
    where: { raceId: "race_finished" },
  });
  const report = await prisma.report.findFirstOrThrow({
    where: { raceId: "race_finished", status: "PUBLISHED" },
  });
  const judgingRecord = await prisma.judgingRecord.findFirstOrThrow({
    where: {
      judgeAssignment: {
        work: {
          registration: {
            raceId: "race_finished",
          },
        },
      },
    },
  });

  assert.match(award.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(award.sourceRefJson, /work/);
  assert.match(report.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(report.sourceRefJson, /projections/);
  assert.match(judgingRecord.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(judgingRecord.sourceRefJson, /work/);
});
