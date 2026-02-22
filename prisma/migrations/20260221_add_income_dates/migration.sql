-- Add month/year date fields to Income model
ALTER TABLE "Income" ADD COLUMN IF NOT EXISTS "startMonth" INTEGER;
ALTER TABLE "Income" ADD COLUMN IF NOT EXISTS "startYear" INTEGER;
ALTER TABLE "Income" ADD COLUMN IF NOT EXISTS "endMonth" INTEGER;
ALTER TABLE "Income" ADD COLUMN IF NOT EXISTS "endYear" INTEGER;

-- Add comment to explain the fields
COMMENT ON COLUMN "Income"."startMonth" IS 'Start month (1-12) for the income';
COMMENT ON COLUMN "Income"."startYear" IS 'Start year for the income';
COMMENT ON COLUMN "Income"."endMonth" IS 'End month (1-12) for the income';
COMMENT ON COLUMN "Income"."endYear" IS 'End year for the income';