import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAwardSourceRef,
  buildJudgingRecordSourceRef,
  buildReportSourceRef,
} from "./result-reference-freeze-helpers";

test("buildJudgingRecordSourceRef captures work and evidence digests", () => {
  const ref = buildJudgingRecordSourceRef({
    evidences: [
      {
        id: "ev_1",
        integrityStatus: "OK",
        sourceDigest: "digest_ev_1",
        title: "Work evidence",
        type: "WORK",
      },
    ],
    registration: {
      id: "reg_1",
      userId: "user_1",
    },
    work: {
      contentHash: "work_hash",
      id: "work_1",
      sourceRefJson: "{\"repoUrl\":\"https://github.com/demo/work-1\"}",
      title: "Work 1",
    },
  });

  assert.equal(ref.work.contentHash, "work_hash");
  assert.equal(ref.evidences[0]?.sourceDigest, "digest_ev_1");
});

test("buildAwardSourceRef keeps registration and work linkage", () => {
  const ref = buildAwardSourceRef({
    evidences: [{ id: "ev_1", sourceDigest: "digest_ev_1", type: "WORK" }],
    registration: { id: "reg_1", userId: "user_1" },
    work: { contentHash: "work_hash", id: "work_1", title: "Work 1" },
  });

  assert.equal(ref.registration.id, "reg_1");
  assert.equal(ref.work?.contentHash, "work_hash");
});

test("buildReportSourceRef carries work, evidence, projection, and award refs", () => {
  const ref = buildReportSourceRef({
    awards: [{ awardName: "Best Overall", id: "award_1", rank: 1 }],
    evidences: [
      {
        id: "ev_1",
        registrationId: "reg_1",
        sourceDigest: "digest_ev_1",
        type: "WORK",
      },
    ],
    projections: [
      {
        asOfAt: "2026-07-10T00:00:00.000Z",
        payloadDigest: "projection_digest",
        type: "CURRENT_LEADERBOARD",
      },
    ],
    raceId: "race_1",
    reportType: "RACE_REPORT",
    subjectRegistrationId: null,
    works: [{ contentHash: "work_hash", id: "work_1", registrationId: "reg_1" }],
  });

  assert.equal(ref.reportType, "RACE_REPORT");
  assert.equal(ref.works[0]?.contentHash, "work_hash");
  assert.equal(ref.projections[0]?.payloadDigest, "projection_digest");
});
