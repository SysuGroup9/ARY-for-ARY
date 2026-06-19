-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CAConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceProjectId" TEXT NOT NULL,
    "caType" TEXT NOT NULL,
    "ingestionSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "connectorId" TEXT NOT NULL,
    "connectorSecret" TEXT NOT NULL,
    "connectorBaseUrl" TEXT NOT NULL DEFAULT '',
    "connectorVersion" TEXT NOT NULL DEFAULT '',
    "caProjectId" TEXT NOT NULL,
    "ingestionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handshakeCompletedAt" DATETIME,
    "disabledAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CAConnection_raceProjectId_fkey" FOREIGN KEY ("raceProjectId") REFERENCES "RaceProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CAConnection" ("caProjectId", "caType", "connectorId", "connectorSecret", "connectorVersion", "createdAt", "disabledAt", "handshakeCompletedAt", "id", "ingestionSource", "ingestionStatus", "lastSyncedAt", "raceProjectId", "registeredAt", "updatedAt") SELECT "caProjectId", "caType", "connectorId", "connectorSecret", "connectorVersion", "createdAt", "disabledAt", "handshakeCompletedAt", "id", "ingestionSource", "ingestionStatus", "lastSyncedAt", "raceProjectId", "registeredAt", "updatedAt" FROM "CAConnection";
DROP TABLE "CAConnection";
ALTER TABLE "new_CAConnection" RENAME TO "CAConnection";
CREATE INDEX "CAConnection_raceProjectId_ingestionStatus_idx" ON "CAConnection"("raceProjectId", "ingestionStatus");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caConnectionId" TEXT NOT NULL,
    "caSessionId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "toolCallCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCost" INTEGER NOT NULL DEFAULT 0,
    "allRidingMessageLength" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" DATETIME,
    "snapshotFetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_caConnectionId_fkey" FOREIGN KEY ("caConnectionId") REFERENCES "CAConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("caConnectionId", "caSessionId", "createdAt", "endedAt", "id", "lastActiveAt", "messageCount", "startedAt", "tokenCost", "toolCallCount", "updatedAt") SELECT "caConnectionId", "caSessionId", "createdAt", "endedAt", "id", "lastActiveAt", "messageCount", "startedAt", "tokenCost", "toolCallCount", "updatedAt" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_caConnectionId_startedAt_idx" ON "Session"("caConnectionId", "startedAt");
CREATE UNIQUE INDEX "Session_caConnectionId_caSessionId_key" ON "Session"("caConnectionId", "caSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
