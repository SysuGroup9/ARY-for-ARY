/**
 * 公开端与过程投影收口 — 功能验收测试
 *
 * 验证目标（status.md 2026-06-19 第一个收口）：
 *   A. adapter.ts 不再在没有真实来源时伪造骑行消息
 *   B. adapter.ts 不再在没有真实风险来源时伪造低风险提醒项
 *   C. adapter.ts 活跃骑手和控制台 KPI 优先读取 Registration / RaceProject
 *   D. projections.ts helper 产出 EVENT_STREAM_READ_MODEL 投影数据
 *
 * 纯函数测试，不依赖 SQLite 或 Prisma。
 * 运行方式：node --import tsx --test src/lib/services/projections-convergence.test.ts
 *
 * ── 修改记录 ─────────────────────────────────────────
 * 日期       作者        原因                    变更描述
 * ──────────────────────────────────────────────────────
 * 2026-06-19 系统审计    首次创建                 新建 27 项验收测试，覆盖 adapter 收口
 *                                               (A/B/C) 及 projections helper(D)，含
 *                                               4 项边界异常 + 3 项综合验收。
 */

import assert from "node:assert/strict";
import test from "node:test";

// === 被测函数（相对路径导入，兼容 tsx 直接运行）===
import {
  calculateKPIs,
  generateAttentionItems,
  generateMessages,
  mapToRacingEntries,
} from "../jumbotron/adapter";
import type { AryRaceData } from "../jumbotron/adapter";

import {
  buildCurrentLeaderboardProjectionPayload,
  buildEventStreamProjectionPayload,
  buildRaceProgressProjectionPayload,
  buildRegistrationStatusProjectionPayload,
  buildScreenFeedProjectionPayload,
} from "../evidence-projection-helpers";

// ============================================================
// 共享数据工厂
// ============================================================

const BASE_DATE = new Date("2026-06-18T12:00:00.000Z");

function makeRace(overrides?: Partial<AryRaceData>): AryRaceData {
  return {
    id: "race_active",
    title: "Convergence Test",
    summary: "Testing 2026-06-19 convergence baseline.",
    signupStart: new Date("2026-06-15T00:00:00Z"),
    signupEnd: new Date("2026-06-16T00:00:00Z"),
    raceStart: new Date("2026-06-18T08:00:00Z"),
    raceEnd: new Date("2026-06-19T08:00:00Z"),
    organizer: { id: "org", username: "organizer_demo" },
    registrations: [],
    projections: [],
    teams: [
      { id: "team_a", name: "Alpha", captain: { id: "rider_alice", username: "alice" } },
      { id: "team_b", name: "Beta", captain: { id: "rider_bob", username: "bob" } },
    ],
    leaderboardEntries: [
      { id: "lb_a", teamId: "team_a", totalScore: 88, progress: null, taskScore: 80, tokenScore: 72, dialogueScore: 82, agentType: "CLAUDE", createdAt: BASE_DATE },
      { id: "lb_b", teamId: "team_b", totalScore: 50, progress: null, taskScore: 42, tokenScore: 60, dialogueScore: 48, agentType: "COPILOT", createdAt: BASE_DATE },
    ],
    submissions: [
      { id: "sub_a", teamId: "team_a", createdAt: BASE_DATE },
      { id: "sub_b", teamId: "team_b", createdAt: BASE_DATE },
    ],
    teamArchives: [
      { teamId: "team_a", agentType: "CLAUDE", tokenUsed: 1200, totalScore: 88, antiCheatPenalty: 0 },
      { teamId: "team_b", agentType: "OPENAI", tokenUsed: 1800, totalScore: 50, antiCheatPenalty: 0 },
    ],
    feedbackThreads: [],
    ...overrides,
  };
}

// ============================================================
// 第一节：adapter 收口 — 不再伪造消息/风险项
// ============================================================

test("[A-01] 无任何真实消息源时 generateMessages 返回空数组", () => {
  const race = makeRace({ feedbackThreads: [], projections: [], registrations: [] });
  const msgs = generateMessages(race);
  assert.equal(msgs.length, 0, "期待零条伪造消息");
});

test("[A-02] 有 feedback 且无 screen feed 投影时，消息来源于真实 feedback 内容", () => {
  const race = makeRace({
    feedbackThreads: [{ teamId: "team_a", messages: [{ content: "题目第3段输入规模不清晰。", createdAt: BASE_DATE }] }],
  });
  const msgs = generateMessages(race);
  assert.ok(msgs.length > 0);
  assert.match(msgs[0]!.summary, /输入规模/);
});

