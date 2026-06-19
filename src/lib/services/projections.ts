import { ProjectionType } from "@/generated/prisma/enums";
import {
  buildCurrentLeaderboardProjectionPayload,
  buildEventStreamProjectionPayload,
  buildRaceProgressProjectionPayload,
  buildRegistrationStatusProjectionPayload,
  buildScreenFeedProjectionPayload,
} from "@/lib/evidence-projection-helpers";
import { prisma } from "@/lib/prisma";

export async function rebuildRaceProcessProjections(raceId: string) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      registrations: {
        include: {
          raceProject: {
            include: {
              caConnections: {
                include: {
                  sessions: true,
                },
              },
            },
          },
          user: true,
        },
      },
      leaderboardEntries: {
        include: {
          team: true,
        },
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!race) {
    throw new Error("Race not found");
  }

  const registrationItems = race.registrations.map((registration) => {
    const connections = registration.raceProject?.caConnections ?? [];
    return buildRegistrationStatusProjectionPayload({
      aggregateIngestionStatus:
        registration.raceProject?.aggregateIngestionStatus ?? "NOT_CONFIGURED",
      caConnectionCount: connections.length,
      raceProjectId: registration.raceProject?.id ?? null,
      registrationId: registration.id,
      registrationStatus: registration.status,
      sessionCount: connections.reduce(
        (sum, connection) => sum + connection.sessions.length,
        0,
      ),
      username: registration.user.username,
    });
  });

  const leaderboardItems = buildCurrentLeaderboardProjectionPayload(
    race.registrations.map((registration) => {
      const sessions = registration.raceProject?.caConnections.flatMap(
        (connection) => connection.sessions,
      ) ?? [];
      const latestSession = [...sessions].sort(
        (left, right) =>
          (right.lastActiveAt ?? right.startedAt).getTime() -
          (left.lastActiveAt ?? left.startedAt).getTime(),
      )[0];

      return {
        entryId: registration.id,
        progressPercent: latestSession?.progressPercent ?? 0,
        tokenCost: sessions.reduce((sum, session) => sum + session.tokenCost, 0),
        username: registration.user.username,
      };
    }),
  );

  const raceProgress = buildRaceProgressProjectionPayload({
    activeConnections: race.registrations.reduce(
      (sum, registration) =>
        sum +
        (registration.raceProject?.caConnections.filter(
          (connection) => connection.ingestionStatus === "ACTIVE",
        ).length ?? 0),
      0,
    ),
    activeRegistrations: race.registrations.filter(
      (registration) => registration.status === "APPROVED",
    ).length,
    activeSessions: race.registrations.reduce(
      (sum, registration) =>
        sum +
        (registration.raceProject?.caConnections.reduce(
          (inner, connection) =>
            inner +
            connection.sessions.filter((session) => session.endedAt === null).length,
          0,
        ) ?? 0),
      0,
    ),
    raceId,
    totalRegistrations: race.registrations.length,
  });

  const screenFeed = buildScreenFeedProjectionPayload({
    items: [
      ...race.notifications.slice(0, 3).map((item) => ({
        summary: item.content,
        type: "announcement" as const,
      })),
      ...race.registrations.flatMap((registration) =>
        registration.raceProject?.caConnections.flatMap((connection) =>
          connection.sessions.slice(0, 1).map((session) => ({
            summary:
              session.latestActivity ??
              `${registration.user.username} session ${session.caSessionId} has ${session.messageCount} messages.`,
            type: "session_summary" as const,
          })),
        ) ?? [],
      ),
      ...(leaderboardItems.length > 0
        ? [
            {
              summary: "Current process leaderboard is available.",
              type: "current_leaderboard_projection" as const,
            },
          ]
        : []),
    ].slice(0, 8),
    raceId,
  });

  const eventStream = buildEventStreamProjectionPayload({
    items: [
      ...race.notifications.slice(0, 5).map((item) => ({
        createdAt: item.createdAt.toISOString(),
        severity: "info" as const,
        summary: item.content,
        type: "announcement" as const,
      })),
      ...race.registrations.flatMap((registration) =>
        registration.raceProject?.caConnections.flatMap((connection) =>
          connection.sessions
            .filter((session) => session.latestActivity || session.messageCount > 0)
            .map((session) => ({
              createdAt:
                (session.lastActiveAt ?? session.startedAt).toISOString(),
              registrationId: registration.id,
              severity: "info" as const,
              summary:
                session.latestActivity ??
                `${registration.user.username} session ${session.caSessionId} has ${session.messageCount} messages.`,
              type: "session_activity" as const,
              username: registration.user.username,
            })),
        ) ?? [],
      ),
      ...race.registrations
        .filter(
          (registration) =>
            registration.raceProject?.aggregateIngestionStatus === "FAILED",
        )
        .map((registration) => ({
          createdAt:
            registration.raceProject?.updatedAt.toISOString() ??
            race.updatedAt.toISOString(),
          registrationId: registration.id,
          severity: "warning" as const,
          summary: `${registration.user.username} reported a CA ingestion failure.`,
          type: "risk" as const,
          username: registration.user.username,
        })),
    ].slice(0, 12),
    raceId,
  });

  const projectionPayloads = [
    {
      payload: raceProgress,
      type: ProjectionType.RACE_PROGRESS,
    },
    {
      payload: registrationItems,
      type: ProjectionType.REGISTRATION_STATUS,
    },
    {
      payload: race.registrations.map((registration) => ({
        registrationId: registration.id,
        tokenCost:
          registration.raceProject?.caConnections.reduce(
            (sum, connection) =>
              sum +
              connection.sessions.reduce(
                (inner, session) => inner + session.tokenCost,
                0,
              ),
            0,
          ) ?? 0,
      })),
      type: ProjectionType.COST,
    },
    {
      payload: race.registrations.map((registration) => ({
        aggregateIngestionStatus:
          registration.raceProject?.aggregateIngestionStatus ?? "NOT_CONFIGURED",
        registrationId: registration.id,
      })),
      type: ProjectionType.RISK,
    },
    {
      payload: leaderboardItems,
      type: ProjectionType.CURRENT_LEADERBOARD,
    },
    {
      payload: eventStream,
      type: ProjectionType.EVENT_STREAM_READ_MODEL,
    },
    {
      payload: screenFeed,
      type: ProjectionType.SCREEN_FEED,
    },
  ] as const;

  await prisma.$transaction(
    projectionPayloads.map((item) =>
      prisma.projection.upsert({
        where: {
          raceId_type: {
            raceId,
            type: item.type,
          },
        },
        update: {
          asOfAt: new Date(),
          payloadJson: JSON.stringify(item.payload),
        },
        create: {
          asOfAt: new Date(),
          payloadJson: JSON.stringify(item.payload),
          raceId,
          type: item.type,
        },
      }),
    ),
  );
}
