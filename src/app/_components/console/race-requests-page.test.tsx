import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RaceRequestsPageView } from "./race-requests-page";

const pendingRequest = {
  companyName: "ARY Lab",
  contactEmail: "ops@example.com",
  contactName: "Ops",
  contactPhone: "",
  createdAt: new Date("2026-07-11T12:00:00Z"),
  displayShowOrganizerComment: true,
  displayShowRiderCode: true,
  displayShowTopHighlights: true,
  displayShowTrainingData: true,
  enableFreeze: true,
  evaluationNotes: "Runner weighted review",
  freezeMinutesBeforeEnd: 30,
  hasTrainingData: true,
  id: "req_1",
  keywordsText: "sorting, review",
  maxTeamSize: 5,
  notes: "",
  raceEnd: "2026-08-01T12:00:00.000Z",
  raceStart: "2026-08-01T10:00:00.000Z",
  raceSummary: "Demo race",
  raceTitle: "Sorting Demo",
  signupEnd: "2026-07-31T12:00:00.000Z",
  signupStart: "2026-07-30T12:00:00.000Z",
  status: "PENDING",
  submissionIntervalHours: 24,
  taskDescription: "Build a stable sort",
  tokenLimit: 4000,
  trainingDataSummary: "",
};

test("race requests page preserves returnTo on approve and reject actions", () => {
  const html = renderToStaticMarkup(
    <RaceRequestsPageView requests={[pendingRequest]} />,
  );

  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/admin\/race-requests"/,
  );
});
