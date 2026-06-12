-- AlterTable: add trackDirection and trackStartFinishS to Race
ALTER TABLE "Race" ADD COLUMN "trackDirection" TEXT NOT NULL DEFAULT 'counterclockwise';
ALTER TABLE "Race" ADD COLUMN "trackStartFinishS" REAL NOT NULL DEFAULT 0.0;
