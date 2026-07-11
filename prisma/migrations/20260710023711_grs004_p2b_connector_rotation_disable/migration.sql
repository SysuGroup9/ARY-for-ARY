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
    "credentialFingerprint" TEXT NOT NULL DEFAULT '',
    "publicKeyPem" TEXT NOT NULL DEFAULT '',
    "signatureVersion" TEXT NOT NULL DEFAULT '',
    "secretVersion" INTEGER NOT NULL DEFAULT 1,
    "secretRotatedAt" DATETIME,
    "disabledReason" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_CAConnection" ("caProjectId", "caType", "connectorBaseUrl", "connectorId", "connectorSecret", "connectorVersion", "createdAt", "credentialFingerprint", "disabledAt", "handshakeCompletedAt", "id", "ingestionSource", "ingestionStatus", "lastSyncedAt", "publicKeyPem", "raceProjectId", "registeredAt", "signatureVersion", "updatedAt") SELECT "caProjectId", "caType", "connectorBaseUrl", "connectorId", "connectorSecret", "connectorVersion", "createdAt", "credentialFingerprint", "disabledAt", "handshakeCompletedAt", "id", "ingestionSource", "ingestionStatus", "lastSyncedAt", "publicKeyPem", "raceProjectId", "registeredAt", "signatureVersion", "updatedAt" FROM "CAConnection";
DROP TABLE "CAConnection";
ALTER TABLE "new_CAConnection" RENAME TO "CAConnection";
CREATE INDEX "CAConnection_raceProjectId_ingestionStatus_idx" ON "CAConnection"("raceProjectId", "ingestionStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
