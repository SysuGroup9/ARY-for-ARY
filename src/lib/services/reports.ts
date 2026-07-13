import { ReportType } from "@/generated/prisma/enums";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { buildReportSourceRef } from "@/lib/result-reference-freeze-helpers";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

function buildProjectionPayloadDigest(payloadJson: string) {
  try {
    return buildPayloadDigest(JSON.parse(payloadJson));
  } catch {
    return buildPayloadDigest(payloadJson);
  }
}

function buildRiderReportContent(input: {
  awards: Array<{ awardName: string; rank: number }>;
  evidenceCount: number;
  judgeComments: string[];
  memberCount: number;
  raceTitle: string;
  teamName: string;
  workTitle: null | string;
}) {
  const awardsLabel = input.awards.length
    ? input.awards
        .map((award) => `${award.awardName} #${award.rank}`)
        .join(", ")
    : "none";
  const judgeCommentsLabel = input.judgeComments.length
    ? input.judgeComments.join(" | ")
    : "none";
  const workLabel = input.workTitle ?? "none";
  const membersLabel = `${input.teamName} (${input.memberCount} members)`;

  return {
    body: [
      `Race: ${input.raceTitle}`,
      `Team: ${membersLabel}`,
      `Work: ${workLabel}`,
      `Awards: ${awardsLabel}`,
      `Evidence Count: ${input.evidenceCount}`,
      `Judge Comments: ${judgeCommentsLabel}`,
    ].join("\n"),
    summary: `${input.teamName} / ${workLabel} / awards ${awardsLabel} / evidence ${input.evidenceCount}`,
    title: `${input.raceTitle} / ${input.teamName} Rider Report`,
  };
}

function buildRaceReportContent(input: {
  awardCount: number;
  organizerComment: string;
  raceTitle: string;
  teamCount: number;
  workCount: number;
}) {
  return {
    body: [
      `Race: ${input.raceTitle}`,
      `Teams: ${input.teamCount}`,
      `Works: ${input.workCount}`,
      `Published Awards: ${input.awardCount}`,
      `Organizer Notes: ${input.organizerComment || "none"}`,
    ].join("\n"),
    summary: `${input.teamCount} teams / ${input.workCount} works / ${input.awardCount} published awards`,
    title: `${input.raceTitle} Race Report`,
  };
}

function buildReviewSummaryContent(input: {
  evidenceHighlights: string[];
  judgeComments: string[];
  raceTitle: string;
}) {
  const highlightsLabel = input.evidenceHighlights.length
    ? input.evidenceHighlights.join(" | ")
    : "none";
  const commentsLabel = input.judgeComments.length
    ? input.judgeComments.join(" | ")
    : "none";

  return {
    body: [
      `Race: ${input.raceTitle}`,
      `Judge Comments: ${commentsLabel}`,
      `Evidence Highlights: ${highlightsLabel}`,
    ].join("\n"),
    summary: `${input.judgeComments.length} judge comments / ${input.evidenceHighlights.length} public evidence highlights`,
    title: `${input.raceTitle} Review Summary`,
  };
}

async function getRaceForManagedReportAction(input: {
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
    throw new Error("无权操作这场比赛的报告");
  }

  return race;
}

