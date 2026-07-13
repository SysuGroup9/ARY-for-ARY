/**
 * GRS004 协作功能 - Judging 服务（Team 维度适配）
 *
 * 将所有 work.registration 引用改为 work.team。
 */

import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { buildJudgingScoreJson } from "@/lib/judging-helpers";
import { buildJudgingRecordSourceRef } from "@/lib/result-reference-freeze-helpers";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

export async function listJudgeAssignmentsForRace(raceId: string) {
  return prisma.judgeAssignment.findMany({
    where: {
      work: {
        team: { raceId },
      },
    },
    include: {
      assignedByUser: true,
      judge: true,
      judgingRecord: true,
      work: {
        include: {
          team: {
            include: {
              members: {
                where: { status: { not: "REMOVED" } },
                include: { user: true },
              },
            },
          },
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });
}

export async function listJudgeAssignmentsForUserInRace(input: {
  raceId: string;
  userId: string;
}) {
  return prisma.judgeAssignment.findMany({
    where: {
      judgeId: input.userId,
      work: {
        team: { raceId: input.raceId },
      },
    },
    include: {
      assignedByUser: true,
      judge: true,
      judgingRecord: true,
      work: {
        include: {
          awards: true,
          team: {
            include: {
              members: {
                where: { status: { not: "REMOVED" } },
                include: { user: true },
              },
              registrations: {
                include: {
                  evidences: true,
                  raceProject: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });
}

export async function assignJudgeToWork(input: {
  allowSystem?: boolean;
  assignedByUserId: string;
  judgeId: string;
  workId: string;
}) {
  const [assignedByUser, work] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.assignedByUserId },
      select: { rolesJson: true },
    }),
    prisma.work.findUnique({
      where: { id: input.workId },
      include: {
        team: { include: { race: true } },
      },
    }),
  ]);

  const roles = assignedByUser ? parseRolesJson(assignedByUser.rolesJson) : [];
  const isAdmin = hasRole(roles, "ADMIN");
  const isOrganizer = hasRole(roles, "ORGANIZER");

  if (!assignedByUser || (!isAdmin && !isOrganizer)) {
    throw new Error("Judge assignment actor must be organizer or admin");
  }

  if (
    !work?.team ||
    (work.team.race.organizerId !== input.assignedByUserId &&
      !(input.allowSystem && isAdmin))
  ) {
    throw new Error("Judge assignment not allowed for current actor");
  }

  return prisma.judgeAssignment.upsert({
    where: {
      workId_judgeId: { judgeId: input.judgeId, workId: input.workId },
    },
    update: {
      assignedAt: new Date(),
      assignedByUserId: input.assignedByUserId,
    },
    create: {
      assignedByUserId: input.assignedByUserId,
      judgeId: input.judgeId,
      workId: input.workId,
    },
  });
}

export async function removeJudgeAssignment(input: {
  allowSystem?: boolean;
  assignedByUserId: string;
  assignmentId: string;
}) {
  const [assignedByUser, assignment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.assignedByUserId },
      select: { rolesJson: true },
    }),
    prisma.judgeAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        work: {
          include: { team: { include: { race: true } } },
        },
      },
    }),
  ]);

  const roles = assignedByUser ? parseRolesJson(assignedByUser.rolesJson) : [];
  const isAdmin = hasRole(roles, "ADMIN");
  const isOrganizer = hasRole(roles, "ORGANIZER");

  if (!assignedByUser || (!isAdmin && !isOrganizer)) {
    throw new Error("Judge assignment actor must be organizer or admin");
  }

  if (
    !assignment?.work?.team ||
    (assignment.work.team.race.organizerId !== input.assignedByUserId &&
      !(input.allowSystem && isAdmin))
  ) {
    throw new Error("Judge assignment not allowed for current actor");
  }

  return prisma.judgeAssignment.delete({
    where: { id: input.assignmentId },
  });
}

export async function upsertJudgingRecord(input: {
  assignmentId: string;
  comments: string;
  judgeUserId: string;
  scoreResultTotal: number;
  scoreRidingTotal: number;
  submit: boolean;
}) {
  const assignment = await prisma.judgeAssignment.findUnique({
    where: { id: input.assignmentId },
    include: {
      work: {
        include: {
          team: {
            include: {
              registrations: {
                include: {
                  evidences: { orderBy: { createdAt: "asc" } },
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!assignment || assignment.judgeId !== input.judgeUserId) {
    throw new Error("Judge assignment not found for current user");
  }

  const team = assignment.work.team;
  const allEvidences = team?.registrations.flatMap((reg) =>
    reg.evidences.map((e) => ({
      id: e.id,
      integrityStatus: e.integrityStatus,
      sourceDigest: e.sourceDigest,
      title: e.title,
      type: e.type,
    })),
  ) ?? [];

  const firstMember = team?.members?.[0];
  const sourceRef = buildJudgingRecordSourceRef({
    evidences: allEvidences,
    registration: {
      id: team?.id ?? assignment.work.id,
      userId: firstMember?.userId ?? "",
    },
    work: {
      contentHash: assignment.work.contentHash,
      id: assignment.work.id,
      sourceRefJson: assignment.work.sourceRefJson,
      title: assignment.work.title,
    },
  });
  const sourceDigest = buildPayloadDigest(sourceRef);

  return prisma.judgingRecord.upsert({
    where: { judgeAssignmentId: input.assignmentId },
    update: {
      comments: input.comments.trim(),
      scoreResultJson: JSON.stringify(buildJudgingScoreJson(input.scoreResultTotal)),
      scoreRidingJson: JSON.stringify(buildJudgingScoreJson(input.scoreRidingTotal)),
      sourceDigest,
      sourceRefJson: JSON.stringify(sourceRef),
      submittedAt: input.submit ? new Date() : null,
    },
    create: {
      comments: input.comments.trim(),
      judgeAssignmentId: input.assignmentId,
      scoreResultJson: JSON.stringify(buildJudgingScoreJson(input.scoreResultTotal)),
      scoreRidingJson: JSON.stringify(buildJudgingScoreJson(input.scoreRidingTotal)),
      sourceDigest,
      sourceRefJson: JSON.stringify(sourceRef),
      submittedAt: input.submit ? new Date() : null,
    },
  });
}

export async function listJudgingRecordsForRace(
  raceId: string,
  options?: { submittedOnly?: boolean },
) {
  return prisma.judgingRecord.findMany({
    where: {
      judgeAssignment: {
        work: {
          team: { raceId },
        },
      },
      ...(options?.submittedOnly ? { submittedAt: { not: null } } : {}),
    },
    include: {
      judgeAssignment: {
        include: {
          judge: true,
          work: {
            include: {
              team: {
                include: {
                  members: {
                    where: { status: { not: "REMOVED" } },
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
