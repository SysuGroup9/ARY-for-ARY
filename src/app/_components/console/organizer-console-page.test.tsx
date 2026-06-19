import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizerConsolePageView } from "./organizer-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    awards: [],
    displayHighlightCount: 3,
    displayShowOrganizerComment: false,
    displayShowRiderCode: false,
    displayShowTopHighlights: false,
    displayShowTrainingData: false,
    feedbackThreads: [],
    harnessEntries: [],
    highlights: [],
    id: "race_active",
    organizerComment: "",
    phase: "active",
    projections: [],
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    registrations: [],
    reports: [],
    runnerTasks: [],
    submissions: [],
    teamComments: [],
    teams: [],
    title: "Sorting Challenge",
    leaderboardEntries: [],
    ...overrides,
  } as unknown as RaceListItem;
}

test("organizer console avoids exposing legacy compatibility wording in ca-status, judging, awards, and reports sections", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      section="ca-status"
    />,
  ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="judging"
      />,
    ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="awards"
      />,
    ) +
    renderToStaticMarkup(
      <OrganizerConsolePageView
        judgeAssignments={[]}
        judges={[]}
        race={buildRace()}
        raceSlug="race_active--sorting-challenge"
        section="reports"
      />,
    );

  assert.doesNotMatch(html, /Legacy Compatibility/);
  assert.doesNotMatch(html, /Legacy Harness Compatibility/);
  assert.doesNotMatch(html, /Organizer Summary Fallback/);
  assert.doesNotMatch(html, /current live display compatibility layer/);
  assert.match(html, /Projection \/ Display Status/);
  assert.match(html, /Process Evaluation/);
  assert.match(html, /Published Skill Signals/);
  assert.match(html, /Organizer Report Notes/);
});
