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
  role: roleEnum,
});

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
  harnessWeightReasoning: z.coerce.number().positive(),
  harnessWeightKeyword: z.coerce.number().positive(),
  trackId: z.enum(["oval-standard", "rect-standard"]).default("oval-standard"),
  trackCenterlineJson: z.string().trim().nullable().optional().refine(
    (v) => {
      if (!v) return true;
      try {
        const pts = JSON.parse(v);
        return Array.isArray(pts) && pts.length >= 4;
      } catch { return false; }
    },
    { message: "控制点格式错误：需为 JSON 数组（至少 4 个点），如 [[960,200],[1600,540],...]" }
  ).transform((v) => v || null),
  trackDirection: z.enum(["clockwise", "counterclockwise"]).default("counterclockwise"),
  trackStartFinishS: z.coerce.number().min(0).max(1).default(0.0),
  checkpointCount: z.coerce.number().int().min(1).max(10).default(3),
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
  codeLabel: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine(
      (value) => /\.(?:[cm]?[jt]s)$/i.test(value),
      "Only JavaScript / TypeScript submission files are supported in this PoC",
    ),
  codeContent: z.string().trim().min(1, "代码内容不能为空"),
  recordLabel: z.string().trim().max(120).optional(),
  ridingRecord: z.string().trim().optional(),
  tokenUsed: z.coerce.number().int().min(0),
  agentType: agentEnum,
}).transform((data) => {
  const ridingRecord = data.ridingRecord?.trim() || null;
  const recordLabel = ridingRecord ? data.recordLabel?.trim() || null : null;

  return {
    ...data,
    recordLabel,
    ridingRecord,
  };
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

export const runnerResultSchema = z.object({
  taskId: z.string().min(1),
  submissionId: z.string().min(1),
  status: z.enum(["succeeded", "failed"]),
  score: z.coerce.number().min(0).default(0),
  reasoningScore: z.coerce.number().min(0).max(100).optional(),
  keywordScore: z.coerce.number().min(0).max(100).optional(),
  runnerComment: z.string().trim().max(2000).default(""),
  resultHash: z.string().trim().max(255).optional(),
  finishedAt: z.string().datetime().optional(),
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
