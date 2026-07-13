import { hashPassword } from "../src/lib/auth";
import { buildPayloadDigest } from "../src/lib/ca-integrity-helpers";
import { buildSubmissionBindingJson } from "../src/lib/material-integrity-helpers";
import { prisma } from "../src/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "../src/lib/services/evidence";
import { rebuildRaceProcessProjections } from "../src/lib/services/projections";
import { generateRaceSnapshot } from "../src/lib/services/race-snapshot";
import {
  buildAwardSourceRef,
  buildJudgingRecordSourceRef,
  buildReportSourceRef,
} from "../src/lib/result-reference-freeze-helpers";
import {
  buildAwardSeedRecords,
  buildReviewSummaryReportSeed,
  buildRiderReportSeed,
  buildWorkSeedRecord,
} from "../src/lib/result-chain-helpers";
import { serializeRoles, type AppRole } from "../src/lib/user-roles";

function buildProjectionPayloadDigest(payloadJson: string) {
  try {
    return buildPayloadDigest(JSON.parse(payloadJson));
  } catch {
    return buildPayloadDigest(payloadJson);
  }
}

async function main() {
  await prisma.runnerTask.deleteMany();
  await prisma.submissionArtifact.deleteMany();
  await prisma.teamComment.deleteMany();
  await prisma.ridingHighlight.deleteMany();
  await prisma.harnessEntry.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.feedbackMessage.deleteMany();
  await prisma.feedbackThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.teamArchive.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.race.deleteMany();
  await prisma.user.deleteMany();

  const organizerPw = await hashPassword("organizer123");
  const riderPw = await hashPassword("rider123");

  async function createUser(input: {
    id: string;
    passwordHash: string;
    profileCompleted?: boolean;
    roles: AppRole[];
    username: string;
  }) {
    return prisma.user.create({
      data: {
        id: input.id,
        passwordHash: input.passwordHash,
        profileCompleted: input.profileCompleted ?? true,
        profileName: input.username,
        profileOrgLabel: "ARY",
        rolesJson: serializeRoles(input.roles),
        username: input.username,
      },
    });
  }

  const organizer = await createUser({
    id: "org_01",
    passwordHash: organizerPw,
    roles: ["ORGANIZER"],
    username: "organizer_demo",
  });

  await createUser({
    id: "admin_01",
    passwordHash: organizerPw,
    roles: ["ADMIN"],
    username: "admin_demo",
  });

  const judge = await createUser({
    id: "judge_01",
    passwordHash: riderPw,
    roles: ["JUDGE"],
    username: "judge_demo",
  });

  const riders = await Promise.all(
    [
      "alice",
      "bob",
      "charlie",
      "diana",
      "eve",
      "frank",
      "grace",
      "henry",
      "iris",
      "jack",
      "kate",
    ].map((name, index) =>
      createUser({
        id: `rider_${String(index + 1).padStart(2, "0")}`,
        passwordHash: riderPw,
        roles: ["RIDER"],
        username: `rider_${name}`,
      }),
    ),
  );

  const organizerStory = await createUser({
    id: "org_story_01",
    passwordHash: organizerPw,
    roles: ["ORGANIZER"],
    username: "organizer_story",
  });

  const judgeStory = await createUser({
    id: "judge_story_01",
    passwordHash: riderPw,
    roles: ["JUDGE"],
    username: "judge_story",
  });

  const storyRiders = await Promise.all(
    ["luna", "milo", "nova", "orion"].map((name, index) =>
      createUser({
        id: `rider_story_${String(index + 1).padStart(2, "0")}`,
        passwordHash: riderPw,
        roles: ["RIDER"],
        username: `rider_${name}`,
      }),
    ),
  );

  const now = new Date();
  const addDays = (date: Date, days: number) =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  const addHours = (date: Date, hours: number) =>
    new Date(date.getTime() + hours * 60 * 60 * 1000);

  // GRS004: 多人 Team 辅助函数，支持混合 PENDING/APPROVED 状态
  async function createMultiMemberTeam(input: {
    raceId: string;
    teamName: string;
    members: Array<{
      user: { id: string; username: string };
      role: "LEADER" | "MATE";
      status: "APPROVED" | "PENDING";
    }>;
  }) {
    const leader = input.members.find((m) => m.role === "LEADER")!;
    const team = await prisma.team.create({
      data: {
        captainId: leader.user.id,
        leaderId: leader.user.id,
        name: input.teamName,
        raceId: input.raceId,
      },
    });
    for (const m of input.members) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: m.user.id,
          displayName: m.user.username,
          role: m.role,
          status: m.status,
        },
      });
    }
    return team;
  }

  async function createTeamRegistrationBundle(input: {
    aggregateIngestionStatus?: "ACTIVE" | "CONNECTED" | "FAILED" | "NOT_CONFIGURED";
    approvedAt?: Date;
    createRaceProject?: boolean;
    extraMembers?: Array<{
      displayName: string;
      role?: "LEADER" | "MATE";
      status?: "APPROVED" | "PENDING" | "REJECTED";
      user: { id: string; username: string };
    }>;
    githubRepoUrl?: string;
    raceId: string;
    registrationStatus?: "APPROVED" | "REJECTED" | "SUBMITTED" | "WITHDRAWN";
    submittedAt?: Date;
    teamName: string;
    user: { id: string; username: string };
  }) {
    const registrationStatus = input.registrationStatus ?? "APPROVED";
    const registration = await prisma.registration.create({
      data: {
        approvedAt:
          registrationStatus === "APPROVED"
            ? input.approvedAt ?? now
            : undefined,
        raceId: input.raceId,
        status: registrationStatus,
        submittedAt: input.submittedAt ?? now,
        userId: input.user.id,
      },
    });

    // 构建 TeamMember 列表：Leader + 额外成员
    const memberCreates = [
      { displayName: input.user.username, role: "LEADER" as const, status: "APPROVED" as const, userId: input.user.id },
      ...(input.extraMembers ?? []).map((m) => ({
        displayName: m.displayName,
        role: m.role ?? "MATE" as const,
        status: m.status ?? "APPROVED" as const,
        userId: m.user.id,
      })),
    ];

    const team = await prisma.team.create({
      data: {
        captainId: input.user.id,
        leaderId: input.user.id,
        members: {
          create: memberCreates,
        },
        name: input.teamName,
        raceId: input.raceId,
      },
    });

    // 为额外成员创建 Registration 并回写 teamId
    if (input.extraMembers) {
      for (const m of input.extraMembers) {
        const mateReg = await prisma.registration.create({
          data: {
            approvedAt:
              registrationStatus === "APPROVED"
                ? input.approvedAt ?? now
                : undefined,
            raceId: input.raceId,
            status: registrationStatus,
            submittedAt: input.submittedAt ?? now,
            teamId: team.id,
            userId: m.user.id,
          },
        });
        // 为 mate 创建 RaceProject
        if (input.createRaceProject !== false) {
          await prisma.raceProject.create({
            data: {
              aggregateIngestionStatus:
                input.aggregateIngestionStatus ?? "NOT_CONFIGURED",
              githubRepoUrl:
                input.githubRepoUrl ??
                `https://github.com/demo/${m.user.username}-${input.raceId}`,
              registrationId: mateReg.id,
            },
          });
        }
      }
    }

    // 回写 Leader 的 Registration.teamId
    await prisma.registration.update({
      where: { id: registration.id },
      data: { teamId: team.id },
    });

    const raceProject =
      input.createRaceProject === false
        ? null
        : await prisma.raceProject.create({
            data: {
              aggregateIngestionStatus:
                input.aggregateIngestionStatus ?? "NOT_CONFIGURED",
              githubRepoUrl:
                input.githubRepoUrl ??
                `https://github.com/demo/${input.user.username}-${input.raceId}`,
              registrationId: registration.id,
            },
          });

    return { raceProject, registration, team };
  }

  const raceBase = {
    cloudStudioUrl: "https://cloudstudio.net/",
    displayHighlightCount: 3,
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    harnessWeightKeyword: 0.4,
    harnessWeightReasoning: 0.6,
    maxTeamSize: 5,
    organizerId: organizer.id,
    tokenLimit: 4000,
    trackConfigJson: "",
    trackId: "oval-track",
    updateGranularityMinutes: 30,
    weightCodeReview: 0.5,
    weightKeywords: 0.3,
    weightReasoning: 0.7,
    weightTaskPassRate: 0.5,
    weightTotalDialogue: 0.2,
    weightTotalTask: 0.5,
    weightTotalToken: 0.3,
  } as const;

  async function createConnectionWithOptionalSession(input: {
    caProjectId: string;
    caType: "CLAUDE_CODE" | "CODEX" | "OTHER";
    connectorBaseUrl: string;
    connectorId: string;
    connectorSecret: string;
    ingestionStatus: "ACTIVE" | "CONNECTED" | "FAILED" | "NOT_CONFIGURED";
    latestActivity?: string;
    progressPercent?: number;
    raceProjectId: string;
    riskLevel?: string;
    riskReason?: string;
    sessionId?: string;
    startedAt?: Date;
    taskStatus?: string;
    tokenCost?: number;
  }) {
    const connection = await prisma.cAConnection.create({
      data: {
        caProjectId: input.caProjectId,
        caType: input.caType,
        connectorBaseUrl: input.connectorBaseUrl,
        connectorId: input.connectorId,
        connectorSecret: input.connectorSecret,
        connectorVersion: "0.1.0",
        handshakeCompletedAt:
          input.ingestionStatus === "NOT_CONFIGURED" ? null : input.startedAt ?? now,
        ingestionSource: "CONNECTOR",
        ingestionStatus: input.ingestionStatus,
        lastSyncedAt:
          input.ingestionStatus === "ACTIVE" || input.ingestionStatus === "CONNECTED"
            ? input.startedAt ?? now
            : null,
        raceProjectId: input.raceProjectId,
      },
    });

    if (!input.sessionId) {
      return { connection, session: null };
    }

    const session = await prisma.session.create({
      data: {
        caConnectionId: connection.id,
        caSessionId: input.sessionId,
        currentGoal: "Advance the current race objective and keep the delivery path stable.",
        endedAt: input.taskStatus === "completed" ? addHours(input.startedAt ?? now, 6) : null,
        lastActiveAt: addHours(input.startedAt ?? now, 1),
        latestActivity: input.latestActivity ?? `${input.connectorId} is still active.`,
        messageCount: 24,
        progressPercent: input.progressPercent ?? 50,
        riskLevel: input.riskLevel ?? "low",
        riskReason: input.riskReason ?? "none",
        startedAt: input.startedAt ?? now,
        taskStatus: input.taskStatus ?? "in_progress",
        tokenCost: input.tokenCost ?? 1800,
        toolCallCount: 6,
      },
    });

    return { connection, session };
  }

  const raceActive = await prisma.race.create({
    data: {
      ...raceBase,
      enableFreeze: false,
      evaluationNotes: "Use current public leaderboard and runner flow as the transitional live scoring source.",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: true,
      id: "race_active",
      keywordsJson: JSON.stringify([
        "sorting",
        "boundary",
        "performance",
        "reasoning",
      ]),
      organizerComment: "",
      raceEnd: new Date("2026-06-27T20:00:00+08:00"),
      raceStart: new Date("2026-06-18T09:00:00+08:00"),
      signupEnd: new Date("2026-06-18T08:00:00+08:00"),
      signupStart: new Date("2026-06-10T09:00:00+08:00"),
      status: "running",
      submissionIntervalHours: 1,
      summary: "Sorting challenge race with active teams and distributed live progress.",
      taskDescription: "Implement a stable sorting workflow and keep correctness under boundary inputs.",
      taskPackageLabel: "sort-task-v1.zip",
      title: "Sorting Challenge",
      trainingDataSummary: "Sample inputs include duplicates, empty arrays, and reversed sequences.",
    },
  });

  const raceSignup = await prisma.race.create({
    data: {
      ...raceBase,
      displayShowRiderCode: false,
      displayShowTrainingData: false,
      enableFreeze: false,
      evaluationNotes: "Focus on RESTful API shape, extensibility, and public explanation quality.",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: false,
      id: "race_signup",
      keywordsJson: JSON.stringify([
        "api",
        "rest",
        "docs",
        "versioning",
      ]),
      organizerComment: "",
      raceEnd: new Date("2026-06-30T18:00:00+08:00"),
      raceStart: new Date("2026-06-29T09:00:00+08:00"),
      signupEnd: new Date("2026-06-28T23:00:00+08:00"),
      signupStart: new Date("2026-06-16T09:00:00+08:00"),
      status: "registration",
      submissionIntervalHours: 12,
      summary: "Upcoming API design race still in registration.",
      taskDescription: "Design and explain a task-manager API with clear resources and state transitions.",
      taskPackageLabel: "api-design-v1.zip",
      title: "API Design Race",
      trainingDataSummary: "",
    },
  });

  const raceFinished = await prisma.race.create({
    data: {
      ...raceBase,
      enableFreeze: true,
      evaluationNotes: "Focus on render speed, memory use, and overall page responsiveness.",
      freezeMinutesBeforeEnd: 60,
      hasTrainingData: true,
      id: "race_finished",
      keywordsJson: JSON.stringify([
        "performance",
        "cache",
        "lazy-load",
        "rendering",
      ]),
      organizerComment:
        "The winning teams showed strong performance thinking and clear technical storytelling.",
      raceEnd: new Date("2026-06-17T18:00:00+08:00"),
      raceStart: new Date("2026-06-16T09:00:00+08:00"),
      signupEnd: new Date("2026-06-15T22:00:00+08:00"),
      signupStart: new Date("2026-06-08T09:00:00+08:00"),
      status: "completed",
      submissionIntervalHours: 6,
      summary: "Finished performance race with published results and showcase data.",
      taskDescription: "Optimize a React storefront for load time, memory, and rendering smoothness.",
      taskPackageLabel: "perf-opt-v2.zip",
      title: "Performance Marathon",
      trainingDataSummary: "Baseline page metrics include FCP, memory use, and frame rate.",
    },
  });

  const raceMatrixDraft = await prisma.race.create({
    data: {
      ...raceBase,
      enableFreeze: false,
      evaluationNotes: "Draft-only sponsor rehearsal for organizer configuration and private screen preparation.",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: true,
      id: "race_matrix_draft",
      keywordsJson: JSON.stringify(["sponsor", "draft", "briefing", "sandbox"]),
      organizerComment: "Hold until sponsorship package and challenge brief are finalized.",
      raceEnd: addDays(now, 18),
      raceStart: addDays(now, 16),
      signupEnd: addDays(now, 15),
      signupStart: addDays(now, 10),
      status: "draft",
      submissionIntervalHours: 24,
      summary: "Matrix demo race for draft-only organizer rehearsal.",
      taskDescription: "Validate sponsor-facing challenge packaging before public release.",
      taskPackageLabel: "sponsor-sandbox-v1.zip",
      title: "[Matrix] Draft - Sponsor Sandbox",
      trackId: "circuit-track",
      trainingDataSummary: "Sample sponsor requirements and compliance prompts.",
    },
  });

  const raceMatrixPublished = await prisma.race.create({
    data: {
      ...raceBase,
      displayShowRiderCode: false,
      enableFreeze: false,
      evaluationNotes: "Published lobby race for public teaser and countdown-state demonstration.",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: false,
      id: "race_matrix_published",
      keywordsJson: JSON.stringify(["countdown", "published", "lobby", "teaser"]),
      organizerComment: "",
      raceEnd: addDays(now, 14),
      raceStart: addDays(now, 12),
      signupEnd: addDays(now, 11),
      signupStart: addDays(now, 7),
      status: "published",
      submissionIntervalHours: 12,
      summary: "Matrix demo race for the published-but-not-open state.",
      taskDescription: "Prepare a public challenge lobby with rules and teaser materials.",
      taskPackageLabel: "countdown-lobby-v1.zip",
      title: "[Matrix] Published - Countdown Lobby",
      trainingDataSummary: "",
    },
  });

  const raceMatrixSubmitting = await prisma.race.create({
    data: {
      ...raceBase,
      evaluationNotes: "Submission-stage drill for draft assets, runner tasks, and readiness prompts.",
      freezeMinutesBeforeEnd: 30,
      hasTrainingData: true,
      id: "race_matrix_submitting",
      keywordsJson: JSON.stringify(["submission", "artifact", "freeze", "runner"]),
      organizerComment: "Watch for missing artifacts and late-stage connector drift.",
      raceEnd: addDays(now, 2),
      raceStart: addDays(now, -1),
      signupEnd: addDays(now, -2),
      signupStart: addDays(now, -8),
      status: "submitting",
      submissionIntervalHours: 2,
      summary: "Matrix demo race centered on the submission stage.",
      taskDescription: "Ship a reproducible artifact package before the freeze window closes.",
      taskPackageLabel: "artifact-freeze-v1.zip",
      title: "[Matrix] Submitting - Artifact Freeze Drill",
      trackId: "circuit-track",
      trainingDataSummary: "Artifact manifests, replay logs, and verification fixtures.",
    },
  });

  const raceMatrixJudging = await prisma.race.create({
    data: {
      ...raceBase,
      evaluationNotes: "Judging-stage drill for assignments, feedback reply, draft reports, and award staging.",
      freezeMinutesBeforeEnd: 45,
      hasTrainingData: true,
      id: "race_matrix_judging",
      keywordsJson: JSON.stringify(["judging", "review", "awards", "reports"]),
      organizerComment: "Organizer should reconcile reviewer comments and publish final outputs.",
      organizerId: organizerStory.id,
      raceEnd: addDays(now, -1),
      raceStart: addDays(now, -4),
      signupEnd: addDays(now, -5),
      signupStart: addDays(now, -12),
      status: "judging",
      submissionIntervalHours: 3,
      summary: "Matrix demo race centered on the judging stage.",
      taskDescription: "Review multi-agent deliverables and prepare final awards and reports.",
      taskPackageLabel: "review-queue-v1.zip",
      title: "[Matrix] Judging - Review Queue Arena",
      trainingDataSummary: "Evaluation prompts and review reference bundles.",
    },
  });

  const raceMatrixArchived = await prisma.race.create({
    data: {
      ...raceBase,
      enableFreeze: true,
      evaluationNotes: "Archived showcase race for legacy navigation, results, and historical display.",
      freezeMinutesBeforeEnd: 60,
      hasTrainingData: true,
      id: "race_matrix_archived",
      keywordsJson: JSON.stringify(["archive", "history", "showcase", "legacy"]),
      organizerComment: "Archived after showcase handoff.",
      organizerId: organizerStory.id,
      raceEnd: addDays(now, -18),
      raceStart: addDays(now, -20),
      signupEnd: addDays(now, -21),
      signupStart: addDays(now, -28),
      status: "archived",
      submissionIntervalHours: 6,
      summary: "Matrix demo race for archived history and post-race browsing.",
      taskDescription: "Preserve a finished challenge as a reusable public showcase artifact.",
      taskPackageLabel: "legacy-vault-v1.zip",
      title: "[Matrix] Archived - Legacy Showcase Vault",
      trainingDataSummary: "Historical benchmark set and post-race notes.",
    },
  });

  const raceStoryRunning = await prisma.race.create({
    data: {
      ...raceBase,
      evaluationNotes: "Deep running-story demo with live CA signals, submissions, feedback, and screen coverage.",
      freezeMinutesBeforeEnd: 30,
      hasTrainingData: true,
      id: "race_story_running",
      keywordsJson: JSON.stringify(["warehouse", "copilot", "operations", "live"]),
      organizerComment: "Focus on multi-connector coordination and operator-facing visibility.",
      organizerId: organizerStory.id,
      raceEnd: addDays(now, 3),
      raceStart: addDays(now, -1),
      signupEnd: addDays(now, -2),
      signupStart: addDays(now, -9),
      status: "running",
      submissionIntervalHours: 2,
      summary: "Story demo race with a full live operational narrative.",
      taskDescription: "Build a warehouse operations copilot that can route incidents, inventory checks, and dock exceptions.",
      taskPackageLabel: "warehouse-copilot-v2.zip",
      title: "[Story] Running - Smart Warehouse Copilot",
      trackId: "circuit-track",
      trainingDataSummary: "Warehouse incident logs, SKU constraints, and route simulation fixtures.",
    },
  });

  const raceStoryCompleted = await prisma.race.create({
    data: {
      ...raceBase,
      enableFreeze: true,
      evaluationNotes: "Deep completed-story demo with works, judging, awards, reports, and profile evidence.",
      freezeMinutesBeforeEnd: 60,
      hasTrainingData: true,
      id: "race_story_completed",
      keywordsJson: JSON.stringify(["campus", "automation", "ops", "finals"]),
      organizerComment: "This race is used to demo post-race reports and public showcases.",
      organizerId: organizerStory.id,
      raceEnd: addDays(now, -6),
      raceStart: addDays(now, -9),
      signupEnd: addDays(now, -10),
      signupStart: addDays(now, -18),
      status: "completed",
      submissionIntervalHours: 4,
      summary: "Story demo race with a complete post-race asset chain.",
      taskDescription: "Automate student ops workflows across facilities requests, notices, and ticket handoffs.",
      taskPackageLabel: "campus-ops-finals-v2.zip",
      title: "[Story] Completed - Campus Ops Automation Finals",
      trainingDataSummary: "Campus operations logs, approval flows, and resolution transcripts.",
    },
  });

  // ── 报名中赛事（动态日期，始终在当前报名窗口内）──────────────────────────
  const raceRegistrationOpen = await prisma.race.create({
    data: {
      ...raceBase,
      displayShowRiderCode: false,
      displayShowTrainingData: false,
      enableFreeze: false,
      evaluationNotes: "Focus on natural language processing quality, context handling, and reasoning clarity.",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: true,
      id: "race_registration_open",
      keywordsJson: JSON.stringify(["nlp", "context", "reasoning", "summarization"]),
      organizerComment: "",
      raceEnd: addDays(now, 12),
      raceStart: addDays(now, 5),
      signupEnd: addDays(now, 4),
      signupStart: addDays(now, -3),
      status: "registration",
      submissionIntervalHours: 6,
      summary: "NLP 推理挑战赛 — 报名窗口已开启，欢迎报名参赛。",
      taskDescription: "实现一个文本摘要与关键信息抽取模块，支持长文本上下文处理与多粒度输出。",
      taskPackageLabel: "nlp-task-v1.zip",
      title: "📝 NLP 推理挑战赛",
      trainingDataSummary: "样例包含新闻、技术文档和对话记录，覆盖不同长度与领域。",
    },
  });
  // ── 报名中赛事结束 ────────────────────────────────────────────────────────

  // ── 操场椭圆赛道·个人进行中赛事 ──────────────────────────────────────────
  const raceActiveOval = await prisma.race.create({
    data: {
      ...raceBase,
      enableFreeze: false,
      evaluationNotes: "Evaluate path optimisation quality, graph reasoning, and edge case robustness.",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: true,
      id: "race_active_oval",
      keywordsJson: JSON.stringify(["graph", "pathfinding", "optimization", "routing"]),
      organizerComment: "",
      raceEnd: addDays(now, 4),
      raceStart: addDays(now, -2),
      signupEnd: addDays(now, -3),
      signupStart: addDays(now, -10),
      status: "running",
      submissionIntervalHours: 1,
      summary: "路径优化个人赛 — 6 名骑手在椭圆操场赛道上实时竞速。",
      taskDescription: "实现一个基于图结构的最短路径算法，支持边权变化与多约束条件。",
      taskPackageLabel: "path-opt-v1.zip",
      title: "🏇 路径优化挑战赛",
      trackId: "oval-track",
      trainingDataSummary: "示例图包含城市网格、稀疏树和稠密中心辐射网络。",
    },
  });

  // race_active_oval: 2 teams (3-member each with mixed PENDING/APPROVED)
  const ovalTeamDefs = [
    {
      teamName: "Pathfinders Alpha",
      score: 88.4, token: 1540, agent: "CLAUDE" as const, caType: "CLAUDE_CODE" as const,
      progress: 72, activity: "正在优化 Dijkstra 路径计算",
      leader: riders[0]!,
      mates: [
        { user: riders[1]!, role: "MATE" as const, status: "PENDING" as const },
        { user: riders[2]!, role: "MATE" as const, status: "APPROVED" as const },
      ],
    },
    {
      teamName: "Graph Explorers",
      score: 63.3, token: 2750, agent: "CLAUDE" as const, caType: "CLAUDE_CODE" as const,
      progress: 43, activity: "分析 token 消耗趋势",
      leader: riders[3]!,
      mates: [
        { user: riders[4]!, role: "MATE" as const, status: "PENDING" as const },
        { user: riders[5]!, role: "MATE" as const, status: "APPROVED" as const },
      ],
    },
  ];

  for (let i = 0; i < ovalTeamDefs.length; i++) {
    const def = ovalTeamDefs[i]!;
    const allMembers = [
      { user: def.leader, role: "LEADER" as const, status: "APPROVED" as const },
      ...def.mates,
    ];
    const team = await createMultiMemberTeam({
      raceId: raceActiveOval.id,
      teamName: def.teamName,
      members: allMembers,
    });

    // Leader Registration
    const registration = await prisma.registration.create({
      data: {
        approvedAt: addDays(now, -2),
        raceId: raceActiveOval.id,
        status: "APPROVED",
        teamId: team.id,
        userId: def.leader.id,
      },
    });
    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: i < 2 ? "ACTIVE" : "CONNECTED",
        githubRepoUrl: `https://github.com/demo/${def.leader.username}-oval`,
        registrationId: registration.id,
      },
    });

    // Mate Registrations
    for (const mate of def.mates) {
      const mateReg = await prisma.registration.create({
        data: {
          approvedAt: addDays(now, -2),
          raceId: raceActiveOval.id,
          status: mate.status === "PENDING" ? "SUBMITTED" : "APPROVED",
          teamId: team.id,
          userId: mate.user.id,
        },
      });
      await prisma.raceProject.create({
        data: {
          aggregateIngestionStatus: i < 2 ? "ACTIVE" : "CONNECTED",
          githubRepoUrl: `https://github.com/demo/${mate.user.username}-oval`,
          registrationId: mateReg.id,
        },
      });
    }

    const ovalConnection = await prisma.cAConnection.create({
      data: {
        caProjectId: `oval_project_${i}`,
        caType: def.caType,
        connectorBaseUrl: "https://connector.example/oval",
        connectorId: `oval_connector_${i}`,
        connectorSecret: `oval-secret-${i}`,
        connectorVersion: "0.2.0",
        handshakeCompletedAt: addDays(now, -2),
        ingestionSource: "CONNECTOR",
        ingestionStatus: i < 2 ? "ACTIVE" : "CONNECTED",
        lastSyncedAt: i < 2 ? addHours(now, -1) : null,
        raceProjectId: raceProject.id,
      },
    });

    await prisma.session.create({
      data: {
        caConnectionId: ovalConnection.id,
        caSessionId: `oval_session_${i}`,
        currentGoal: "Optimise pathfinding for edge-heavy graphs.",
        lastActiveAt: addHours(now, -1),
        latestActivity: def.activity,
        messageCount: 18 + i * 4,
        progressPercent: def.progress,
        riskLevel: i === 1 ? "medium" : "low",
        riskReason: i === 1 ? "token cost is approaching limit" : "none",
        startedAt: addDays(now, -2),
        taskStatus: "in_progress",
        tokenCost: def.token,
        toolCallCount: 5 + i,
      },
    });

    const ovalCodeContent = "export function solve(graph, start, end) { return dijkstra(graph, start, end); }";
    const ovalRidingRecord = "Analyse edge weights, test boundary inputs, verify path correctness.";
    const ovalSubId = `sub_oval_${i}`;
    const ovalArtifactId = `artifact_oval_${i}`;
    const ovalSubmitterBinding = buildSubmissionBindingJson({
      raceId: raceActiveOval.id,
      registrationId: registration.id,
      submittedAt: now,
      teamId: team.id,
      userId: def.leader.id,
    });

    await prisma.submission.create({
      data: {
        agentType: def.agent,
        codeContent: ovalCodeContent,
        codeLabel: "solution.ts",
        id: ovalSubId,
        raceId: raceActiveOval.id,
        registrationId: registration.id,
        status: "SCORED",
        teamId: team.id,
        tokenUsed: def.token,
      },
    });

    await prisma.submissionArtifact.create({
      data: {
        agentType: def.agent,
        codeContent: ovalCodeContent,
        codeContentHash: buildPayloadDigest(ovalCodeContent),
        codeLabel: "solution.ts",
        id: ovalArtifactId,
        raceId: raceActiveOval.id,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord: ovalRidingRecord,
        ridingRecordHash: buildPayloadDigest(ovalRidingRecord),
        submissionId: ovalSubId,
        submitterBindingJson: ovalSubmitterBinding,
        teamId: team.id,
        tokenUsed: def.token,
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        agentType: def.agent,
        dialogueScore: Math.round(def.score * 0.85 * 10) / 10,
        progress: Math.max(0.12, def.score / 88.4),
        raceId: raceActiveOval.id,
        registrationId: registration.id,
        submissionId: ovalSubId,
        taskScore: Math.round(def.score * 0.9 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - def.token / 60) * 10) / 10,
        totalScore: def.score,
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: def.agent,
        antiCheatPenalty: 0,
        codeContent: ovalCodeContent,
        codeContentHash: buildPayloadDigest(ovalCodeContent),
        codeLabel: "solution.ts",
        dialogueScore: Math.round(def.score * 0.85 * 10) / 10,
        progress: Math.max(0.12, def.score / 88.4),
        raceId: raceActiveOval.id,
        reasoningScore: Math.round(def.score * 0.88 * 10) / 10,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord: ovalRidingRecord,
        ridingRecordHash: buildPayloadDigest(ovalRidingRecord),
        submissionId: ovalSubId,
        submitterBindingJson: ovalSubmitterBinding,
        taskScore: Math.round(def.score * 0.9 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - def.token / 60) * 10) / 10,
        tokenUsed: def.token,
        totalScore: def.score,
      },
    });
  }
  // ── 操场椭圆赛道赛事结束 ──────────────────────────────────────────────────

  // race_active: 3 teams (2 multi-member with PENDING/APPROVED mates + 1 single-member)
  const activeTeamDefs = [
    {
      teamName: "Fast Sort Squad",
      score: 92.5, token: 1320, agent: "CLAUDE" as const,
      leader: riders[0]!,
      mates: [
        { user: riders[1]!, role: "MATE" as const, status: "PENDING" as const },
        { user: riders[2]!, role: "MATE" as const, status: "APPROVED" as const },
      ],
    },
    {
      teamName: "Milk Tea Coder",
      score: 87.3, token: 2150, agent: "OPENAI" as const,
      leader: riders[3]!,
      mates: [
        { user: riders[4]!, role: "MATE" as const, status: "PENDING" as const },
      ],
    },
    {
      teamName: "Bug Crusher",
      score: 81.0, token: 1800, agent: "COPILOT" as const,
      leader: riders[5]!,
      mates: [],
    },
  ];

  for (let i = 0; i < activeTeamDefs.length; i++) {
    const def = activeTeamDefs[i]!;
    const submissionId = `sub_active_${i}`;
    const artifactId = `artifact_active_${i}`;
    const activeCodeContent = "export function solve(input) { return [...input].sort((a, b) => a - b); }";
    const activeRidingRecord = "Clarify constraints, validate edge cases, then verify final sorting behavior.";

    // 创建 Team 及所有成员
    const allMembers = [
      { user: def.leader, role: "LEADER" as const, status: "APPROVED" as const },
      ...def.mates,
    ];
    const team = await createMultiMemberTeam({
      raceId: raceActive.id,
      teamName: def.teamName,
      members: allMembers,
    });

    // 为 Leader 创建 Registration + RaceProject + Connection
    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-06-18T08:05:00+08:00"),
        raceId: raceActive.id,
        status: "APPROVED",
        teamId: team.id,
        userId: def.leader.id,
      },
    });

    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: i < 2 ? "ACTIVE" : "CONNECTED",
        githubRepoUrl: `https://github.com/demo/${def.leader.username}-${raceActive.id}`,
        registrationId: registration.id,
      },
    });

    // 为 Mates 创建 Registration + RaceProject
    for (const mate of def.mates) {
      const mateReg = await prisma.registration.create({
        data: {
          approvedAt: new Date("2026-06-18T08:05:00+08:00"),
          raceId: raceActive.id,
          status: mate.status === "PENDING" ? "SUBMITTED" : "APPROVED",
          teamId: team.id,
          userId: mate.user.id,
        },
      });
      await prisma.raceProject.create({
        data: {
          aggregateIngestionStatus: i < 2 ? "ACTIVE" : "CONNECTED",
          githubRepoUrl: `https://github.com/demo/${mate.user.username}-${raceActive.id}`,
          registrationId: mateReg.id,
        },
      });
    }

    const activeSubmitterBindingJson = buildSubmissionBindingJson({
      raceId: raceActive.id,
      registrationId: registration.id,
      submittedAt: new Date(),
      teamId: team.id,
      userId: def.leader.id,
    });

    const primaryConnection = await prisma.cAConnection.create({
      data: {
        caProjectId: `codex_project_active_${i}`,
        caType: "CODEX",
        connectorBaseUrl: "https://connector.example/active",
        connectorId: `codex_connector_active_${i}`,
        connectorSecret: `active-secret-${i}`,
        connectorVersion: "0.1.0",
        handshakeCompletedAt: new Date("2026-06-18T08:10:00+08:00"),
        ingestionSource: "CONNECTOR",
        ingestionStatus: i < 2 ? "ACTIVE" : "CONNECTED",
        lastSyncedAt: i < 2 ? new Date("2026-06-19T10:00:00+08:00") : null,
        raceProjectId: raceProject.id,
      },
    });

    if (i < 2) {
      await prisma.session.create({
        data: {
          caConnectionId: primaryConnection.id,
          caSessionId: `codex_session_active_${i}`,
          currentGoal: "Keep sorting implementation moving forward.",
          endedAt: null,
          lastActiveAt: new Date("2026-06-19T10:00:00+08:00"),
          latestActivity: `${def.leader.username} is pushing the active race implementation forward.`,
          messageCount: 42 + i * 3,
          progressPercent: 90 - i * 18,
          riskLevel: i === 2 ? "medium" : "low",
          riskReason: i === 2 ? "One active blocker remains." : "none",
          startedAt: new Date("2026-06-19T09:00:00+08:00"),
          taskStatus: "in_progress",
          tokenCost: def.token,
          toolCallCount: 8 + i,
        },
      });
    }

    // Per-team 数据：仅 Leader 时创建
    await prisma.submission.create({
      data: {
        agentType: def.agent,
        codeContent: "export function solve(input) { return [...input].sort((a, b) => a - b); }",
        codeLabel: "solution.ts",
        id: submissionId,
        raceId: raceActive.id,
        status: "QUEUED",
        teamId: team.id,
        tokenUsed: def.token,
      },
    });

    await prisma.submissionArtifact.create({
      data: {
        agentType: def.agent,
        codeContent: "export function solve(input) { return [...input].sort((a, b) => a - b); }",
        codeLabel: "solution.ts",
        id: artifactId,
        raceId: raceActive.id,
        recordLabel: "riding-record.txt",
        ridingRecord: "Clarify constraints, validate edge cases, then verify final sorting behavior.",
        submissionId,
        teamId: team.id,
        tokenUsed: def.token,
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: def.agent,
        antiCheatPenalty: i === 1 ? 10 : 0,
        codeContent: activeCodeContent,
        codeContentHash: buildPayloadDigest(activeCodeContent),
        codeLabel: "solution.ts",
        dialogueScore: Math.round(def.score * 0.85 * 10) / 10,
        keywordScore: Math.round(def.score * 0.8 * 10) / 10,
        progress: Math.max(0.12, def.score / 92.5),
        raceId: raceActive.id,
        registrationId: registration.id,
        reasoningScore: Math.round(def.score * 0.88 * 10) / 10,
        recordLabel: "riding-record.txt",
        ridingRecord: activeRidingRecord,
        ridingRecordHash: buildPayloadDigest(activeRidingRecord),
        submissionId,
        submitterBindingJson: activeSubmitterBindingJson,
        taskScore: Math.round(def.score * 0.9 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - def.token / 60) * 10) / 10,
        tokenUsed: def.token,
        totalScore: def.score,
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        agentType: def.agent,
        dialogueScore: Math.round(def.score * 0.85 * 10) / 10,
        progress: Math.max(0.12, def.score / 92.5),
        raceId: raceActive.id,
        registrationId: registration.id,
        submissionId,
        taskScore: Math.round(def.score * 0.9 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - def.token / 60) * 10) / 10,
        totalScore: def.score,
      },
    });

    await prisma.runnerTask.create({
      data: {
        artifactId,
        raceId: raceActive.id,
        registrationId: registration.id,
        resultHash: "",
        runnerComment: "",
        status: "QUEUED",
        submissionId,
        taskType: "PROGRESS_EVAL",
        teamId: team.id,
      },
    });
  }

  await prisma.notification.create({
    data: {
      content: "Sorting Challenge is live. Teams should submit current progress for evaluation.",
      raceId: raceActive.id,
      target: "ALL",
      title: "Race Active",
    },
  });

  const signupTeamNames = ["Interface Artist", "REST Master", "API Builder"];
  for (let i = 0; i < 3; i++) {
    await prisma.registration.create({
      data: {
        raceId: raceSignup.id,
        status: "SUBMITTED",
        userId: riders[i + 8].id,
      },
    });

    await prisma.team.create({
      data: {
        id: `team_signup_${i}`,
        captainId: riders[i + 8].id,
        members: {
          create: [{ displayName: riders[i + 8].username, userId: riders[i + 8].id }],
        },
        name: signupTeamNames[i],
        raceId: raceSignup.id,
      },
    });
  }

  // race_finished: 2 teams (3-member each with mixed PENDING/APPROVED)
  const finishedTeamDefs = [
    {
      teamName: "Render Rocket",
      score: 94.1, token: 2100, agent: "CLAUDE" as const,
      leader: riders[0]!,
      mates: [
        { user: riders[1]!, role: "MATE" as const, status: "PENDING" as const },
        { user: riders[2]!, role: "MATE" as const, status: "APPROVED" as const },
      ],
    },
    {
      teamName: "Memory Tuner",
      score: 89.7, token: 3400, agent: "OPENAI" as const,
      leader: riders[3]!,
      mates: [
        { user: riders[4]!, role: "MATE" as const, status: "PENDING" as const },
        { user: riders[5]!, role: "MATE" as const, status: "APPROVED" as const },
      ],
    },
  ];

  const finishedResultBridge: Array<{
    registrationId: string;
    reportTitle: string;
    teamName: string;
    workId: string;
  }> = [];

  for (let i = 0; i < finishedTeamDefs.length; i++) {
    const def = finishedTeamDefs[i]!;
    const submissionId = `sub_finished_${i}`;
    const finishedCodeContent = "// optimized storefront implementation";
    const finishedRidingRecord = "Start from diagnostics, then improve loading strategy and rendering stability.";

    const allMembers = [
      { user: def.leader, role: "LEADER" as const, status: "APPROVED" as const },
      ...def.mates,
    ];
    const team = await createMultiMemberTeam({
      raceId: raceFinished.id,
      teamName: def.teamName,
      members: allMembers,
    });

    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-06-15T12:00:00+08:00"),
        raceId: raceFinished.id,
        status: "APPROVED",
        teamId: team.id,
        userId: def.leader.id,
      },
    });
    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: "ACTIVE",
        githubRepoUrl: `https://github.com/demo/${def.leader.username}-${raceFinished.id}`,
        registrationId: registration.id,
      },
    });

    for (const mate of def.mates) {
      const mateReg = await prisma.registration.create({
        data: {
          approvedAt: new Date("2026-06-15T12:00:00+08:00"),
          raceId: raceFinished.id,
          status: mate.status === "PENDING" ? "SUBMITTED" : "APPROVED",
          teamId: team.id,
          userId: mate.user.id,
        },
      });
      await prisma.raceProject.create({
        data: {
          aggregateIngestionStatus: "ACTIVE",
          githubRepoUrl: `https://github.com/demo/${mate.user.username}-${raceFinished.id}`,
          registrationId: mateReg.id,
        },
      });
    }

    const finishedSubmitterBindingJson = buildSubmissionBindingJson({
      raceId: raceFinished.id,
      registrationId: registration.id,
      submittedAt: new Date(),
      teamId: team.id,
      userId: def.leader.id,
    });

    const connection = await prisma.cAConnection.create({
      data: {
        caProjectId: `codex_project_finished_${i}`,
        caType: i % 2 === 0 ? "CODEX" : "CLAUDE_CODE",
        connectorBaseUrl: "https://connector.example/finished",
        connectorId: `finished_connector_${i}`,
        connectorSecret: `finished-secret-${i}`,
        connectorVersion: "0.1.0",
        handshakeCompletedAt: new Date("2026-06-15T12:10:00+08:00"),
        ingestionSource: "CONNECTOR",
        ingestionStatus: "ACTIVE",
        lastSyncedAt: new Date("2026-06-17T18:00:00+08:00"),
        raceProjectId: raceProject.id,
      },
    });

    await prisma.session.create({
      data: {
        allRidingMessageLength: 120000 + i * 100,
        caConnectionId: connection.id,
        caSessionId: `finished_session_${i}`,
        currentGoal: "Finalize performance optimization and report.",
        endedAt: new Date("2026-06-17T17:30:00+08:00"),
        lastActiveAt: new Date("2026-06-17T17:30:00+08:00"),
        latestActivity: `${def.teamName} finished the performance run and captured the final summary.`,
        messageCount: 30 + i * 2,
        progressPercent: 100,
        riskLevel: "low",
        riskReason: "completed",
        startedAt: new Date("2026-06-17T15:00:00+08:00"),
        taskStatus: "completed",
        tokenCost: def.token,
        toolCallCount: 6 + i,
      },
    });

    const work = await prisma.work.create({
      data: buildWorkSeedRecord({
        archiveCode: "// optimized storefront implementation",
        demoUrl: `https://demo.example/${raceFinished.id}/work-${i}`,
        excerpt: `${def.teamName} improved rendering and explained the tradeoffs clearly.`,
        raceId: raceFinished.id,
        registrationId: registration.id,
        repoUrl: raceProject!.githubRepoUrl,
        teamId: team.id,
        teamName: def.teamName,
        videoUrl: `https://video.example/${raceFinished.id}/work-${i}`,
      }),
    });

    const judgeAssignment = await prisma.judgeAssignment.create({
      data: {
        assignedByUserId: organizer.id,
        judgeId: judge.id,
        workId: work.id,
      },
    });

    await prisma.judgingRecord.create({
      data: {
        comments: `Judge summary for ${def.teamName}.`,
        judgeAssignmentId: judgeAssignment.id,
        scoreResultJson: JSON.stringify({
          overall: def.score,
          presentation: Math.round(def.score * 0.9 * 10) / 10,
        }),
        scoreRidingJson: JSON.stringify({
          costControl: Math.round((100 - def.token / 100) * 10) / 10,
          riding: Math.round(def.score * 0.92 * 10) / 10,
        }),
        submittedAt: new Date("2026-06-18T10:00:00+08:00"),
      },
    });

    await prisma.evidence.create({
      data: {
        registrationId: registration.id,
        sourceRefJson: JSON.stringify({ workId: work.id }),
        summary: `${def.teamName} work asset and public summary.`,
        title: `${def.teamName} Work`,
        type: "WORK",
        visibility: "PUBLIC",
      },
    });

    await prisma.report.create({
      data: buildRiderReportSeed({
        body: `Rider report for ${def.teamName}.`,
        raceId: raceFinished.id,
        subjectRegistrationId: registration.id,
        summary: `${def.teamName} rider report summary.`,
        title: `${def.teamName} Rider Report`,
      }),
    });

    finishedResultBridge.push({
      registrationId: registration.id,
      reportTitle: `${def.teamName} Rider Report`,
      teamName: def.teamName,
      workId: work.id,
    });

    await prisma.submission.create({
      data: {
        agentType: def.agent,
        codeContent: "// optimized storefront implementation",
        codeLabel: "optimized.tsx",
        id: submissionId,
        raceId: raceFinished.id,
        recordLabel: "riding-record.txt",
        ridingRecord: "Start from diagnostics, then improve loading strategy and rendering stability.",
        status: "QUEUED",
        teamId: team.id,
        tokenUsed: def.token,
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: def.agent,
        antiCheatPenalty: 0,
        codeContent: finishedCodeContent,
        codeContentHash: buildPayloadDigest(finishedCodeContent),
        codeLabel: "optimized.tsx",
        dialogueScore: Math.round(def.score * 0.9 * 10) / 10,
        keywordScore: Math.round(def.score * 0.88 * 10) / 10,
        progress: Math.max(0.3, def.score / 94.1),
        raceId: raceFinished.id,
        registrationId: registration.id,
        reasoningScore: Math.round(def.score * 0.85 * 10) / 10,
        recordLabel: "riding-record.txt",
        ridingRecord: finishedRidingRecord,
        ridingRecordHash: buildPayloadDigest(finishedRidingRecord),
        submissionId,
        submitterBindingJson: finishedSubmitterBindingJson,
        taskScore: Math.round(def.score * 0.92 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - def.token / 100) * 10) / 10,
        tokenUsed: def.token,
        totalScore: def.score,
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        agentType: def.agent,
        dialogueScore: Math.round(def.score * 0.9 * 10) / 10,
        progress: Math.max(0.3, def.score / 94.1),
        raceId: raceFinished.id,
        registrationId: registration.id,
        submissionId,
        taskScore: Math.round(def.score * 0.92 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - def.token / 100) * 10) / 10,
        totalScore: def.score,
      },
    });

    await prisma.harnessEntry.create({
      data: {
        harnessScore: def.score,
        keywordScore: Math.round(def.score * 0.82 * 10) / 10,
        raceId: raceFinished.id,
        registrationId: registration.id,
        reasoningScore: Math.round(def.score * 0.87 * 10) / 10,
        teamId: team.id,
      },
    });

    await prisma.teamComment.create({
      data: {
        content: `Review summary for ${def.teamName}.`,
        raceId: raceFinished.id,
        teamId: team.id,
      },
    });

    await prisma.ridingHighlight.create({
      data: {
        agentType: def.agent,
        codeSnippet: `// ${def.teamName}\nconst MemoizedList = React.memo(VirtualList);`,
        excerpt: `${def.teamName} improved rendering strategy and explained the tradeoffs clearly.`,
        raceId: raceFinished.id,
        score: def.score,
        teamId: team.id,
      },
    });
  }

  const workIdByRegistrationId = Object.fromEntries(
    finishedResultBridge.map((item) => [item.registrationId, item.workId]),
  );
  const awardSeeds = buildAwardSeedRecords({
    bestWorkRegistrationId: finishedResultBridge[1]!.registrationId,
    overallRegistrationId: finishedResultBridge[0]!.registrationId,
    raceId: raceFinished.id,
    ridingRegistrationId: finishedResultBridge[1]!.registrationId,
    workIdByRegistrationId,
  });

  for (const award of [
    ...awardSeeds,
    {
      awardName: "Best Cost Control",
      decisionReason: "Strongest cost efficiency among finished riders.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: raceFinished.id,
      rank: 1,
      registrationId: finishedResultBridge[0]!.registrationId,
      workId: workIdByRegistrationId[finishedResultBridge[0]!.registrationId],
    },
    {
      awardName: "Best Retrospective",
      decisionReason: "Strongest post-race summary and explanation quality.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: raceFinished.id,
      rank: 1,
      registrationId: finishedResultBridge[1]!.registrationId,
      workId: workIdByRegistrationId[finishedResultBridge[1]!.registrationId],
    },
  ]) {
    await prisma.award.create({ data: award });
  }

  await prisma.report.create({
    data: {
      body: "Published race report body.",
      raceId: raceFinished.id,
      status: "PUBLISHED",
      summary: "Published race report summary.",
      title: "Performance Marathon Race Report",
      type: "RACE_REPORT",
    },
  });

  await prisma.report.create({
    data: buildReviewSummaryReportSeed({
      body: "Published review summary body.",
      raceId: raceFinished.id,
      summary: "Published review summary.",
      title: "Performance Marathon Review Summary",
    }),
  });

  await prisma.notification.create({
    data: {
      content: "Performance Marathon has finished and results are published.",
      raceId: raceFinished.id,
      target: "ALL",
      title: "Race Finished",
    },
  });

  await prisma.screenDisplay.create({
    data: {
      mode: "ANNOUNCEMENT",
      raceId: raceMatrixDraft.id,
      theme: "matrix-draft",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "Private sponsor rehearsal draft. Keep this race hidden until the brief is approved.",
      raceId: raceMatrixDraft.id,
      title: "Sponsor Sandbox Draft",
      visibility: "PRIVATE",
    },
  });

  await prisma.screenDisplay.create({
    data: {
      mode: "BILLBOARD",
      raceId: raceMatrixPublished.id,
      theme: "matrix-countdown",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "This published lobby is visible to the public, but registration opens later.",
      publishedAt: addHours(now, -6),
      raceId: raceMatrixPublished.id,
      title: "Countdown Lobby Live",
      visibility: "PUBLIC",
    },
  });
  await prisma.notification.create({
    data: {
      content: "Countdown Lobby is published. Registration opens next week.",
      raceId: raceMatrixPublished.id,
      target: "ALL",
      title: "Published Lobby",
    },
  });

  await prisma.screenDisplay.create({
    data: {
      mode: "WORKS",
      raceId: raceMatrixSubmitting.id,
      theme: "matrix-submitting",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "Final artifact checks are open. Teams should verify manifests and runner compatibility.",
      publishedAt: addHours(now, -2),
      raceId: raceMatrixSubmitting.id,
      title: "Artifact Freeze Notice",
      visibility: "PUBLIC",
    },
  });
  await prisma.notification.create({
    data: {
      content: "Artifact Freeze Drill is in the submitting stage. Final checks are active.",
      raceId: raceMatrixSubmitting.id,
      target: "ALL",
      title: "Submitting Stage",
    },
  });

  const matrixSubmittingConfigs = [
    {
      agentType: "OPENAI" as const,
      score: 84.2,
      teamName: "Submission Relay",
      tokenUsed: 1880,
      user: riders[5]!,
      workStatus: "DRAFT" as const,
      workVisibility: "INTERNAL" as const,
    },
    {
      agentType: "CLAUDE" as const,
      score: 79.4,
      teamName: "Manifest Watch",
      tokenUsed: 2360,
      user: riders[6]!,
      workStatus: "SUBMITTED" as const,
      workVisibility: "PRIVATE" as const,
    },
    {
      agentType: "COPILOT" as const,
      score: 70.1,
      teamName: "Freeze Buffer",
      tokenUsed: 3210,
      user: riders[7]!,
      workStatus: "HIDDEN" as const,
      workVisibility: "PRIVATE" as const,
    },
  ];

  for (const [index, config] of matrixSubmittingConfigs.entries()) {
    const submissionId = `sub_matrix_submitting_${index}`;
    const artifactId = `artifact_matrix_submitting_${index}`;
    const codeContent = `export async function deliverArtifact${index}(input) { return { input, verified: true }; }`;
    const ridingRecord = "Verify the artifact manifest, check runner compatibility, and package the final submission.";
    const { registration, raceProject, team } = await createTeamRegistrationBundle({
      aggregateIngestionStatus: index === 2 ? "CONNECTED" : "ACTIVE",
      approvedAt: addDays(now, -3),
      raceId: raceMatrixSubmitting.id,
      teamName: config.teamName,
      user: config.user,
    });

    await createConnectionWithOptionalSession({
      caProjectId: `matrix_submitting_project_${index}`,
      caType: index === 1 ? "CLAUDE_CODE" : "CODEX",
      connectorBaseUrl: "https://connector.example/submitting",
      connectorId: `matrix_submitting_connector_${index}`,
      connectorSecret: `matrix-submitting-secret-${index}`,
      ingestionStatus: index === 2 ? "CONNECTED" : "ACTIVE",
      latestActivity: `${config.teamName} is finalizing the artifact bundle.`,
      progressPercent: 68 + index * 10,
      raceProjectId: raceProject!.id,
      sessionId: index === 2 ? undefined : `matrix_submitting_session_${index}`,
      startedAt: addDays(now, -1),
      taskStatus: "in_progress",
      tokenCost: config.tokenUsed,
    });

    const workSeed = buildWorkSeedRecord({
      archiveCode: codeContent,
      demoUrl: `https://demo.example/${raceMatrixSubmitting.id}/artifact-${index}`,
      excerpt: `${config.teamName} is packaging its latest artifact candidate.`,
      raceId: raceMatrixSubmitting.id,
      registrationId: registration.id,
      repoUrl: raceProject!.githubRepoUrl,
      teamId: team.id,
      teamName: `${config.teamName} Artifact`,
      videoUrl: `https://video.example/${raceMatrixSubmitting.id}/artifact-${index}`,
    });

    await prisma.work.create({
      data: {
        ...workSeed,
        status: config.workStatus,
        summary: `${config.teamName} submission-stage artifact candidate.`,
        title: `${config.teamName} Artifact Candidate`,
        visibility: config.workVisibility,
      },
    });

    await prisma.submission.create({
      data: {
        agentType: config.agentType,
        codeContent,
        codeContentHash: buildPayloadDigest(codeContent),
        codeLabel: "artifact.ts",
        id: submissionId,
        raceId: raceMatrixSubmitting.id,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord,
        ridingRecordHash: buildPayloadDigest(ridingRecord),
        status: index === 1 ? "PULLED" : index === 2 ? "FAILED" : "QUEUED",
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceMatrixSubmitting.id,
          registrationId: registration.id,
          submittedAt: now,
          teamId: team.id,
      userId: config.user.id,
        }),
        teamId: team.id,
        tokenUsed: config.tokenUsed,
      },
    });

    await prisma.submissionArtifact.create({
      data: {
        agentType: config.agentType,
        codeContent,
        codeContentHash: buildPayloadDigest(codeContent),
        codeLabel: "artifact.ts",
        id: artifactId,
        raceId: raceMatrixSubmitting.id,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord,
        ridingRecordHash: buildPayloadDigest(ridingRecord),
        submissionId,
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceMatrixSubmitting.id,
          registrationId: registration.id,
          submittedAt: now,
          teamId: team.id,
      userId: config.user.id,
        }),
        teamId: team.id,
        tokenUsed: config.tokenUsed,
      },
    });

    await prisma.runnerTask.create({
      data: {
        artifactId,
        raceId: raceMatrixSubmitting.id,
        registrationId: registration.id,
        resultHash: index === 1 ? "matrix-submitting-result-hash" : "",
        runnerComment:
          index === 2
            ? "Artifact manifest is missing the environment descriptor."
            : "Runner task is ready for the next verification step.",
        status: index === 2 ? "FAILED" : index === 1 ? "CLAIMED" : "QUEUED",
        submissionId,
        taskType: index === 1 ? "HARNESS_EVAL" : "PROGRESS_EVAL",
        teamId: team.id,
      },
    });

    if (index < 2) {
      await prisma.teamArchive.create({
        data: {
          agentType: config.agentType,
          antiCheatPenalty: 0,
          codeContent,
          codeContentHash: buildPayloadDigest(codeContent),
          codeLabel: "artifact.ts",
          dialogueScore: config.score - 6,
          keywordScore: config.score - 9,
          progress: 0.62 + index * 0.1,
          raceId: raceMatrixSubmitting.id,
          registrationId: registration.id,
          reasoningScore: config.score - 4,
          recordLabel: "riding-record.txt",
          ridingRecord,
          ridingRecordHash: buildPayloadDigest(ridingRecord),
          submissionId,
          submitterBindingJson: buildSubmissionBindingJson({
            raceId: raceMatrixSubmitting.id,
            registrationId: registration.id,
            submittedAt: now,
            teamId: team.id,
      userId: config.user.id,
          }),
          taskScore: config.score - 3,
          teamId: team.id,
          tokenScore: 70 - index * 4,
          tokenUsed: config.tokenUsed,
          totalScore: config.score,
        },
      });
      await prisma.leaderboardEntry.create({
        data: {
          agentType: config.agentType,
          dialogueScore: config.score - 6,
          progress: 0.62 + index * 0.1,
          raceId: raceMatrixSubmitting.id,
          registrationId: registration.id,
          submissionId,
          taskScore: config.score - 3,
          teamId: team.id,
          tokenScore: 70 - index * 4,
          totalScore: config.score,
        },
      });
    }
  }

  await prisma.screenDisplay.create({
    data: {
      mode: "LEADERBOARD",
      raceId: raceMatrixJudging.id,
      theme: "matrix-judging",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "Organizer is reviewing judge comments before final publication.",
      raceId: raceMatrixJudging.id,
      title: "Review Queue In Progress",
      visibility: "PRIVATE",
    },
  });
  await prisma.notification.create({
    data: {
      content: "Review Queue Arena is in judging. Judges should finalize comments.",
      raceId: raceMatrixJudging.id,
      target: "ALL",
      title: "Judging Stage",
    },
  });

  const matrixJudgingConfigs = [
    {
      agentType: "OPENAI" as const,
      judgeUser: judge,
      score: 91.2,
      teamName: "Review Prism",
      tokenUsed: 2400,
      user: riders[8]!,
    },
    {
      agentType: "CLAUDE" as const,
      judgeUser: judgeStory,
      score: 86.4,
      teamName: "Queue Tactician",
      tokenUsed: 2780,
      user: riders[9]!,
    },
    {
      agentType: "COPILOT" as const,
      judgeUser: judgeStory,
      score: 79.8,
      teamName: "Score Ledger",
      tokenUsed: 3010,
      user: riders[10]!,
    },
  ];

  const matrixJudgingBundles: Array<{
    registrationId: string;
    teamId: string;
    workId: string;
  }> = [];

  for (const [index, config] of matrixJudgingConfigs.entries()) {
    const { registration, raceProject, team } = await createTeamRegistrationBundle({
      aggregateIngestionStatus: index === 2 ? "FAILED" : "ACTIVE",
      approvedAt: addDays(now, -8),
      raceId: raceMatrixJudging.id,
      teamName: config.teamName,
      user: config.user,
    });

    await createConnectionWithOptionalSession({
      caProjectId: `matrix_judging_project_${index}`,
      caType: index === 1 ? "CLAUDE_CODE" : "CODEX",
      connectorBaseUrl: "https://connector.example/judging",
      connectorId: `matrix_judging_connector_${index}`,
      connectorSecret: `matrix-judging-secret-${index}`,
      ingestionStatus: index === 2 ? "FAILED" : "ACTIVE",
      latestActivity: `${config.teamName} has entered the review queue.`,
      progressPercent: 100,
      raceProjectId: raceProject!.id,
      riskLevel: index === 2 ? "medium" : "low",
      riskReason: index === 2 ? "Connector evidence needs manual review." : "completed",
      sessionId: `matrix_judging_session_${index}`,
      startedAt: addDays(now, -5),
      taskStatus: "completed",
      tokenCost: config.tokenUsed,
    });

    const work = await prisma.work.create({
      data: {
        ...buildWorkSeedRecord({
          archiveCode: `// ${config.teamName}\nexport const judged = true;`,
          demoUrl: `https://demo.example/${raceMatrixJudging.id}/review-${index}`,
          excerpt: `${config.teamName} is waiting for final judging decisions.`,
          raceId: raceMatrixJudging.id,
          registrationId: registration.id,
          repoUrl: raceProject!.githubRepoUrl,
          teamId: team.id,
          teamName: config.teamName,
          videoUrl: `https://video.example/${raceMatrixJudging.id}/review-${index}`,
        }),
        visibility: index === 2 ? "INTERNAL" : "PUBLIC",
      },
    });

    const judgeAssignment = await prisma.judgeAssignment.create({
      data: {
        assignedByUserId: organizerStory.id,
        judgeId: config.judgeUser.id,
        workId: work.id,
      },
    });

    if (index < 2) {
      await prisma.judgingRecord.create({
        data: {
          comments: `Judging note for ${config.teamName}.`,
          judgeAssignmentId: judgeAssignment.id,
          scoreResultJson: JSON.stringify({
            overall: config.score,
            presentation: config.score - 4,
          }),
          scoreRidingJson: JSON.stringify({
            collaboration: config.score - 3,
            process: config.score - 2,
          }),
          submittedAt: addDays(now, -1),
        },
      });
    }

    await prisma.teamComment.create({
      data: {
        content: `${config.teamName} is waiting for final organizer review.`,
        raceId: raceMatrixJudging.id,
        registrationId: registration.id,
        teamId: team.id,
      },
    });

    matrixJudgingBundles.push({
      registrationId: registration.id,
      teamId: team.id,
      workId: work.id,
    });
  }

  const judgingThread = await prisma.feedbackThread.create({
    data: {
      raceId: raceMatrixJudging.id,
      registrationId: matrixJudgingBundles[0]!.registrationId,
      teamId: matrixJudgingBundles[0]!.teamId,
    },
  });
  await prisma.feedbackMessage.createMany({
    data: [
      {
        authorId: riders[8]!.id,
        content: "We clarified the evidence package and want to confirm the final judging basis.",
        threadId: judgingThread.id,
      },
      {
        authorId: organizerStory.id,
        content: "The team comment has been updated. Judges will review the refreshed evidence bundle.",
        threadId: judgingThread.id,
      },
    ],
  });

  await prisma.award.createMany({
    data: [
      {
        awardName: "Best Review Candidate",
        decisionReason: "Pending final judge confirmation.",
        raceId: raceMatrixJudging.id,
        rank: 1,
        registrationId: matrixJudgingBundles[0]!.registrationId,
        workId: matrixJudgingBundles[0]!.workId,
      },
      {
        awardName: "Most Explainable Delivery",
        decisionReason: "Organizer draft only. Not yet published.",
        raceId: raceMatrixJudging.id,
        rank: 1,
        registrationId: matrixJudgingBundles[1]!.registrationId,
        workId: matrixJudgingBundles[1]!.workId,
      },
    ],
  });
  await prisma.report.createMany({
    data: [
      {
        body: "Draft judging report for Review Queue Arena.",
        raceId: raceMatrixJudging.id,
        status: "DRAFT",
        summary: "Draft report waiting for organizer review.",
        title: "Review Queue Arena Draft Report",
        type: "RACE_REPORT",
      },
      {
        body: "Generated rider report waiting for manual review.",
        raceId: raceMatrixJudging.id,
        status: "GENERATED",
        subjectRegistrationId: matrixJudgingBundles[0]!.registrationId,
        summary: "Generated review summary for the lead review candidate.",
        title: "Review Prism Rider Report",
        type: "RIDER_REPORT",
      },
      {
        body: "Reviewed summary awaiting publication.",
        raceId: raceMatrixJudging.id,
        status: "REVIEWED",
        summary: "Review summary is reviewed but not yet published.",
        title: "Review Queue Arena Summary",
        type: "REVIEW_SUMMARY",
      },
    ],
  });

  await prisma.screenDisplay.create({
    data: {
      mode: "ANNOUNCEMENT",
      raceId: raceMatrixArchived.id,
      theme: "matrix-archive",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "Legacy Showcase Vault is archived and kept available for historical browsing.",
      publishedAt: addDays(now, -12),
      raceId: raceMatrixArchived.id,
      title: "Legacy Vault Archived",
      visibility: "PUBLIC",
    },
  });
  await prisma.notification.create({
    data: {
      content: "Legacy Showcase Vault is archived and available for results and works review.",
      raceId: raceMatrixArchived.id,
      target: "ALL",
      title: "Archived Stage",
    },
  });

  const matrixArchivedConfigs = [
    {
      teamName: "Archive Relay",
      tokenUsed: 2100,
      user: riders[3]!,
    },
    {
      teamName: "History Buffer",
      tokenUsed: 2440,
      user: riders[4]!,
    },
  ];
  const matrixArchivedBridge: Array<{
    registrationId: string;
    workId: string;
  }> = [];

  for (const [index, config] of matrixArchivedConfigs.entries()) {
    const { registration, raceProject, team } = await createTeamRegistrationBundle({
      aggregateIngestionStatus: "ACTIVE",
      approvedAt: addDays(now, -22),
      raceId: raceMatrixArchived.id,
      teamName: config.teamName,
      user: config.user,
    });

    await createConnectionWithOptionalSession({
      caProjectId: `matrix_archived_project_${index}`,
      caType: index === 0 ? "CODEX" : "CLAUDE_CODE",
      connectorBaseUrl: "https://connector.example/archived",
      connectorId: `matrix_archived_connector_${index}`,
      connectorSecret: `matrix-archived-secret-${index}`,
      ingestionStatus: "ACTIVE",
      latestActivity: `${config.teamName} archived its final project state.`,
      progressPercent: 100,
      raceProjectId: raceProject!.id,
      sessionId: `matrix_archived_session_${index}`,
      startedAt: addDays(now, -20),
      taskStatus: "completed",
      tokenCost: config.tokenUsed,
    });

    const work = await prisma.work.create({
      data: buildWorkSeedRecord({
        archiveCode: `// archived showcase ${index}`,
        demoUrl: `https://demo.example/${raceMatrixArchived.id}/showcase-${index}`,
        excerpt: `${config.teamName} remains available as an archived showcase work.`,
        raceId: raceMatrixArchived.id,
        registrationId: registration.id,
        repoUrl: raceProject!.githubRepoUrl,
        teamId: team.id,
        teamName: config.teamName,
        videoUrl: `https://video.example/${raceMatrixArchived.id}/showcase-${index}`,
      }),
    });

    await prisma.judgeAssignment.create({
      data: {
        assignedByUserId: organizerStory.id,
        judgeId: index === 0 ? judge.id : judgeStory.id,
        workId: work.id,
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: index === 0 ? "OPENAI" : "CLAUDE",
        antiCheatPenalty: 0,
        codeContent: `// archived showcase ${index}`,
        codeContentHash: buildPayloadDigest(`// archived showcase ${index}`),
        codeLabel: "archive.ts",
        dialogueScore: 82 - index * 6,
        keywordScore: 79 - index * 6,
        progress: 1,
        raceId: raceMatrixArchived.id,
        registrationId: registration.id,
        reasoningScore: 84 - index * 5,
        submissionId: `archive_matrix_archived_${index}`,
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceMatrixArchived.id,
          registrationId: registration.id,
          submittedAt: addDays(now, -18),
          teamId: team.id,
      userId: config.user.id,
        }),
        taskScore: 85 - index * 5,
        teamId: team.id,
        tokenScore: 72 - index * 5,
        tokenUsed: config.tokenUsed,
        totalScore: 88 - index * 7,
      },
    });

    await prisma.teamComment.create({
      data: {
        content: `${config.teamName} is preserved as an archived reference team.`,
        raceId: raceMatrixArchived.id,
        registrationId: registration.id,
        teamId: team.id,
      },
    });

    matrixArchivedBridge.push({
      registrationId: registration.id,
      workId: work.id,
    });
  }

  await prisma.award.createMany({
    data: [
      {
        awardName: "Best Archived Reference",
        decisionReason: "Strongest reusable archived showcase.",
        publishedAt: addDays(now, -16),
        raceId: raceMatrixArchived.id,
        rank: 1,
        registrationId: matrixArchivedBridge[0]!.registrationId,
        workId: matrixArchivedBridge[0]!.workId,
      },
      {
        awardName: "Best Historical Write-up",
        decisionReason: "Most complete historical summary asset.",
        publishedAt: addDays(now, -16),
        raceId: raceMatrixArchived.id,
        rank: 1,
        registrationId: matrixArchivedBridge[1]!.registrationId,
        workId: matrixArchivedBridge[1]!.workId,
      },
    ],
  });
  await prisma.report.createMany({
    data: [
      {
        body: "Archived race report for Legacy Showcase Vault.",
        publishedAt: addDays(now, -16),
        raceId: raceMatrixArchived.id,
        status: "PUBLISHED",
        summary: "Archived race report is available for historical browsing.",
        title: "Legacy Showcase Vault Race Report",
        type: "RACE_REPORT",
      },
      {
        body: "Archived review summary for Legacy Showcase Vault.",
        publishedAt: addDays(now, -16),
        raceId: raceMatrixArchived.id,
        status: "PUBLISHED",
        summary: "Archived review summary is available for historical browsing.",
        title: "Legacy Showcase Vault Review Summary",
        type: "REVIEW_SUMMARY",
      },
    ],
  });

  await prisma.screenDisplay.create({
    data: {
      mode: "LIVE",
      raceId: raceStoryRunning.id,
      theme: "story-running",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "Smart Warehouse Copilot is live. Watch active agents coordinate routing, incident handling, and dock operations.",
      publishedAt: addHours(now, -4),
      raceId: raceStoryRunning.id,
      title: "Warehouse Copilot Live",
      visibility: "PUBLIC",
    },
  });
  await prisma.notification.create({
    data: {
      content: "Smart Warehouse Copilot is live with multiple active connectors and review threads.",
      raceId: raceStoryRunning.id,
      target: "ALL",
      title: "Story Running",
    },
  });

  // race_story_running: 2 teams (all 2-member)
  const storyRunningConfigs = [
    {
      aggregateIngestionStatus: "ACTIVE" as const,
      agentType: "OPENAI" as const,
      progress: 92,
      score: 93.5,
      teamName: "Dock Delta",
      tokenUsed: 2200,
      user: storyRiders[0]!,
      mate: storyRiders[1]!,
      workStatus: "SUBMITTED" as const,
      workVisibility: "PUBLIC" as const,
    },
    {
      aggregateIngestionStatus: "CONNECTED" as const,
      agentType: "COPILOT" as const,
      progress: 64,
      score: 74.2,
      teamName: "Route Foxtrot",
      tokenUsed: 1940,
      user: storyRiders[2]!,
      mate: storyRiders[3]!,
      workStatus: "DRAFT" as const,
      workVisibility: "PRIVATE" as const,
    },
  ];

  const storyRunningBundles: Array<{
    registrationId: string;
    teamId: string;
    userId: string;
  }> = [];

  for (const [index, config] of storyRunningConfigs.entries()) {
    const submissionId = `sub_story_running_${index}`;
    const artifactId = `artifact_story_running_${index}`;
    const codeContent = `export function warehouseCopilot${index}(ticket) { return { ticket, lane: "L-${index}" }; }`;
    const ridingRecord = "Observe warehouse constraints, coordinate multiple connectors, and keep the dispatch loop stable.";
    const { registration, raceProject, team } = await createTeamRegistrationBundle({
      aggregateIngestionStatus: config.aggregateIngestionStatus,
      approvedAt: addDays(now, -5),
      extraMembers: config.mate ? [{ displayName: config.mate.username, user: config.mate }] : undefined,
      raceId: raceStoryRunning.id,
      teamName: config.teamName,
      user: config.user,
    });

    await createConnectionWithOptionalSession({
      caProjectId: `story_running_project_${index}`,
      caType: index === 0 ? "CODEX" : "CLAUDE_CODE",
      connectorBaseUrl: "https://connector.example/story-running",
      connectorId: `story_running_connector_${index}`,
      connectorSecret: `story-running-secret-${index}`,
      ingestionStatus:
        config.aggregateIngestionStatus === "CONNECTED"
          ? "CONNECTED"
          : "ACTIVE",
      latestActivity: `${config.teamName} is managing live warehouse incidents.`,
      progressPercent: config.progress,
      raceProjectId: raceProject!.id,
      riskLevel: "low",
      riskReason: "none",
      sessionId:
        config.aggregateIngestionStatus === "CONNECTED"
          ? undefined
          : `story_running_session_${index}`,
      startedAt: addDays(now, -1),
      taskStatus: "in_progress",
      tokenCost: config.tokenUsed,
    });

    if (index === 0) {
      await createConnectionWithOptionalSession({
        caProjectId: `story_running_project_${index}_backup`,
        caType: "CLAUDE_CODE",
        connectorBaseUrl: "https://connector.example/story-running-backup",
        connectorId: `story_running_backup_connector_${index}`,
        connectorSecret: `story-running-backup-secret-${index}`,
        ingestionStatus: "CONNECTED",
        latestActivity: `${config.teamName} attached a backup connector for escalation workflows.`,
        progressPercent: 40,
        raceProjectId: raceProject!.id,
        sessionId: undefined,
        startedAt: addDays(now, -1),
        taskStatus: "in_progress",
        tokenCost: 640,
      });
    }

    const workSeed = buildWorkSeedRecord({
      archiveCode: codeContent,
      demoUrl: `https://demo.example/${raceStoryRunning.id}/story-${index}`,
      excerpt: `${config.teamName} is iterating on warehouse copilot behavior under live pressure.`,
      raceId: raceStoryRunning.id,
      registrationId: registration.id,
      repoUrl: raceProject!.githubRepoUrl,
      teamId: team.id,
      teamName: config.teamName,
      videoUrl: `https://video.example/${raceStoryRunning.id}/story-${index}`,
    });
    await prisma.work.create({
      data: {
        ...workSeed,
        status: config.workStatus,
        visibility: config.workVisibility,
      },
    });

    await prisma.submission.create({
      data: {
        agentType: config.agentType,
        codeContent,
        codeContentHash: buildPayloadDigest(codeContent),
        codeLabel: "warehouse.ts",
        id: submissionId,
        raceId: raceStoryRunning.id,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord,
        ridingRecordHash: buildPayloadDigest(ridingRecord),
        status: index === 0 ? "PULLED" : index === 1 ? "QUEUED" : index === 2 ? "PULLED" : "FAILED",
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          submittedAt: now,
          teamId: team.id,
      userId: config.user.id,
        }),
        teamId: team.id,
        tokenUsed: config.tokenUsed,
      },
    });

    await prisma.submissionArtifact.create({
      data: {
        agentType: config.agentType,
        codeContent,
        codeContentHash: buildPayloadDigest(codeContent),
        codeLabel: "warehouse.ts",
        id: artifactId,
        raceId: raceStoryRunning.id,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord,
        ridingRecordHash: buildPayloadDigest(ridingRecord),
        submissionId,
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          submittedAt: now,
          teamId: team.id,
      userId: config.user.id,
        }),
        teamId: team.id,
        tokenUsed: config.tokenUsed,
      },
    });

    if (index < 2) {
      await prisma.runnerTask.create({
        data: {
          artifactId,
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          resultHash: index === 0 ? "story-running-progress-hash" : "",
          runnerComment: "Runner queue accepted the latest live artifact.",
          status: "QUEUED",
          submissionId,
          taskType: index === 1 ? "HARNESS_EVAL" : "PROGRESS_EVAL",
          teamId: team.id,
        },
      });
    }

    if (index < 2) {
      await prisma.teamArchive.create({
        data: {
          agentType: config.agentType,
          antiCheatPenalty: 0,
          codeContent,
          codeContentHash: buildPayloadDigest(codeContent),
          codeLabel: "warehouse.ts",
          dialogueScore: config.score - 5,
          keywordScore: config.score - 7,
          progress: config.progress / 100,
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          reasoningScore: config.score - 3,
          recordLabel: "riding-record.txt",
          ridingRecord,
          ridingRecordHash: buildPayloadDigest(ridingRecord),
          submissionId,
          submitterBindingJson: buildSubmissionBindingJson({
            raceId: raceStoryRunning.id,
            registrationId: registration.id,
            submittedAt: now,
            teamId: team.id,
      userId: config.user.id,
          }),
          taskScore: config.score - 2,
          teamId: team.id,
          tokenScore: 76 - index * 3,
          tokenUsed: config.tokenUsed,
          totalScore: config.score,
        },
      });
      await prisma.leaderboardEntry.create({
        data: {
          agentType: config.agentType,
          dialogueScore: config.score - 5,
          progress: config.progress / 100,
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          submissionId,
          taskScore: config.score - 2,
          teamId: team.id,
          tokenScore: 76 - index * 3,
          totalScore: config.score,
        },
      });
      await prisma.harnessEntry.create({
        data: {
          harnessScore: config.score - 4,
          keywordScore: config.score - 8,
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          reasoningScore: config.score - 4,
          teamId: team.id,
        },
      });
    }

    if (index < 2) {
      await prisma.ridingHighlight.create({
        data: {
          agentType: config.agentType,
          codeSnippet: `// ${config.teamName}\nexport const dispatchPlan = "dock-${index}";`,
          excerpt: `${config.teamName} explained how it balanced dock throughput and exception handling.`,
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          score: config.score,
          teamId: team.id,
        },
      });
    }

    if (index < 2) {
      await prisma.teamComment.create({
        data: {
          content: `${config.teamName} has a visible operator-facing narrative for the running story demo.`,
          raceId: raceStoryRunning.id,
          registrationId: registration.id,
          teamId: team.id,
        },
      });
    }

    storyRunningBundles.push({
      registrationId: registration.id,
      teamId: team.id,
      userId: config.user.id,
    });
  }

  const runningResolvedThread = await prisma.feedbackThread.create({
    data: {
      raceId: raceStoryRunning.id,
      registrationId: storyRunningBundles[0]!.registrationId,
      status: "RESOLVED",
      teamId: storyRunningBundles[0]!.teamId,
    },
  });
  const runningPendingThread = await prisma.feedbackThread.create({
    data: {
      raceId: raceStoryRunning.id,
      registrationId: storyRunningBundles[1]!.registrationId,
      teamId: storyRunningBundles[1]!.teamId,
    },
  });
  await prisma.feedbackMessage.createMany({
    data: [
      {
        authorId: storyRunningBundles[0]!.userId,
        content: "We adjusted the dock prioritization logic and want confirmation on the updated scoring basis.",
        threadId: runningResolvedThread.id,
      },
      {
        authorId: organizerStory.id,
        content: "The organizer note now reflects the revised dock-priority constraint.",
        threadId: runningResolvedThread.id,
      },
      {
        authorId: storyRunningBundles[1]!.userId,
        content: "Our backup connector is attached, but the harness replay still looks stale.",
        threadId: runningPendingThread.id,
      },
    ],
  });

  await prisma.screenDisplay.create({
    data: {
      mode: "LEADERBOARD",
      raceId: raceStoryCompleted.id,
      theme: "story-completed",
    },
  });
  await prisma.announcement.create({
    data: {
      body: "Campus Ops Automation Finals is complete. Public results, reports, and works are now available.",
      publishedAt: addDays(now, -4),
      raceId: raceStoryCompleted.id,
      title: "Campus Ops Finals Published",
      visibility: "PUBLIC",
    },
  });
  await prisma.notification.create({
    data: {
      content: "Campus Ops Automation Finals has published works, awards, and review summaries.",
      raceId: raceStoryCompleted.id,
      target: "ALL",
      title: "Story Completed",
    },
  });

  // race_story_completed: 2 teams (all 2-member)
  const storyCompletedConfigs = [
    {
      agentType: "OPENAI" as const,
      score: 95.4,
      teamName: "Ticket Atlas",
      tokenUsed: 2480,
      user: storyRiders[0]!,
      mate: storyRiders[1]!,
    },
    {
      agentType: "COPILOT" as const,
      score: 84.9,
      teamName: "Queue Harbor",
      tokenUsed: 3120,
      user: storyRiders[2]!,
      mate: storyRiders[3]!,
    },
  ];

  const storyCompletedBridge: Array<{
    registrationId: string;
    workId: string;
  }> = [];

  for (const [index, config] of storyCompletedConfigs.entries()) {
    const submissionId = `sub_story_completed_${index}`;
    const { registration, raceProject, team } = await createTeamRegistrationBundle({
      aggregateIngestionStatus: "ACTIVE",
      approvedAt: addDays(now, -12),
      extraMembers: config.mate ? [{ displayName: config.mate.username, user: config.mate }] : undefined,
      raceId: raceStoryCompleted.id,
      teamName: config.teamName,
      user: config.user,
    });

    await createConnectionWithOptionalSession({
      caProjectId: `story_completed_project_${index}`,
      caType: index % 2 === 0 ? "CODEX" : "CLAUDE_CODE",
      connectorBaseUrl: "https://connector.example/story-completed",
      connectorId: `story_completed_connector_${index}`,
      connectorSecret: `story-completed-secret-${index}`,
      ingestionStatus: "ACTIVE",
      latestActivity: `${config.teamName} finalized its campus operations automation run.`,
      progressPercent: 100,
      raceProjectId: raceProject!.id,
      sessionId: `story_completed_session_${index}`,
      startedAt: addDays(now, -8),
      taskStatus: "completed",
      tokenCost: config.tokenUsed,
    });

    const codeContent = `export function campusOps${index}(request) { return { request, automated: true }; }`;
    const ridingRecord = "Model the operational queue, automate the common path, and document recovery behavior.";

    const work = await prisma.work.create({
      data: buildWorkSeedRecord({
        archiveCode: codeContent,
        demoUrl: `https://demo.example/${raceStoryCompleted.id}/campus-${index}`,
        excerpt: `${config.teamName} automated the campus operations flow and documented the rollout path.`,
        raceId: raceStoryCompleted.id,
        registrationId: registration.id,
        repoUrl: raceProject!.githubRepoUrl,
        teamId: team.id,
        teamName: config.teamName,
        videoUrl: `https://video.example/${raceStoryCompleted.id}/campus-${index}`,
      }),
    });

    const judgeAssignment = await prisma.judgeAssignment.create({
      data: {
        assignedByUserId: organizerStory.id,
        judgeId: index % 2 === 0 ? judgeStory.id : judge.id,
        workId: work.id,
      },
    });

    await prisma.judgingRecord.create({
      data: {
        comments: `Final judging record for ${config.teamName}.`,
        judgeAssignmentId: judgeAssignment.id,
        scoreResultJson: JSON.stringify({
          overall: config.score,
          presentation: config.score - 5,
        }),
        scoreRidingJson: JSON.stringify({
          process: config.score - 3,
          reliability: config.score - 4,
        }),
        submittedAt: addDays(now, -5),
      },
    });

    await prisma.submission.create({
      data: {
        agentType: config.agentType,
        codeContent,
        codeContentHash: buildPayloadDigest(codeContent),
        codeLabel: "campus-ops.ts",
        id: submissionId,
        raceId: raceStoryCompleted.id,
        recordLabel: "riding-record.txt",
        registrationId: registration.id,
        ridingRecord,
        ridingRecordHash: buildPayloadDigest(ridingRecord),
        scoredAt: addDays(now, -5),
        status: "SCORED",
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceStoryCompleted.id,
          registrationId: registration.id,
          submittedAt: addDays(now, -6),
          teamId: team.id,
      userId: config.user.id,
        }),
        teamId: team.id,
        tokenUsed: config.tokenUsed,
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: config.agentType,
        antiCheatPenalty: 0,
        codeContent,
        codeContentHash: buildPayloadDigest(codeContent),
        codeLabel: "campus-ops.ts",
        dialogueScore: config.score - 5,
        keywordScore: config.score - 6,
        progress: 1,
        raceId: raceStoryCompleted.id,
        registrationId: registration.id,
        reasoningScore: config.score - 3,
        recordLabel: "riding-record.txt",
        ridingRecord,
        ridingRecordHash: buildPayloadDigest(ridingRecord),
        submissionId,
        submitterBindingJson: buildSubmissionBindingJson({
          raceId: raceStoryCompleted.id,
          registrationId: registration.id,
          submittedAt: addDays(now, -6),
          teamId: team.id,
      userId: config.user.id,
        }),
        taskScore: config.score - 2,
        teamId: team.id,
        tokenScore: 78 - index * 4,
        tokenUsed: config.tokenUsed,
        totalScore: config.score,
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        agentType: config.agentType,
        dialogueScore: config.score - 5,
        progress: 1,
        raceId: raceStoryCompleted.id,
        registrationId: registration.id,
        submissionId,
        taskScore: config.score - 2,
        teamId: team.id,
        tokenScore: 78 - index * 4,
        totalScore: config.score,
      },
    });

    await prisma.harnessEntry.create({
      data: {
        harnessScore: config.score - 3,
        keywordScore: config.score - 7,
        raceId: raceStoryCompleted.id,
        registrationId: registration.id,
        reasoningScore: config.score - 4,
        teamId: team.id,
      },
    });

    if (index < 2) {
      await prisma.ridingHighlight.create({
        data: {
          agentType: config.agentType,
          codeSnippet: `// ${config.teamName}\nexport const escalation = "ops-${index}";`,
          excerpt: `${config.teamName} connected queue automation to a clear operational story.`,
          raceId: raceStoryCompleted.id,
          registrationId: registration.id,
          score: config.score,
          teamId: team.id,
        },
      });
    }

    await prisma.teamComment.create({
      data: {
        content: `${config.teamName} is a strong completed-story demo candidate.`,
        raceId: raceStoryCompleted.id,
        registrationId: registration.id,
        teamId: team.id,
      },
    });

    storyCompletedBridge.push({
      registrationId: registration.id,
      workId: work.id,
    });
  }

  const storyCompletedWorkIdByRegistrationId = Object.fromEntries(
    storyCompletedBridge.map((item) => [item.registrationId, item.workId]),
  );

  for (const award of buildAwardSeedRecords({
    bestWorkRegistrationId: storyCompletedBridge[1]!.registrationId,
    overallRegistrationId: storyCompletedBridge[0]!.registrationId,
    raceId: raceStoryCompleted.id,
    ridingRegistrationId: storyCompletedBridge[1]!.registrationId,
    workIdByRegistrationId: storyCompletedWorkIdByRegistrationId,
  })) {
    await prisma.award.create({ data: award });
  }

  for (const [index, item] of storyCompletedBridge.entries()) {
    await prisma.report.create({
      data: buildRiderReportSeed({
        body: `Rider report for ${storyCompletedConfigs[index]!.teamName}.`,
        raceId: raceStoryCompleted.id,
        subjectRegistrationId: item.registrationId,
        summary: `${storyCompletedConfigs[index]!.teamName} rider report summary.`,
        title: `${storyCompletedConfigs[index]!.teamName} Rider Report`,
      }),
    });
  }

  await prisma.report.create({
    data: {
      body: "Campus Ops Automation Finals race report.",
      publishedAt: addDays(now, -4),
      raceId: raceStoryCompleted.id,
      status: "PUBLISHED",
      summary: "Final race report for the completed story demo.",
      title: "Campus Ops Automation Finals Race Report",
      type: "RACE_REPORT",
    },
  });
  await prisma.report.create({
    data: buildReviewSummaryReportSeed({
      body: "Campus Ops Automation Finals review summary.",
      raceId: raceStoryCompleted.id,
      summary: "Published review summary for the completed story demo.",
      title: "Campus Ops Automation Finals Review Summary",
    }),
  });

  const storyCompletedThread = await prisma.feedbackThread.create({
    data: {
      raceId: raceStoryCompleted.id,
      registrationId: storyCompletedBridge[0]!.registrationId,
      status: "RESOLVED",
      teamId: (
        await prisma.team.findFirstOrThrow({
          where: {
            raceId: raceStoryCompleted.id,
            captainId: storyRiders[0]!.id,
          },
        })
      ).id,
    },
  });
  await prisma.feedbackMessage.createMany({
    data: [
      {
        authorId: storyRiders[0]!.id,
        content: "Thanks for the judging notes. We used them to improve the rollout explanation in the public work page.",
        threadId: storyCompletedThread.id,
      },
      {
        authorId: organizerStory.id,
        content: "The public report now links the updated rollout explanation and final award decision.",
        threadId: storyCompletedThread.id,
      },
    ],
  });

  for (const raceId of [
    raceActive.id,
    raceActiveOval.id,
    raceRegistrationOpen.id,
    raceSignup.id,
    raceFinished.id,
    raceMatrixDraft.id,
    raceMatrixPublished.id,
    raceMatrixSubmitting.id,
    raceMatrixJudging.id,
    raceMatrixArchived.id,
    raceStoryRunning.id,
    raceStoryCompleted.id,
  ]) {
    try {
      await rebuildSessionSummaryEvidenceForRace(raceId);
      await rebuildRaceProcessProjections(raceId);
      await generateRaceSnapshot(raceId);
      console.log(`Generated Jumbotron snapshot for ${raceId}`);
    } catch (error) {
      console.error(`Failed to generate snapshot for ${raceId}`, error);
    }
  }

  const finishedWorks = await prisma.work.findMany({
    where: {
      registrationId: { not: null },
    },
  });
  const finishedWorkRegistrationIds = finishedWorks.map(w => w.registrationId!).filter(Boolean);
  const finishedWorkRegistrations = await prisma.registration.findMany({
    where: { id: { in: finishedWorkRegistrationIds }, raceId: raceFinished.id },
    include: { user: true },
  });
  const finishedRegistrationMap = new Map(finishedWorkRegistrations.map(r => [r.id, r]));
  const finishedEvidences = await prisma.evidence.findMany({
    where: {
      registration: {
        raceId: raceFinished.id,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const finishedProjections = await prisma.projection.findMany({
    where: {
      raceId: raceFinished.id,
    },
    orderBy: {
      type: "asc",
    },
  });
  const finishedAwards = await prisma.award.findMany({
    where: {
      raceId: raceFinished.id,
    },
    include: {
      registration: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: [
      {
        awardName: "asc",
      },
      {
        rank: "asc",
      },
    ],
  });
  const finishedReports = await prisma.report.findMany({
    where: {
      raceId: raceFinished.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const finishedJudgingRecords = await prisma.judgingRecord.findMany({
    where: {
      judgeAssignment: {
        work: {
          registrationId: { in: finishedWorkRegistrationIds },
        },
      },
    },
    include: {
      judgeAssignment: {
        include: {
          work: true,
        },
      },
    },
  });

  const worksByRegistrationId = new Map(
    finishedWorks.map((work) => [
      work.registrationId,
      {
        contentHash: work.contentHash,
        id: work.id,
        registrationId: work.registrationId,
        sourceRefJson: work.sourceRefJson,
        title: work.title,
      },
    ]),
  );
  const evidenceRefsByRegistrationId = new Map<
    string,
    Array<{
      id: string;
      registrationId: string;
      sourceDigest: string;
      title: string;
      type: string;
      integrityStatus: string;
    }>
  >();
  for (const evidence of finishedEvidences) {
    const bucket = evidenceRefsByRegistrationId.get(evidence.registrationId) ?? [];
    bucket.push({
      id: evidence.id,
      integrityStatus: evidence.integrityStatus,
      registrationId: evidence.registrationId,
      sourceDigest: evidence.sourceDigest,
      title: evidence.title,
      type: evidence.type,
    });
    evidenceRefsByRegistrationId.set(evidence.registrationId, bucket);
  }
  const projectionRefs = finishedProjections.map((projection) => ({
    asOfAt: projection.asOfAt.toISOString(),
    payloadDigest: buildProjectionPayloadDigest(projection.payloadJson),
    type: projection.type,
  }));
  const awardRefs = finishedAwards.map((award) => ({
    awardName: award.awardName,
    id: award.id,
    rank: award.rank,
    registrationId: award.registrationId,
  }));

  await prisma.$transaction(async (tx) => {
    for (const judgingRecord of finishedJudgingRecords) {
      const work = judgingRecord.judgeAssignment.work;
      const registration = finishedRegistrationMap.get(work.registrationId ?? "");
      if (!registration) continue;
      const registrationEvidences = finishedEvidences.filter(e => e.registrationId === registration.id);
      const sourceRef = buildJudgingRecordSourceRef({
        evidences: registrationEvidences.map((evidence) => ({
          id: evidence.id,
          integrityStatus: evidence.integrityStatus,
          sourceDigest: evidence.sourceDigest,
          title: evidence.title,
          type: evidence.type,
        })),
        registration: {
          id: registration.id,
          userId: registration.userId,
        },
        work: {
          contentHash: work.contentHash,
          id: work.id,
          sourceRefJson: work.sourceRefJson,
          title: work.title,
        },
      });

      await tx.judgingRecord.update({
        where: {
          id: judgingRecord.id,
        },
        data: {
          sourceDigest: buildPayloadDigest(sourceRef),
          sourceRefJson: JSON.stringify(sourceRef),
        },
      });
    }

    for (const award of finishedAwards) {
      const work = award.workId
        ? (worksByRegistrationId.get(award.registrationId) ?? null)
        : null;
      const sourceRef = buildAwardSourceRef({
        evidences: (evidenceRefsByRegistrationId.get(award.registrationId ?? "") ?? []).map((evidence) => ({
          id: evidence.id,
          sourceDigest: evidence.sourceDigest,
          type: evidence.type,
        })),
        registration: {
          id: award.registrationId ?? "",
          userId: award.registrationId ? (finishedRegistrationMap.get(award.registrationId)?.userId ?? "") : "",
        },
        work: work
          ? {
              contentHash: work.contentHash,
              id: work.id,
              title: work.title,
            }
          : null,
      });

      await tx.award.update({
        where: {
          id: award.id,
        },
        data: {
          sourceDigest: buildPayloadDigest(sourceRef),
          sourceRefJson: JSON.stringify(sourceRef),
        },
      });
    }

    for (const report of finishedReports) {
      const subjectWork = report.subjectRegistrationId
        ? [worksByRegistrationId.get(report.subjectRegistrationId)].filter(Boolean)
        : [...worksByRegistrationId.values()];
      const subjectEvidence = report.subjectRegistrationId
        ? evidenceRefsByRegistrationId.get(report.subjectRegistrationId) ?? []
        : finishedEvidences.map((evidence) => ({
            id: evidence.id,
            integrityStatus: evidence.integrityStatus,
            registrationId: evidence.registrationId,
            sourceDigest: evidence.sourceDigest,
            title: evidence.title,
            type: evidence.type,
          }));
      const sourceRef = buildReportSourceRef({
        awards: awardRefs
          .filter((award) =>
            report.subjectRegistrationId
              ? award.registrationId === report.subjectRegistrationId
              : true,
          )
          .map((award) => ({
            awardName: award.awardName,
            id: award.id,
            rank: award.rank,
          })),
        evidences: subjectEvidence.map((evidence) => ({
          id: evidence.id,
          registrationId: evidence.registrationId,
          sourceDigest: evidence.sourceDigest,
          type: evidence.type,
        })),
        projections: projectionRefs,
        raceId: report.raceId,
        reportType: report.type,
        subjectRegistrationId: report.subjectRegistrationId,
        works: subjectWork.map((work) => ({
          contentHash: work!.contentHash,
          id: work!.id,
          registrationId: work!.registrationId ?? "",
          title: work!.title,
        })),
      });

      await tx.report.update({
        where: {
          id: report.id,
        },
        data: {
          sourceDigest: buildPayloadDigest(sourceRef),
          sourceRefJson: JSON.stringify(sourceRef),
        },
      });
    }
  });

  console.log("\nSeed data generated.");
  console.log("   Admin/Organizer: organizer_demo / organizer123");
  console.log("   Admin: admin_demo / organizer123");
  console.log("   Judge: judge_demo / rider123");
  console.log("   Riders: rider_alice ~ rider_kate / rider123");
  console.log("   Story Organizer: organizer_story / organizer123");
  console.log("   Story Judge: judge_story / rider123");
  console.log("   Story Riders: rider_luna / rider_milo / rider_nova / rider_orion / rider123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
