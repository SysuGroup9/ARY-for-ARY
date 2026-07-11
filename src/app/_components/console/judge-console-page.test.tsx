import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { JudgeConsolePageView } from "./judge-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_active",
    phase: "judging",
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    summary: "进行中的赛事。",
    title: "Sorting Challenge",
    ...overrides,
  } as unknown as RaceListItem;
}

test("judge console surfaces review readiness prompts for risky assignments", () => {
  const html = renderToStaticMarkup(
    <JudgeConsolePageView
      assignments={[
        {
          assignedAt: new Date("2026-06-19T12:00:00Z"),
          assignedByUser: { username: "organizer_amy" },
          id: "assign_1",
          judge: { username: "judge_amy" },
          judgingRecord: null,
          work: {
            awards: [],
            registration: {
              evidences: [
                {
                  confidenceLevel: "MEDIUM",
                  integrityStatus: "REVIEW_NEEDED",
                  reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
                  summary: "证据摘要",
                  type: "SESSION_SUMMARY",
                  visibility: "INTERNAL",
                },
              ],
              raceProject: {
                aggregateIngestionStatus: "FAILED",
              },
              user: { username: "rider_bob" },
            },
            summary: "",
            title: "Render Rocket",
          },
        },
      ]}
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      section="assigned"
    />,
  );

  assert.match(html, /评审前风险提示/);
  assert.match(html, /状态：需要复核/);
  assert.match(html, /CA 接入：接入失败/);
  assert.match(html, /复核原因：CA 接入失败（高）/);
  assert.match(html, /复核原因：存在证据复核标记（高）/);
  assert.match(html, /复核原因：存在中可信度证据（中）/);
  assert.match(html, /复核原因：作品内容为空（中）/);
  assert.match(html, /复核标记：source_event_review_needed/);
});
