import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import SubmissionFormClient from "./submission-form-client";

test("submission form carries returnTo for rider console submission flow", () => {
  const html = renderToStaticMarkup(
    <SubmissionFormClient
      action={async () => {}}
      raceId="race_active"
      returnTo="/console/races/race_active--sorting-challenge/rider/submission"
    />,
  );

  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/races\/race_active--sorting-challenge\/rider\/submission"/,
  );
});