async function getManagedReportForAction(input: {
  allowSystem?: boolean;
  organizerId: string;
  reportId: string;
}) {
  const [report, user] = await Promise.all([
    prisma.report.findUnique({
      where: {
        id: input.reportId,
      },
      include: {
        race: true,
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

  if (
    !report ||
    (report.race.organizerId !== input.organizerId && !canUseSystem)
  ) {
    throw new Error("无权操作这份报告");
  }

  return report;
}

async function upsertGeneratedDraftReport(tx: typeof prisma, input: {
  body: string;
  raceId: string;
  sourceDigest: string;
  sourceRefJson: string;
  status: "GENERATED";
  subjectRegistrationId: null | string;
  summary: string;
  title: string;
  type: ReportType;
}) {
  const existingDraft = await tx.report.findFirst({
    where: {
      raceId: input.raceId,
      status: {
        not: "PUBLISHED",
      },
      subjectRegistrationId: input.subjectRegistrationId,
      type: input.type,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (existingDraft) {
    return tx.report.update({
      where: {
        id: existingDraft.id,
      },
      data: {
        body: input.body,
        publishedAt: null,
        sourceDigest: input.sourceDigest,
        sourceRefJson: input.sourceRefJson,
        status: input.status,
        subjectRegistrationId: input.subjectRegistrationId,
        summary: input.summary,
        title: input.title,
      },
    });
  }

  return tx.report.create({
    data: input,
  });
}

export async function getPublishedReviewSummaryForRace(raceId: string) {
  return prisma.report.findFirst({
    where: {
      raceId,
      status: "PUBLISHED",
      type: ReportType.REVIEW_SUMMARY,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
}

export async function getPublishedRaceReportForRace(raceId: string) {
  return prisma.report.findFirst({
    where: {
      raceId,
      status: "PUBLISHED",
      type: ReportType.RACE_REPORT,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
}

export async function listPublishedRiderReportsForUser(userId: string) {
  return prisma.report.findMany({
    where: {
      status: "PUBLISHED",
      subjectRegistration: {
        userId,
      },
      type: ReportType.RIDER_REPORT,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
}

export async function listPrivateRiderReportsForUserInRace(input: {
  raceId: string;
  userId: string;
}) {
  return prisma.report.findMany({
    where: {
      raceId: input.raceId,
      subjectRegistration: {
        userId: input.userId,
      },
      type: ReportType.RIDER_REPORT,
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function generateReportsForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  const race = await getRaceForManagedReportAction(input);
  // GRS004: 改为 Team 维度查询
  const [teams, projections, publishedAwards, judgingRecords, works] = await Promise.all([
    prisma.team.findMany({
      where: { raceId: input.raceId },
      include: {
        members: { where: { status: "APPROVED" }, include: { user: true } },
        awards: { where: { publishedAt: { not: null } }, orderBy: [{ awardName: "asc" }, { rank: "asc" }] },
        works: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.projection.findMany({
      where: { raceId: input.raceId },
      orderBy: { type: "asc" },
    }),
    prisma.award.findMany({
      where: { publishedAt: { not: null }, raceId: input.raceId },
      orderBy: [{ awardName: "asc" }, { rank: "asc" }],
    }),
    prisma.judgingRecord.findMany({
      where: {
        submittedAt: { not: null },
        judgeAssignment: { work: { team: { raceId: input.raceId } } },
      },
      include: { judgeAssignment: { include: { work: { include: { team: true } } } } },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.work.findMany({
      where: { team: { raceId: input.raceId } },
      include: { team: { include: { members: { where: { status: "APPROVED" }, include: { user: true } } } } },
    }),
  ]);

  const projectionRefs = projections.map((projection) => ({
    asOfAt: projection.asOfAt.toISOString(),
    payloadDigest: buildProjectionPayloadDigest(projection.payloadJson),
    type: projection.type,
  }));
  const awardRefs = publishedAwards.map((award) => ({
    awardName: award.awardName,
    id: award.id,
    rank: award.rank,
    teamId: award.teamId,
  }));
  const publicEvidenceHighlights = teams
    .flatMap((team) => team.works)
    .filter(Boolean)
    .slice(0, 8)
    .map((work) => work.summary);
  const submittedJudgeComments = judgingRecords
    .map((record) => record.comments.trim())
    .filter((comment) => comment.length > 0);

  // 构建 teamId → members 映射（用于 Evidence 聚合）
  const registrationsByTeamId = await prisma.registration.findMany({
    where: { raceId: input.raceId, status: "APPROVED" },
    include: { evidences: { orderBy: { createdAt: "asc" } }, user: true },
  }).then((regs) => {
    const map = new Map<string, typeof regs>();
    for (const reg of regs) {
      const key = reg.teamId ?? reg.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(reg);
    }
    return map;
  });

  const createdReports = [];

  // 为每个 Team 生成一份 RIDER_REPORT
  for (const team of teams) {
    const teamRegs = registrationsByTeamId.get(team.id) ?? [];
    const teamWork = team.works[0] ?? null;
    const allEvidences = teamRegs.flatMap((reg) => reg.evidences);
    const teamAwards = team.awards;

    const teamJudgeComments = judgingRecords
      .filter((record) => record.judgeAssignment.work.teamId === team.id)
      .map((record) => record.comments.trim())
      .filter((comment) => comment.length > 0);

    const riderReportContent = buildRiderReportContent({
      awards: teamAwards.map((award) => ({ awardName: award.awardName, rank: award.rank })),
      evidenceCount: allEvidences.length,
      judgeComments: teamJudgeComments,
      memberCount: team.members.length,
      raceTitle: race.title,
      teamName: team.name,
      workTitle: teamWork?.title ?? null,
    });

    const riderSourceRef = buildReportSourceRef({
      awards: awardRefs
        .filter((award) => award.teamId === team.id)
        .map((award) => ({ awardName: award.awardName, id: award.id, rank: award.rank })),
      evidences: allEvidences.map((evidence) => ({
        id: evidence.id,
        registrationId: evidence.registrationId,
        sourceDigest: evidence.sourceDigest,
        type: evidence.type,
      })),
      projections: projectionRefs,
      raceId: race.id,
      reportType: ReportType.RIDER_REPORT,
      subjectRegistrationId: teamRegs[0]?.id ?? null,
      works: teamWork
        ? [{ contentHash: teamWork.contentHash, id: teamWork.id, registrationId: teamRegs[0]?.id ?? "", title: teamWork.title }]
        : [],
    });

    createdReports.push(
      await upsertGeneratedDraftReport(prisma, {
        body: riderReportContent.body,
        raceId: race.id,
        sourceDigest: buildPayloadDigest(riderSourceRef),
        sourceRefJson: JSON.stringify(riderSourceRef),
        status: "GENERATED",
        subjectRegistrationId: teamRegs[0]?.id ?? null,
        summary: riderReportContent.summary,
        title: riderReportContent.title,
        type: ReportType.RIDER_REPORT,
      }),
    );
  }

  const raceReportContent = buildRaceReportContent({
    awardCount: publishedAwards.length,
    organizerComment: race.organizerComment,
    raceTitle: race.title,
    teamCount: teams.length,
    workCount: works.length,
  });
  const raceReportSourceRef = buildReportSourceRef({
    awards: awardRefs.map((award) => ({ awardName: award.awardName, id: award.id, rank: award.rank })),
    evidences: teams.flatMap((team) => {
      const teamRegs = registrationsByTeamId.get(team.id) ?? [];
      return teamRegs.flatMap((reg) =>
        reg.evidences.map((evidence) => ({
          id: evidence.id,
          registrationId: evidence.registrationId,
          sourceDigest: evidence.sourceDigest,
          type: evidence.type,
        })),
      );
    }),
    projections: projectionRefs,
    raceId: race.id,
    reportType: ReportType.RACE_REPORT,
    subjectRegistrationId: null,
    works: works.map((w) => ({
      contentHash: w.contentHash,
      id: w.id,
      registrationId: w.team?.members[0]?.user.id ?? "",
      title: w.title,
    })),
  });
  createdReports.push(
    await upsertGeneratedDraftReport(prisma, {
      body: raceReportContent.body,
      raceId: race.id,
      sourceDigest: buildPayloadDigest(raceReportSourceRef),
      sourceRefJson: JSON.stringify(raceReportSourceRef),
      status: "GENERATED",
      subjectRegistrationId: null,
      summary: raceReportContent.summary,
      title: raceReportContent.title,
      type: ReportType.RACE_REPORT,
    }),
  );

  const reviewSummaryContent = buildReviewSummaryContent({
    evidenceHighlights: publicEvidenceHighlights,
    judgeComments: submittedJudgeComments,
    raceTitle: race.title,
  });
  const reviewSummarySourceRef = buildReportSourceRef({
    awards: awardRefs.map((award) => ({ awardName: award.awardName, id: award.id, rank: award.rank })),
    evidences: teams.flatMap((team) => {
      const teamRegs = registrationsByTeamId.get(team.id) ?? [];
      return teamRegs.flatMap((reg) =>
        reg.evidences
          .filter((evidence) => evidence.visibility === "PUBLIC")
          .map((evidence) => ({
            id: evidence.id,
            registrationId: evidence.registrationId,
            sourceDigest: evidence.sourceDigest,
            type: evidence.type,
          })),
      );
    }),
    projections: projectionRefs,
    raceId: race.id,
    reportType: ReportType.REVIEW_SUMMARY,
    subjectRegistrationId: null,
    works: works.map((w) => ({
      contentHash: w.contentHash,
      id: w.id,
      registrationId: w.team?.members[0]?.user.id ?? "",
      title: w.title,
    })),
  });
  createdReports.push(
    await upsertGeneratedDraftReport(prisma, {
      body: reviewSummaryContent.body,
      raceId: race.id,
      sourceDigest: buildPayloadDigest(reviewSummarySourceRef),
      sourceRefJson: JSON.stringify(reviewSummarySourceRef),
      status: "GENERATED",
      subjectRegistrationId: null,
      summary: reviewSummaryContent.summary,
      title: reviewSummaryContent.title,
      type: ReportType.REVIEW_SUMMARY,
    }),
  );

  return createdReports;
}

export async function publishReportForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  reportId: string;
}) {
  const report = await getManagedReportForAction(input);

  if (report.type === ReportType.RIDER_REPORT) {
    throw new Error("rider_report 默认保持私有，当前不支持公开发布");
  }

  if (report.status !== "REVIEWED") {
    throw new Error("鍙兘鍙戝竷 reviewed 鐘舵€佺殑鍏紑鎶ュ憡");
  }

  return prisma.report.update({
    where: {
      id: report.id,
    },
    data: {
      publishedAt: new Date(),
      status: "PUBLISHED",
    },
  });
}

export async function updateReportDraftForRace(input: {
  allowSystem?: boolean;
  body: string;
  organizerId: string;
  reportId: string;
  summary: string;
  title: string;
}) {
  const report = await getManagedReportForAction(input);

  if (report.status === "PUBLISHED" || report.publishedAt) {
    throw new Error("宸插彂甯冩姤鍛婁笉鑳藉啀缂栬緫");
  }

  return prisma.report.update({
    where: {
      id: report.id,
    },
    data: {
      body: input.body,
      publishedAt: null,
      status: "DRAFT",
      summary: input.summary,
      title: input.title,
    },
  });
}

export async function markReportReviewedForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  reportId: string;
}) {
  const report = await getManagedReportForAction(input);

  if (report.status === "PUBLISHED" || report.publishedAt) {
    throw new Error("宸插彂甯冩姤鍛婁笉鑳藉啀鏍囪 reviewed");
  }

  return prisma.report.update({
    where: {
      id: report.id,
    },
    data: {
      status: "REVIEWED",
    },
  });
}
