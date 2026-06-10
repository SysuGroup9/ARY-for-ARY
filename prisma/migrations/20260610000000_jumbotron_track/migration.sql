-- AddColumns Race: trackId, checkpointCount (Organizer 创赛时选择赛道模板和检查点数量)
ALTER TABLE "Race" ADD COLUMN "trackId" TEXT NOT NULL DEFAULT 'oval-standard';
ALTER TABLE "Race" ADD COLUMN "checkpointCount" INTEGER NOT NULL DEFAULT 3;
