-- Add email preferences and unsubscribe tracking to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "feedbackEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unsubscribeToken" TEXT;

-- Add unique constraint on unsubscribeToken
ALTER TABLE "User" ADD CONSTRAINT "User_unsubscribeToken_key" UNIQUE ("unsubscribeToken");

-- Add index for unsubscribeToken for faster lookups
CREATE INDEX IF NOT EXISTS "User_unsubscribeToken_idx" ON "User"("unsubscribeToken");

-- Generate unsubscribe tokens for existing users
UPDATE "User" SET "unsubscribeToken" = md5(random()::text || clock_timestamp()::text || email)
WHERE "unsubscribeToken" IS NULL;
