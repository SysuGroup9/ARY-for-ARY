-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CooperationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submitterId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "raceTitle" TEXT NOT NULL,
    "raceSummary" TEXT NOT NULL,
    "taskDescription" TEXT NOT NULL,
    "trainingDataSummary" TEXT NOT NULL DEFAULT '',
    "evaluationNotes" TEXT NOT NULL,
    "keywordsText" TEXT NOT NULL,
    "signupStart" TEXT NOT NULL,
    "signupEnd" TEXT NOT NULL,
    "raceStart" TEXT NOT NULL,
    "raceEnd" TEXT NOT NULL,
    "tokenLimit" INTEGER NOT NULL DEFAULT 4000,
    "maxTeamSize" INTEGER NOT NULL DEFAULT 5,
    "submissionIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "freezeMinutesBeforeEnd" INTEGER NOT NULL DEFAULT 30,
    "hasTrainingData" BOOLEAN NOT NULL DEFAULT true,
    "enableFreeze" BOOLEAN NOT NULL DEFAULT true,
    "displayShowTrainingData" BOOLEAN NOT NULL DEFAULT true,
    "displayShowOrganizerComment" BOOLEAN NOT NULL DEFAULT true,
    "displayShowTopHighlights" BOOLEAN NOT NULL DEFAULT true,
    "displayShowRiderCode" BOOLEAN NOT NULL DEFAULT true,
    "taskPackageFileName" TEXT NOT NULL DEFAULT '',
    "taskPackageFilePath" TEXT NOT NULL DEFAULT '',
    "taskPackageFileHash" TEXT NOT NULL DEFAULT '',
    "proposalFileName" TEXT NOT NULL DEFAULT '',
    "proposalFilePath" TEXT NOT NULL DEFAULT '',
    "proposalFileHash" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CooperationRequest" ("companyName", "contactEmail", "contactName", "contactPhone", "createdAt", "displayShowOrganizerComment", "displayShowRiderCode", "displayShowTopHighlights", "displayShowTrainingData", "enableFreeze", "evaluationNotes", "freezeMinutesBeforeEnd", "hasTrainingData", "id", "keywordsText", "maxTeamSize", "notes", "proposalFileName", "proposalFilePath", "raceEnd", "raceStart", "raceSummary", "raceTitle", "signupEnd", "signupStart", "status", "submissionIntervalHours", "submitterId", "taskDescription", "taskPackageFileName", "taskPackageFilePath", "tokenLimit", "trainingDataSummary", "updatedAt") SELECT "companyName", "contactEmail", "contactName", "contactPhone", "createdAt", "displayShowOrganizerComment", "displayShowRiderCode", "displayShowTopHighlights", "displayShowTrainingData", "enableFreeze", "evaluationNotes", "freezeMinutesBeforeEnd", "hasTrainingData", "id", "keywordsText", "maxTeamSize", "notes", "proposalFileName", "proposalFilePath", "raceEnd", "raceStart", "raceSummary", "raceTitle", "signupEnd", "signupStart", "status", "submissionIntervalHours", "submitterId", "taskDescription", "taskPackageFileName", "taskPackageFilePath", "tokenLimit", "trainingDataSummary", "updatedAt" FROM "CooperationRequest";
