import { z } from "zod";

const agentEnum = z.enum([
  "CLAUDE",
  "COPILOT",
  "DEEPSEEK",
  "ZHIPU",
  "OPENAI",
  "CUSTOM",
]);
const trackEnum = z.enum(["oval-track", "circuit-track"]);
const checkpointSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(64),
  s: z.coerce.number().min(0).max(1),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 个字符").max(32),
  password: z.string().min(6, "密码至少 6 个字符").max(128),
});

export const loginSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 个字符").max(32),
  password: z.string().min(6, "密码至少 6 个字符").max(128),
});

export const profileCompletionSchema = z.object({
  profileName: z.string().trim().min(2, "姓名至少 2 个字符").max(80),
  profileOrgLabel: z.string().trim().max(80).default(""),
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
  trackId: trackEnum,
  trackStartFinishS: z.coerce.number().min(0).max(1),
  trackCheckpointsJson: z.string().trim().min(2, "检查点配置不能为空"),
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

  let parsedCheckpoints: unknown;
  try {
    parsedCheckpoints = JSON.parse(data.trackCheckpointsJson);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "检查点配置必须是合法 JSON",
      path: ["trackCheckpointsJson"],
    });
    return;
  }

  const checkpointParse = z.array(checkpointSchema).safeParse(parsedCheckpoints);
  if (!checkpointParse.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "检查点配置里的每一项都要包含 id / name / s",
      path: ["trackCheckpointsJson"],
    });
  }
});

const codeSubmissionBaseSchema = z.object({
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
  tokenUsed: z.coerce.number().int().min(0),
  agentType: agentEnum,
});

const optionalWorkUrlSchema = z
  .string()
  .trim()
  .url("请输入合法链接")
  .or(z.literal(""));

const workMaterialShape = {
  demoUrl: optionalWorkUrlSchema,
  repoUrl: optionalWorkUrlSchema,
  techNotes: z.string().trim().max(4000).default(""),
  videoUrl: optionalWorkUrlSchema,
  workSummary: z.string().trim().min(1, "作品简介不能为空").max(4000),
  workTitle: z.string().trim().min(1, "作品名称不能为空").max(120),
} satisfies Record<string, z.ZodTypeAny>;

export const saveWorkDraftSchema = z.object({
  raceId: z.string().min(1),
  ...workMaterialShape,
});

export const createSubmissionSchema = codeSubmissionBaseSchema.extend(
  workMaterialShape,
);

export const createFinalSubmissionSchema = codeSubmissionBaseSchema.extend({
  ...workMaterialShape,
  recordLabel: z.string().trim().min(1, "Riding Record 文件名不能为空").max(120),
  ridingRecord: z.string().trim().min(1, "Riding Record 内容不能为空"),
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
  progress: z.coerce.number().min(0).max(1).optional(),
  passRate: z.coerce.number().min(0).max(100).optional(),
  codeReviewScore: z.coerce.number().min(0).max(100).optional(),
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

export const judgingRecordSchema = z.object({
  assignmentId: z.string().min(1),
  comments: z.string().trim().min(1).max(4000),
  scoreResultTotal: z.coerce.number().min(0).max(100),
  scoreRidingTotal: z.coerce.number().min(0).max(100),
  submit: z.boolean().default(false),
});
