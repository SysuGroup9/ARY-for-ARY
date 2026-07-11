-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CAIngestionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caConnectionId" TEXT NOT NULL,
    "caSessionId" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_CAIngestionEvent" (
    "caConnectionId",
    "caSessionId",
    "createdAt",
    "id",
    "idempotencyKey",
    "integrityStatus",
    "messageId",
    "observedAt",
    "payloadDigest",
    "payloadJson",
    "receivedAt",
    "sequence",
    "signalKind",
    "signalType"
) SELECT
    "caConnectionId",
    COALESCE(json_extract("payloadJson", '$.ca.caSessionId'), ''),
    "createdAt",
    "id",
    "idempotencyKey",
    "integrityStatus",
    "messageId",
    "observedAt",
    "payloadDigest",
    "payloadJson",
    "receivedAt",
    CASE
        WHEN "integrityStatus" = 'INTEGRITY_GAP' THEN NULL
        ELSE "sequence"
    END,
    "signalKind",
    "signalType"
FROM "CAIngestionEvent";
DROP TABLE "CAIngestionEvent";
ALTER TABLE "new_CAIngestionEvent" RENAME TO "CAIngestionEvent";
CREATE UNIQUE INDEX "CAIngestionEvent_idempotencyKey_key" ON "CAIngestionEvent"("idempotencyKey");
CREATE INDEX "CAIngestionEvent_caConnectionId_observedAt_idx" ON "CAIngestionEvent"("caConnectionId", "observedAt");
CREATE UNIQUE INDEX "CAIngestionEvent_caConnectionId_caSessionId_sequence_key" ON "CAIngestionEvent"("caConnectionId", "caSessionId", "sequence");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
