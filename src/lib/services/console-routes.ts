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

  if (hasRole(roles, "ORGANIZER") || hasRole(roles, "ADMIN")) {
    items.push(
      ...races
        .filter((race: RaceListItem) =>
          hasRole(roles, "ADMIN") ? true : race.organizerId === input.userId,
        )
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

  const visibleRaces = hasRole(roles, "ADMIN")
    ? races
    : hasRole(roles, "ORGANIZER")
      ? races.filter((race: RaceListItem) => race.organizerId === input.userId)
      : [];

  return visibleRaces.map((race: RaceListItem) => {
    const slug = buildRaceSlug(race.id, race.title);
    return {
      defaultHref: `/console/screen/${slug}/jumbotron`,
      race,
      slug,
    };
  });
}

export async function getConsoleRaceEntriesBySlugForUser(input: {
  raceSlug: string;
  roles: readonly AppRole[];
  userId: string;
}): Promise<{
  items: ConsoleRaceListItem[];
  race: RaceListItem;
  slug: string;
} | null> {
  const visibleRaces = await listConsoleRacesForUser({
    roles: input.roles,
    userId: input.userId,
  });
  const matchingItems = visibleRaces.filter(
    (item) =>
      item.slug === input.raceSlug ||
      item.race.id === getRaceIdFromSlug(input.raceSlug),
  );

  if (!matchingItems.length) {
    return null;
  }

  return {
    items: matchingItems,
    race: matchingItems[0]!.race,
    slug: matchingItems[0]!.slug,
  };
}

export async function getConsoleRaceBySlugForAccess(input: {
  access: ConsoleRaceAccess;
  raceSlug: string;
  roles: readonly AppRole[];
  userId: string;
}): Promise<{
  race: RaceListItem;
  slug: string;
} | null> {
  const entry = await getConsoleRaceEntriesBySlugForUser({
    raceSlug: input.raceSlug,
    roles: input.roles,
    userId: input.userId,
  });
  const scopedItem = entry?.items.find((item) => item.access === input.access);

  if (!entry || !scopedItem) {
    return null;
  }

  return {
    race: scopedItem.race,
    slug: scopedItem.slug,
  };
}

export async function getScreenConsoleRaceBySlugForUser(input: {
  raceSlug: string;
  roles: readonly AppRole[];
  userId: string;
}): Promise<{
  race: RaceListItem;
  slug: string;
} | null> {
  const visibleRaces = await listScreenConsoleRacesForUser({
    roles: input.roles,
    userId: input.userId,
  });
  const exactMatch = visibleRaces.find((item) => item.slug === input.raceSlug);
  const scopedRace =
    exactMatch ??
    visibleRaces.find(
      (item) => item.race.id === getRaceIdFromSlug(input.raceSlug),
    );

  if (!scopedRace) {
    return null;
  }

  return {
    race: scopedRace.race,
    slug: scopedRace.slug,
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
