import { prisma } from "@/lib/prisma";
import { buildRankedLeaderboardEntries } from "@/lib/leaderboard";
import { getRacePhase } from "@/lib/race-phase";
import { adaptToRaceSnapshot } from "../../../Jumbotron/adapter";
import { RaceLiveView } from "./race-live-view";

interface Props {
  searchParams: Promise<{ raceId?: string; debug?: string }>;
}

export default async function JumbotronPage({ searchParams }: Props) {
  const { raceId, debug } = await searchParams;
  const isDebug = debug === "1" || debug === "true";

  if (!raceId) {
    return <RaceSelector />;
  }

  const race = await prisma.race.findUnique({ where: { id: raceId } });
  if (!race) {
    return (
      <div style={{ color: "white", padding: 40, background: "#0a0e1a", minHeight: "100vh" }}>
        比赛不存在：{raceId}
      </div>
    );
  }

  const [leaderboardEntries, archives, scoredSubmissions, runningTasks] = await Promise.all([
    // 进度分：来自 PROGRESS_EVAL，每队一条，存入 LeaderboardEntry
    prisma.leaderboardEntry.findMany({
      where: { raceId },
      include: { team: true },
      orderBy: { totalScore: "desc" },
    }),
    // 违规标记 + Token 消耗：来自 TeamArchive
    prisma.teamArchive.findMany({
      where: { raceId },
      select: { teamId: true, antiCheatPenalty: true, tokenUsed: true },
    }),
    // 质量分：来自 SUBMISSION_TEST，取每队最新一条 SCORED 提交的 totalScore
    prisma.submission.findMany({
      where: { raceId, status: "SCORED" },
      orderBy: { scoredAt: "desc" },
      select: { teamId: true, totalScore: true },
    }),
    // CLAIMED 状态的 Runner 任务（Runner 已领取但未完成）→ pit_stop 状态
    prisma.runnerTask.findMany({
      where: { raceId, status: "CLAIMED" },
      select: { teamId: true },
    }),
  ]);

  // Archive data per team (penalty, token usage, agent type)
  const archiveMap = new Map(archives.map((a) => [a.teamId, a]));
  const activeTaskTeams = new Set(runningTasks.map((t) => t.teamId));

  // qualityScore per team — first occurrence is the latest (ordered by scoredAt desc)
  // submissionCount per team — total number of scored submissions (proxy for active submitting)
  const qualityMap = new Map<string, number>();
  const submissionCountMap = new Map<string, number>();
  for (const s of scoredSubmissions) {
    if (!qualityMap.has(s.teamId)) {
      qualityMap.set(s.teamId, s.totalScore ?? 0);
    }
    submissionCountMap.set(s.teamId, (submissionCountMap.get(s.teamId) ?? 0) + 1);
  }

  const ranked = buildRankedLeaderboardEntries(leaderboardEntries);
  const rows = ranked.map((e) => {
    const arc = archiveMap.get(e.teamId);
    return {
      teamId: e.teamId,
      teamName: e.team.name,
      progressScore: e.totalScore,               // PROGRESS_EVAL score → horse position
      qualityScore: qualityMap.get(e.teamId) ?? 0, // SUBMISSION_TEST score → quality dimension
      rank: e.rank,
      createdAt: e.createdAt,
      antiCheatPenalty: arc?.antiCheatPenalty ?? 0,
      tokenUsed: arc?.tokenUsed ?? 0,
      submissionCount: submissionCountMap.get(e.teamId) ?? 0,
      hasActiveTask: activeTaskTeams.has(e.teamId),
    };
  });

  const phase = getRacePhase(race);
  const snapshot = adaptToRaceSnapshot(rows, {
    raceId: race.id,
    title: race.title,
    currentPhase: phase,
    raceStart: race.raceStart,
  });

  return (
    <RaceLiveView
      snapshot={snapshot}
      trackId={race.trackId}
      trackCenterlineJson={race.trackCenterlineJson}
      trackDirection={race.trackDirection}
      trackStartFinishS={race.trackStartFinishS}
      checkpointCount={race.checkpointCount}
      debug={isDebug}
      raceStartMs={race.raceStart?.getTime()}
    />
  );
}

async function RaceSelector() {
  const races = await prisma.race.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, raceStart: true },
  });

  return (
    <div style={{
      background: "#0a0e1a", minHeight: "100vh", color: "white",
      padding: 60, fontFamily: "system-ui, sans-serif",
    }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>DevCompass Racing · Jumbotron</h1>
      <p style={{ color: "#94a3b8", marginBottom: 40 }}>选择一场比赛以展示进度跑马场</p>
      {races.length === 0 && <p style={{ color: "#64748b" }}>暂无比赛</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {races.map((r) => (
          <a
            key={r.id}
            href={`/jumbotron?raceId=${r.id}`}
            style={{
              display: "block", padding: "16px 24px",
              background: "#1a2035", borderRadius: 8,
              color: "white", textDecoration: "none",
              border: "1px solid #1e3a5f",
            }}
          >
            <span style={{ fontWeight: 600 }}>{r.title}</span>
            <span style={{ marginLeft: 16, color: "#64748b", fontSize: 13 }}>
              {r.raceStart.toLocaleDateString("zh-CN")}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
