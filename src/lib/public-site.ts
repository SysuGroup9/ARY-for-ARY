import type { ReturnTypeOfBuildPublicSiteModel } from "./public-site-types";

type RaceSummaryLike = {
  id: string;
  title: string;
  summary: string;
  phase: string;
  raceStart: Date;
  raceEnd: Date;
  projections?: Array<{
    id: string;
    payloadJson: string;
    type: string;
  }>;
  registrations?: Array<{
    id: string;
    userId: string;
    user: { id: string; username: string };
    awards?: Array<{ awardName: string; rank: number }>;
    raceProject?: null | {
      aggregateIngestionStatus: string;
      id: string;
    };
    work?: null | {
      id: string;
      summary: string;
      title: string;
    };
  }>;
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

function getCurrentProgressPercent(
  race: Pick<RaceSummaryLike, "leaderboardEntries" | "projections">,
): number {
  const currentLeaderboard = parseCurrentLeaderboardProjection(race.projections);
  if (currentLeaderboard.length > 0) {
    const total = currentLeaderboard.reduce(
      (sum, entry) => sum + clampPercent(entry.progressPercent ?? 0),
      0,
    );
    return Math.round(total / currentLeaderboard.length);
  }

  if (race.leaderboardEntries.length === 0) return 0;
  const top = race.leaderboardEntries[0]?.totalScore ?? 0;
  if (top <= 0) return 0;
  const total = race.leaderboardEntries.reduce(
    (sum, entry) => sum + Math.min(entry.totalScore / top, 1),
    0,
  );
  return Math.round((total / race.leaderboardEntries.length) * 100);
}

function parseCurrentLeaderboardProjection(
  projections: RaceSummaryLike["projections"],
): Array<{ progressPercent?: number }> {
  const payloadJson = projections?.find(
    (projection) => projection.type === "CURRENT_LEADERBOARD",
  )?.payloadJson;

  if (!payloadJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(payloadJson) as Array<{ progressPercent?: number }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(value, 100));
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
  workId: string,
  workTitle: string,
): string {
  return `${raceId}__${workId}--${slugify(workTitle)}`;
}

export function getWorkPartsFromSlug(slug: string): {
  raceId: string;
  workId: string;
} {
  const [composite] = slug.split("--");
  const [raceId, workId] = composite.split("__");
  return { raceId, workId };
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
  const featuredRaces = [...races]
    .sort((a, b) => {
      const phaseScore = phasePriority(a.phase) - phasePriority(b.phase);
      if (phaseScore !== 0) return phaseScore;
      return b.raceStart.getTime() - a.raceStart.getTime();
    })
    .map((race) => ({
      id: race.id,
      slug: buildRaceSlug(race.id, race.title),
      title: race.title,
      summary: race.summary,
      phase: race.phase,
      raceStart: race.raceStart,
      raceEnd: race.raceEnd,
      teamCount: race.teams.length,
      workCount: race.registrations?.filter((registration) => registration.work).length ?? 0,
      activeRiderCount: race.registrations?.length ?? race.teams.length,
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

  const featuredWorks = finishedRaces.flatMap((race) => {
    return (race.registrations ?? [])
      .filter((registration) => registration.work)
      .map((registration) => ({
        id: buildWorkSlug(
          race.id,
          registration.work!.id,
          registration.work!.title,
        ),
        raceId: race.id,
        raceSlug: buildRaceSlug(race.id, race.title),
        raceTitle: race.title,
        title: registration.work!.title,
        author: registration.user.username,
        excerpt: registration.work!.summary,
        score: registration.awards?.length
          ? 100 - (registration.awards[0]!.rank - 1)
          : race.leaderboardEntries.find((entry) =>
              race.teams.find((team) => team.id === entry.teamId)?.captain.id ===
              registration.userId,
            )?.totalScore ?? 0,
        agentType:
          race.highlights.find((highlight) =>
            race.teams.find((team) => team.id === highlight.teamId)?.captain.id ===
            registration.userId,
          )?.agentType ?? "CUSTOM",
      }));
  });

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
    if (race.registrations?.length) {
      for (const registration of race.registrations) {
        const existing = riderMap.get(registration.user.id);
        const publicWorkLink = registration.work
          ? {
              title: registration.work.title,
              href: `/works/${buildWorkSlug(
                race.id,
                registration.work.id,
                registration.work.title,
              )}`,
            }
          : null;

        if (existing) {
          existing.raceCount += 1;
          if (publicWorkLink) {
            existing.workCount += 1;
            existing.publicWorkLinks.push(publicWorkLink);
            if (!existing.featuredWorkTitle) {
              existing.featuredWorkTitle = registration.work!.title;
            }
          }
        } else {
          riderMap.set(registration.user.id, {
            id: registration.user.id,
            riderSlug: buildRiderSlug(
              registration.user.id,
              registration.user.username,
            ),
            username: registration.user.username,
            orgLabel: "ARY",
            featuredRaceTitle: race.title,
            featuredWorkTitle: registration.work?.title ?? null,
            raceCount: 1,
            workCount: registration.work ? 1 : 0,
            publicWorkLinks: publicWorkLink ? [publicWorkLink] : [],
          });
        }
      }
      continue;
    }

    for (const team of race.teams) {
      const existing = riderMap.get(team.captain.id);
      if (existing) {
        existing.raceCount += 1;
      } else {
        riderMap.set(team.captain.id, {
          id: team.captain.id,
          riderSlug: buildRiderSlug(team.captain.id, team.captain.username),
          username: team.captain.username,
          orgLabel: "ARY",
          featuredRaceTitle: race.title,
          featuredWorkTitle: null,
          raceCount: 1,
          workCount: 0,
          publicWorkLinks: [],
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
      return { href: `/races/${race.slug}/register`, label: "立即报名" };
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

export function groupPublicRacesByPhase<T extends { phase: string }>(
  races: readonly T[],
) {
  return {
    active: races.filter((race) => race.phase === "active"),
    frozen: races.filter((race) => race.phase === "frozen"),
    registration: races.filter((race) => race.phase === "registration"),
    preparation: races.filter((race) => race.phase === "preparation"),
    finished: races.filter((race) => race.phase === "finished"),
  };
}

export function sortFeaturedWorks<T extends { score: number; title: string }>(
  works: readonly T[],
  sortBy: "score" | "title",
) {
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
