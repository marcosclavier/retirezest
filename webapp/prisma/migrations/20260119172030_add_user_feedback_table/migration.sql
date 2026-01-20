-- CreateTable
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feedbackType" TEXT NOT NULL,
    "triggerContext" TEXT,
    "satisfactionScore" INTEGER,
    "npsScore" INTEGER,
    "helpfulnessScore" INTEGER,
    "didSimulationHelp" TEXT,
    "missingFeatures" TEXT,
    "improvementAreas" TEXT,
    "whatWouldMakeUseful" TEXT,
    "whatIsConfusing" TEXT,
    "improvementSuggestion" TEXT,
    "additionalComments" TEXT,
    "pageUrl" TEXT,
    "referrerUrl" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "userAge" INTEGER,
    "userProvince" TEXT,
    "includesPartner" BOOLEAN,
    "subscriptionTier" TEXT,
    "simulationCount" INTEGER,
    "daysSinceSignup" INTEGER,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "responseNotes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'new',
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_feedback_userId_idx" ON "user_feedback"("userId");

-- CreateIndex
CREATE INDEX "user_feedback_feedbackType_idx" ON "user_feedback"("feedbackType");

-- CreateIndex
CREATE INDEX "user_feedback_status_idx" ON "user_feedback"("status");

-- CreateIndex
CREATE INDEX "user_feedback_priority_idx" ON "user_feedback"("priority");

-- CreateIndex
CREATE INDEX "user_feedback_createdAt_idx" ON "user_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "user_feedback_satisfactionScore_idx" ON "user_feedback"("satisfactionScore");

-- CreateIndex
CREATE INDEX "user_feedback_npsScore_idx" ON "user_feedback"("npsScore");

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
