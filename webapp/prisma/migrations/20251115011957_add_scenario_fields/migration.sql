/*
  Warnings:

  - You are about to drop the column `annualSpendingGoal` on the `Scenario` table. All the data in the column will be lost.
  - You are about to drop the column `investmentReturn` on the `Scenario` table. All the data in the column will be lost.
  - Added the required column `annualExpenses` to the `Scenario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentAge` to the `Scenario` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currentAge" INTEGER NOT NULL,
    "retirementAge" INTEGER NOT NULL,
    "lifeExpectancy" INTEGER NOT NULL DEFAULT 95,
    "province" TEXT NOT NULL DEFAULT 'ON',
    "rrspBalance" REAL NOT NULL DEFAULT 0,
    "tfsaBalance" REAL NOT NULL DEFAULT 0,
    "nonRegBalance" REAL NOT NULL DEFAULT 0,
    "realEstateValue" REAL NOT NULL DEFAULT 0,
    "employmentIncome" REAL NOT NULL DEFAULT 0,
    "pensionIncome" REAL NOT NULL DEFAULT 0,
    "rentalIncome" REAL NOT NULL DEFAULT 0,
    "otherIncome" REAL NOT NULL DEFAULT 0,
    "cppStartAge" INTEGER NOT NULL DEFAULT 65,
    "oasStartAge" INTEGER NOT NULL DEFAULT 65,
    "averageCareerIncome" REAL NOT NULL DEFAULT 0,
    "yearsOfCPPContributions" INTEGER NOT NULL DEFAULT 40,
    "yearsInCanada" INTEGER NOT NULL DEFAULT 40,
    "annualExpenses" REAL NOT NULL,
    "expenseInflationRate" REAL NOT NULL DEFAULT 2.0,
    "investmentReturnRate" REAL NOT NULL DEFAULT 5.0,
    "inflationRate" REAL NOT NULL DEFAULT 2.0,
    "rrspToRrifAge" INTEGER NOT NULL DEFAULT 71,
    "projectionResults" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Scenario" ("cppStartAge", "createdAt", "description", "id", "inflationRate", "isBaseline", "lifeExpectancy", "name", "oasStartAge", "retirementAge", "updatedAt", "userId") SELECT "cppStartAge", "createdAt", "description", "id", "inflationRate", "isBaseline", "lifeExpectancy", "name", "oasStartAge", "retirementAge", "updatedAt", "userId" FROM "Scenario";
DROP TABLE "Scenario";
ALTER TABLE "new_Scenario" RENAME TO "Scenario";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
