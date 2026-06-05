-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "taskPackageLabel" TEXT NOT NULL,
    "taskDescription" TEXT NOT NULL,
    "trainingDataSummary" TEXT NOT NULL,
    "hasTrainingData" BOOLEAN NOT NULL DEFAULT false,
    "evaluationNotes" TEXT NOT NULL,
    "keywordsJson" TEXT NOT NULL,
    "tokenLimit" INTEGER NOT NULL,
    "signupStart" DATETIME NOT NULL,
    "signupEnd" DATETIME NOT NULL,
    "raceStart" DATETIME NOT NULL,
    "raceEnd" DATETIME NOT NULL,
    "enableFreeze" BOOLEAN NOT NULL DEFAULT false,
    "freezeMinutesBeforeEnd" INTEGER NOT NULL DEFAULT 0,
    "updateGranularityMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxTeamSize" INTEGER NOT NULL DEFAULT 5,
    "submissionIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "cloudStudioUrl" TEXT NOT NULL,
    "displayShowTrainingData" BOOLEAN NOT NULL DEFAULT false,
    "displayShowOrganizerComment" BOOLEAN NOT NULL DEFAULT false,
    "displayShowTopHighlights" BOOLEAN NOT NULL DEFAULT false,
    "displayHighlightCount" INTEGER NOT NULL DEFAULT 3,
    "displayShowRiderCode" BOOLEAN NOT NULL DEFAULT false,
    "weightTaskPassRate" REAL NOT NULL,
    "weightCodeReview" REAL NOT NULL,
    "weightReasoning" REAL NOT NULL,
    "weightKeywords" REAL NOT NULL,
    "weightTotalTask" REAL NOT NULL,
    "weightTotalToken" REAL NOT NULL,
    "weightTotalDialogue" REAL NOT NULL,
    "organizerComment" TEXT NOT NULL DEFAULT '',
    "lastLeaderboardSyncAt" DATETIME,
    "lastShowcaseSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Race_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "codeLabel" TEXT NOT NULL,
    "codeContent" TEXT,
    "recordLabel" TEXT NOT NULL,
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
    "antiCheatPenalty" REAL,
    "runnerComment" TEXT,
    "runnerStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pulledAt" DATETIME,
    "scoredAt" DATETIME,
    CONSTRAINT "Submission_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamArchive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "codeLabel" TEXT NOT NULL,
    "codeContent" TEXT NOT NULL,
    "recordLabel" TEXT NOT NULL,
    "ridingRecord" TEXT NOT NULL,
    "tokenUsed" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "taskScore" REAL NOT NULL,
    "dialogueScore" REAL NOT NULL,
    "tokenScore" REAL NOT NULL,
    "reasoningScore" REAL NOT NULL,
    "keywordScore" REAL NOT NULL,
    "totalScore" REAL NOT NULL,
    "antiCheatPenalty" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamArchive_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamArchive_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedbackThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeedbackThread_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackThread_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedbackMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "FeedbackThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "totalScore" REAL NOT NULL,
    "taskScore" REAL NOT NULL,
    "tokenScore" REAL NOT NULL,
    "dialogueScore" REAL NOT NULL,
    "agentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaderboardEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HarnessEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "harnessScore" REAL NOT NULL,
    "reasoningScore" REAL NOT NULL,
    "keywordScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HarnessEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarnessEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RidingHighlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "agentType" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "codeSnippet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RidingHighlight_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RidingHighlight_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamComment_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamComment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Team_raceId_captainId_key" ON "Team"("raceId", "captainId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamArchive_raceId_teamId_key" ON "TeamArchive"("raceId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamComment_raceId_teamId_key" ON "TeamComment"("raceId", "teamId");
