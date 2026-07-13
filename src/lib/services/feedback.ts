import { prisma } from "@/lib/prisma";
import { assertManagedRaceActionAccess } from "@/lib/services/races";
import { feedbackReplySchema, feedbackSchema } from "@/lib/validation";

export async function sendFeedback(authorId: string, formData: FormData) {
  const parsed = feedbackSchema.parse({
    raceId: formData.get("raceId"),
    content: formData.get("content"),
  });

  const registration = await prisma.registration.findUnique({
    where: {
      raceId_userId: {
        raceId: parsed.raceId,
        userId: authorId,
      },
    },
    select: { id: true, teamId: true },
  });

  if (!registration) {
    throw new Error("请先报名参赛后再反馈");
  }
  if (!registration.teamId) {
    throw new Error("请先创建或加入队伍后再反馈");
  }
  // GRS004: 双重校验 — 必须 TeamMember.approved
  const teamMember = await prisma.teamMember.findFirst({
    where: { teamId: registration.teamId, userId: authorId, status: "APPROVED" },
  });
  if (!teamMember) {
    throw new Error("请等待队长审批通过后再发送反馈");
  }

  return prisma.$transaction(async (tx) => {
    const existingReg = await tx.registration.findUnique({
      where: {
        raceId_userId: {
          raceId: parsed.raceId,
          userId: authorId,
        },
      },
    });

    if (!existingReg) {
      throw new Error("请先报名参赛后再反馈");
    }

    const thread =
      (await tx.feedbackThread.findFirst({
        where: {
          raceId: parsed.raceId,
          registrationId: existingReg.id,
        },
      })) ??
      (await tx.feedbackThread.create({
        data: {
          raceId: parsed.raceId,
          registrationId: existingReg.id,
          teamId: registration.teamId,
        },
      }));

    await tx.feedbackMessage.create({
      data: {
        threadId: thread.id,
        authorId,
        content: parsed.content,
      },
    });

    return tx.feedbackThread.update({
      where: {
        id: thread.id,
      },
      data: {
        status: "PENDING",
      },
    });
  });
}

export async function replyFeedback(input: {
  allowSystem?: boolean;
  formData: FormData;
  organizerId: string;
}) {
  const parsed = feedbackReplySchema.parse({
    threadId: input.formData.get("threadId"),
    content: input.formData.get("content"),
    markResolved: input.formData.get("markResolved") === "on",
  });

  const thread = await prisma.feedbackThread.findUnique({
    where: {
      id: parsed.threadId,
    },
    include: {
      race: true,
    },
  });

  if (!thread) {
    throw new Error("无权回复这条反馈");
  }

  await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权回复这条反馈",
    raceId: thread.raceId,
    userId: input.organizerId,
  });

  return prisma.$transaction(async (tx) => {
    await tx.feedbackMessage.create({
      data: {
        threadId: parsed.threadId,
        authorId: input.organizerId,
        content: parsed.content,
      },
    });

    return tx.feedbackThread.update({
      where: {
        id: parsed.threadId,
      },
      data: {
        status: parsed.markResolved ? "RESOLVED" : "PENDING",
      },
    });
  });
}
