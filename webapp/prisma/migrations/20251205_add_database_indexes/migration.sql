-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Income_userId_idx" ON "Income"("userId");

-- CreateIndex
CREATE INDEX "Income_userId_type_idx" ON "Income"("userId", "type");

-- CreateIndex
CREATE INDEX "Income_createdAt_idx" ON "Income"("createdAt");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE INDEX "Asset_userId_type_idx" ON "Asset"("userId", "type");

-- CreateIndex
CREATE INDEX "Asset_createdAt_idx" ON "Asset"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_userId_category_idx" ON "Expense"("userId", "category");

-- CreateIndex
CREATE INDEX "Expense_userId_isEssential_idx" ON "Expense"("userId", "isEssential");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Debt_userId_idx" ON "Debt"("userId");

-- CreateIndex
CREATE INDEX "Debt_userId_type_idx" ON "Debt"("userId", "type");

-- CreateIndex
CREATE INDEX "Debt_createdAt_idx" ON "Debt"("createdAt");

-- CreateIndex
CREATE INDEX "Scenario_userId_idx" ON "Scenario"("userId");

-- CreateIndex
CREATE INDEX "Scenario_userId_isBaseline_idx" ON "Scenario"("userId", "isBaseline");

-- CreateIndex
CREATE INDEX "Scenario_createdAt_idx" ON "Scenario"("createdAt");

-- CreateIndex
CREATE INDEX "Projection_userId_idx" ON "Projection"("userId");

-- CreateIndex
CREATE INDEX "Projection_scenarioId_idx" ON "Projection"("scenarioId");

-- CreateIndex
CREATE INDEX "Projection_userId_scenarioId_idx" ON "Projection"("userId", "scenarioId");

-- CreateIndex
CREATE INDEX "Projection_createdAt_idx" ON "Projection"("createdAt");

-- CreateIndex
CREATE INDEX "Projection_calculationDate_idx" ON "Projection"("calculationDate");
