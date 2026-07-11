import {
  ConfidenceLevel,
  EvidenceType,
  IntegrityStatus,
  Visibility,
} from "@/generated/prisma/enums";
import {
  buildPayloadDigest,
  summarizeEvidenceIntegrity,
} from "@/lib/ca-integrity-helpers";
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
              ingestionEvents: true,
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
          const relatedEvents = connection.ingestionEvents.filter((event) => {
            const payload = JSON.parse(event.payloadJson) as {
              ca?: { caSessionId?: string };
            };

            return payload.ca?.caSessionId === session.caSessionId;
          });
          const integritySummary = summarizeEvidenceIntegrity(
            relatedEvents.map((event) => ({
              id: event.id,
              integrityStatus:
                event.integrityStatus === "INTEGRITY_GAP"
                  ? "integrity_gap"
                  : event.integrityStatus === "REVIEW_NEEDED"
                    ? "review_needed"
                    : "ok",
            })),
          );
          const evidence = buildSessionSummaryEvidenceRecord({
            caConnectionId: connection.id,
            caProjectId: connection.caProjectId,
            caSessionId: session.caSessionId,
            caType: connection.caType,
            confidenceLevel: integritySummary.confidenceLevel,
            generatedFromEventIdsJson: integritySummary.generatedFromEventIdsJson,
            integrityStatus: integritySummary.integrityStatus,
            messageCount: session.messageCount,
            registrationId: registration.id,
            reviewFlagJson: integritySummary.reviewFlagJson,
            sourceDigest: buildPayloadDigest(
              relatedEvents.length > 0
                ? relatedEvents.map((event) => ({
                    id: event.id,
                    payloadDigest: event.payloadDigest,
                  }))
                : {
                    caConnectionId: connection.id,
                    caProjectId: connection.caProjectId,
                    caSessionId: session.caSessionId,
                  },
            ),
            startedAt: session.startedAt,
            tokenCost: session.tokenCost,
            toolCallCount: session.toolCallCount,
          });

          await tx.evidence.create({
            data: {
              registrationId: evidence.registrationId,
              confidenceLevel:
                evidence.confidenceLevel === "high"
                  ? ConfidenceLevel.HIGH
                  : ConfidenceLevel.MEDIUM,
              generatedFromEventIdsJson: evidence.generatedFromEventIdsJson,
              integrityStatus:
                evidence.integrityStatus === "ok"
                  ? IntegrityStatus.OK
                  : IntegrityStatus.REVIEW_NEEDED,
              reviewFlagJson: evidence.reviewFlagJson,
              sourceRefJson: evidence.sourceRefJson,
              sourceDigest: evidence.sourceDigest,
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
