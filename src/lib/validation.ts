import { z } from "zod";

const roleEnum = z.enum(["ORGANIZER", "RIDER"]);
const agentEnum = z.enum([
  "CLAUDE",
  "COPILOT",
  "DEEPSEEK",
  "ZHIPU",
  "OPENAI",
  "CUSTOM",
]);

export const registerSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 个字符").max(32),
  password: z.string().min(6, "密码至少 6 个字符").max(128),
  displayName: z.string().trim().max(64).optional(),
  role: roleEnum,
}).transform((data) => ({
  ...data,
  displayName: data.displayName?.trim() || data.username,
})).pipe(
  z.object({
    username: z.string().trim().min(3, "用户名至少 3 个字符").max(32),
    password: z.string().min(6, "密码至少 6 个字符").max(128),
    displayName: z.string().min(2, "显示名至少 2 个字符").max(64),
    role: roleEnum,
  }),
);

export const loginSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 个字符").max(32),
  password: z.string().min(6, "密码至少 6 个字符").max(128),
});

const raceBaseSchema = z.object({
  title: z.string().trim().min(2, "赛事名称至少 2 个字符").max(120),
  summary: z.string().trim().min(8, "赛事简介至少 8 个字符").max(500),
  taskPackageLabel: z.string().trim().min(2).max(120),
  taskDescription: z.string().trim().min(10, "题目描述至少 10 个字符"),
  trainingDataSummary: z.string().trim().max(4000).default(""),
  hasTrainingData: z.boolean(),
  evaluationNotes: z.string().trim().min(4, "评测说明至少 4 个字符"),
  keywordsText: z.string().trim().min(1, "关键词不能为空"),
  tokenLimit: z.coerce.number().int().positive(),
  signupStart: z.string().datetime(),
  signupEnd: z.string().datetime(),
  raceStart: z.string().datetime(),
  raceEnd: z.string().datetime(),
  enableFreeze: z.boolean(),
  freezeMinutesBeforeEnd: z.coerce.number().int().min(0).max(180),
  updateGranularityMinutes: z.coerce.number().int().positive(),
  maxTeamSize: z.coerce.number().int().positive().max(20),
  submissionIntervalHours: z.coerce.number().int().positive().max(168),
  cloudStudioUrl: z.string().trim().url("CloudStudio 地址格式不正确").or(z.literal("")),
  displayShowTrainingData: z.boolean(),
  displayShowOrganizerComment: z.boolean(),
  displayShowTopHighlights: z.boolean(),
  displayHighlightCount: z.coerce.number().int().min(0).max(20),
  displayShowRiderCode: z.boolean(),
  weightTaskPassRate: z.coerce.number().positive(),
  weightCodeReview: z.coerce.number().positive(),
  weightReasoning: z.coerce.number().positive(),
  weightKeywords: z.coerce.number().positive(),
  weightTotalTask: z.coerce.number().positive(),
  weightTotalToken: z.coerce.number().positive(),
  weightTotalDialogue: z.coerce.number().positive(),
});

export const createRaceSchema = raceBaseSchema.superRefine((data, ctx) => {
  const signupStart = new Date(data.signupStart).getTime();
  const signupEnd = new Date(data.signupEnd).getTime();
  const raceStart = new Date(data.raceStart).getTime();
  const raceEnd = new Date(data.raceEnd).getTime();

  if (!(signupStart <= signupEnd && signupEnd <= raceStart && raceStart <= raceEnd)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "时间线必须满足报名开始 <= 报名结束 <= 比赛开始 <= 比赛结束",
      path: ["raceEnd"],
    });
  }
});

export const registerTeamSchema = z.object({
  raceId: z.string().min(1),
  teamName: z.string().trim().min(2, "队伍名至少 2 个字符").max(80),
  membersText: z.string().trim().min(1, "至少填写 1 名组员"),
});

export const createSubmissionSchema = z.object({
  raceId: z.string().min(1),
  codeLabel: z.string().trim().min(1).max(120),
  codeContent: z.string().trim().min(1, "代码内容不能为空"),
  recordLabel: z.string().trim().min(1).max(120),
  ridingRecord: z.string().trim().min(1, "Riding Record 不能为空"),
  tokenUsed: z.coerce.number().int().min(0),
  agentType: agentEnum,
});

export const feedbackSchema = z.object({
  raceId: z.string().min(1),
  content: z.string().trim().min(1, "反馈内容不能为空"),
});

export const feedbackReplySchema = z.object({
  threadId: z.string().min(1),
  content: z.string().trim().min(1, "回复内容不能为空"),
  markResolved: z.boolean().default(false),
});

export const runnerPullSchema = z.object({
  raceId: z.string().min(1),
});

export const runnerScoreSchema = z.object({
  submissionId: z.string().min(1),
  passRate: z.coerce.number().min(0).max(100),
  codeReviewScore: z.coerce.number().min(0).max(100),
  reasoningScore: z.coerce.number().min(0).max(100),
  runnerComment: z.string().trim().max(2000).default(""),
  status: z.enum(["success", "failed"]),
});

export const displayOptionsSchema = raceBaseSchema
  .pick({
    displayShowTrainingData: true,
    displayShowOrganizerComment: true,
    displayShowTopHighlights: true,
    displayHighlightCount: true,
    displayShowRiderCode: true,
  })
  .extend({
    raceId: z.string().min(1),
  });
