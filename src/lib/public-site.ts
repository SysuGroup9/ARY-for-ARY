import type { ReturnTypeOfBuildPublicSiteModel } from "./public-site-types";

type RaceSummaryLike = {
  id: string;
  title: string;
  summary: string;
  phase: string;
  raceStart: Date;
  raceEnd: Date;
  teams: Array<{
    id: string;
    name: string;
    captain: { id: string; username: string };
  }>;
  highlights: Array<{
    id: string;
    teamId: string;
    team: { id: string; name: string };
    agentType: string;
    score: number;
    excerpt: string;
    codeSnippet: string;
  }>;
  teamArchives: Array<{
    id: string;
    teamId: string;
    team: { id: string; name: string };
    agentType: string;
    totalScore: number;
  }>;
  leaderboardEntries: Array<{
    id: string;
    teamId: string;
    team: { id: string; name: string };
    totalScore: number;
    rank: number;
    agentType: string;
  }>;
};

function getCurrentProgressPercent(race: Pick<RaceSummaryLike, "leaderboardEntries">): number {
  if (race.leaderboardEntries.length === 0) return 0;
  const top = race.leaderboardEntries[0]?.totalScore ?? 0;
  if (top <= 0) return 0;
  const total = race.leaderboardEntries.reduce(
    (sum, entry) => sum + Math.min(entry.totalScore / top, 1),
    0,
  );
  return Math.round((total / race.leaderboardEntries.length) * 100);
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function buildRaceSlug(raceId: string, title: string): string {
  return `${raceId}--${slugify(title)}`;
}

export function getRaceIdFromSlug(slug: string): string {
  return slug.split("--")[0] ?? slug;
}

export function buildWorkSlug(
  raceId: string,
  teamId: string,
  workTitle: string,
): string {
  return `${raceId}__${teamId}--${slugify(workTitle)}`;
}

export function getWorkPartsFromSlug(slug: string): {
  raceId: string;
  teamId: string;
} {
  const [composite] = slug.split("--");
  const [raceId, teamId] = composite.split("__");
  return { raceId, teamId };
}

export function buildRiderSlug(riderId: string, username: string): string {
  return `${riderId}--${slugify(username)}`;
}

export function getRiderIdFromSlug(slug: string): string {
  return slug.split("--")[0] ?? slug;
}

export function buildPublicSiteModel<T extends RaceSummaryLike>(
  races: readonly T[],
): ReturnTypeOfBuildPublicSiteModel {
  const featuredRaces = [...races].sort((a, b) => {
    const phaseScore = phasePriority(a.phase) - phasePriority(b.phase);
    if (phaseScore !== 0) return phaseScore;
    return b.raceStart.getTime() - a.raceStart.getTime();
  }).map((race) => ({
    id: race.id,
    slug: buildRaceSlug(race.id, race.title),
    title: race.title,
    summary: race.summary,
    phase: race.phase,
    raceStart: race.raceStart,
    raceEnd: race.raceEnd,
    teamCount: race.teams.length,
    workCount: race.highlights.length,
    activeRiderCount: race.teams.length,
    currentProgressPercent: getCurrentProgressPercent(race),
  }));
  const liveRaces = featuredRaces.filter(
    (race) => race.phase === "active" || race.phase === "frozen",
  );

  const latestResults = [...races]
    .filter((race) => race.phase === "finished")
    .sort((a, b) => b.raceEnd.getTime() - a.raceEnd.getTime())
    .map((race) => ({
      id: race.id,
      slug: buildRaceSlug(race.id, race.title),
      title: race.title,
      summary: race.summary,
    }));

  const finishedRaces = races.filter((race) => race.phase === "finished");
  const pastRaces = finishedRaces.map((race) => ({
    id: race.id,
    slug: buildRaceSlug(race.id, race.title),
    title: race.title,
    summary: race.summary,
  }));

  const featuredWorks = finishedRaces.flatMap((race) =>
    race.highlights.map((highlight) => ({
      id: buildWorkSlug(race.id, highlight.teamId, highlight.team.name),
      raceId: race.id,
      raceSlug: buildRaceSlug(race.id, race.title),
      raceTitle: race.title,
      title: highlight.team.name,
      author:
        race.teams.find((team) => team.id === highlight.teamId)?.captain.username ??
        highlight.team.name,
      excerpt: highlight.excerpt,
      score: highlight.score,
      agentType: highlight.agentType,
    })),
  );

  const riderMap = new Map<
    string,
    {
      id: string;
      riderSlug: string;
      username: string;
      orgLabel: string;
      featuredRaceTitle: string | null;
      featuredWorkTitle: string | null;
      raceCount: number;
      workCount: number;
      publicWorkLinks: Array<{
        title: string;
        href: string;
      }>;
    }
  >();

  for (const race of races) {
    for (const team of race.teams) {
      const existing = riderMap.get(team.captain.id);
      if (existing) {
        existing.raceCount += 1;
        if (race.highlights.some((highlight) => highlight.teamId === team.id)) {
          existing.workCount += 1;
        }
      } else {
        riderMap.set(team.captain.id, {
          id: team.captain.id,
          riderSlug: buildRiderSlug(team.captain.id, team.captain.username),
          username: team.captain.username,
          orgLabel: "ARY",
          featuredRaceTitle: race.title,
          featuredWorkTitle:
            race.highlights.find((highlight) => highlight.teamId === team.id)?.team.name ??
            null,
          raceCount: 1,
          workCount: race.highlights.some((highlight) => highlight.teamId === team.id) ? 1 : 0,
          publicWorkLinks: race.highlights
            .filter((highlight) => highlight.teamId === team.id)
            .map((highlight) => ({
              title: highlight.team.name,
              href: `/works/${buildWorkSlug(race.id, highlight.teamId, highlight.team.name)}`,
            })),
        });
      }
    }
  }

  const featuredRiders = [...riderMap.values()].sort((a, b) => {
    if (b.workCount !== a.workCount) return b.workCount - a.workCount;
    return b.raceCount - a.raceCount;
  });

  return {
    featuredRaces,
    liveRaces,
    latestResults,
    pastRaces,
    featuredWorks,
    featuredRiders,
  };
}

export function getRacePrimaryCta(
  race: {
    slug: string;
    phase: string;
  },
): { href: string; label: string } {
  switch (race.phase) {
    case "registration":
    case "preparation":
      return { href: `/races/${race.slug}`, label: "查看赛题" };
    case "active":
    case "frozen":
      return { href: `/races/${race.slug}/live`, label: "进入实况大厅" };
    case "finished":
      return { href: `/races/${race.slug}/results`, label: "查看赛果" };
    default:
      return { href: `/races/${race.slug}`, label: "进入赛事页" };
  }
}

export function groupPublicRacesByPhase<
  T extends { phase: string },
>(races: readonly T[]) {
  return {
    active: races.filter((race) => race.phase === "active"),
    frozen: races.filter((race) => race.phase === "frozen"),
    registration: races.filter((race) => race.phase === "registration"),
    preparation: races.filter((race) => race.phase === "preparation"),
    finished: races.filter((race) => race.phase === "finished"),
  };
}

export function sortFeaturedWorks<
  T extends { score: number; title: string },
>(works: readonly T[], sortBy: "score" | "title") {
  return [...works].sort((left, right) => {
    if (sortBy === "score") {
      if (right.score !== left.score) return right.score - left.score;
      return left.title.localeCompare(right.title, "zh-CN");
    }

    return left.title.localeCompare(right.title, "zh-CN");
  });
}

function phasePriority(phase: string): number {
  switch (phase) {
    case "active":
      return 0;
    case "frozen":
      return 1;
    case "registration":
      return 2;
    case "preparation":
      return 3;
    case "finished":
      return 4;
    default:
      return 5;
  }
}
