import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAwardSeedRecords,
  buildReviewSummaryReportSeed,
  buildRiderReportSeed,
  buildWorkSeedRecord,
} from "./result-chain-helpers";

test("builds a Work asset record from legacy highlight/archive data", () => {
  const work = buildWorkSeedRecord({
    archiveCode: "export const solve = () => 1;",
    demoUrl: "https://demo.example/app",
    excerpt: "Optimized storefront with strong rendering strategy.",
    raceId: "race_finished",
    registrationId: "reg_01",
    repoUrl: "https://github.com/demo/work",
    teamName: "Render Rocket",
    videoUrl: "https://video.example/work",
  });

  assert.equal(work.registrationId, "reg_01");
  assert.equal(work.title, "Render Rocket");
  assert.equal(work.status, "SUBMITTED");
  assert.equal(work.visibility, "PUBLIC");
  assert.match(work.techNotes, /solve/);
});

test("builds award seed records from legacy leaderboard and harness result slices", () => {
  const awards = buildAwardSeedRecords({
    bestWorkRegistrationId: "reg_02",
    overallRegistrationId: "reg_01",
    ridingRegistrationId: "reg_03",
    raceId: "race_finished",
    workIdByRegistrationId: {
      reg_01: "work_01",
      reg_02: "work_02",
      reg_03: "work_03",
    },
    sourceByRegistrationId: {
      reg_01: {
        sourceDigest: "digest_reg_01",
        sourceRefJson: "{\"work\":{\"id\":\"work_01\"}}",
      },
      reg_02: {
        sourceDigest: "digest_reg_02",
        sourceRefJson: "{\"work\":{\"id\":\"work_02\"}}",
      },
      reg_03: {
        sourceDigest: "digest_reg_03",
        sourceRefJson: "{\"work\":{\"id\":\"work_03\"}}",
      },
    },
  });

  assert.equal(awards.length, 3);
  assert.deepEqual(
    awards.map((award) => [award.awardName, award.registrationId, award.workId ?? null]),
    [
      ["Best Overall", "reg_01", "work_01"],
      ["Best Work", "reg_02", "work_02"],
      ["Best Agent Rider", "reg_03", "work_03"],
    ],
  );
  assert.equal(awards[0]?.sourceDigest, "digest_reg_01");
  assert.match(awards[0]?.sourceRefJson ?? "", /work_01/);
});

test("builds review summary report seed with no subject registration", () => {
  const report = buildReviewSummaryReportSeed({
    body: "Detailed race review body.",
    raceId: "race_finished",
    sourceDigest: "report_digest",
    sourceRefJson: "{\"projections\":[{\"type\":\"CURRENT_LEADERBOARD\"}]}",
    summary: "Published review summary.",
    title: "Performance Marathon Review",
  });

  assert.equal(report.sourceDigest, "report_digest");
  assert.match(report.sourceRefJson, /CURRENT_LEADERBOARD/);
  assert.equal(report.type, "REVIEW_SUMMARY");
  assert.equal(report.status, "PUBLISHED");
  assert.equal(report.subjectRegistrationId, null);
});

test("builds rider report seed with a required subject registration", () => {
  const report = buildRiderReportSeed({
    body: "Rider report body.",
    raceId: "race_finished",
    sourceDigest: "rider_digest",
    sourceRefJson: "{\"works\":[{\"id\":\"work_01\"}]}",
    subjectRegistrationId: "reg_01",
    summary: "Rider report summary.",
    title: "Render Rocket Rider Report",
  });

  assert.equal(report.sourceDigest, "rider_digest");
  assert.match(report.sourceRefJson, /work_01/);
  assert.equal(report.type, "RIDER_REPORT");
  assert.equal(report.subjectRegistrationId, "reg_01");
  assert.equal(report.status, "PUBLISHED");
});
