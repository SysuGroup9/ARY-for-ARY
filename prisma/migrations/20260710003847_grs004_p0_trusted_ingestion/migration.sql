-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CAIngestionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caConnectionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequence" INTEGER,
    "payloadDigest" TEXT NOT NULL DEFAULT '',
    "integrityStatus" TEXT NOT NULL DEFAULT 'OK',
    "signalType" TEXT NOT NULL,
    "signalKind" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CAIngestionEvent_caConnectionId_fkey" FOREIGN KEY ("caConnectionId") REFERENCES "CAConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CAIngestionEvent" ("caConnectionId", "createdAt", "id", "idempotencyKey", "messageId", "observedAt", "payloadJson", "signalKind", "signalType") SELECT "caConnectionId", "createdAt", "id", "idempotencyKey", "messageId", "observedAt", "payloadJson", "signalKind", "signalType" FROM "CAIngestionEvent";
DROP TABLE "CAIngestionEvent";
ALTER TABLE "new_CAIngestionEvent" RENAME TO "CAIngestionEvent";
CREATE UNIQUE INDEX "CAIngestionEvent_idempotencyKey_key" ON "CAIngestionEvent"("idempotencyKey");
CREATE INDEX "CAIngestionEvent_caConnectionId_observedAt_idx" ON "CAIngestionEvent"("caConnectionId", "observedAt");
CREATE TABLE "new_Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceRefJson" TEXT NOT NULL,
    "sourceDigest" TEXT NOT NULL DEFAULT '',
    "generatedFromEventIdsJson" TEXT NOT NULL DEFAULT '[]',
    "reviewFlagJson" TEXT NOT NULL DEFAULT '[]',
    "integrityStatus" TEXT NOT NULL DEFAULT 'OK',
    "confidenceLevel" TEXT NOT NULL DEFAULT 'HIGH',
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("createdAt", "id", "registrationId", "sourceRefJson", "summary", "title", "type", "updatedAt", "visibility") SELECT "createdAt", "id", "registrationId", "sourceRefJson", "summary", "title", "type", "updatedAt", "visibility" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
CREATE INDEX "Evidence_registrationId_type_idx" ON "Evidence"("registrationId", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
