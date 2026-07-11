import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("console races root reuses the dedicated races-section access helper", () => {
  const source = readFileSync("src/app/console/races/page.tsx", "utf8");

  assert.match(source, /requireConsoleUser\("\/console\/races"\)/);
  assert.match(source, /getConsoleRacesRootAccess\(sessionUser\.roles\)/);
  assert.match(source, /if \(!access\.allowed\)/);
});

test("console races root reads action feedback from query params", () => {
  const source = readFileSync("src/app/console/races/page.tsx", "utf8");

  assert.match(source, /feedbackMessage\?: string/);
  assert.match(source, /feedbackScope\?: string/);
  assert.match(source, /getActionFeedbackContent/);
  assert.match(source, /ErrorNotice/);
});
