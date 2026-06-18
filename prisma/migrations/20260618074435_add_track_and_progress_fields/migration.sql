-- AlterTable
ALTER TABLE "LeaderboardEntry" ADD COLUMN "progress" REAL DEFAULT 0;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "progress" REAL;

-- AlterTable
ALTER TABLE "TeamArchive" ADD COLUMN "progress" REAL DEFAULT 0;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "lastLeaderboardSyncAt" DATETIME,
    "lastShowcaseSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Race_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Race" ("cloudStudioUrl", "createdAt", "displayHighlightCount", "displayShowOrganizerComment", "displayShowRiderCode", "displayShowTopHighlights", "displayShowTrainingData", "enableFreeze", "evaluationNotes", "freezeMinutesBeforeEnd", "harnessWeightKeyword", "harnessWeightReasoning", "hasTrainingData", "id", "keywordsJson", "lastLeaderboardSyncAt", "lastShowcaseSyncAt", "maxTeamSize", "organizerComment", "organizerId", "raceEnd", "raceStart", "signupEnd", "signupStart", "submissionIntervalHours", "summary", "taskDescription", "taskPackageLabel", "title", "tokenLimit", "trainingDataSummary", "updateGranularityMinutes", "updatedAt", "weightCodeReview", "weightKeywords", "weightReasoning", "weightTaskPassRate", "weightTotalDialogue", "weightTotalTask", "weightTotalToken") SELECT "cloudStudioUrl", "createdAt", "displayHighlightCount", "displayShowOrganizerComment", "displayShowRiderCode", "displayShowTopHighlights", "displayShowTrainingData", "enableFreeze", "evaluationNotes", "freezeMinutesBeforeEnd", "harnessWeightKeyword", "harnessWeightReasoning", "hasTrainingData", "id", "keywordsJson", "lastLeaderboardSyncAt", "lastShowcaseSyncAt", "maxTeamSize", "organizerComment", "organizerId", "raceEnd", "raceStart", "signupEnd", "signupStart", "submissionIntervalHours", "summary", "taskDescription", "taskPackageLabel", "title", "tokenLimit", "trainingDataSummary", "updateGranularityMinutes", "updatedAt", "weightCodeReview", "weightKeywords", "weightReasoning", "weightTaskPassRate", "weightTotalDialogue", "weightTotalTask", "weightTotalToken" FROM "Race";
DROP TABLE "Race";
ALTER TABLE "new_Race" RENAME TO "Race";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
