/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Race" ADD COLUMN "status" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeedbackThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeedbackThread_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackThread_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackThread_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FeedbackThread" ("createdAt", "id", "raceId", "status", "teamId", "updatedAt") SELECT "createdAt", "id", "raceId", "status", "teamId", "updatedAt" FROM "FeedbackThread";
DROP TABLE "FeedbackThread";
ALTER TABLE "new_FeedbackThread" RENAME TO "FeedbackThread";
CREATE INDEX "FeedbackThread_registrationId_idx" ON "FeedbackThread"("registrationId");
CREATE TABLE "new_HarnessEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "harnessScore" REAL NOT NULL,
    "reasoningScore" REAL,
    "keywordScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HarnessEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarnessEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarnessEntry_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_HarnessEntry" ("createdAt", "harnessScore", "id", "keywordScore", "raceId", "reasoningScore", "teamId") SELECT "createdAt", "harnessScore", "id", "keywordScore", "raceId", "reasoningScore", "teamId" FROM "HarnessEntry";
DROP TABLE "HarnessEntry";
ALTER TABLE "new_HarnessEntry" RENAME TO "HarnessEntry";
CREATE INDEX "HarnessEntry_registrationId_idx" ON "HarnessEntry"("registrationId");
CREATE UNIQUE INDEX "HarnessEntry_raceId_teamId_key" ON "HarnessEntry"("raceId", "teamId");
CREATE TABLE "new_LeaderboardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "submissionId" TEXT NOT NULL,
    "totalScore" REAL NOT NULL,
    "progress" REAL DEFAULT 0,
    "taskScore" REAL,
    "tokenScore" REAL,
    "dialogueScore" REAL,
    "agentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaderboardEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaderboardEntry_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LeaderboardEntry" ("agentType", "createdAt", "dialogueScore", "id", "progress", "raceId", "submissionId", "taskScore", "teamId", "tokenScore", "totalScore") SELECT "agentType", "createdAt", "dialogueScore", "id", "progress", "raceId", "submissionId", "taskScore", "teamId", "tokenScore", "totalScore" FROM "LeaderboardEntry";
DROP TABLE "LeaderboardEntry";
ALTER TABLE "new_LeaderboardEntry" RENAME TO "LeaderboardEntry";
CREATE INDEX "LeaderboardEntry_registrationId_idx" ON "LeaderboardEntry"("registrationId");
CREATE UNIQUE INDEX "LeaderboardEntry_raceId_teamId_key" ON "LeaderboardEntry"("raceId", "teamId");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "teamId" TEXT,
    "registrationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("content", "createdAt", "id", "raceId", "target", "teamId", "title") SELECT "content", "createdAt", "id", "raceId", "target", "teamId", "title" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_registrationId_idx" ON "Notification"("registrationId");
CREATE TABLE "new_RidingHighlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "score" REAL NOT NULL,
    "agentType" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "codeSnippet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RidingHighlight_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RidingHighlight_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RidingHighlight_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RidingHighlight" ("agentType", "codeSnippet", "createdAt", "excerpt", "id", "raceId", "score", "teamId") SELECT "agentType", "codeSnippet", "createdAt", "excerpt", "id", "raceId", "score", "teamId" FROM "RidingHighlight";
DROP TABLE "RidingHighlight";
ALTER TABLE "new_RidingHighlight" RENAME TO "RidingHighlight";
CREATE INDEX "RidingHighlight_registrationId_idx" ON "RidingHighlight"("registrationId");
CREATE TABLE "new_RunnerTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "submissionId" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "score" REAL,
    "runnerComment" TEXT,
    "resultHash" TEXT,
    "claimedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RunnerTask_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunnerTask_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunnerTask_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RunnerTask_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunnerTask_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "SubmissionArtifact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RunnerTask" ("artifactId", "claimedAt", "createdAt", "finishedAt", "id", "raceId", "resultHash", "runnerComment", "score", "status", "submissionId", "taskType", "teamId", "updatedAt") SELECT "artifactId", "claimedAt", "createdAt", "finishedAt", "id", "raceId", "resultHash", "runnerComment", "score", "status", "submissionId", "taskType", "teamId", "updatedAt" FROM "RunnerTask";