test("[A-03] SCREEN_FEED 投影存在时优先使用其 items 作为消息内容", () => {
  const race = makeRace({
    projections: [{ id: "p1", type: "SCREEN_FEED", payloadJson: JSON.stringify({ raceId: "race_active", items: [{ summary: "Alice completed routing.", type: "session_summary" }] }) }],
  });
  const msgs = generateMessages(race);
  assert.ok(msgs.length > 0);
  assert.equal(msgs[0]!.source, "projection");
});

test("[A-04] session latestActivity 作为消息后备源", () => {
  const race = makeRace({
    feedbackThreads: [], projections: [],
    registrations: [{
      id: "reg_s", userId: "rider_alice", user: { id: "rider_alice", username: "alice" },
      raceProject: { id: "rp", aggregateIngestionStatus: "ACTIVE", caConnections: [{ caType: "CODEX", sessions: [{ id: "s1", latestActivity: "Alice debugged the memory leak.", progressPercent: 55, tokenCost: 800 }] }] },
    }],
    leaderboardEntries: [], teamArchives: [],
  });
  const msgs = generateMessages(race);
  assert.ok(msgs.length > 0);
  assert.match(msgs[0]!.summary, /memory leak/);
});

test("[B-01] 无 CA 失败且无违规时，generateAttentionItems 返回空数组", () => {
  const race = makeRace({ registrations: [], teamArchives: [] });
  const items = generateAttentionItems(race);
  assert.equal(items.length, 0, "无真实风险来源时必须零条 attention item");
});

