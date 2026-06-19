import { prisma } from "@/lib/prisma";
import { buildJudgingScoreJson } from "@/lib/judging-helpers";

export async function listJudgeAssignmentsForRace(raceId: string) {
  return prisma.judgeAssignment.findMany({
    where: {
      work: {
        registration: {
          raceId,
        },
      },
    },
    include: {
      assignedByUser: true,
      judge: true,
      judgingRecord: true,
      work: {
        include: {
          registration: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "asc",
    },
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
        registration: {
          raceId: input.raceId,
        },
      },
    },
    include: {
      assignedByUser: true,
      judge: true,
      judgingRecord: true,
      work: {
        include: {
          awards: true,
          registration: {
            include: {
              evidences: true,
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "asc",
    },
  });
}

export async function assignJudgeToWork(input: {
  assignedByUserId: string;
  judgeId: string;
  workId: string;
}) {
  return prisma.judgeAssignment.upsert({
    where: {
      workId_judgeId: {
        judgeId: input.judgeId,
        workId: input.workId,
      },
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

export async function upsertJudgingRecord(input: {
  assignmentId: string;
  comments: string;
  judgeUserId: string;
  scoreResultTotal: number;
  scoreRidingTotal: number;
  submit: boolean;
}) {
  const assignment = await prisma.judgeAssignment.findUnique({
    where: {
      id: input.assignmentId,
    },
  });

  if (!assignment || assignment.judgeId !== input.judgeUserId) {
    throw new Error("Judge assignment not found for current user");
  }

  return prisma.judgingRecord.upsert({
    where: {
      judgeAssignmentId: input.assignmentId,
    },
    update: {
      comments: input.comments.trim(),
      scoreResultJson: JSON.stringify(buildJudgingScoreJson(input.scoreResultTotal)),
      scoreRidingJson: JSON.stringify(buildJudgingScoreJson(input.scoreRidingTotal)),
      submittedAt: input.submit ? new Date() : null,
    },
    create: {
      comments: input.comments.trim(),
      judgeAssignmentId: input.assignmentId,
      scoreResultJson: JSON.stringify(buildJudgingScoreJson(input.scoreResultTotal)),
      scoreRidingJson: JSON.stringify(buildJudgingScoreJson(input.scoreRidingTotal)),
      submittedAt: input.submit ? new Date() : null,
    },
  });
}

export async function listJudgingRecordsForRace(raceId: string) {
  return prisma.judgingRecord.findMany({
    where: {
      judgeAssignment: {
        work: {
          registration: {
            raceId,
          },
        },
      },
    },
    include: {
      judgeAssignment: {
        include: {
          judge: true,
          work: {
            include: {
              registration: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
