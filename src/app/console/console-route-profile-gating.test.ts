import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const gatedConsoleRoutes = [
  "src/app/console/admin/[section]/page.tsx",
  "src/app/console/races/page.tsx",
  "src/app/console/races/new/page.tsx",
  "src/app/console/races/[raceSlug]/page.tsx",
  "src/app/console/races/[raceSlug]/organizer/[section]/page.tsx",
  "src/app/console/races/[raceSlug]/rider/[section]/page.tsx",
  "src/app/console/races/[raceSlug]/judge/[section]/page.tsx",
  "src/app/console/screen/page.tsx",
  "src/app/console/screen/[raceSlug]/[mode]/page.tsx",
] as const;

test("console route pages reuse the shared profile-completion gate instead of raw loadDatabaseUser checks", () => {
  for (const file of gatedConsoleRoutes) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /requireConsoleUser/);
    assert.doesNotMatch(source, /const sessionUser = await loadDatabaseUser\(/);
  }
});

