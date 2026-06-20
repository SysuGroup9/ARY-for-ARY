import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "../src/lib/services/evidence";
import { rebuildRaceProcessProjections } from "../src/lib/services/projections";
import { generateRaceSnapshot } from "../src/lib/services/race-snapshot";
import {
  buildAwardSeedRecords,
  buildReviewSummaryReportSeed,
  buildRiderReportSeed,
  buildWorkSeedRecord,
} from "../src/lib/result-chain-helpers";
import { serializeRoles, type AppRole } from "../src/lib/user-roles";

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

  const activeTeamNames = [
    "Fast Sort Squad",
    "Milk Tea Coder",
    "Bug Crusher",
    "Late Night Commit",
    "Requirement Master",
    "Boundary Test Crew",
    "Refactor Pioneer",
    "Performance Hunter",
  ];
  const activeScores = [92.5, 87.3, 81.0, 75.8, 68.2, 60.4, 52.1, 38.9];
  const activeTokens = [1320, 2150, 1800, 2900, 3500, 4200, 1680, 5100];
  const activeAgents = [
    "CLAUDE",
    "OPENAI",
    "COPILOT",
    "DEEPSEEK",
    "CLAUDE",
    "OPENAI",
    "COPILOT",
    "CLAUDE",
  ] as const;

  for (let i = 0; i < 8; i++) {
    const submissionId = `sub_active_${i}`;
    const artifactId = `artifact_active_${i}`;
    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-06-18T08:05:00+08:00"),
        raceId: raceActive.id,
        status: "APPROVED",
        userId: riders[i].id,
      },
    });

    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: i < 3 ? "ACTIVE" : "CONNECTED",
        githubRepoUrl: `https://github.com/demo/${riders[i].username}-${raceActive.id}`,
        registrationId: registration.id,
      },
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
        ingestionStatus: i < 3 ? "ACTIVE" : "CONNECTED",
        lastSyncedAt: i < 3 ? new Date("2026-06-19T10:00:00+08:00") : null,
        raceProjectId: raceProject.id,
      },
    });

    if (i < 3) {
      await prisma.session.create({
        data: {
          caConnectionId: primaryConnection.id,
          caSessionId: `codex_session_active_${i}`,
          currentGoal: "Keep sorting implementation moving forward.",
          endedAt: null,
          lastActiveAt: new Date("2026-06-19T10:00:00+08:00"),
          latestActivity: `${riders[i].username} is pushing the active race implementation forward.`,
          messageCount: 42 + i * 3,
          progressPercent: 90 - i * 18,
          riskLevel: i === 2 ? "medium" : "low",
          riskReason: i === 2 ? "One active blocker remains." : "none",
          startedAt: new Date("2026-06-19T09:00:00+08:00"),
          taskStatus: "in_progress",
          tokenCost: activeTokens[i],
          toolCallCount: 8 + i,
        },
      });
    }

    const team = await prisma.team.create({
      data: {
        id: `team_active_${i}`,
        captainId: riders[i].id,
        members: {
          create: [{ displayName: riders[i].username, userId: riders[i].id }],
        },
        name: activeTeamNames[i],
        raceId: raceActive.id,
      },
    });

    await prisma.submission.create({
      data: {
        agentType: activeAgents[i],
        codeContent: "export function solve(input) { return [...input].sort((a, b) => a - b); }",
        codeLabel: "solution.ts",
        id: submissionId,
        raceId: raceActive.id,
        status: "QUEUED",
        teamId: team.id,
        tokenUsed: activeTokens[i],
      },
    });

    await prisma.submissionArtifact.create({
      data: {
        agentType: activeAgents[i],
        codeContent: "export function solve(input) { return [...input].sort((a, b) => a - b); }",
        codeLabel: "solution.ts",
        id: artifactId,
        raceId: raceActive.id,
        recordLabel: "riding-record.txt",
        ridingRecord: "Clarify constraints, validate edge cases, then verify final sorting behavior.",
        submissionId,
        teamId: team.id,
        tokenUsed: activeTokens[i],
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: activeAgents[i],
        antiCheatPenalty: i === 3 ? 10 : 0,
        codeContent: "export function solve(input) { return [...input].sort((a, b) => a - b); }",
        codeLabel: "solution.ts",
        dialogueScore: Math.round(activeScores[i] * 0.85 * 10) / 10,
        keywordScore: Math.round(activeScores[i] * 0.8 * 10) / 10,
        progress: Math.max(0.12, activeScores[i] / 92.5),
        raceId: raceActive.id,
        reasoningScore: Math.round(activeScores[i] * 0.88 * 10) / 10,
        recordLabel: "riding-record.txt",
        ridingRecord: "Clarify constraints, validate edge cases, then verify final sorting behavior.",
        submissionId,
        taskScore: Math.round(activeScores[i] * 0.9 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - activeTokens[i] / 60) * 10) / 10,
        tokenUsed: activeTokens[i],
        totalScore: activeScores[i],
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        agentType: activeAgents[i],
        dialogueScore: Math.round(activeScores[i] * 0.85 * 10) / 10,
        progress: Math.max(0.12, activeScores[i] / 92.5),
        raceId: raceActive.id,
        submissionId,
        taskScore: Math.round(activeScores[i] * 0.9 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - activeTokens[i] / 60) * 10) / 10,
        totalScore: activeScores[i],
      },
    });

    await prisma.runnerTask.create({
      data: {
        artifactId,
        raceId: raceActive.id,
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

  const finishedTeamNames = [
    "Render Rocket",
    "Memory Tuner",
    "Lazy Load Expert",
    "Cache Master",
    "Frame Rate Fury",
    "Refactor Unit",
  ];
  const finishedScores = [94.1, 89.7, 85.2, 78.3, 71.6, 64.0];
  const finishedTokens = [2100, 3400, 2800, 4600, 5200, 6100];
  const finishedResultBridge: Array<{
    registrationId: string;
    reportTitle: string;
    teamName: string;
    workId: string;
  }> = [];

  for (let i = 0; i < 6; i++) {
    const submissionId = `sub_finished_${i}`;
    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-06-15T12:00:00+08:00"),
        raceId: raceFinished.id,
        status: "APPROVED",
        userId: riders[i].id,
      },
    });

    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: "ACTIVE",
        githubRepoUrl: `https://github.com/demo/${riders[i].username}-${raceFinished.id}`,
        registrationId: registration.id,
      },
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
        latestActivity: `${finishedTeamNames[i]} finished the performance run and captured the final summary.`,
        messageCount: 30 + i * 2,
        progressPercent: 100,
        riskLevel: "low",
        riskReason: "completed",
        startedAt: new Date("2026-06-17T15:00:00+08:00"),
        taskStatus: "completed",
        tokenCost: finishedTokens[i],
        toolCallCount: 6 + i,
      },
    });

    const work = await prisma.work.create({
      data: buildWorkSeedRecord({
        archiveCode: "// optimized storefront implementation",
        demoUrl: `https://demo.example/${raceFinished.id}/work-${i}`,
        excerpt: `${finishedTeamNames[i]} improved rendering and explained the tradeoffs clearly.`,
        raceId: raceFinished.id,
        registrationId: registration.id,
        repoUrl: raceProject.githubRepoUrl,
        teamName: finishedTeamNames[i],
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
        comments: `Judge summary for ${finishedTeamNames[i]}.`,
        judgeAssignmentId: judgeAssignment.id,
        scoreResultJson: JSON.stringify({
          overall: finishedScores[i],
          presentation: Math.round(finishedScores[i] * 0.9 * 10) / 10,
        }),
        scoreRidingJson: JSON.stringify({
          costControl: Math.round((100 - finishedTokens[i] / 100) * 10) / 10,
          riding: Math.round(finishedScores[i] * 0.92 * 10) / 10,
        }),
        submittedAt: new Date("2026-06-18T10:00:00+08:00"),
      },
    });

    await prisma.evidence.create({
      data: {
        registrationId: registration.id,
        sourceRefJson: JSON.stringify({ workId: work.id }),
        summary: `${finishedTeamNames[i]} work asset and public summary.`,
        title: `${finishedTeamNames[i]} Work`,
        type: "WORK",
        visibility: "PUBLIC",
      },
    });

    await prisma.report.create({
      data: buildRiderReportSeed({
        body: `Rider report for ${finishedTeamNames[i]}.`,
        raceId: raceFinished.id,
        subjectRegistrationId: registration.id,
        summary: `${finishedTeamNames[i]} rider report summary.`,
        title: `${finishedTeamNames[i]} Rider Report`,
      }),
    });

    finishedResultBridge.push({
      registrationId: registration.id,
      reportTitle: `${finishedTeamNames[i]} Rider Report`,
      teamName: finishedTeamNames[i],
      workId: work.id,
    });

    const team = await prisma.team.create({
      data: {
        id: `team_finished_${i}`,
        captainId: riders[i].id,
        members: {
          create: [{ displayName: riders[i].username, userId: riders[i].id }],
        },
        name: finishedTeamNames[i],
        raceId: raceFinished.id,
      },
    });

    await prisma.submission.create({
      data: {
        agentType: activeAgents[i],
        codeContent: "// optimized storefront implementation",
        codeLabel: "optimized.tsx",
        id: submissionId,
        raceId: raceFinished.id,
        recordLabel: "riding-record.txt",
        ridingRecord: "Start from diagnostics, then improve loading strategy and rendering stability.",
        status: "QUEUED",
        teamId: team.id,
        tokenUsed: finishedTokens[i],
      },
    });

    await prisma.teamArchive.create({
      data: {
        agentType: activeAgents[i],
        antiCheatPenalty: 0,
        codeContent: "// optimized storefront implementation",
        codeLabel: "optimized.tsx",
        dialogueScore: Math.round(finishedScores[i] * 0.9 * 10) / 10,
        keywordScore: Math.round(finishedScores[i] * 0.88 * 10) / 10,
        progress: Math.max(0.3, finishedScores[i] / 94.1),
        raceId: raceFinished.id,
        reasoningScore: Math.round(finishedScores[i] * 0.85 * 10) / 10,
        recordLabel: "riding-record.txt",
        ridingRecord: "Start from diagnostics, then improve loading strategy and rendering stability.",
        submissionId,
        taskScore: Math.round(finishedScores[i] * 0.92 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - finishedTokens[i] / 100) * 10) / 10,
        tokenUsed: finishedTokens[i],
        totalScore: finishedScores[i],
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        agentType: activeAgents[i],
        dialogueScore: Math.round(finishedScores[i] * 0.9 * 10) / 10,
        progress: Math.max(0.3, finishedScores[i] / 94.1),
        raceId: raceFinished.id,
        submissionId,
        taskScore: Math.round(finishedScores[i] * 0.92 * 10) / 10,
        teamId: team.id,
        tokenScore: Math.round((100 - finishedTokens[i] / 100) * 10) / 10,
        totalScore: finishedScores[i],
      },
    });

    await prisma.harnessEntry.create({
      data: {
        harnessScore: finishedScores[i],
        keywordScore: Math.round(finishedScores[i] * 0.82 * 10) / 10,
        raceId: raceFinished.id,
        reasoningScore: Math.round(finishedScores[i] * 0.87 * 10) / 10,
        teamId: team.id,
      },
    });

    await prisma.teamComment.create({
      data: {
        content: `Review summary for ${finishedTeamNames[i]}.`,
        raceId: raceFinished.id,
        teamId: team.id,
      },
    });

    if (i < 3) {
      await prisma.ridingHighlight.create({
        data: {
          agentType: activeAgents[i],
          codeSnippet: `// ${finishedTeamNames[i]}\nconst MemoizedList = React.memo(VirtualList);`,
          excerpt: `${finishedTeamNames[i]} improved rendering strategy and explained the tradeoffs clearly.`,
          raceId: raceFinished.id,
          score: finishedScores[i],
          teamId: team.id,
        },
      });
    }
  }

  const workIdByRegistrationId = Object.fromEntries(
    finishedResultBridge.map((item) => [item.registrationId, item.workId]),
  );
  const awardSeeds = buildAwardSeedRecords({
    bestWorkRegistrationId: finishedResultBridge[1]!.registrationId,
    overallRegistrationId: finishedResultBridge[0]!.registrationId,
    raceId: raceFinished.id,
    ridingRegistrationId: finishedResultBridge[2]!.registrationId,
    workIdByRegistrationId,
  });

  for (const award of [
    ...awardSeeds,
    {
      awardName: "Best Recovery",
      decisionReason: "Strong correction path under changing constraints.",
      publishedAt: new Date("2026-06-19T00:00:00Z"),
      raceId: raceFinished.id,
      rank: 1,
      registrationId: finishedResultBridge[2]!.registrationId,
      workId: workIdByRegistrationId[finishedResultBridge[2]!.registrationId],
    },
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

  for (const raceId of [raceActive.id, raceSignup.id, raceFinished.id]) {
    try {
      await rebuildSessionSummaryEvidenceForRace(raceId);
      await rebuildRaceProcessProjections(raceId);
      await generateRaceSnapshot(raceId);
      console.log(`Generated Jumbotron snapshot for ${raceId}`);
    } catch (error) {
      console.error(`Failed to generate snapshot for ${raceId}`, error);
    }
  }

  console.log("\nSeed data generated.");
  console.log("   Organizer: organizer_demo / organizer123");
  console.log("   Admin: admin_demo / organizer123");
  console.log("   Judge: judge_demo / rider123");
  console.log("   Rider: rider_alice ~ rider_kate / rider123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
