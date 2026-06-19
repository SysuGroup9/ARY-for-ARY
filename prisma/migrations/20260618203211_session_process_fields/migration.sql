-- AlterTable
ALTER TABLE "Session" ADD COLUMN "currentGoal" TEXT;
ALTER TABLE "Session" ADD COLUMN "latestActivity" TEXT;
ALTER TABLE "Session" ADD COLUMN "progressPercent" INTEGER;
ALTER TABLE "Session" ADD COLUMN "riskLevel" TEXT;
ALTER TABLE "Session" ADD COLUMN "riskReason" TEXT;
ALTER TABLE "Session" ADD COLUMN "taskStatus" TEXT;