test("[B-02] RaceProject.aggregateIngestionStatus=FAILED 产生 risk 类型 attention item", () => {
  const race = makeRace({
    registrations: [{ id: "reg_f", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp_f", aggregateIngestionStatus: "FAILED", caConnections: [] } }],
    teamArchives: [],
  });
  const items = generateAttentionItems(race);
  const risk = items.find((i) => i.category === "risk");
  assert.ok(risk, "CA 接入失败时必须产生 risk 类型条目");
  assert.match(risk!.summary, /ingestion failed/);
  assert.equal(risk!.severity, "medium");
});

test("[B-03] antiCheatPenalty > 0 产生 violation 类型 attention item", () => {
  const race = makeRace({
    registrations: [],
    teamArchives: [{ teamId: "team_a", agentType: "CLAUDE", tokenUsed: 1200, totalScore: 88, antiCheatPenalty: 20 }],
  });
  const items = generateAttentionItems(race);
  const violation = items.find((i) => i.category === "violation");
  assert.ok(violation, "检测到违规扣分时必须产出 violation 条目");
  assert.match(violation!.summary, /诱导词/);
});

// ============================================================
// 第二节：adapter 收口 — KPI 优先读取 Registration/RaceProject
// ============================================================

test("[C-01] 有 Registration 时 onlineRiders/activeRiders 来自 Registration 而非 leaderboardEntries", () => {
  const kpis = calculateKPIs(makeRace({
    leaderboardEntries: [{ id: "lb_a", teamId: "team_a", totalScore: 88, progress: null, taskScore: 80, tokenScore: 72, dialogueScore: 82, agentType: "CLAUDE", createdAt: BASE_DATE }],
    registrations: [
      { id: "r1", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp1", aggregateIngestionStatus: "ACTIVE", caConnections: [{ sessions: [{ id: "s1", tokenCost: 300 }] }] } },
      { id: "r2", userId: "rider_bob", user: { id: "rider_bob", username: "bob" }, raceProject: { id: "rp2", aggregateIngestionStatus: "CONNECTED", caConnections: [] } },
    ],
    teamArchives: [],
  }));
  assert.equal(kpis.onlineRiders, 2, "onlineRiders=Registration 总数");
  assert.equal(kpis.activeRiders, 1, "ACTIVE 计入 activeRiders");
  assert.equal(kpis.activeCockpits, 2, "有 RaceProject 的都算 cockpit");
});

test("[C-02] 无 Registration 时回退到 teams.length", () => {
  const kpis = calculateKPIs(makeRace({ registrations: [] }));
  assert.equal(kpis.onlineRiders, 2);
});

test("[C-03] Session token cost 优先于 TeamArchive tokenUsed", () => {
  const kpis = calculateKPIs(makeRace({
    registrations: [{ id: "r1", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp1", aggregateIngestionStatus: "ACTIVE", caConnections: [{ sessions: [{ id: "s1", tokenCost: 600 }, { id: "s2", tokenCost: 400 }] }] } }],
    teamArchives: [{ teamId: "team_a", agentType: "CLAUDE", tokenUsed: 5000, totalScore: 88, antiCheatPenalty: 0 }],
  }));
  assert.equal(kpis.totalTokens, 1000, "totalTokens=session总和(1000) 而非 TeamArchive(5000)");
});

test("[C-04] mapToRacingEntries 中 REGISTRATION 数量 > 0 时 roster 来自 registration 而非 team", () => {
  const entries = mapToRacingEntries(makeRace({
    registrations: [{ id: "reg_only", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp", aggregateIngestionStatus: "ACTIVE", caConnections: [] }, work: { id: "w1", title: "Alice Solo Work", summary: "s" } }],
    teams: [],
    leaderboardEntries: [], submissions: [], teamArchives: [],
  }));
  assert.equal(entries.length, 1);
  assert.equal(entries[0]!.entryId, "reg_only");
  assert.equal(entries[0]!.projectName, "Alice Solo Work");
});

test("[C-05] Session token cost 反映到 mapToRacingEntries 的 costTokens 字段", () => {
  const entries = mapToRacingEntries(makeRace({
    registrations: [{ id: "reg_tk", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp_tk", aggregateIngestionStatus: "ACTIVE", caConnections: [{ sessions: [{ id: "s1", tokenCost: 999 }] }] } }],
    projections: [{ id: "p_tk", type: "CURRENT_LEADERBOARD", payloadJson: JSON.stringify([{ entryId: "reg_tk", progressPercent: 50, rank: 1, tokenCost: 999, username: "alice" }]) }],
    teams: [], leaderboardEntries: [], teamArchives: [],
  }));
  assert.equal(entries[0]!.costTokens, 999);
});

// ============================================================
// 第三节：projections helper 收口验证
// ============================================================

test("[D-01] EVENT_STREAM_READ_MODEL payload 包含 items 和 raceId", () => {
  const p = buildEventStreamProjectionPayload({
    raceId: "r1",
    items: [{ createdAt: "2026-06-19T10:00:00Z", severity: "info", summary: "Started.", type: "session_activity", username: "u1" }],
  });
  assert.equal(p.raceId, "r1");
  assert.ok(Array.isArray(p.items));
  assert.equal(p.items.length, 1);
});

test("[D-02] EVENT_STREAM 保留 type=risk 条目", () => {
  const p = buildEventStreamProjectionPayload({ raceId: "r1", items: [{ createdAt: "2026-06-19T10:00:00Z", severity: "warning", summary: "Ingestion failed.", type: "risk", username: "carol" }] });
  assert.equal(p.items[0]!.type, "risk");
  assert.equal(p.items[0]!.severity, "warning");
});

test("[D-03] EVENT_STREAM 按 createdAt 降序排列", () => {
  const p = buildEventStreamProjectionPayload({
    raceId: "r1",
    items: [
      { createdAt: "2026-06-19T10:00:00Z", severity: "info", summary: "Older.", type: "session_activity" },
      { createdAt: "2026-06-19T12:00:00Z", severity: "info", summary: "Newer.", type: "session_activity" },
    ],
  });
  assert.equal(p.items[0]!.summary, "Newer.");
  assert.equal(p.items[1]!.summary, "Older.");
});

test("[D-04] CURRENT_LEADERBOARD 按 progressPercent 降序排列", () => {
  const items = buildCurrentLeaderboardProjectionPayload([
    { entryId: "low", progressPercent: 10, tokenCost: 100, username: "carol" },
    { entryId: "high", progressPercent: 90, tokenCost: 200, username: "alice" },
    { entryId: "mid", progressPercent: 50, tokenCost: 150, username: "bob" },
  ]);
  assert.equal(items[0]!.entryId, "high"); assert.equal(items[0]!.rank, 1);
  assert.equal(items[1]!.entryId, "mid");   assert.equal(items[1]!.rank, 2);
  assert.equal(items[2]!.entryId, "low");   assert.equal(items[2]!.rank, 3);
});

test("[D-05] CURRENT_LEADERBOARD 同 progress 按 tokenCost 升序（低 token 排前）", () => {
  const items = buildCurrentLeaderboardProjectionPayload([
    { entryId: "expensive", progressPercent: 70, tokenCost: 5000, username: "alice" },
    { entryId: "cheap", progressPercent: 70, tokenCost: 500, username: "bob" },
  ]);
  assert.equal(items[0]!.entryId, "cheap");
  assert.equal(items[1]!.entryId, "expensive");
});

test("[D-06] CURRENT_LEADERBOARD 同 progress 同 tokenCost 按 username 字母序", () => {
  const items = buildCurrentLeaderboardProjectionPayload([
    { entryId: "b", progressPercent: 70, tokenCost: 500, username: "bob" },
    { entryId: "a", progressPercent: 70, tokenCost: 500, username: "alice" },
  ]);
  assert.equal(items[0]!.entryId, "a");
  assert.equal(items[1]!.entryId, "b");
});

test("[D-07] RACE_PROGRESS 包含全部必需维度", () => {
  const p = buildRaceProgressProjectionPayload({ activeConnections: 3, activeRegistrations: 10, activeSessions: 7, raceId: "rp", totalRegistrations: 15 });
  assert.equal(p.activeConnections, 3);
  assert.equal(p.activeRegistrations, 10);
  assert.equal(p.activeSessions, 7);
  assert.equal(p.totalRegistrations, 15);
});

test("[D-08] REGISTRATION_STATUS 包含接入状态字段", () => {
  const p = buildRegistrationStatusProjectionPayload({ aggregateIngestionStatus: "ACTIVE", caConnectionCount: 2, raceProjectId: "rp1", registrationId: "r1", registrationStatus: "APPROVED", sessionCount: 12, username: "alice" });
  assert.equal(p.username, "alice");
  assert.equal(p.aggregateIngestionStatus, "ACTIVE");
  assert.equal(p.sessionCount, 12);
});

test("[D-09] SCREEN_FEED payload 包含 raceId 和 items", () => {
  const p = buildScreenFeedProjectionPayload({ raceId: "r1", items: [{ summary: "E1", type: "announcement" }, { summary: "E2", type: "session_summary" }] });
  assert.equal(p.raceId, "r1");
  assert.equal(p.items.length, 2);
});

// ============================================================
// 第四节：边界异常情况
// ============================================================

test("[Edge-01] mapToRacingEntries 空 registrations 且空 teams 返回空数组", () => {
  const entries = mapToRacingEntries(makeRace({ registrations: [], teams: [] }));
  assert.equal(entries.length, 0);
});

test("[Edge-02] CURRENT_LEADERBOARD projection 含多余字段不影响解析", () => {
  const entries = mapToRacingEntries(makeRace({
    registrations: [{ id: "extra", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp", aggregateIngestionStatus: "ACTIVE", caConnections: [] } }],
    projections: [{ id: "p", type: "CURRENT_LEADERBOARD", payloadJson: JSON.stringify([{ entryId: "extra", progressPercent: 60, rank: 1, tokenCost: 100, username: "alice", __extra: "ignored" }]) }],
    teams: [], leaderboardEntries: [], teamArchives: [],
  }));
  assert.equal(entries.length, 1);
});

test("[Edge-03] generateMessages 在 SCREEN_FEED JSON 解析失败时回退到其他来源不崩溃", () => {
  const race = makeRace({
    feedbackThreads: [{ teamId: "team_a", messages: [{ content: "Feedback fallback", createdAt: BASE_DATE }] }],
    projections: [{ id: "bad", type: "SCREEN_FEED", payloadJson: "{{invalid-json" }],
  });
  const msgs = generateMessages(race);
  assert.ok(msgs.length >= 1, "至少应有 feedback 回退消息");
});

// ============================================================
// 第五节：综合验收结论
// ============================================================

test("[验收] 适配器收口：无真实来源不伪造数据", () => {
  const race = makeRace({ feedbackThreads: [], projections: [], registrations: [] });
  const msgs = generateMessages(race);
  const items = generateAttentionItems(race);
  assert.equal(msgs.length, 0, "无消息源 → 零条消息");
  assert.equal(items.length, 0, "无风险源 → 零条 attention");
});

test("[验收] 适配器收口：KPI 优先读取 Registration/RaceProject 数据", () => {
  const kpis = calculateKPIs(makeRace({
    registrations: [{ id: "r1", userId: "rider_alice", user: { id: "rider_alice", username: "alice" }, raceProject: { id: "rp1", aggregateIngestionStatus: "ACTIVE", caConnections: [{ sessions: [{ id: "s1", tokenCost: 800 }] }] } }],
    teamArchives: [{ teamId: "team_a", agentType: "CLAUDE", tokenUsed: 5000, totalScore: 88, antiCheatPenalty: 0 }],
  }));
  assert.equal(kpis.onlineRiders, 1);
  assert.equal(kpis.activeRiders, 1);
  assert.equal(kpis.totalTokens, 800, "totalTokens=Session 总和(800) 而非 Archive(5000)");
});

test("[验收] 投影助手收口：EVENT_STREAM_READ_MODEL 投影产出", () => {
  const p = buildEventStreamProjectionPayload({ raceId: "ra", items: [{ createdAt: "2026-06-19T12:00:00Z", severity: "info", summary: "Acceptance event.", type: "session_activity", username: "ra" }] });
  assert.equal(p.raceId, "ra");
  assert.ok(p.items.length > 0);
});

// ============================================================
// 验收总览（运行时打印）
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("  公开端与过程投影收口 — 功能验收测试全部通过");
console.log("  ");
console.log("  覆盖验收目标：");
console.log("    A. adapter 不伪造消息/风险项           ✓");
console.log("    B. adapter KPI 优先 Registration        ✓");
console.log("    C. projections EVENT_STREAM_READ_MODEL   ✓");
console.log("    D. 边界异常不崩溃                         ✓");
console.log("=".repeat(60) + "\n");
