import { buildRaceSlug, getRaceIdFromSlug } from "@/lib/public-site";
import { prisma } from "@/lib/prisma";
import type { RaceListItem } from "@/lib/services/races";
import { listRaces } from "@/lib/services/races";
import { getCompatibilityContainerForRegistration } from "@/lib/services/rider-bridge";
import type { AppRole } from "@/lib/user-roles";
import { hasRole, normalizeRoles } from "@/lib/user-roles";

export type ConsoleRaceAccess = "judge" | "organizer" | "rider";

export type ConsoleRaceListItem = {
  access: ConsoleRaceAccess;
  defaultHref: string;
  race: RaceListItem;
  slug: string;
};

export async function listConsoleRacesForUser(input: {
  roles: readonly AppRole[];
  userId: string;
}): Promise<ConsoleRaceListItem[]> {
  const roles = normalizeRoles(input.roles);
  const races = await listRaces();
  const items: ConsoleRaceListItem[] = [];

  if (hasRole(roles, "ORGANIZER")) {
    items.push(
      ...races
        .filter((race: RaceListItem) => race.organizerId === input.userId)
        .map((race: RaceListItem) => {
          const slug = buildRaceSlug(race.id, race.title);
          return {
            access: "organizer" as const,
            defaultHref: `/console/races/${slug}/organizer/overview`,
            race,
            slug,
          };
        }),
    );
  }

  if (hasRole(roles, "RIDER")) {
    items.push(
      ...races
        .filter(
          (race: RaceListItem) =>
            race.registrations.some(
              (registration: RaceListItem["registrations"][number]) =>
                registration.userId === input.userId,
            ),
        )
        .map((race: RaceListItem) => {
          const slug = buildRaceSlug(race.id, race.title);
          return {
            access: "rider" as const,
            defaultHref: `/console/races/${slug}/rider/registration`,
            race,
            slug,
          };
        }),
    );
  }

  if (hasRole(roles, "JUDGE")) {
    const assignments = await prisma.judgeAssignment.findMany({
      where: {
        judgeId: input.userId,
      },
      select: {
        work: {
          select: {
            registration: {
              select: {
                raceId: true,
              },
            },
          },
        },
      },
    });
    const assignedRaceIds = new Set(
      assignments.map(
        (assignment: { work: { registration: { raceId: string } } }) =>
          assignment.work.registration.raceId,
      ),
    );

    items.push(
      ...races
        .filter((race: RaceListItem) => assignedRaceIds.has(race.id))
        .map((race: RaceListItem) => {
          const slug = buildRaceSlug(race.id, race.title);
          return {
            access: "judge" as const,
            defaultHref: `/console/races/${slug}/judge/assigned`,
            race,
            slug,
          };
        }),
    );
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.access}-${item.race.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function listScreenConsoleRacesForUser(input: {
  roles: readonly AppRole[];
  userId: string;
}): Promise<Array<{ defaultHref: string; race: RaceListItem; slug: string }>> {
  const roles = normalizeRoles(input.roles);
  const races = await listRaces();

  if (hasRole(roles, "ADMIN")) {
    // 企业能力尚未独立建模，当前由 Admin 代理大屏控制台可见范围。
    return races.map((race: RaceListItem) => {
      const slug = buildRaceSlug(race.id, race.title);
      return {
        defaultHref: `/console/screen/${slug}/jumbotron`,
        race,
        slug,
      };
    });
  }

  return [];
}

export async function getConsoleRaceBySlug(raceSlug: string): Promise<{
  race: RaceListItem;
  slug: string;
} | null> {
  const races = await listRaces();
  const exactMatch = races.find(
    (item: RaceListItem) => buildRaceSlug(item.id, item.title) === raceSlug,
  );
  const race =
    exactMatch ??
    races.find((item: RaceListItem) => item.id === getRaceIdFromSlug(raceSlug));

  if (!race) {
    return null;
  }

  return {
    race,
    slug: buildRaceSlug(race.id, race.title),
  };
}

export async function getConsoleRiderTeamContext(input: {
  raceId: string;
  userId: string;
}) {
  return getCompatibilityContainerForRegistration({
    raceId: input.raceId,
    userId: input.userId,
  });
}
