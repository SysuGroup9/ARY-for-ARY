import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildWorkSourceRef } from "@/lib/material-integrity-helpers";

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
  const sourceRef = buildWorkSourceRef({
    demoUrl: input.demoUrl,
    repoUrl: input.repoUrl,
    techNotes: input.archiveCode,
    videoUrl: input.videoUrl,
  });

  return {
    contentHash: buildPayloadDigest({
      demoUrl: input.demoUrl,
      repoUrl: input.repoUrl,
      summary: input.excerpt,
      techNotes: input.archiveCode,
      title: input.teamName,
      videoUrl: input.videoUrl,
    }),
    demoUrl: input.demoUrl,
    registrationId: input.registrationId,
    repoUrl: input.repoUrl,
    sourceRefJson: JSON.stringify(sourceRef),
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
  sourceByRegistrationId?: Record<string, { sourceDigest: string; sourceRefJson: string }>;
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
      sourceDigest: input.sourceByRegistrationId?.[input.overallRegistrationId]?.sourceDigest ?? "",
      sourceRefJson: input.sourceByRegistrationId?.[input.overallRegistrationId]?.sourceRefJson ?? "{}",
      workId: input.workIdByRegistrationId[input.overallRegistrationId] ?? null,
    },
    {
      awardName: "Best Work",
      decisionReason: "Strongest public work asset.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: input.raceId,
      rank: 1,
      registrationId: input.bestWorkRegistrationId,
      sourceDigest: input.sourceByRegistrationId?.[input.bestWorkRegistrationId]?.sourceDigest ?? "",
      sourceRefJson: input.sourceByRegistrationId?.[input.bestWorkRegistrationId]?.sourceRefJson ?? "{}",
      workId: input.workIdByRegistrationId[input.bestWorkRegistrationId] ?? null,
    },
    {
      awardName: "Best Agent Rider",
      decisionReason: "Strongest riding process summary.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: input.raceId,
      rank: 1,
      registrationId: input.ridingRegistrationId,
      sourceDigest: input.sourceByRegistrationId?.[input.ridingRegistrationId]?.sourceDigest ?? "",
      sourceRefJson: input.sourceByRegistrationId?.[input.ridingRegistrationId]?.sourceRefJson ?? "{}",
      workId: input.workIdByRegistrationId[input.ridingRegistrationId] ?? null,
    },
  ];
}

export function buildReviewSummaryReportSeed(input: {
  body: string;
  raceId: string;
  sourceDigest?: string;
  sourceRefJson?: string;
  summary: string;
  title: string;
}) {
  return {
    body: input.body,
    publishedAt: new Date("2026-06-19T00:00:00Z"),
    raceId: input.raceId,
    sourceDigest: input.sourceDigest ?? "",
    sourceRefJson: input.sourceRefJson ?? "{}",
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
  sourceDigest?: string;
  sourceRefJson?: string;
  subjectRegistrationId: string;
  summary: string;
  title: string;
}) {
  return {
    body: input.body,
    publishedAt: new Date("2026-06-19T00:00:00Z"),
    raceId: input.raceId,
    sourceDigest: input.sourceDigest ?? "",
    sourceRefJson: input.sourceRefJson ?? "{}",
    status: "PUBLISHED" as const,
    subjectRegistrationId: input.subjectRegistrationId,
    summary: input.summary,
    title: input.title,
    type: "RIDER_REPORT" as const,
  };
}
