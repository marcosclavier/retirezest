-- AlterTable
ALTER TABLE "User" ADD COLUMN "simulationRunsToday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "simulationRunsDate" TIMESTAMP(3);
