/*
  Warnings:

  - The required column `connectorSecret` was added to the `CAConnection` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "CAIngestionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caConnectionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "signalType" TEXT NOT NULL,
    "signalKind" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CAIngestionEvent_caConnectionId_fkey" FOREIGN KEY ("caConnectionId") REFERENCES "CAConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
INSERT INTO "new_CAConnection" ("caProjectId", "caType", "connectorId", "connectorSecret", "connectorVersion", "createdAt", "disabledAt", "handshakeCompletedAt", "id", "ingestionSource", "ingestionStatus", "lastSyncedAt", "raceProjectId", "registeredAt", "updatedAt")
SELECT
  "caProjectId",
  "caType",
  "connectorId",
  lower(hex(randomblob(16))),
  "connectorVersion",
  "createdAt",
  "disabledAt",
  "handshakeCompletedAt",
  "id",
  "ingestionSource",
  "ingestionStatus",
  "lastSyncedAt",
  "raceProjectId",
  "registeredAt",
  "updatedAt"
FROM "CAConnection";
DROP TABLE "CAConnection";
ALTER TABLE "new_CAConnection" RENAME TO "CAConnection";
CREATE INDEX "CAConnection_raceProjectId_ingestionStatus_idx" ON "CAConnection"("raceProjectId", "ingestionStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CAIngestionEvent_idempotencyKey_key" ON "CAIngestionEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CAIngestionEvent_caConnectionId_observedAt_idx" ON "CAIngestionEvent"("caConnectionId", "observedAt");
