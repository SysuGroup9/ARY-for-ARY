-- CreateTable
CREATE TABLE "SecurityAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT,
    "raceProjectId" TEXT,
    "registrationId" TEXT,
    "userId" TEXT,
    "caConnectionId" TEXT,
    "actorKind" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "payloadDigest" TEXT NOT NULL DEFAULT '',
    "detailsJson" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SecurityAudit_raceId_createdAt_idx" ON "SecurityAudit"("raceId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAudit_registrationId_createdAt_idx" ON "SecurityAudit"("registrationId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAudit_caConnectionId_createdAt_idx" ON "SecurityAudit"("caConnectionId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAudit_action_createdAt_idx" ON "SecurityAudit"("action", "createdAt");
