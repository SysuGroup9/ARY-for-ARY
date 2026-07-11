import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { createSubmission } from "@/lib/services/submissions";

function buildSubmissionFormData(input: {
  agentType?: string;
  codeContent?: string;
  codeLabel?: string;
  raceId: string;
  tokenUsed?: string;
  workSummary?: string;
  workTitle?: string;
}) {
  const formData = new FormData();
  formData.set("raceId", input.raceId);
  formData.set("codeLabel", input.codeLabel ?? "submission.ts");
  formData.set("codeContent", input.codeContent ?? "export const value = 1;");
  formData.set("tokenUsed", input.tokenUsed ?? "100");
  formData.set("agentType", input.agentType ?? "CUSTOM");
  formData.set(
    "workSummary",
    input.workSummary ?? "把当前提交沉淀成正式作品资产。",
  );
  formData.set("workTitle", input.workTitle ?? "Submission Work");
  formData.set("demoUrl", "");
  formData.set("repoUrl", "");
  formData.set("videoUrl", "");
  formData.set("techNotes", "");
  return formData;
}

test("submission service keeps pending registrations out of the formal work submission path", async () => {
  const user = await prisma.user.findFirst({
    where: {
      username: "rider_iris",
    },
  });

  assert.ok(user, "expected seeded rider_iris");

  await assert.rejects(
    createSubmission(
      user.id,
      buildSubmissionFormData({
        raceId: "race_signup",
        tokenUsed: "321",
      }),
    ),
    /当前报名尚未通过审核/,
  );
});

test("submission service uses registration-first wording when the rider is not registered", async () => {
  const user = await prisma.user.findFirst({
    where: {
      username: "judge_demo",
    },
  });

  assert.ok(user, "expected seeded judge_demo");

  await assert.rejects(
    createSubmission(
      user.id,
      buildSubmissionFormData({
        raceId: "race_active",
      }),
    ),
    /请先完成个人报名/,
  );
});
