PRAGMA foreign_keys=OFF;

-- Rebuild Submission so Riding Record becomes optional at submission time.
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
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
    "antiCheatPenalty" REAL,
    "runnerComment" TEXT,
    "runnerStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pulledAt" DATETIME,
    "scoredAt" DATETIME,
    CONSTRAINT "Submission_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Submission" (
    "id","raceId","teamId","status","codeLabel","codeContent","recordLabel","ridingRecord",
    "tokenUsed","agentType","passRate","codeReviewScore","reasoningScore","keywordScore",
    "tokenScore","taskScore","dialogueScore","totalScore","antiCheatPenalty","runnerComment",
    "runnerStatus","createdAt","pulledAt","scoredAt"
)
SELECT
    "id","raceId","teamId","status","codeLabel","codeContent","recordLabel","ridingRecord",
    "tokenUsed","agentType","passRate","codeReviewScore","reasoningScore","keywordScore",
    "tokenScore","taskScore","dialogueScore","totalScore","antiCheatPenalty","runnerComment",
    "runnerStatus","createdAt","pulledAt","scoredAt"
FROM "Submission";

DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";

-- Rebuild TeamArchive so optional sub-scores and record fields can remain empty.
CREATE TABLE "new_TeamArchive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
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
    "antiCheatPenalty" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamArchive_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamArchive_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_TeamArchive" (
    "id","raceId","teamId","submissionId","codeLabel","codeContent","recordLabel","ridingRecord",
    "tokenUsed","agentType","taskScore","dialogueScore","tokenScore","reasoningScore",
    "keywordScore","totalScore","antiCheatPenalty","createdAt"
)
SELECT
    "id","raceId","teamId","submissionId","codeLabel","codeContent","recordLabel","ridingRecord",
    "tokenUsed","agentType","taskScore","dialogueScore","tokenScore","reasoningScore",
    "keywordScore","totalScore","antiCheatPenalty","createdAt"
FROM "TeamArchive";

DROP TABLE "TeamArchive";
ALTER TABLE "new_TeamArchive" RENAME TO "TeamArchive";

CREATE UNIQUE INDEX "TeamArchive_raceId_teamId_key" ON "TeamArchive"("raceId", "teamId");

-- Rebuild LeaderboardEntry so sub-scores may be missing when organizer only returns total score.
CREATE TABLE "new_LeaderboardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "totalScore" REAL NOT NULL,
    "taskScore" REAL,
    "tokenScore" REAL,
    "dialogueScore" REAL,
    "agentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaderboardEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_LeaderboardEntry" (
    "id","raceId","teamId","submissionId","totalScore","taskScore","tokenScore",
    "dialogueScore","agentType","createdAt"
)
SELECT
    "id","raceId","teamId","submissionId","totalScore","taskScore","tokenScore",
    "dialogueScore","agentType","createdAt"
FROM "LeaderboardEntry";

DROP TABLE "LeaderboardEntry";
ALTER TABLE "new_LeaderboardEntry" RENAME TO "LeaderboardEntry";

CREATE UNIQUE INDEX "LeaderboardEntry_raceId_teamId_key" ON "LeaderboardEntry"("raceId", "teamId");

-- Rebuild HarnessEntry so explanation sub-scores are optional.
CREATE TABLE "new_HarnessEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "harnessScore" REAL NOT NULL,
    "reasoningScore" REAL,
    "keywordScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HarnessEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarnessEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_HarnessEntry" (
    "id","raceId","teamId","harnessScore","reasoningScore","keywordScore","createdAt"
)
SELECT
    "id","raceId","teamId","harnessScore","reasoningScore","keywordScore","createdAt"
FROM "HarnessEntry";

DROP TABLE "HarnessEntry";
ALTER TABLE "new_HarnessEntry" RENAME TO "HarnessEntry";

CREATE UNIQUE INDEX "HarnessEntry_raceId_teamId_key" ON "HarnessEntry"("raceId", "teamId");

-- Create immutable submission artifacts used by runner tasks.
CREATE TABLE "SubmissionArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
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
    CONSTRAINT "SubmissionArtifact_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create runner task queue.
CREATE TABLE "RunnerTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
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
    CONSTRAINT "RunnerTask_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunnerTask_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "SubmissionArtifact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SubmissionArtifact_submissionId_key" ON "SubmissionArtifact"("submissionId");
CREATE INDEX "RunnerTask_raceId_status_createdAt_idx" ON "RunnerTask"("raceId", "status", "createdAt");
CREATE INDEX "RunnerTask_teamId_taskType_createdAt_idx" ON "RunnerTask"("teamId", "taskType", "createdAt");

PRAGMA foreign_keys=ON;