DROP TABLE "RunnerTask";
ALTER TABLE "new_RunnerTask" RENAME TO "RunnerTask";
CREATE INDEX "RunnerTask_raceId_status_createdAt_idx" ON "RunnerTask"("raceId", "status", "createdAt");
CREATE INDEX "RunnerTask_teamId_taskType_createdAt_idx" ON "RunnerTask"("teamId", "taskType", "createdAt");
CREATE INDEX "RunnerTask_registrationId_taskType_createdAt_idx" ON "RunnerTask"("registrationId", "taskType", "createdAt");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "codeLabel" TEXT NOT NULL,
    "codeContent" TEXT,
    "recordLabel" TEXT,
    "ridingRecord" TEXT,
    "tokenUsed" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "passRate" REAL,
    "codeReviewScore" REAL,
    "reasoningScore" REAL,
    "keywordScore" REAL,
    "tokenScore" REAL,
    "taskScore" REAL,
    "dialogueScore" REAL,
    "totalScore" REAL,
    "progress" REAL,
    "antiCheatPenalty" REAL,
    "runnerComment" TEXT,
    "runnerStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pulledAt" DATETIME,
    "scoredAt" DATETIME,
    CONSTRAINT "Submission_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("agentType", "antiCheatPenalty", "codeContent", "codeLabel", "codeReviewScore", "createdAt", "dialogueScore", "id", "keywordScore", "passRate", "progress", "pulledAt", "raceId", "reasoningScore", "recordLabel", "ridingRecord", "runnerComment", "runnerStatus", "scoredAt", "status", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore") SELECT "agentType", "antiCheatPenalty", "codeContent", "codeLabel", "codeReviewScore", "createdAt", "dialogueScore", "id", "keywordScore", "passRate", "progress", "pulledAt", "raceId", "reasoningScore", "recordLabel", "ridingRecord", "runnerComment", "runnerStatus", "scoredAt", "status", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_registrationId_createdAt_idx" ON "Submission"("registrationId", "createdAt");
CREATE TABLE "new_SubmissionArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "submissionId" TEXT NOT NULL,
    "codeLabel" TEXT NOT NULL,
    "codeContent" TEXT NOT NULL,
    "recordLabel" TEXT,
    "ridingRecord" TEXT,
    "tokenUsed" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmissionArtifact_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubmissionArtifact_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubmissionArtifact_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SubmissionArtifact_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionArtifact" ("agentType", "codeContent", "codeLabel", "createdAt", "id", "raceId", "recordLabel", "ridingRecord", "submissionId", "teamId", "tokenUsed") SELECT "agentType", "codeContent", "codeLabel", "createdAt", "id", "raceId", "recordLabel", "ridingRecord", "submissionId", "teamId", "tokenUsed" FROM "SubmissionArtifact";
DROP TABLE "SubmissionArtifact";
ALTER TABLE "new_SubmissionArtifact" RENAME TO "SubmissionArtifact";
CREATE UNIQUE INDEX "SubmissionArtifact_submissionId_key" ON "SubmissionArtifact"("submissionId");
CREATE INDEX "SubmissionArtifact_registrationId_createdAt_idx" ON "SubmissionArtifact"("registrationId", "createdAt");
CREATE TABLE "new_TeamArchive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "submissionId" TEXT NOT NULL,
    "codeLabel" TEXT NOT NULL,
    "codeContent" TEXT NOT NULL,
    "recordLabel" TEXT,
    "ridingRecord" TEXT,
    "tokenUsed" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "taskScore" REAL,
    "dialogueScore" REAL,
    "tokenScore" REAL,
    "reasoningScore" REAL,
    "keywordScore" REAL,
    "totalScore" REAL NOT NULL,
    "progress" REAL DEFAULT 0,
    "antiCheatPenalty" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamArchive_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamArchive_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamArchive_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamArchive" ("agentType", "antiCheatPenalty", "codeContent", "codeLabel", "createdAt", "dialogueScore", "id", "keywordScore", "progress", "raceId", "reasoningScore", "recordLabel", "ridingRecord", "submissionId", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore") SELECT "agentType", "antiCheatPenalty", "codeContent", "codeLabel", "createdAt", "dialogueScore", "id", "keywordScore", "progress", "raceId", "reasoningScore", "recordLabel", "ridingRecord", "submissionId", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore" FROM "TeamArchive";
DROP TABLE "TeamArchive";
ALTER TABLE "new_TeamArchive" RENAME TO "TeamArchive";
CREATE INDEX "TeamArchive_registrationId_idx" ON "TeamArchive"("registrationId");
CREATE UNIQUE INDEX "TeamArchive_raceId_teamId_key" ON "TeamArchive"("raceId", "teamId");
CREATE TABLE "new_TeamComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamComment_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamComment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamComment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamComment" ("content", "createdAt", "id", "raceId", "teamId", "updatedAt") SELECT "content", "createdAt", "id", "raceId", "teamId", "updatedAt" FROM "TeamComment";
DROP TABLE "TeamComment";
ALTER TABLE "new_TeamComment" RENAME TO "TeamComment";
CREATE INDEX "TeamComment_registrationId_idx" ON "TeamComment"("registrationId");
CREATE UNIQUE INDEX "TeamComment_raceId_teamId_key" ON "TeamComment"("raceId", "teamId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rolesJson" TEXT NOT NULL DEFAULT '["RIDER"]',
    "profileName" TEXT NOT NULL DEFAULT '',
    "profileOrgLabel" TEXT NOT NULL DEFAULT '',
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "githubAccount" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "githubAccount", "id", "passwordHash", "profileCompleted", "profileName", "profileOrgLabel", "rolesJson", "username") SELECT "createdAt", "githubAccount", "id", "passwordHash", "profileCompleted", "profileName", "profileOrgLabel", "rolesJson", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
