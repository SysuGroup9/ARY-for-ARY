import {
  AgentType,
  SubmissionStatus,
} from "@/generated/prisma/enums";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildSubmissionBindingJson } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import {
  ensureCompatibilityContainerForApprovedRegistration,
  getRegistrationForUser,
} from "@/lib/services/registrations";
import { recordSecurityAudit } from "@/lib/services/security-audit";
import { upsertSubmittedWorkForRegistration } from "@/lib/services/works";
import {
  createFinalSubmissionSchema,
  createSubmissionSchema,
} from "@/lib/validation";

export async function createSubmission(
  riderId: string,
  formData: FormData,
) {
  const parsed = createSubmissionSchema.parse({
    raceId: formData.get("raceId"),
    codeLabel: formData.get("codeLabel"),
    codeContent: formData.get("codeContent"),
    demoUrl: formData.get("demoUrl"),
    repoUrl: formData.get("repoUrl"),
    techNotes: formData.get("techNotes"),
    tokenUsed: formData.get("tokenUsed"),
    agentType: formData.get("agentType"),
    videoUrl: formData.get("videoUrl"),
    workSummary: formData.get("workSummary"),
    workTitle: formData.get("workTitle"),
  });

  const registration = await getRegistrationForUser(parsed.raceId, riderId);
  if (!registration) {
    throw new Error("请先完成个人报名");
  }

  if (registration.status !== "APPROVED") {
    throw new Error("当前报名尚未通过审核");
  }

  const team = await ensureCompatibilityContainerForApprovedRegistration({
    raceId: parsed.raceId,
    userId: riderId,
  });

  const registrationId = registration.id;

  const race = await prisma.race.findUnique({
    where: {
      id: parsed.raceId,
    },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  const phase = getRacePhase(race);
  if (
    phase !== "active" &&
    phase !== "frozen" &&
    phase !== "running" &&
    phase !== "submitting"
  ) {
    throw new Error("只有比赛中、封榜期或提交中阶段才能提交作品");
  }

  const lastSubmission = await prisma.submission.findFirst({
    where: {
      teamId: team.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (lastSubmission) {
    const cooldownMs = race.submissionIntervalHours * 60 * 60 * 1000;
    const elapsed = Date.now() - lastSubmission.createdAt.getTime();
    if (elapsed < cooldownMs) {
      const minutes = Math.ceil((cooldownMs - elapsed) / 60000);
      throw new Error(`提交过于频繁，请 ${minutes} 分钟后再试`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const submittedAt = new Date();
    const codeContentHash = buildPayloadDigest(parsed.codeContent);
    const ridingRecordHash = buildPayloadDigest("");
    const submitterBindingJson = buildSubmissionBindingJson({
      raceId: parsed.raceId,
      registrationId,
      submittedAt,
      userId: riderId,
    });

    await upsertSubmittedWorkForRegistration(tx, {
      fallbackRepoUrl: registration.raceProject?.githubRepoUrl ?? "",
      registrationId,
      work: {
        demoUrl: parsed.demoUrl,
        repoUrl: parsed.repoUrl,
        summary: parsed.workSummary,
        techNotes: parsed.techNotes,
        title: parsed.workTitle,
        videoUrl: parsed.videoUrl,
      },
    });

    const submission = await tx.submission.create({
      data: {
        agentType: parsed.agentType,
        codeContent: parsed.codeContent,
        codeContentHash,
        codeLabel: parsed.codeLabel,
        raceId: parsed.raceId,
        registrationId,
        recordLabel: null,
        ridingRecord: null,
        ridingRecordHash,
        status: SubmissionStatus.QUEUED,
        submitterBindingJson,
        teamId: team.id,
        tokenUsed: parsed.tokenUsed,
      },
    });

    const artifact = await tx.submissionArtifact.create({
      data: {
        agentType: parsed.agentType,
        codeContent: parsed.codeContent,
        codeContentHash,
        codeLabel: parsed.codeLabel,
        raceId: parsed.raceId,
        registrationId,
        recordLabel: null,
        ridingRecord: null,
        ridingRecordHash,
        submissionId: submission.id,
        submitterBindingJson,
        teamId: team.id,
        tokenUsed: parsed.tokenUsed,
      },
    });

    await recordSecurityAudit(tx, {
      action: "submission_artifact.create",
      actorKind: "USER",
      details: {
        codeContentHash,
        ridingRecordHash,
        submissionId: submission.id,
        submissionPhase: "active",
        submitterBindingJson,
      },
      raceId: parsed.raceId,
      registrationId,
      result: "accepted",
      targetId: artifact.id,
      targetType: "SubmissionArtifact",
      userId: riderId,
    });

    return submission;
  });
}

export async function createFinalSubmission(riderId: string, formData: FormData) {
  const parsed = createFinalSubmissionSchema.parse({
    raceId: formData.get("raceId"),
    codeLabel: formData.get("codeLabel"),
    codeContent: formData.get("codeContent"),
    demoUrl: formData.get("demoUrl"),
    recordLabel: formData.get("recordLabel"),
    repoUrl: formData.get("repoUrl"),
    ridingRecord: formData.get("ridingRecord"),
    techNotes: formData.get("techNotes"),
    tokenUsed: formData.get("tokenUsed"),
    agentType: formData.get("agentType"),
    videoUrl: formData.get("videoUrl"),
    workSummary: formData.get("workSummary"),
    workTitle: formData.get("workTitle"),
  });

  const registration = await getRegistrationForUser(parsed.raceId, riderId);
  if (!registration) {
    throw new Error("请先完成个人报名");
  }

  if (registration.status !== "APPROVED") {
    throw new Error("当前报名尚未通过审核");
  }

  const team = await ensureCompatibilityContainerForApprovedRegistration({
    raceId: parsed.raceId,
    userId: riderId,
  });

  const registrationId = registration.id;

  const race = await prisma.race.findUnique({
    where: {
      id: parsed.raceId,
    },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  const phase = getRacePhase(race);
  if (phase !== "finished" && phase !== "completed") {
    throw new Error("只有比赛结束后才能提交赛后代码与 Riding Record");
  }

  return prisma.$transaction(async (tx) => {
    const submittedAt = new Date();
    const codeContentHash = buildPayloadDigest(parsed.codeContent);
    const ridingRecordHash = buildPayloadDigest(parsed.ridingRecord);
    const submitterBindingJson = buildSubmissionBindingJson({
      raceId: parsed.raceId,
      registrationId,
      submittedAt,
      userId: riderId,
    });

    await upsertSubmittedWorkForRegistration(tx, {
      fallbackRepoUrl: registration.raceProject?.githubRepoUrl ?? "",
      registrationId,
      work: {
        demoUrl: parsed.demoUrl,
        repoUrl: parsed.repoUrl,
        summary: parsed.workSummary,
        techNotes: parsed.techNotes,
        title: parsed.workTitle,
        videoUrl: parsed.videoUrl,
      },
    });

    const submission = await tx.submission.create({
      data: {
        agentType: parsed.agentType,
        codeContent: parsed.codeContent,
        codeContentHash,
        codeLabel: parsed.codeLabel,
        raceId: parsed.raceId,
        registrationId,
        recordLabel: parsed.recordLabel,
        ridingRecord: parsed.ridingRecord,
        ridingRecordHash,
        status: SubmissionStatus.QUEUED,
        submitterBindingJson,
        teamId: team.id,
        tokenUsed: parsed.tokenUsed,
      },
    });

    const artifact = await tx.submissionArtifact.create({
      data: {
        agentType: parsed.agentType,
        codeContent: parsed.codeContent,
        codeContentHash,
        codeLabel: parsed.codeLabel,
        raceId: parsed.raceId,
        registrationId,
        recordLabel: parsed.recordLabel,
        ridingRecord: parsed.ridingRecord,
        ridingRecordHash,
        submissionId: submission.id,
        submitterBindingJson,
        teamId: team.id,
        tokenUsed: parsed.tokenUsed,
      },
    });

    await recordSecurityAudit(tx, {
      action: "submission_artifact.create",
      actorKind: "USER",
      details: {
        codeContentHash,
        ridingRecordHash,
        submissionId: submission.id,
        submissionPhase: "final",
        submitterBindingJson,
      },
      raceId: parsed.raceId,
      registrationId,
      result: "accepted",
      targetId: artifact.id,
      targetType: "SubmissionArtifact",
      userId: riderId,
    });

    // Legacy Harness evaluation path demoted.
    // await enqueueHarnessEvalTaskForArtifact(tx, { ... });

    return submission;
  });
}

export function getAgentLabel(agent: AgentType): string {
  switch (agent) {
    case AgentType.CLAUDE:
      return "Claude";
    case AgentType.COPILOT:
      return "Copilot";
    case AgentType.DEEPSEEK:
      return "DeepSeek";
    case AgentType.ZHIPU:
      return "Zhipu";
    case AgentType.OPENAI:
      return "OpenAI";
    case AgentType.CUSTOM:
      return "Custom";
    default:
      return "Unknown";
  }
}
