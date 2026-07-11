import { ScreenFallbackMode, ScreenMode } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

export type ScreenDisplayMode =
  | "announcement"
  | "billboard"
  | "jumbotron"
  | "leaderboard"
  | "live"
  | "works";

export type ScreenDisplayFallbackMode =
  | "auto"
  | "stable_projection"
  | "static_notice";

type ScreenDisplayState = {
  fallbackMode: ScreenDisplayFallbackMode;
  mode: ScreenDisplayMode;
  theme: string;
};

async function withSqliteBusyRetry<T>(task: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isSqliteBusyError(error) || attempt === 4) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }

  throw lastError;
}

function isSqliteBusyError(error: unknown) {
  return (
    error instanceof Error &&
    /database is locked|SQLITE_BUSY/i.test(error.message)
  );
}

function mapScreenModeFromDb(mode: ScreenMode): ScreenDisplayMode {
  switch (mode) {
    case ScreenMode.ANNOUNCEMENT:
      return "announcement";
    case ScreenMode.BILLBOARD:
      return "billboard";
    case ScreenMode.LEADERBOARD:
      return "leaderboard";
    case ScreenMode.LIVE:
      return "live";
    case ScreenMode.WORKS:
      return "works";
    case ScreenMode.JUMBOTRON:
    default:
      return "jumbotron";
  }
}

function mapScreenModeToDb(mode: ScreenDisplayMode): ScreenMode {
  switch (mode) {
    case "announcement":
      return ScreenMode.ANNOUNCEMENT;
    case "billboard":
      return ScreenMode.BILLBOARD;
    case "leaderboard":
      return ScreenMode.LEADERBOARD;
    case "live":
      return ScreenMode.LIVE;
    case "works":
      return ScreenMode.WORKS;
    case "jumbotron":
    default:
      return ScreenMode.JUMBOTRON;
  }
}

function mapFallbackModeFromDb(
  fallbackMode: ScreenFallbackMode,
): ScreenDisplayFallbackMode {
  switch (fallbackMode) {
    case ScreenFallbackMode.STABLE_PROJECTION:
      return "stable_projection";
    case ScreenFallbackMode.STATIC_NOTICE:
      return "static_notice";
    case ScreenFallbackMode.AUTO:
    default:
      return "auto";
  }
}

function mapFallbackModeToDb(
  fallbackMode: ScreenDisplayFallbackMode,
): ScreenFallbackMode {
  switch (fallbackMode) {
    case "stable_projection":
      return ScreenFallbackMode.STABLE_PROJECTION;
    case "static_notice":
      return ScreenFallbackMode.STATIC_NOTICE;
    case "auto":
    default:
      return ScreenFallbackMode.AUTO;
  }
}

function toScreenDisplayState(input: {
  fallbackMode: ScreenFallbackMode;
  mode: ScreenMode;
  theme: string;
}): ScreenDisplayState {
  return {
    fallbackMode: mapFallbackModeFromDb(input.fallbackMode),
    mode: mapScreenModeFromDb(input.mode),
    theme: input.theme,
  };
}

export function normalizeScreenDisplayState(
  input:
    | null
    | {
        fallbackMode: ScreenFallbackMode;
        mode: ScreenMode;
        theme: string;
      },
) {
  return input ? toScreenDisplayState(input) : null;
}

async function getRaceForManagedScreenDisplayAction(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  const [race, user] = await Promise.all([
    prisma.race.findUnique({
      where: {
        id: input.raceId,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: input.organizerId,
      },
      select: {
        rolesJson: true,
      },
    }),
  ]);

  const userRoles = user ? parseRolesJson(user.rolesJson) : [];
  const canUseSystem =
    Boolean(input.allowSystem) && hasRole(userRoles, "ADMIN");

  if (!race || (race.organizerId !== input.organizerId && !canUseSystem)) {
    throw new Error("无权操作这场比赛的大屏显示状态");
  }

  return race;
}

export async function getOrCreateScreenDisplayForRace(input: {
  raceId: string;
}): Promise<ScreenDisplayState> {
  const screenDisplay = await withSqliteBusyRetry(() =>
    prisma.screenDisplay.upsert({
      where: {
        raceId: input.raceId,
      },
      update: {},
      create: {
        raceId: input.raceId,
      },
    }),
  );

  return toScreenDisplayState(screenDisplay);
}

export async function updateScreenDisplayModeForRace(input: {
  allowSystem?: boolean;
  mode: ScreenDisplayMode;
  organizerId: string;
  raceId: string;
}): Promise<ScreenDisplayState> {
  await getRaceForManagedScreenDisplayAction(input);

  const screenDisplay = await withSqliteBusyRetry(() =>
    prisma.screenDisplay.upsert({
      where: {
        raceId: input.raceId,
      },
      update: {
        fallbackMode: ScreenFallbackMode.AUTO,
        mode: mapScreenModeToDb(input.mode),
      },
      create: {
        fallbackMode: ScreenFallbackMode.AUTO,
        mode: mapScreenModeToDb(input.mode),
        raceId: input.raceId,
      },
    }),
  );

  return toScreenDisplayState(screenDisplay);
}

export async function updateScreenDisplayThemeForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
  theme: string;
}): Promise<ScreenDisplayState> {
  await getRaceForManagedScreenDisplayAction(input);

  const theme = input.theme.trim() || "default";
  const screenDisplay = await withSqliteBusyRetry(() =>
    prisma.screenDisplay.upsert({
      where: {
        raceId: input.raceId,
      },
      update: {
        theme,
      },
      create: {
        raceId: input.raceId,
        theme,
      },
    }),
  );

  return toScreenDisplayState(screenDisplay);
}

async function updateScreenDisplayFallbackMode(input: {
  allowSystem?: boolean;
  fallbackMode: ScreenDisplayFallbackMode;
  organizerId: string;
  raceId: string;
}): Promise<ScreenDisplayState> {
  await getRaceForManagedScreenDisplayAction(input);

  const screenDisplay = await withSqliteBusyRetry(() =>
    prisma.screenDisplay.upsert({
      where: {
        raceId: input.raceId,
      },
      update: {
        fallbackMode: mapFallbackModeToDb(input.fallbackMode),
      },
      create: {
        fallbackMode: mapFallbackModeToDb(input.fallbackMode),
        raceId: input.raceId,
      },
    }),
  );

  return toScreenDisplayState(screenDisplay);
}

export async function fallbackScreenDisplayToStableProjection(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  return updateScreenDisplayFallbackMode({
    ...input,
    fallbackMode: "stable_projection",
  });
}

export async function fallbackScreenDisplayToStaticNotice(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  return updateScreenDisplayFallbackMode({
    ...input,
    fallbackMode: "static_notice",
  });
}

export function resolveScreenDisplayHref(input: {
  fallbackMode: ScreenDisplayFallbackMode;
  mode: ScreenDisplayMode;
  raceId: string;
  raceSlug: string;
}) {
  if (input.fallbackMode === "stable_projection") {
    return `/jumbotron/${input.raceId}?source=stable`;
  }

  if (input.fallbackMode === "static_notice") {
    return `/screen/${input.raceSlug}/static`;
  }

  switch (input.mode) {
    case "announcement":
      return `/screen/${input.raceSlug}/announcement`;
    case "billboard":
      return `/screen/${input.raceSlug}/billboard`;
    case "leaderboard":
      return `/screen/${input.raceSlug}/leaderboard`;
    case "live":
      return `/screen/${input.raceSlug}/live`;
    case "works":
      return `/screen/${input.raceSlug}/works`;
    case "jumbotron":
    default:
      return `/jumbotron/${input.raceId}`;
  }
}
