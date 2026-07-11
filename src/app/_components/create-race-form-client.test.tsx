import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import CreateRaceFormClient from "./create-race-form-client";

test("create race form carries returnTo for friendly error redirects", () => {
  const html = renderToStaticMarkup(
    <CreateRaceFormClient
      action={() => undefined}
      organizerOptions={[{ id: "org_1", label: "Organizer" }]}
      returnTo="/console/races/new"
    />,
  );

  assert.match(html, /type="hidden" name="returnTo" value="\/console\/races\/new"/);
});
