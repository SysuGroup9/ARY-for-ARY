-- CreateTable
CREATE TABLE "ScreenDisplay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'JUMBOTRON',
    "theme" TEXT NOT NULL DEFAULT 'default',
    "fallbackMode" TEXT NOT NULL DEFAULT 'AUTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScreenDisplay_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScreenDisplay_raceId_key" ON "ScreenDisplay"("raceId");

-- CreateIndex
CREATE INDEX "ScreenDisplay_raceId_mode_fallbackMode_idx" ON "ScreenDisplay"("raceId", "mode", "fallbackMode");