DROP TABLE "CooperationRequest";
ALTER TABLE "new_CooperationRequest" RENAME TO "CooperationRequest";
CREATE TABLE "new_Race" (
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
    "trackId" TEXT NOT NULL DEFAULT 'oval-track',
    "trackConfigJson" TEXT NOT NULL DEFAULT '',
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
    "harnessWeightReasoning" REAL NOT NULL DEFAULT 0.6,
    "harnessWeightKeyword" REAL NOT NULL DEFAULT 0.4,
    "organizerComment" TEXT NOT NULL DEFAULT '',
    "status" TEXT,
    "challengeSourceRefJson" TEXT NOT NULL DEFAULT '{}',
    "challengeContentHash" TEXT NOT NULL DEFAULT '',
    "lastLeaderboardSyncAt" DATETIME,
    "lastShowcaseSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Race_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Race" ("cloudStudioUrl", "createdAt", "displayHighlightCount", "displayShowOrganizerComment", "displayShowRiderCode", "displayShowTopHighlights", "displayShowTrainingData", "enableFreeze", "evaluationNotes", "freezeMinutesBeforeEnd", "harnessWeightKeyword", "harnessWeightReasoning", "hasTrainingData", "id", "keywordsJson", "lastLeaderboardSyncAt", "lastShowcaseSyncAt", "maxTeamSize", "organizerComment", "organizerId", "raceEnd", "raceStart", "signupEnd", "signupStart", "status", "submissionIntervalHours", "summary", "taskDescription", "taskPackageLabel", "title", "tokenLimit", "trackConfigJson", "trackId", "trainingDataSummary", "updateGranularityMinutes", "updatedAt", "weightCodeReview", "weightKeywords", "weightReasoning", "weightTaskPassRate", "weightTotalDialogue", "weightTotalTask", "weightTotalToken") SELECT "cloudStudioUrl", "createdAt", "displayHighlightCount", "displayShowOrganizerComment", "displayShowRiderCode", "displayShowTopHighlights", "displayShowTrainingData", "enableFreeze", "evaluationNotes", "freezeMinutesBeforeEnd", "harnessWeightKeyword", "harnessWeightReasoning", "hasTrainingData", "id", "keywordsJson", "lastLeaderboardSyncAt", "lastShowcaseSyncAt", "maxTeamSize", "organizerComment", "organizerId", "raceEnd", "raceStart", "signupEnd", "signupStart", "status", "submissionIntervalHours", "summary", "taskDescription", "taskPackageLabel", "title", "tokenLimit", "trackConfigJson", "trackId", "trainingDataSummary", "updateGranularityMinutes", "updatedAt", "weightCodeReview", "weightKeywords", "weightReasoning", "weightTaskPassRate", "weightTotalDialogue", "weightTotalTask", "weightTotalToken" FROM "Race";
DROP TABLE "Race";
ALTER TABLE "new_Race" RENAME TO "Race";
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
INSERT INTO "new_Submission" ("agentType", "antiCheatPenalty", "codeContent", "codeLabel", "codeReviewScore", "createdAt", "dialogueScore", "id", "keywordScore", "passRate", "progress", "pulledAt", "raceId", "reasoningScore", "recordLabel", "registrationId", "ridingRecord", "runnerComment", "runnerStatus", "scoredAt", "status", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore") SELECT "agentType", "antiCheatPenalty", "codeContent", "codeLabel", "codeReviewScore", "createdAt", "dialogueScore", "id", "keywordScore", "passRate", "progress", "pulledAt", "raceId", "reasoningScore", "recordLabel", "registrationId", "ridingRecord", "runnerComment", "runnerStatus", "scoredAt", "status", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore" FROM "Submission";
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
    "codeContentHash" TEXT NOT NULL DEFAULT '',
    "recordLabel" TEXT,
    "ridingRecord" TEXT,
    "ridingRecordHash" TEXT NOT NULL DEFAULT '',
    "submitterBindingJson" TEXT NOT NULL DEFAULT '{}',
    "tokenUsed" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmissionArtifact_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubmissionArtifact_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubmissionArtifact_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SubmissionArtifact_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionArtifact" ("agentType", "codeContent", "codeLabel", "createdAt", "id", "raceId", "recordLabel", "registrationId", "ridingRecord", "submissionId", "teamId", "tokenUsed") SELECT "agentType", "codeContent", "codeLabel", "createdAt", "id", "raceId", "recordLabel", "registrationId", "ridingRecord", "submissionId", "teamId", "tokenUsed" FROM "SubmissionArtifact";
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
    "codeContentHash" TEXT NOT NULL DEFAULT '',
    "recordLabel" TEXT,
    "ridingRecord" TEXT,
    "ridingRecordHash" TEXT NOT NULL DEFAULT '',
    "submitterBindingJson" TEXT NOT NULL DEFAULT '{}',
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
INSERT INTO "new_TeamArchive" ("agentType", "antiCheatPenalty", "codeContent", "codeLabel", "createdAt", "dialogueScore", "id", "keywordScore", "progress", "raceId", "reasoningScore", "recordLabel", "registrationId", "ridingRecord", "submissionId", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore") SELECT "agentType", "antiCheatPenalty", "codeContent", "codeLabel", "createdAt", "dialogueScore", "id", "keywordScore", "progress", "raceId", "reasoningScore", "recordLabel", "registrationId", "ridingRecord", "submissionId", "taskScore", "teamId", "tokenScore", "tokenUsed", "totalScore" FROM "TeamArchive";
DROP TABLE "TeamArchive";
ALTER TABLE "new_TeamArchive" RENAME TO "TeamArchive";
CREATE INDEX "TeamArchive_registrationId_idx" ON "TeamArchive"("registrationId");
CREATE UNIQUE INDEX "TeamArchive_raceId_teamId_key" ON "TeamArchive"("raceId", "teamId");
CREATE TABLE "new_Work" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
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
    CONSTRAINT "Work_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Work" ("createdAt", "demoUrl", "id", "registrationId", "repoUrl", "status", "summary", "techNotes", "title", "updatedAt", "videoUrl", "visibility") SELECT "createdAt", "demoUrl", "id", "registrationId", "repoUrl", "status", "summary", "techNotes", "title", "updatedAt", "videoUrl", "visibility" FROM "Work";
DROP TABLE "Work";
ALTER TABLE "new_Work" RENAME TO "Work";
CREATE UNIQUE INDEX "Work_registrationId_key" ON "Work"("registrationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
