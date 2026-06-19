/**
 * Jumbotron 在线态新鲜度 — 验收测试
 *
 * 验证目标（status.md 2026-06-19）：
 *   E. adapter.ts updatedAt 优先 latestSession.lastActiveAt
 *   F. resolveMotionState stale detection
 *
 * 运行：node --import tsx --test src/lib/services/adapter-freshness-convergence.test.ts
 *
 * ── 修改记录 ────────────────────────────
 * 2026-06-19 系统审计    首次创建   2 项
 */
import assert from "node:assert/strict";
import test from "node:test";
import { mapToRacingEntries } from "../jumbotron/adapter";
import type { AryRaceData } from "../jumbotron/adapter";
import { resolveMotionState } from "../jumbotron/track-runtime/animation-state";

function mk(o?: Partial<AryRaceData>): AryRaceData {
  return { id: "r", title: "T", summary: "",
    signupStart: new Date("2026-06-15"), signupEnd: new Date("2026-06-16"),
    raceStart: new Date("2026-06-18T08:00"), raceEnd: new Date("2026-06-19T08:00"),
    organizer: { id: "o", username: "d" },
    registrations: [], projections: [], teams: [], leaderboardEntries: [],
    submissions: [], teamArchives: [], feedbackThreads: [], ...o };
}

test("[E] Session time priority: lastActiveAt > updatedAt > entry.createdAt", () => {
  const la = new Date("2026-06-19T11:50:00Z");
  const r = mapToRacingEntries(mk({
    teams: [{ id: "t", name: "T", captain: { id: "a", username: "alice" } }],
    leaderboardEntries: [{ id: "l", teamId: "t", totalScore: 88, progress: 0.5, taskScore: 80, tokenScore: 72, dialogueScore: 82, agentType: "CLAUDE", createdAt: new Date("2026-06-19T10:00:00Z") }],
    registrations: [{
      id: "r", userId: "a", user: { id: "a", username: "alice" },
      raceProject: { id: "rp", aggregateIngestionStatus: "ACTIVE", caConnections: [{
        caType: "CODEX", sessions: [{
          id: "s", lastActiveAt: la, updatedAt: new Date("2026-06-19T11:40:00Z"),
          progressPercent: 50, tokenCost: 500,
        }],
      }] },
    }],
  }));
  assert.equal(r[0]!.updatedAt, la.toISOString());
});

test("[F] resolveMotionState stale detection", () => {
  const now = new Date("2026-06-19T12:00:00Z");
  const s = new Date("2026-06-19T11:54:00Z").toISOString();
  const f = new Date("2026-06-19T11:59:00Z").toISOString();
  assert.equal(resolveMotionState("running", s, now), "stale");
  assert.equal(resolveMotionState("sprinting", s, now), "stale");
  assert.equal(resolveMotionState("running", f, now), "running");
  assert.equal(resolveMotionState("sprinting", f, now), "sprinting");
  assert.equal(resolveMotionState("idle", s, now), "idle");
  assert.equal(resolveMotionState("finished", s, now), "finished");
  assert.equal(resolveMotionState("slowed", s, now), "slowed");
  assert.equal(resolveMotionState("running", undefined, now), "running");
});
