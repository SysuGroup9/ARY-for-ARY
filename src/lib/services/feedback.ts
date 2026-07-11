import { prisma } from "@/lib/prisma";
import { assertManagedRaceActionAccess } from "@/lib/services/races";
import { getCompatibilityContainerForRegistration } from "@/lib/services/rider-bridge";
import { feedbackReplySchema, feedbackSchema } from "@/lib/validation";

export async function sendFeedback(authorId: string, formData: FormData) {
  const parsed = feedbackSchema.parse({
    raceId: formData.get("raceId"),
    content: formData.get("content"),
  });

  const team = await getCompatibilityContainerForRegistration({
    raceId: parsed.raceId,
    userId: authorId,
  });

  if (!team) {
    throw new Error("请先报名参赛后再反馈");
  }

  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: {
        raceId_userId: {
          raceId: parsed.raceId,
          userId: authorId,
        },
      },
    });

    if (!registration) {
      throw new Error("请先报名参赛后再反馈");
    }

    const thread =
      (await tx.feedbackThread.findFirst({
        where: {
          raceId: parsed.raceId,
          registrationId: registration.id,
        },
      })) ??
      (await tx.feedbackThread.create({
        data: {
          raceId: parsed.raceId,
          registrationId: registration.id,
          teamId: team.id,
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
