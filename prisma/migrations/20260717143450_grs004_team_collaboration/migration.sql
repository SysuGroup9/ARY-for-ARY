-- CreateTable
CREATE TABLE "TeamTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "TeamTask_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollaborationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "linkedAssetType" TEXT NOT NULL DEFAULT '',
    "linkedAssetId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollaborationMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Award" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "registrationId" TEXT,
    "teamId" TEXT,
    "workId" TEXT,
    "awardName" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "decisionReason" TEXT NOT NULL DEFAULT '',
    "sourceRefJson" TEXT NOT NULL DEFAULT '{}',
    "sourceDigest" TEXT NOT NULL DEFAULT '',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Award_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Award_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Award_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Award_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Award" ("awardName", "createdAt", "decisionReason", "id", "publishedAt", "raceId", "rank", "registrationId", "sourceDigest", "sourceRefJson", "updatedAt", "workId") SELECT "awardName", "createdAt", "decisionReason", "id", "publishedAt", "raceId", "rank", "registrationId", "sourceDigest", "sourceRefJson", "updatedAt", "workId" FROM "Award";
DROP TABLE "Award";
ALTER TABLE "new_Award" RENAME TO "Award";
CREATE INDEX "Award_teamId_idx" ON "Award"("teamId");
CREATE UNIQUE INDEX "Award_raceId_awardName_rank_key" ON "Award"("raceId", "awardName", "rank");
CREATE TABLE "new_RaceProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT,
    "teamId" TEXT,
    "githubRepoUrl" TEXT NOT NULL DEFAULT '',
    "aggregateIngestionStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaceProject_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RaceProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RaceProject" ("aggregateIngestionStatus", "createdAt", "githubRepoUrl", "id", "registrationId", "updatedAt") SELECT "aggregateIngestionStatus", "createdAt", "githubRepoUrl", "id", "registrationId", "updatedAt" FROM "RaceProject";
DROP TABLE "RaceProject";
ALTER TABLE "new_RaceProject" RENAME TO "RaceProject";
CREATE UNIQUE INDEX "RaceProject_registrationId_key" ON "RaceProject"("registrationId");
CREATE UNIQUE INDEX "RaceProject_teamId_key" ON "RaceProject"("teamId");
CREATE TABLE "new_Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Registration_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Registration" ("approvedAt", "createdAt", "id", "raceId", "rejectedAt", "status", "submittedAt", "updatedAt", "userId", "withdrawnAt") SELECT "approvedAt", "createdAt", "id", "raceId", "rejectedAt", "status", "submittedAt", "updatedAt", "userId", "withdrawnAt" FROM "Registration";
DROP TABLE "Registration";
ALTER TABLE "new_Registration" RENAME TO "Registration";
CREATE INDEX "Registration_teamId_idx" ON "Registration"("teamId");
CREATE UNIQUE INDEX "Registration_raceId_userId_key" ON "Registration"("raceId", "userId");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registrationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "codeLabel" TEXT NOT NULL,
    "codeContent" TEXT,
    "codeContentHash" TEXT NOT NULL DEFAULT '',
    "recordLabel" TEXT,
    "ridingRecord" TEXT,
    "ridingRecordHash" TEXT NOT NULL DEFAULT '',
    "submitterBindingJson" TEXT NOT NULL DEFAULT '{}',
    "tokenUsed" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "modifiedByUserId" TEXT,
    "changeSummary" TEXT NOT NULL DEFAULT '',
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
    CONSTRAINT "Submission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Submission_modifiedByUserId_fkey" FOREIGN KEY ("modifiedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("agentType", "antiCheatPenalty", "codeContent", "codeContentHash", "codeLabel", "codeReviewScore", "createdAt", "dialogueScore", "id", "keywordScore", "passRate", "progress", "pulledAt", "raceId", "reasoningScore", "recordLabel", "registrationId", "ridingRecord", "ridingRecordHash", "runnerComment", "runnerStatus", "scoredAt", "status", "submitterBindingJson", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore") SELECT "agentType", "antiCheatPenalty", "codeContent", "codeContentHash", "codeLabel", "codeReviewScore", "createdAt", "dialogueScore", "id", "keywordScore", "passRate", "progress", "pulledAt", "raceId", "reasoningScore", "recordLabel", "registrationId", "ridingRecord", "ridingRecordHash", "runnerComment", "runnerStatus", "scoredAt", "status", "submitterBindingJson", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_registrationId_createdAt_idx" ON "Submission"("registrationId", "createdAt");
CREATE INDEX "Submission_teamId_createdAt_idx" ON "Submission"("teamId", "createdAt");
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "leaderId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("captainId", "createdAt", "id", "name", "raceId") SELECT "captainId", "createdAt", "id", "name", "raceId" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_raceId_name_key" ON "Team"("raceId", "name");
CREATE TABLE "new_TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MATE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamMember" ("createdAt", "displayName", "id", "teamId", "userId") SELECT "createdAt", "displayName", "id", "teamId", "userId" FROM "TeamMember";
DROP TABLE "TeamMember";
ALTER TABLE "new_TeamMember" RENAME TO "TeamMember";
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE TABLE "new_Work" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT,
    "teamId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "demoUrl" TEXT NOT NULL DEFAULT '',
    "repoUrl" TEXT NOT NULL DEFAULT '',
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "techNotes" TEXT NOT NULL DEFAULT '',
    "sourceRefJson" TEXT NOT NULL DEFAULT '{}',
    "contentHash" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Work_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Work" ("contentHash", "createdAt", "demoUrl", "id", "registrationId", "repoUrl", "sourceRefJson", "status", "summary", "techNotes", "title", "updatedAt", "videoUrl", "visibility") SELECT "contentHash", "createdAt", "demoUrl", "id", "registrationId", "repoUrl", "sourceRefJson", "status", "summary", "techNotes", "title", "updatedAt", "videoUrl", "visibility" FROM "Work";
DROP TABLE "Work";
ALTER TABLE "new_Work" RENAME TO "Work";
CREATE UNIQUE INDEX "Work_teamId_key" ON "Work"("teamId");
CREATE INDEX "Work_teamId_idx" ON "Work"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TeamTask_teamId_status_idx" ON "TeamTask"("teamId", "status");

-- CreateIndex
CREATE INDEX "CollaborationMessage_teamId_createdAt_idx" ON "CollaborationMessage"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "CollaborationMessage_senderId_receiverId_createdAt_idx" ON "CollaborationMessage"("senderId", "receiverId", "createdAt");
