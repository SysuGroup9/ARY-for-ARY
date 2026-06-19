import { EvidenceType, Visibility } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { buildSessionSummaryEvidenceRecord } from "@/lib/evidence-projection-helpers";

export async function rebuildSessionSummaryEvidenceForRace(raceId: string) {
  const registrations = await prisma.registration.findMany({
    where: { raceId },
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
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.evidence.deleteMany({
      where: {
        registration: {
          raceId,
        },
        type: EvidenceType.SESSION_SUMMARY,
      },
    });

    for (const registration of registrations) {
      for (const connection of registration.raceProject?.caConnections ?? []) {
        for (const session of connection.sessions) {
          const evidence = buildSessionSummaryEvidenceRecord({
            caConnectionId: connection.id,
            caProjectId: connection.caProjectId,
            caSessionId: session.caSessionId,
            caType: connection.caType,
            messageCount: session.messageCount,
            registrationId: registration.id,
            startedAt: session.startedAt,
            tokenCost: session.tokenCost,
            toolCallCount: session.toolCallCount,
          });

          await tx.evidence.create({
            data: {
              registrationId: evidence.registrationId,
              sourceRefJson: evidence.sourceRefJson,
              summary: evidence.summary,
              title: evidence.title,
              type: EvidenceType.SESSION_SUMMARY,
              visibility: Visibility.INTERNAL,
            },
          });
        }
      }
    }
  });
}
