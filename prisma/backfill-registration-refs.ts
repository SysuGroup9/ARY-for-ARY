import { prisma } from "../src/lib/prisma";

async function backfillRegistrationRefs(): Promise<void> {
  const teams = await prisma.team.findMany({
    select: {
      captainId: true,
      id: true,
      raceId: true,
    },
  });

  for (const team of teams) {
    const registration = await prisma.registration.findUnique({
      where: {
        raceId_userId: {
          raceId: team.raceId,
          userId: team.captainId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!registration) {
      continue;
    }

    await prisma.$transaction([
      prisma.submission.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.submissionArtifact.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.runnerTask.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.teamArchive.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.feedbackThread.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.notification.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.leaderboardEntry.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.harnessEntry.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.ridingHighlight.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
      prisma.teamComment.updateMany({
        data: { registrationId: registration.id },
        where: { raceId: team.raceId, registrationId: null, teamId: team.id },
      }),
    ]);
  }
}

backfillRegistrationRefs()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Failed to backfill registration references", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
