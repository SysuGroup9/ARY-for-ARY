import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { buildRiderConsoleReportModel } from "@/lib/services/rider-console";

test("builds rider console report model from published rider report and review summary", async () => {
  const result = await buildRiderConsoleReportModel({
    raceId: "race_finished",
    userId: "rider_01",
  });

  assert.equal(result.reviewSummary?.type, "REVIEW_SUMMARY");
  assert.equal(result.riderReports.length > 0, true);
  assert.equal(result.riderReports[0]?.type, "RIDER_REPORT");
});

test("rider console can read a private rider report for the current race before publication", async () => {
  const registration = await prisma.registration.findFirstOrThrow({
    where: {
      raceId: "race_finished",
      userId: "rider_01",
    },
  });
  const title = `Private Rider Report ${Date.now()}`;
  const report = await prisma.report.create({
    data: {
      body: "private rider report body",
      raceId: "race_finished",
      status: "GENERATED",
      subjectRegistrationId: registration.id,
      summary: "private rider report summary",
      title,
      type: "RIDER_REPORT",
    },
  });

  try {
    const result = await buildRiderConsoleReportModel({
      raceId: "race_finished",
      userId: "rider_01",
    });

    assert.equal(
      result.riderReports.some((item) => item.title === title),
      true,
    );
  } finally {
    await prisma.report.delete({
      where: {
        id: report.id,
      },
    });
  }
});
