import assert from "node:assert/strict";
import test from "node:test";
import { buildRankedLeaderboardEntries } from "./leaderboard";

test("builds explicit ranks from score desc and createdAt asc", () => {
  const ranked = buildRankedLeaderboardEntries([
    {
      createdAt: new Date("2026-06-06T10:05:00.000Z"),
      id: "entry_b",
      totalScore: 88.5,
    },
    {
      createdAt: new Date("2026-06-06T10:00:00.000Z"),
      id: "entry_a",
      totalScore: 92,
    },
    {
      createdAt: new Date("2026-06-06T10:01:00.000Z"),
      id: "entry_c",
      totalScore: 88.5,
    },
  ]);

  assert.deepEqual(
    ranked.map((entry) => ({
      id: entry.id,
      rank: entry.rank,
      totalScore: entry.totalScore,
    })),
    [
      {
        id: "entry_a",
        rank: 1,
        totalScore: 92,
      },
      {
        id: "entry_c",
        rank: 2,
        totalScore: 88.5,
      },
      {
        id: "entry_b",
        rank: 3,
        totalScore: 88.5,
      },
    ],
  );
});
