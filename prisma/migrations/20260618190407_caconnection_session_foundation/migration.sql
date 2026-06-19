-- CreateTable
CREATE TABLE "CAConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceProjectId" TEXT NOT NULL,
    "caType" TEXT NOT NULL,
    "ingestionSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "connectorId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caConnectionId" TEXT NOT NULL,
    "caSessionId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "toolCallCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCost" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_caConnectionId_fkey" FOREIGN KEY ("caConnectionId") REFERENCES "CAConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CAConnection_raceProjectId_ingestionStatus_idx" ON "CAConnection"("raceProjectId", "ingestionStatus");

-- CreateIndex
CREATE INDEX "Session_caConnectionId_startedAt_idx" ON "Session"("caConnectionId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_caConnectionId_caSessionId_key" ON "Session"("caConnectionId", "caSessionId");
