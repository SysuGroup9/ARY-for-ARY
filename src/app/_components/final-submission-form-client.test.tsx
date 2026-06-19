import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import FinalSubmissionFormClient from "./final-submission-form-client";

test("final submission form carries returnTo for post-race rider flow", () => {
  const html = renderToStaticMarkup(
    <FinalSubmissionFormClient
      action={async () => {}}
      raceId="race_finished"
      returnTo="/console/races/race_finished--performance-marathon/rider/submission"
    />,
  );

  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/races\/race_finished--performance-marathon\/rider\/submission"/,
  );
});
