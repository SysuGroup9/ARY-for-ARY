export function buildWorkSeedRecord(input: {
  archiveCode: string;
  demoUrl: string;
  excerpt: string;
  raceId: string;
  registrationId: string;
  repoUrl: string;
  teamName: string;
  videoUrl: string;
}) {
  return {
    demoUrl: input.demoUrl,
    registrationId: input.registrationId,
    repoUrl: input.repoUrl,
    status: "SUBMITTED" as const,
    summary: input.excerpt,
    techNotes: input.archiveCode,
    title: input.teamName,
    videoUrl: input.videoUrl,
    visibility: "PUBLIC" as const,
  };
}

export function buildAwardSeedRecords(input: {
  bestWorkRegistrationId: string;
  overallRegistrationId: string;
  raceId: string;
  ridingRegistrationId: string;
  workIdByRegistrationId: Record<string, string>;
}) {
  return [
    {
      awardName: "Best Overall",
      decisionReason: "Top overall finished result.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: input.raceId,
      rank: 1,
      registrationId: input.overallRegistrationId,
      workId: input.workIdByRegistrationId[input.overallRegistrationId] ?? null,
    },
    {
      awardName: "Best Work",
      decisionReason: "Strongest public work asset.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: input.raceId,
      rank: 1,
      registrationId: input.bestWorkRegistrationId,
      workId: input.workIdByRegistrationId[input.bestWorkRegistrationId] ?? null,
    },
    {
      awardName: "Best Agent Rider",
      decisionReason: "Strongest riding process summary.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: input.raceId,
      rank: 1,
      registrationId: input.ridingRegistrationId,
      workId: input.workIdByRegistrationId[input.ridingRegistrationId] ?? null,
    },
  ];
}

export function buildReviewSummaryReportSeed(input: {
  body: string;
  raceId: string;
  summary: string;
  title: string;
}) {
  return {
    body: input.body,
    publishedAt: new Date("2026-06-19T00:00:00Z"),
    raceId: input.raceId,
    status: "PUBLISHED" as const,
    subjectRegistrationId: null,
    summary: input.summary,
    title: input.title,
    type: "REVIEW_SUMMARY" as const,
  };
}

export function buildRiderReportSeed(input: {
  body: string;
  raceId: string;
  subjectRegistrationId: string;
  summary: string;
  title: string;
}) {
  return {
    body: input.body,
    publishedAt: new Date("2026-06-19T00:00:00Z"),
    raceId: input.raceId,
    status: "PUBLISHED" as const,
    subjectRegistrationId: input.subjectRegistrationId,
    summary: input.summary,
    title: input.title,
    type: "RIDER_REPORT" as const,
  };
}
