import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CooperationForm } from "./cooperation-form";

test("cooperation form keeps its action return target and upload field names aligned", () => {
  const html = renderToStaticMarkup(<CooperationForm />);

  assert.match(html, /type="hidden" name="returnTo" value="\/cooperation"/);
  assert.match(html, /name="taskPackageFile"/);
  assert.match(html, /name="proposalFile"/);
});
