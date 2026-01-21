/**
 * E2E tests for scenario persistence feature
 * Tests the full API flow: save, load, update, delete
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Scenario Persistence', () => {
  let testUserEmail: string;
  let testUserId: string;
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    // Create test user
    testUserEmail = `test-scenarios-${Date.now()}@example.com`;

    const signupResponse = await request.post('/api/auth/signup', {
      data: {
        email: testUserEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(signupResponse.ok()).toBeTruthy();

    // Login to get session
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: testUserEmail,
        password: 'TestPassword123!',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Get session cookie
    const cookies = await loginResponse.headersArray();
    const setCookieHeader = cookies.find(h => h.name.toLowerCase() === 'set-cookie');
    authCookie = setCookieHeader?.value || '';

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });
    testUserId = user!.id;
  });

  test.afterAll(async () => {
    // Clean up: delete test user and all their scenarios
    await prisma.savedSimulationScenario.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  test('should save a scenario successfully', async ({ request }) => {
    const mockInputData = {
      p1: {
        age: 55,
        retirement_age: 65,
        life_expectancy: 95,
        rrsp_balance: 500000,
        tfsa_balance: 100000,
        non_reg_balance: 50000,
        employment_income: 80000,
        pension_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
        tfsa_contribution_annual: 7000,
      },
      p2: {
        age: 53,
        retirement_age: 65,
        life_expectancy: 95,
        rrsp_balance: 400000,
        tfsa_balance: 80000,
        non_reg_balance: 30000,
        employment_income: 70000,
        pension_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
        tfsa_contribution_annual: 7000,
      },
      province: 'ON',
      strategy: 'corporate-optimized',
      spending_go_go: 60000,
      spending_slow_go: 45000,
      spending_no_go: 35000,
    };

    const response = await request.post('/api/saved-scenarios', {
      headers: {
        Cookie: authCookie,
      },
      data: {
        name: 'E2E Test Scenario',
        description: 'Test scenario from E2E test',
        scenarioType: 'custom',
        inputData: mockInputData,
        hasResults: false,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.scenario).toBeDefined();
    expect(data.scenario.name).toBe('E2E Test Scenario');
    expect(data.scenario.id).toBeDefined();
  });

  test('should list saved scenarios', async ({ request }) => {
    const response = await request.get('/api/saved-scenarios', {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.scenarios).toBeDefined();
    expect(Array.isArray(data.scenarios)).toBe(true);
    expect(data.scenarios.length).toBeGreaterThan(0);
    expect(data.count).toBeGreaterThan(0);
  });

  test('should enforce freemium limits (3 scenarios max for free users)', async ({ request }) => {
    const mockInputData = {
      p1: { age: 55, retirement_age: 65, life_expectancy: 95 },
      p2: { age: 53, retirement_age: 65, life_expectancy: 95 },
      province: 'ON',
      strategy: 'corporate-optimized',
      spending_go_go: 60000,
      spending_slow_go: 45000,
      spending_no_go: 35000,
    };

    // Create scenarios until we hit the limit
    for (let i = 2; i <= 3; i++) {
      const response = await request.post('/api/saved-scenarios', {
        headers: {
          Cookie: authCookie,
        },
        data: {
          name: `Test Scenario ${i}`,
          description: 'Test scenario',
          scenarioType: 'custom',
          inputData: mockInputData,
        },
      });

      expect(response.ok()).toBeTruthy();
    }

    // Try to create a 4th scenario (should fail)
    const response = await request.post('/api/saved-scenarios', {
      headers: {
        Cookie: authCookie,
      },
      data: {
        name: 'Test Scenario 4',
        description: 'Should fail',
        scenarioType: 'custom',
        inputData: mockInputData,
      },
    });

    expect(response.status()).toBe(403);
    const data = await response.json();

    expect(data.requiresPremium).toBe(true);
    expect(data.error).toContain('Free users can only save up to 3 scenarios');
  });

  test('should update a scenario', async ({ request }) => {
    // Get the first scenario
    const listResponse = await request.get('/api/saved-scenarios', {
      headers: {
        Cookie: authCookie,
      },
    });

    const listData = await listResponse.json();
    const scenarioId = listData.scenarios[0].id;

    // Update it
    const updateResponse = await request.put(`/api/saved-scenarios/${scenarioId}`, {
      headers: {
        Cookie: authCookie,
      },
      data: {
        isFavorite: true,
        name: 'Updated Scenario Name',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();

    expect(updateData.success).toBe(true);
    expect(updateData.scenario.isFavorite).toBe(true);
  });

  test('should delete a scenario', async ({ request }) => {
    // Get all scenarios
    const listResponse = await request.get('/api/saved-scenarios', {
      headers: {
        Cookie: authCookie,
      },
    });

    const listData = await listResponse.json();
    const initialCount = listData.scenarios.length;
    const scenarioId = listData.scenarios[0].id;

    // Delete it
    const deleteResponse = await request.delete(`/api/saved-scenarios/${scenarioId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();

    expect(deleteData.success).toBe(true);

    // Verify it's gone
    const verifyResponse = await request.get('/api/saved-scenarios', {
      headers: {
        Cookie: authCookie,
      },
    });

    const verifyData = await verifyResponse.json();
    expect(verifyData.scenarios.length).toBe(initialCount - 1);
  });

  test('should not allow access without authentication', async ({ request }) => {
    const response = await request.get('/api/saved-scenarios');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('should not allow deleting another users scenario', async ({ request }) => {
    // Try to delete a scenario with a fake ID
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request.delete(`/api/saved-scenarios/${fakeId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Scenario not found');
  });
});
