-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Award" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
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
    CONSTRAINT "Award_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Award_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Award" ("awardName", "createdAt", "decisionReason", "id", "publishedAt", "raceId", "rank", "registrationId", "updatedAt", "workId") SELECT "awardName", "createdAt", "decisionReason", "id", "publishedAt", "raceId", "rank", "registrationId", "updatedAt", "workId" FROM "Award";
DROP TABLE "Award";
ALTER TABLE "new_Award" RENAME TO "Award";
CREATE UNIQUE INDEX "Award_raceId_awardName_rank_key" ON "Award"("raceId", "awardName", "rank");
CREATE TABLE "new_JudgingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judgeAssignmentId" TEXT NOT NULL,
    "scoreResultJson" TEXT NOT NULL,
    "scoreRidingJson" TEXT NOT NULL,
    "comments" TEXT NOT NULL DEFAULT '',
    "sourceRefJson" TEXT NOT NULL DEFAULT '{}',
    "sourceDigest" TEXT NOT NULL DEFAULT '',
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JudgingRecord_judgeAssignmentId_fkey" FOREIGN KEY ("judgeAssignmentId") REFERENCES "JudgeAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JudgingRecord" ("comments", "createdAt", "id", "judgeAssignmentId", "scoreResultJson", "scoreRidingJson", "submittedAt", "updatedAt") SELECT "comments", "createdAt", "id", "judgeAssignmentId", "scoreResultJson", "scoreRidingJson", "submittedAt", "updatedAt" FROM "JudgingRecord";
DROP TABLE "JudgingRecord";
ALTER TABLE "new_JudgingRecord" RENAME TO "JudgingRecord";
CREATE UNIQUE INDEX "JudgingRecord_judgeAssignmentId_key" ON "JudgingRecord"("judgeAssignmentId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "subjectRegistrationId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceRefJson" TEXT NOT NULL DEFAULT '{}',
    "sourceDigest" TEXT NOT NULL DEFAULT '',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_subjectRegistrationId_fkey" FOREIGN KEY ("subjectRegistrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("body", "createdAt", "id", "publishedAt", "raceId", "status", "subjectRegistrationId", "summary", "title", "type", "updatedAt") SELECT "body", "createdAt", "id", "publishedAt", "raceId", "status", "subjectRegistrationId", "summary", "title", "type", "updatedAt" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
