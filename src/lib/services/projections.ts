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
      awards: {
        where: {
          publishedAt: {
            not: null,
          },
        },
        orderBy: [
          {
            awardName: "asc",
          },
          {
            rank: "asc",
          },
        ],
      },
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
      teams: {
        include: {
          members: {
            where: { status: { not: "REMOVED" } },
            include: {
              user: true,
            },
          },
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

  // GRS004: Team 维度的注册状态投影
  const regByUserId = new Map(
    race.registrations.map((r) => [r.userId, r]),
  );

  const approvedTeams = race.teams.filter((team) =>
    team.members.some((m) => regByUserId.get(m.userId)?.status === "APPROVED"),
  );

  const registrationItems = approvedTeams.map((team) => {
    const memberProjections = team.members.map((member) => {
      const reg = regByUserId.get(member.userId);
      const connections = reg?.raceProject?.caConnections ?? [];
      return {
        aggregateIngestionStatus:
          reg?.raceProject?.aggregateIngestionStatus ?? "NOT_CONFIGURED",
        caConnectionCount: connections.length,
        sessionCount: connections.reduce(
          (sum, connection) => sum + connection.sessions.length,
          0,
        ),
      };
    });

    const worstStatus = memberProjections.some((p) => p.aggregateIngestionStatus === "FAILED")
      ? "FAILED"
      : memberProjections.some((p) => p.aggregateIngestionStatus === "ACTIVE")
        ? "ACTIVE"
        : memberProjections.some((p) => p.aggregateIngestionStatus === "CONNECTED")
          ? "CONNECTED"
          : "NOT_CONFIGURED";
    const totalCaConnections = memberProjections.reduce((sum, p) => sum + p.caConnectionCount, 0);
    const totalSessions = memberProjections.reduce((sum, p) => sum + p.sessionCount, 0);

    return buildRegistrationStatusProjectionPayload({
      aggregateIngestionStatus: worstStatus as "ACTIVE" | "CONNECTED" | "FAILED" | "NOT_CONFIGURED",
      caConnectionCount: totalCaConnections,
      raceProjectId: null,
      registrationId: team.id,
      registrationStatus: "APPROVED",
      sessionCount: totalSessions,
      username: team.name,
    });
  });

  const leaderboardItems = buildCurrentLeaderboardProjectionPayload(
    approvedTeams.map((team) => {
      let totalProgress = 0;
      let totalToken = 0;
      let memberCount = 0;

      for (const member of team.members) {
        const reg = regByUserId.get(member.userId);
        const sessions =
          reg?.raceProject?.caConnections.flatMap(
            (connection) => connection.sessions,
          ) ?? [];
        const latestSession = [...sessions].sort(
          (left, right) =>
            (right.lastActiveAt ?? right.startedAt).getTime() -
            (left.lastActiveAt ?? left.startedAt).getTime(),
        )[0];
        if (latestSession) {
          totalProgress += latestSession.progressPercent ?? 0;
          totalToken += sessions.reduce((sum, session) => sum + session.tokenCost, 0);
          memberCount++;
        }
      }

      return {
        entryId: team.id,
        progressPercent: memberCount > 0 ? totalProgress / memberCount : 0,
        tokenCost: totalToken,
        username: team.name,
      };
    }),
  );

  const raceProgress = buildRaceProgressProjectionPayload({
    activeConnections: race.teams.reduce(
      (sum, team) =>
        sum +
        team.members.reduce(
          (memberSum, member) => {
            const reg = regByUserId.get(member.userId);
            return (
              memberSum +
              (reg?.raceProject?.caConnections.filter(
                (connection) => connection.ingestionStatus === "ACTIVE",
              ).length ?? 0)
            );
          },
          0,
        ),
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
  const teamIds = race.teams.map((t) => t.id);
  const publicWorks = await prisma.work.findMany({
    where: { teamId: { in: teamIds }, visibility: "PUBLIC" },
  });
  const publicWorkCount = publicWorks.length;
  const publishedAwardCount = race.awards.length;

  const teamSessionItems = approvedTeams.flatMap((team) =>
    team.members.flatMap((member) => {
      const reg = regByUserId.get(member.userId);
      return (
        reg?.raceProject?.caConnections.flatMap((connection) =>
          connection.sessions.slice(0, 1).map((session) => ({
            summary:
              session.latestActivity ??
              `[${team.name}] ${member.user.username} session ${session.caSessionId} has ${session.messageCount} messages.`,
            type: "session_summary" as const,
          })),
        ) ?? []
      );
    }),
  );

  const screenFeed = buildScreenFeedProjectionPayload({
    items: [
      ...race.notifications.slice(0, 3).map((item) => ({
        summary: item.content,
        type: "announcement" as const,
      })),
      ...(publishedAwardCount > 0
        ? [
            {
              summary: "Published final leaderboard is available.",
              type: "leaderboard_read_model" as const,
            },
          ]
        : []),
      ...(publicWorkCount > 0
        ? [
            {
              summary: `${publicWorkCount} public works are available for showcase.`,
              type: "works" as const,
            },
          ]
        : []),
      ...teamSessionItems,
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
      ...approvedTeams.flatMap((team) =>
        team.members.flatMap((member) => {
          const reg = regByUserId.get(member.userId);
          return (
            reg?.raceProject?.caConnections.flatMap((connection) =>
              connection.sessions
                .filter((session) => session.latestActivity || session.messageCount > 0)
                .map((session) => ({
                  createdAt:
                    (session.lastActiveAt ?? session.startedAt).toISOString(),
                  registrationId: reg.id,
                  severity: "info" as const,
                  summary:
                    session.latestActivity ??
                    `[${team.name}] ${member.user.username} session ${session.caSessionId} has ${session.messageCount} messages.`,
                  type: "session_activity" as const,
                  username: member.user.username,
                })),
            ) ?? []
          );
        }),
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
      payload: approvedTeams.map((team) => ({
        registrationId: team.id,
        tokenCost: team.members.reduce(
          (sum, member) => {
            const reg = regByUserId.get(member.userId);
            return (
              sum +
              (reg?.raceProject?.caConnections.reduce(
                (connSum, connection) =>
                  connSum +
                  connection.sessions.reduce(
                    (sessionSum, session) => sessionSum + session.tokenCost,
                    0,
                  ),
                0,
              ) ?? 0)
            );
          },
          0,
        ),
      })),
      type: ProjectionType.COST,
    },
    {
      payload: approvedTeams.map((team) => {
        const worstStatus = team.members.some(
          (m) => {
            const reg = regByUserId.get(m.userId);
            return reg?.raceProject?.aggregateIngestionStatus === "FAILED";
          },
        )
          ? "FAILED"
          : team.members.some(
                (m) => {
                  const reg = regByUserId.get(m.userId);
                  return reg?.raceProject?.aggregateIngestionStatus === "ACTIVE";
                },
              )
            ? "ACTIVE"
            : team.members.some(
                  (m) => {
                    const reg = regByUserId.get(m.userId);
                    return reg?.raceProject?.aggregateIngestionStatus === "CONNECTED";
                  },
                )
              ? "CONNECTED"
              : "NOT_CONFIGURED";
        return {
          aggregateIngestionStatus: worstStatus,
          registrationId: team.id,
        };
      }),
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
