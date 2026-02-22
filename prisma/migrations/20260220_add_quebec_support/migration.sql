-- Add Quebec-specific fields to Income table for QPP tracking
ALTER TABLE "Income"
ADD COLUMN IF NOT EXISTS "qppContributions" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "qppYearsContributed" INTEGER,
ADD COLUMN IF NOT EXISTS "qppPensionableEarnings" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "qppEstimatedBenefit" DOUBLE PRECISION;

-- Create QuebecBenefits table for Quebec-specific benefits
CREATE TABLE IF NOT EXISTS "quebec_benefits" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "solidarityCredit" DOUBLE PRECISION,
    "workPremium" DOUBLE PRECISION,
    "seniorAssistance" DOUBLE PRECISION,
    "homeSupportCredit" DOUBLE PRECISION,
    "qppRetirementSupplement" DOUBLE PRECISION,
    "drugInsurancePremium" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quebec_benefits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quebec_benefits_userId_key" UNIQUE ("userId")
);

-- Add foreign key constraint
ALTER TABLE "quebec_benefits"
ADD CONSTRAINT "quebec_benefits_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "quebec_benefits_userId_idx" ON "quebec_benefits"("userId");

-- Add comment to Income type field to indicate QPP support
COMMENT ON COLUMN "Income"."type" IS 'employment, cpp, oas, pension, rental, business, investment, other, qpp';