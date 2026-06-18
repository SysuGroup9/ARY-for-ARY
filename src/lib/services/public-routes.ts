import {
  buildPublicSiteModel,
  buildRaceSlug,
  getRaceIdFromSlug,
  getRiderIdFromSlug,
  getWorkPartsFromSlug,
} from "@/lib/public-site";
import { listRaces } from "@/lib/services/races";

export async function getRaceBySlug(raceSlug: string) {
  const raceId = getRaceIdFromSlug(raceSlug);
  const races = await listRaces();
  const race = races.find((item) => item.id === raceId);

  if (!race) {
    return null;
  }

  return {
    ...race,
    slug: buildRaceSlug(race.id, race.title),
  };
}

export async function getWorkBySlug(workSlug: string) {
  const { raceId, teamId } = getWorkPartsFromSlug(workSlug);
  const races = await listRaces();
  const race = races.find((item) => item.id === raceId);

  if (!race) {
    return null;
  }

  const highlight = race.highlights.find((item) => item.teamId === teamId);
  if (!highlight) {
    return null;
  }

  return {
    id: workSlug,
    title: highlight.team.name,
    author:
      race.teams.find((team) => team.id === highlight.teamId)?.captain.username ??
      highlight.team.name,
    excerpt: highlight.excerpt,
    score: highlight.score,
    codeSnippet: highlight.codeSnippet,
    raceSlug: buildRaceSlug(race.id, race.title),
    raceTitle: race.title,
  };
}

export async function getRiderBySlug(riderSlug: string) {
  const riderId = getRiderIdFromSlug(riderSlug);
  const races = await listRaces();
  const model = buildPublicSiteModel(races);
  const rider = model.featuredRiders.find((item) => item.id === riderId);

  if (!rider) {
    return null;
  }

  const raceRecords = races
    .filter((race) => race.teams.some((team) => team.captain.id === riderId))
    .map((race) => ({
      raceId: race.id,
      raceSlug: buildRaceSlug(race.id, race.title),
      raceTitle: race.title,
      phase: race.phase,
      awardScore:
        race.leaderboardEntries.find((entry) =>
          race.teams.find((team) => team.id === entry.teamId)?.captain.id === riderId,
        )?.totalScore ?? null,
      workTitle:
        race.highlights.find((highlight) =>
          race.teams.find((team) => team.id === highlight.teamId)?.captain.id === riderId,
        )?.team.name ?? null,
      comment:
        race.teamComments.find((comment) =>
          race.teams.find((team) => team.id === comment.teamId)?.captain.id === riderId,
        )?.content ?? null,
    }));

  return {
    ...rider,
    publicWorkLinks: rider.publicWorkLinks,
    raceRecords,
  };
}
