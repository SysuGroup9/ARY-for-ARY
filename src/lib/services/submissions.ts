import {
  AgentType,
  SubmissionStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import { enqueueSubmissionTestTask } from "@/lib/services/runner";
import { createSubmissionSchema } from "@/lib/validation";

export async function createSubmission(riderId: string, formData: FormData) {
  const parsed = createSubmissionSchema.parse({
    raceId: formData.get("raceId"),
    codeLabel: formData.get("codeLabel"),
    codeContent: formData.get("codeContent"),
    recordLabel: formData.get("recordLabel"),
    ridingRecord: formData.get("ridingRecord"),
    tokenUsed: formData.get("tokenUsed"),
    agentType: formData.get("agentType"),
  });

  const team = await prisma.team.findFirst({
    where: {
      captainId: riderId,
      raceId: parsed.raceId,
    },
  });

  if (!team) {
    throw new Error("请先报名参赛");
  }

  const race = await prisma.race.findUnique({
    where: {
      id: parsed.raceId,
    },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  const phase = getRacePhase(race);
  if (phase !== "active" && phase !== "frozen") {
    throw new Error("只有比赛中或封榜期才能提交");
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
    const submission = await tx.submission.create({
      data: {
        agentType: parsed.agentType,
        codeContent: parsed.codeContent,
        codeLabel: parsed.codeLabel,
        raceId: parsed.raceId,
        recordLabel: parsed.recordLabel,
        ridingRecord: parsed.ridingRecord,
        status: SubmissionStatus.QUEUED,
        teamId: team.id,
        tokenUsed: parsed.tokenUsed,
      },
    });

    const artifact = await tx.submissionArtifact.create({
      data: {
        agentType: parsed.agentType,
        codeContent: parsed.codeContent,
        codeLabel: parsed.codeLabel,
        raceId: parsed.raceId,
        recordLabel: parsed.recordLabel,
        ridingRecord: parsed.ridingRecord,
        submissionId: submission.id,
        teamId: team.id,
        tokenUsed: parsed.tokenUsed,
      },
    });

    await enqueueSubmissionTestTask({
      artifactId: artifact.id,
      raceId: parsed.raceId,
      submissionId: submission.id,
      teamId: team.id,
      tx,
    });

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
