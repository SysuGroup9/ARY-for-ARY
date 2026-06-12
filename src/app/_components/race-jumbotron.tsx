import { adaptToRaceSnapshot } from "../../../Jumbotron/adapter";
import { RaceLiveView } from "@/app/jumbotron/race-live-view";
import type { RaceListItem } from "@/lib/services/races";

/**
 * Server Component bridge: transforms a RaceListItem (from listRaces()) into
 * a RaceSnapshot and renders the Jumbotron track visualization in embedded mode.
 *
 * Data flow (strictly separated):
 *   Progress  → LeaderboardEntry.totalScore (PROGRESS_EVAL, Runner auto-pull)
 *   Quality   → latest Submission.totalScore (SUBMISSION_TEST, Rider-initiated)
 *   Activity  → count of SCORED Submissions (主动提交次数, Rider-initiated)
 */
export function RaceJumbotron({ race }: { race: RaceListItem }) {
  // Build quality and submission count maps from SCORED submissions only.
  // race.submissions is ordered by createdAt desc, so the first SCORED entry per
  // team is the most recent one — that's the quality score we want.
  const qualityMap = new Map<string, number>();
  const submissionCountMap = new Map<string, number>();

  for (const s of race.submissions) {
    if (s.status !== "SCORED") continue;
    if (!qualityMap.has(s.teamId)) {
      qualityMap.set(s.teamId, s.totalScore ?? 0);
    }
    submissionCountMap.set(s.teamId, (submissionCountMap.get(s.teamId) ?? 0) + 1);
  }

  const archiveMap = new Map(race.teamArchives.map((a) => [a.teamId, a]));
  const activeTaskTeams = new Set(
    race.runnerTasks.filter((t) => t.status === "CLAIMED").map((t) => t.teamId),
  );

  // leaderboardEntries already ranked (buildRankedLeaderboardEntries in listRaces)
  const rows = race.leaderboardEntries.map((e) => {
    const arc = archiveMap.get(e.teamId);
    return {
      teamId: e.teamId,
      teamName: e.team.name,
      progressScore: e.totalScore,
      qualityScore: qualityMap.get(e.teamId) ?? 0,
      rank: e.rank ?? 1,
      createdAt: e.createdAt,
      antiCheatPenalty: arc?.antiCheatPenalty ?? 0,
      tokenUsed: arc?.tokenUsed ?? 0,
      submissionCount: submissionCountMap.get(e.teamId) ?? 0,
      hasActiveTask: activeTaskTeams.has(e.teamId),
    };
  });

  const snapshot = adaptToRaceSnapshot(rows, {
    raceId: race.id,
    title: race.title,
    currentPhase: race.phase,
    raceStart: race.raceStart,
  });

  return (
    <RaceLiveView
      snapshot={snapshot}
      trackId={race.trackId}
      trackCenterlineJson={race.trackCenterlineJson}
      trackDirection={race.trackDirection}
      trackStartFinishS={race.trackStartFinishS}
      checkpointCount={race.checkpointCount ?? 3}
      embedded
      raceStartMs={race.raceStart?.getTime() ?? undefined}
    />
  );
}
