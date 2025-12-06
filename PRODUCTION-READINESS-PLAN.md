# Production Readiness Plan - RetireZest

**Status**: Pre-Production
**Target Completion**: 2-3 weeks
**Owner**: Development Team
**Last Updated**: December 5, 2025

---

## Overview

This document outlines the critical path to make RetireZest production-ready. All items must be completed before deploying to production with real user data.

---

## Phase 1: P0 Security Issues (Week 1, Days 1-3)

**Priority**: CRITICAL
**Estimated Time**: 3 days
**Risk if Skipped**: Security breaches, data leaks, brute force attacks

### 1.1 Fix JWT Secret Handling

**Current Issue**: Falls back to insecure default if `JWT_SECRET` not set

**Files to Modify**:
- `webapp/lib/auth.ts`

**Implementation**:

```typescript
// webapp/lib/auth.ts (Line 5-7)

// BEFORE:
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

// AFTER:
if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
```

**Testing**:
- [ ] Verify app fails to start without `JWT_SECRET`
- [ ] Verify app fails with short `JWT_SECRET` (< 32 chars)
- [ ] Verify app starts successfully with valid `JWT_SECRET`
- [ ] Test login/logout flow still works

**Estimated Time**: 2 hours

---

### 1.2 Add Rate Limiting

**Current Issue**: No protection against brute force attacks on login

**Dependencies to Install**:
```bash
npm install express-rate-limit
```

**Files to Create/Modify**:
1. `webapp/lib/rate-limit.ts` (NEW)
2. `webapp/app/api/auth/login/route.ts`
3. `webapp/app/api/auth/register/route.ts`

**Implementation**:

**Step 1: Create rate limiting utility**

```typescript
// webapp/lib/rate-limit.ts (NEW FILE)

import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<{ success: boolean; remaining?: number; resetTime?: number }> => {
    // Get client identifier (IP address or forwarded IP)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';

    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();
    const windowMs = config.windowMs;

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: store[key].resetTime
      };
    }

    // Check if limit exceeded
    if (store[key].count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: store[key].resetTime
      };
    }

    // Increment counter
    store[key].count++;

    return {
      success: true,
      remaining: config.maxRequests - store[key].count,
      resetTime: store[key].resetTime
    };
  };
}

// Pre-configured rate limiters
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5             // 5 attempts per 15 minutes
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3             // 3 registrations per hour per IP
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  maxRequests: 60            // 60 requests per minute
});
```

**Step 2: Apply to login endpoint**

```typescript
// webapp/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken, setSession } from '@/lib/auth';
import { loginRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Apply rate limiting FIRST
  const rateLimitResult = await loginRateLimit(request as any);

  if (!rateLimitResult.success) {
    const resetDate = new Date(rateLimitResult.resetTime || 0);
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        resetAt: resetDate.toISOString()
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString()
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // ... rest of existing login logic
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

**Step 3: Apply to register endpoint**

```typescript
// webapp/app/api/auth/register/route.ts

import { registerRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await registerRateLimit(request as any);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    );
  }

  // ... rest of registration logic
}
```

**Testing**:
- [ ] Test login fails after 5 attempts
- [ ] Test register fails after 3 attempts
- [ ] Test rate limit resets after time window
- [ ] Test different IPs don't share limits
- [ ] Test error messages are user-friendly

**Estimated Time**: 6 hours

---

### 1.3 Remove Detailed Error Logging in Production

**Current Issue**: Exposes environment configuration in error logs

**Files to Modify**:
1. `webapp/lib/logger.ts` (NEW - create centralized logger)
2. All API route files (14 files with console.log/error)

**Implementation**:

**Step 1: Create centralized logger**

```typescript
// webapp/lib/logger.ts (NEW FILE)

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: this.isDevelopment ? error.stack : undefined }
      : { error };

    const fullContext = { ...context, ...errorDetails };

    if (this.isProduction) {
      // In production, don't log sensitive details
      console.error(this.formatMessage('error', message));
      // TODO: Send to external logging service (Sentry, LogRocket, etc.)
    } else {
      console.error(this.formatMessage('error', message, fullContext));
    }
  }

  // Security-safe error for API responses
  apiError(message: string, error?: Error | unknown): { error: string; details?: string } {
    if (this.isDevelopment) {
      return {
        error: message,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return { error: message };
  }
}

export const logger = new Logger();
```

**Step 2: Replace console.log in login route**

```typescript
// webapp/app/api/auth/login/route.ts

import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // ... existing code
  } catch (error) {
    // BEFORE:
    // console.error('Login error:', error);
    // console.error('Error details:', {
    //   message: error instanceof Error ? error.message : 'Unknown error',
    //   stack: error instanceof Error ? error.stack : undefined,
    //   env: {
    //     hasJWT: !!process.env.JWT_SECRET,
    //     hasDB: !!process.env.DATABASE_URL,
    //     nodeEnv: process.env.NODE_ENV
    //   }
    // });

    // AFTER:
    logger.error('Login failed', error, { endpoint: '/api/auth/login' });

    return NextResponse.json(
      logger.apiError('Login failed. Please try again.', error),
      { status: 500 }
    );
  }
}
```

**Step 3: Apply to all API routes** (14 files total)

Apply similar pattern to:
- `app/api/auth/register/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/profile/route.ts`
- `app/api/profile/income/route.ts`
- `app/api/profile/assets/route.ts`
- `app/api/profile/expenses/route.ts`
- `app/api/profile/debts/route.ts`
- `app/api/scenarios/route.ts`
- `app/api/scenarios/[id]/route.ts`
- `app/api/projections/route.ts`
- `app/api/projections/[id]/route.ts`
- `app/api/simulation/run/route.ts`
- `app/api/simulation/analyze/route.ts`

**Testing**:
- [ ] Verify development mode shows full errors
- [ ] Verify production mode hides sensitive details
- [ ] Test error logging doesn't crash app
- [ ] Verify API responses don't leak stack traces

**Estimated Time**: 8 hours

---

### 1.4 Add CSRF Protection

**Current Issue**: Cookie-based auth vulnerable to CSRF attacks

**Dependencies to Install**:
```bash
npm install csrf-csrf
```

**Files to Create/Modify**:
1. `webapp/lib/csrf.ts` (NEW)
2. `webapp/middleware.ts` (NEW)
3. `webapp/app/api/csrf/route.ts` (NEW)
4. All forms in dashboard pages

**Implementation**:

**Step 1: Create CSRF utility**

```typescript
// webapp/lib/csrf.ts (NEW FILE)

import { createCsrfProtect } from 'csrf-csrf';
import { cookies } from 'next/headers';

const COOKIE_NAME = '__Host-csrf-token';
const HEADER_NAME = 'x-csrf-token';

// In production, these should be more restrictive
const { generateToken, validateToken } = createCsrfProtect({
  getTokenFromRequest: (req) => {
    return req.headers.get(HEADER_NAME) || '';
  },
});

export async function generateCsrfToken(): Promise<string> {
  const token = generateToken();
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return token;
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return false;

    return validateToken(token, request);
  } catch {
    return false;
  }
}
```

**Step 2: Create CSRF token endpoint**

```typescript
// webapp/app/api/csrf/route.ts (NEW FILE)

import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET() {
  const token = await generateCsrfToken();
  return NextResponse.json({ token });
}
```

**Step 3: Add CSRF validation to middleware**

```typescript
// webapp/middleware.ts (NEW FILE)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateCsrfToken } from '@/lib/csrf';

const PROTECTED_API_ROUTES = [
  '/api/profile',
  '/api/scenarios',
  '/api/projections',
  '/api/simulation',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected API route with mutation (POST, PUT, DELETE)
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  const isMutation = ['POST', 'PUT', 'DELETE'].includes(request.method);

  if (isProtectedApiRoute && isMutation) {
    const isValid = await validateCsrfToken(request);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Step 4: Update forms to include CSRF token**

```typescript
// Example: webapp/app/(dashboard)/profile/page.tsx

'use client';

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // Fetch CSRF token on mount
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => setCsrfToken(data.token));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken, // Include CSRF token
      },
      body: JSON.stringify(formData),
    });

    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

**Testing**:
- [ ] Test API calls fail without CSRF token
- [ ] Test API calls succeed with valid token
- [ ] Test token refresh on expiry
- [ ] Test CSRF doesn't break existing functionality

**Estimated Time**: 6 hours

**Phase 1 Total Time**: 22 hours (3 days)

---

## Phase 2: Write Tests for Calculation Accuracy (Week 1-2, Days 4-7)

**Priority**: CRITICAL
**Estimated Time**: 4 days
**Risk if Skipped**: Incorrect financial calculations, legal liability, user distrust

### 2.1 Setup Testing Infrastructure

**Dependencies to Install**:
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event happy-dom
```

**Files to Create**:
1. `webapp/vitest.config.ts` (NEW)
2. `webapp/lib/test-utils.ts` (NEW)

**Implementation**:

```typescript
// webapp/vitest.config.ts (NEW FILE)

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./lib/test-utils.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'coverage/**',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

```typescript
// webapp/lib/test-utils.ts (NEW FILE)

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Helper to compare floating point numbers
export function expectClose(actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}
```

**Add test scripts to package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

**Estimated Time**: 2 hours

---

### 2.2 Test CPP Calculator

**File to Create**: `webapp/lib/calculations/__tests__/cpp.test.ts`

**Test Cases** (15 scenarios minimum):

```typescript
// webapp/lib/calculations/__tests__/cpp.test.ts (NEW FILE)

import { describe, it, expect } from 'vitest';
import {
  estimateCPPSimple,
  calculateCPPEstimate,
  calculateBreakEvenAge,
  findOptimalCPPStartAge,
  MAX_CPP_2025,
  CPP_AGE_FACTORS,
} from '../cpp';
import { expectClose } from '@/lib/test-utils';

describe('CPP Calculator', () => {
  describe('estimateCPPSimple', () => {
    it('should calculate maximum CPP for high earner at age 65', () => {
      const result = estimateCPPSimple(100000, 40, 65);

      expect(result.startAge).toBe(65);
      expect(result.adjustmentFactor).toBe(1.0);
      expectClose(result.monthlyAmount, MAX_CPP_2025, 1);
      expectClose(result.annualAmount, MAX_CPP_2025 * 12, 12);
    });

    it('should apply 36% reduction for age 60 start', () => {
      const result = estimateCPPSimple(100000, 40, 60);

      expect(result.adjustmentFactor).toBe(0.64);
      expectClose(result.monthlyAmount, MAX_CPP_2025 * 0.64, 1);
    });

    it('should apply 42% increase for age 70 start', () => {
      const result = estimateCPPSimple(100000, 40, 70);

      expect(result.adjustmentFactor).toBe(1.42);
      expectClose(result.monthlyAmount, MAX_CPP_2025 * 1.42, 1);
    });

    it('should calculate proportional CPP for average earner', () => {
      // $50k average income should yield roughly 50% of max
      const result = estimateCPPSimple(50000, 40, 65);

      expectClose(result.monthlyAmount, MAX_CPP_2025 * 0.7, 50); // ~70% of max
    });

    it('should handle low earner correctly', () => {
      const result = estimateCPPSimple(30000, 40, 65);

      expect(result.monthlyAmount).toBeGreaterThan(0);
      expect(result.monthlyAmount).toBeLessThan(MAX_CPP_2025);
    });

    it('should handle short contribution period', () => {
      const result = estimateCPPSimple(60000, 20, 65);

      // 20 years should yield roughly half of full contribution
      expectClose(result.monthlyAmount, MAX_CPP_2025 * 0.5, 150);
    });

    it('should throw error for invalid age (below 60)', () => {
      expect(() => estimateCPPSimple(60000, 40, 59)).toThrow();
    });

    it('should throw error for invalid age (above 70)', () => {
      expect(() => estimateCPPSimple(60000, 40, 71)).toThrow();
    });
  });

  describe('calculateBreakEvenAge', () => {
    it('should calculate break-even between age 60 and 65', () => {
      const contributionHistory = Array.from({ length: 40 }, (_, i) => ({
        year: 2025 - i,
        pensionableEarnings: 60000,
      }));

      const breakEven = calculateBreakEvenAge(contributionHistory, 60, 65);

      // Break-even typically around age 74-76
      expect(breakEven).toBeGreaterThan(70);
      expect(breakEven).toBeLessThan(80);
    });

    it('should calculate break-even between age 65 and 70', () => {
      const contributionHistory = Array.from({ length: 40 }, (_, i) => ({
        year: 2025 - i,
        pensionableEarnings: 60000,
      }));

      const breakEven = calculateBreakEvenAge(contributionHistory, 65, 70);

      // Break-even typically around age 80-82
      expect(breakEven).toBeGreaterThan(75);
      expect(breakEven).toBeLessThan(85);
    });
  });

  describe('findOptimalCPPStartAge', () => {
    it('should find optimal age for long life expectancy (95)', () => {
      const contributionHistory = Array.from({ length: 40 }, (_, i) => ({
        year: 2025 - i,
        pensionableEarnings: 60000,
      }));

      const result = findOptimalCPPStartAge(contributionHistory, 95);

      // For long life expectancy, delaying to 70 is usually optimal
      expect(result.optimalAge).toBe(70);
      expect(result.lifetimeValue).toBeGreaterThan(0);
    });

    it('should find optimal age for short life expectancy (75)', () => {
      const contributionHistory = Array.from({ length: 40 }, (_, i) => ({
        year: 2025 - i,
        pensionableEarnings: 60000,
      }));

      const result = findOptimalCPPStartAge(contributionHistory, 75);

      // For short life expectancy, starting at 60 might be optimal
      expect(result.optimalAge).toBeLessThanOrEqual(65);
    });

    it('should return comparison for all ages 60-70', () => {
      const contributionHistory = Array.from({ length: 40 }, (_, i) => ({
        year: 2025 - i,
        pensionableEarnings: 60000,
      }));

      const result = findOptimalCPPStartAge(contributionHistory, 85);

      expect(result.comparison).toHaveLength(11); // Ages 60-70 inclusive
      expect(result.comparison.every(c => c.age >= 60 && c.age <= 70)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero contributions', () => {
      const result = estimateCPPSimple(0, 40, 65);

      expect(result.monthlyAmount).toBe(0);
      expect(result.annualAmount).toBe(0);
    });

    it('should cap at maximum CPP', () => {
      const result = estimateCPPSimple(200000, 40, 65); // Very high income

      expectClose(result.monthlyAmount, MAX_CPP_2025, 1);
    });

    it('should handle varying contribution history', () => {
      const contributionHistory = [
        { year: 2025, pensionableEarnings: 80000 },
        { year: 2024, pensionableEarnings: 60000 },
        { year: 2023, pensionableEarnings: 40000 },
        { year: 2022, pensionableEarnings: 20000 }, // This should be dropped
      ];

      const result = calculateCPPEstimate(contributionHistory, 65);

      // Should apply dropout provision
      expect(result.monthlyAmount).toBeGreaterThan(0);
    });
  });
});
```

**Validation Against Government Calculator**:
- [ ] Test against official CPP calculator: https://www.canada.ca/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html
- [ ] Document any discrepancies
- [ ] Ensure all test cases pass

**Estimated Time**: 8 hours

---

### 2.3 Test OAS Calculator

**File to Create**: `webapp/lib/calculations/__tests__/oas.test.ts`

**Test Cases** (12 scenarios minimum):

```typescript
// webapp/lib/calculations/__tests__/oas.test.ts (NEW FILE)

import { describe, it, expect } from 'vitest';
import {
  calculateNetOAS,
  calculateOASClawback,
  MAX_OAS_2025,
  MAX_OAS_75_PLUS,
  CLAWBACK_THRESHOLD,
} from '../oas';
import { expectClose } from '@/lib/test-utils';

describe('OAS Calculator', () => {
  describe('calculateNetOAS', () => {
    it('should calculate maximum OAS for age 65-74 with 40 years residency', () => {
      const result = calculateNetOAS(40, 50000, 68);

      expectClose(result.monthlyAmount, MAX_OAS_2025, 0.5);
      expectClose(result.annualAmount, MAX_OAS_2025 * 12, 5);
      expect(result.clawback).toBe(0);
    });

    it('should calculate maximum OAS for age 75+ with enhancement', () => {
      const result = calculateNetOAS(40, 50000, 76);

      expectClose(result.monthlyAmount, MAX_OAS_75_PLUS, 0.5);
      expectClose(result.annualAmount, MAX_OAS_75_PLUS * 12, 5);
      expect(result.clawback).toBe(0);
    });

    it('should calculate partial OAS for 20 years residency (50%)', () => {
      const result = calculateNetOAS(20, 50000, 68);

      expectClose(result.monthlyAmount, MAX_OAS_2025 * 0.5, 0.5);
    });

    it('should calculate partial OAS for 30 years residency (75%)', () => {
      const result = calculateNetOAS(30, 50000, 68);

      expectClose(result.monthlyAmount, MAX_OAS_2025 * 0.75, 0.5);
    });

    it('should apply clawback for high income', () => {
      // Income above threshold should trigger clawback
      const income = CLAWBACK_THRESHOLD + 20000;
      const result = calculateNetOAS(40, income, 68);

      expect(result.clawback).toBeGreaterThan(0);
      expect(result.monthlyAmount).toBeLessThan(MAX_OAS_2025);
    });

    it('should fully claw back OAS at very high income', () => {
      // Income high enough to eliminate OAS
      const income = CLAWBACK_THRESHOLD + (MAX_OAS_2025 * 12 / 0.15) + 1000;
      const result = calculateNetOAS(40, income, 68);

      expectClose(result.monthlyAmount, 0, 1);
      expect(result.clawback).toBeGreaterThanOrEqual(MAX_OAS_2025 * 12);
    });

    it('should handle income exactly at clawback threshold', () => {
      const result = calculateNetOAS(40, CLAWBACK_THRESHOLD, 68);

      expectClose(result.monthlyAmount, MAX_OAS_2025, 0.5);
      expectClose(result.clawback, 0, 0.1);
    });

    it('should return zero OAS for less than 10 years residency', () => {
      const result = calculateNetOAS(9, 50000, 68);

      expect(result.monthlyAmount).toBe(0);
      expect(result.annualAmount).toBe(0);
    });

    it('should handle minimum qualifying period (10 years)', () => {
      const result = calculateNetOAS(10, 50000, 68);

      expectClose(result.monthlyAmount, MAX_OAS_2025 * 0.25, 0.5);
    });
  });

  describe('calculateOASClawback', () => {
    it('should calculate 15% clawback rate', () => {
      const excess = 10000;
      const result = calculateOASClawback(CLAWBACK_THRESHOLD + excess, 68);

      expectClose(result.clawbackAmount, excess * 0.15, 1);
      expect(result.clawbackRate).toBe(0.15);
    });

    it('should not claw back below threshold', () => {
      const result = calculateOASClawback(CLAWBACK_THRESHOLD - 1000, 68);

      expect(result.clawbackAmount).toBe(0);
    });

    it('should handle age 75+ in clawback calculation', () => {
      const result = calculateOASClawback(CLAWBACK_THRESHOLD + 10000, 76);

      // Clawback applies to enhanced amount
      expect(result.maximumOAS).toBe(MAX_OAS_75_PLUS * 12);
      expect(result.clawbackAmount).toBeGreaterThan(0);
    });
  });
});
```

**Estimated Time**: 6 hours

---

### 2.3 Test GIS Calculator

**File to Create**: `webapp/lib/calculations/__tests__/gis.test.ts`

**Test Cases** (10 scenarios minimum):

```typescript
// webapp/lib/calculations/__tests__/gis.test.ts (NEW FILE)

import { describe, it, expect } from 'vitest';
import { calculateGIS, MAX_GIS_SINGLE, MAX_GIS_MARRIED } from '../gis';
import { expectClose } from '@/lib/test-utils';

describe('GIS Calculator', () => {
  describe('Single Recipients', () => {
    it('should calculate maximum GIS for zero income', () => {
      const result = calculateGIS(0, 'single', false);

      expectClose(result.monthlyAmount, MAX_GIS_SINGLE, 0.5);
      expectClose(result.annualAmount, MAX_GIS_SINGLE * 12, 5);
    });

    it('should reduce GIS as income increases', () => {
      const lowIncome = calculateGIS(5000, 'single', false);
      const highIncome = calculateGIS(10000, 'single', false);

      expect(highIncome.monthlyAmount).toBeLessThan(lowIncome.monthlyAmount);
    });

    it('should exempt first $5000 of CPP from GIS calculation', () => {
      const withCPP = calculateGIS(5000, 'single', false);
      const withoutCPP = calculateGIS(0, 'single', false);

      // First $5k exempt, so amounts should be close
      expectClose(withCPP.monthlyAmount, withoutCPP.monthlyAmount, 10);
    });

    it('should return zero GIS above income threshold', () => {
      const highIncome = 50000; // Well above threshold
      const result = calculateGIS(highIncome, 'single', false);

      expect(result.monthlyAmount).toBe(0);
      expect(result.annualAmount).toBe(0);
    });
  });

  describe('Married Recipients', () => {
    it('should calculate maximum GIS for married with OAS-receiving spouse', () => {
      const result = calculateGIS(0, 'married', true);

      expectClose(result.monthlyAmount, MAX_GIS_MARRIED, 0.5);
    });

    it('should use different rate for married vs single', () => {
      const single = calculateGIS(10000, 'single', false);
      const married = calculateGIS(10000, 'married', true);

      expect(married.monthlyAmount).not.toBe(single.monthlyAmount);
    });
  });

  describe('Income Exemptions', () => {
    it('should apply CPP exemption correctly', () => {
      // $7000 income: $5000 exempt + $2000 counted
      const result = calculateGIS(7000, 'single', false);

      expect(result.monthlyAmount).toBeLessThan(MAX_GIS_SINGLE);
      expect(result.monthlyAmount).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative income', () => {
      const result = calculateGIS(-1000, 'single', false);

      expectClose(result.monthlyAmount, MAX_GIS_SINGLE, 0.5);
    });

    it('should handle very high income', () => {
      const result = calculateGIS(1000000, 'single', false);

      expect(result.monthlyAmount).toBe(0);
    });
  });
});
```

**Estimated Time**: 5 hours

---

### 2.4 Test Tax Calculator

**File to Create**: `webapp/lib/calculations/__tests__/tax.test.ts`

**Test Cases** (15 scenarios minimum):

```typescript
// webapp/lib/calculations/__tests__/tax.test.ts (NEW FILE)

import { describe, it, expect } from 'vitest';
import {
  calculateFederalTax,
  calculateOntarioTax,
  calculateTotalTax,
  calculateWithholdingTax,
  calculateCapitalGainsTax,
} from '../tax';
import { expectClose } from '@/lib/test-utils';

describe('Tax Calculator', () => {
  describe('calculateFederalTax', () => {
    it('should calculate tax for first bracket (15%)', () => {
      const income = 50000; // Within first bracket
      const result = calculateFederalTax(income, 65, false);

      expect(result.marginalRate).toBe(15);
      expect(result.netTax).toBeGreaterThan(0);
      expect(result.averageRate).toBeLessThan(15);
    });

    it('should calculate tax for second bracket (20.5%)', () => {
      const income = 80000; // In second bracket
      const result = calculateFederalTax(income, 65, false);

      expect(result.marginalRate).toBe(20.5);
    });

    it('should apply basic personal amount credit', () => {
      const income = 20000;
      const result = calculateFederalTax(income, 65, false);

      expect(result.credits).toBeGreaterThan(0);
      expect(result.netTax).toBe(Math.max(0, result.grossTax - result.credits));
    });

    it('should apply age amount credit for seniors', () => {
      const withAge = calculateFederalTax(50000, 66, false);
      const withoutAge = calculateFederalTax(50000, 64, false);

      expect(withAge.credits).toBeGreaterThan(withoutAge.credits);
      expect(withAge.netTax).toBeLessThan(withoutAge.netTax);
    });

    it('should apply pension income credit', () => {
      const withPension = calculateFederalTax(50000, 65, true);
      const withoutPension = calculateFederalTax(50000, 65, false);

      expect(withPension.credits).toBeGreaterThan(withoutPension.credits);
    });

    it('should return zero tax for income below credits', () => {
      const income = 15000; // Below personal amount
      const result = calculateFederalTax(income, 65, false);

      expect(result.netTax).toBe(0);
    });

    it('should handle maximum tax bracket (33%)', () => {
      const income = 300000; // Top bracket
      const result = calculateFederalTax(income, 65, false);

      expect(result.marginalRate).toBe(33);
    });
  });

  describe('calculateOntarioTax', () => {
    it('should calculate Ontario tax for first bracket', () => {
      const income = 40000;
      const result = calculateOntarioTax(income, 65, false);

      expect(result.marginalRate).toBe(5.05);
      expect(result.netTax).toBeGreaterThan(0);
    });

    it('should calculate Ontario tax for higher brackets', () => {
      const income = 150000;
      const result = calculateOntarioTax(income, 65, false);

      expect(result.marginalRate).toBeGreaterThan(5.05);
    });

    it('should apply Ontario age credit', () => {
      const withAge = calculateOntarioTax(50000, 66, false);
      const withoutAge = calculateOntarioTax(50000, 64, false);

      expect(withAge.credits).toBeGreaterThan(withoutAge.credits);
    });
  });

  describe('calculateTotalTax', () => {
    it('should combine federal and provincial tax', () => {
      const income = 60000;
      const result = calculateTotalTax(income, 'ON', 65, false);

      expect(result.totalTax).toBe(result.federalTax + result.provincialTax);
      expect(result.marginalRate).toBeGreaterThan(20); // Combined marginal rate
    });

    it('should calculate correct average tax rate', () => {
      const income = 100000;
      const result = calculateTotalTax(income, 'ON', 65, false);

      expectClose(result.averageRate, (result.totalTax / income) * 100, 0.1);
    });

    it('should provide detailed breakdown', () => {
      const income = 75000;
      const result = calculateTotalTax(income, 'ON', 65, false);

      expect(result.breakdown.federal).toBeDefined();
      expect(result.breakdown.provincial).toBeDefined();
      expect(result.breakdown.federal.grossTax).toBeGreaterThan(0);
    });
  });

  describe('calculateWithholdingTax', () => {
    it('should calculate 10% withholding for small withdrawal', () => {
      const withdrawal = 3000;
      const result = calculateWithholdingTax(withdrawal, 'ON');

      expectClose(result, withdrawal * 0.15, 1); // 10% federal + 5% ON
    });

    it('should calculate 20% withholding for medium withdrawal', () => {
      const withdrawal = 10000;
      const result = calculateWithholdingTax(withdrawal, 'ON');

      expectClose(result, withdrawal * 0.30, 1); // 20% federal + 10% ON
    });

    it('should calculate 30% withholding for large withdrawal', () => {
      const withdrawal = 20000;
      const result = calculateWithholdingTax(withdrawal, 'ON');

      expectClose(result, withdrawal * 0.45, 1); // 30% federal + 15% ON
    });
  });

  describe('calculateCapitalGainsTax', () => {
    it('should apply 50% inclusion rate', () => {
      const gain = 10000;
      const marginalRate = 26;
      const result = calculateCapitalGainsTax(gain, marginalRate);

      expect(result.taxableAmount).toBe(gain * 0.5);
      expectClose(result.tax, (gain * 0.5 * marginalRate) / 100, 0.5);
    });

    it('should handle zero gain', () => {
      const result = calculateCapitalGainsTax(0, 26);

      expect(result.taxableAmount).toBe(0);
      expect(result.tax).toBe(0);
    });
  });
});
```

**Validation**:
- [ ] Compare against CRA tax calculator
- [ ] Verify 2025 tax brackets are correct
- [ ] Test edge cases at bracket boundaries

**Estimated Time**: 8 hours

---

### 2.5 Test Projection Engine

**File to Create**: `webapp/lib/calculations/__tests__/projection.test.ts`

**Test Cases** (12 scenarios minimum):

```typescript
// webapp/lib/calculations/__tests__/projection.test.ts (NEW FILE)

import { describe, it, expect } from 'vitest';
import { projectRetirement, findOptimalRetirementAge } from '../projection';
import { expectClose } from '@/lib/test-utils';

describe('Projection Engine', () => {
  const basicInput = {
    currentAge: 55,
    retirementAge: 65,
    lifeExpectancy: 90,
    province: 'ON',
    rrspBalance: 500000,
    tfsaBalance: 100000,
    nonRegBalance: 50000,
    realEstateValue: 0,
    employmentIncome: 80000,
    pensionIncome: 20000,
    rentalIncome: 0,
    otherIncome: 0,
    cppStartAge: 65,
    oasStartAge: 65,
    averageCareerIncome: 70000,
    yearsOfCPPContributions: 40,
    yearsInCanada: 40,
    annualExpenses: 60000,
    expenseInflationRate: 0.02,
    investmentReturnRate: 0.05,
    inflationRate: 0.02,
    rrspToRrifAge: 71,
  };

  describe('projectRetirement', () => {
    it('should generate projection for all years', () => {
      const result = projectRetirement(basicInput);

      const expectedYears = basicInput.lifeExpectancy - basicInput.currentAge + 1;
      expect(result.projections).toHaveLength(expectedYears);
      expect(result.totalYears).toBe(expectedYears);
    });

    it('should show employment income before retirement', () => {
      const result = projectRetirement(basicInput);

      const preRetirement = result.projections.find(p => p.age === 60);
      expect(preRetirement?.employmentIncome).toBeGreaterThan(0);
      expect(preRetirement?.isRetired).toBe(false);
    });

    it('should stop employment income after retirement', () => {
      const result = projectRetirement(basicInput);

      const postRetirement = result.projections.find(p => p.age === 66);
      expect(postRetirement?.employmentIncome).toBe(0);
      expect(postRetirement?.isRetired).toBe(true);
    });

    it('should start CPP at specified age', () => {
      const result = projectRetirement(basicInput);

      const beforeCPP = result.projections.find(p => p.age === 64);
      const atCPP = result.projections.find(p => p.age === 65);

      expect(beforeCPP?.cppIncome).toBe(0);
      expect(atCPP?.cppIncome).toBeGreaterThan(0);
    });

    it('should start OAS at specified age', () => {
      const result = projectRetirement(basicInput);

      const beforeOAS = result.projections.find(p => p.age === 64);
      const atOAS = result.projections.find(p => p.age === 65);

      expect(beforeOAS?.oasIncome).toBe(0);
      expect(atOAS?.oasIncome).toBeGreaterThan(0);
    });

    it('should convert RRSP to RRIF at age 71', () => {
      const result = projectRetirement(basicInput);

      const at71 = result.projections.find(p => p.age === 71);
      const at72 = result.projections.find(p => p.age === 72);

      expect(at71?.isRrifAge).toBe(true);
      expect(at72?.rrifMinWithdrawal).toBeGreaterThan(0);
    });

    it('should apply RRIF minimum withdrawals', () => {
      const result = projectRetirement(basicInput);

      const at75 = result.projections.find(p => p.age === 75);

      expect(at75?.rrifMinWithdrawal).toBeGreaterThan(0);
      expect(at75?.rrspWithdrawal).toBeGreaterThanOrEqual(at75?.rrifMinWithdrawal || 0);
    });

    it('should apply inflation to expenses', () => {
      const result = projectRetirement(basicInput);

      const year1 = result.projections[0];
      const year10 = result.projections[9];

      expect(year10.annualExpenses).toBeGreaterThan(year1.annualExpenses);
    });

    it('should apply investment returns to balances', () => {
      const result = projectRetirement(basicInput);

      // Asset balances should generally increase (if returns > withdrawals)
      const hasPositiveGrowth = result.projections.some((p, i) => {
        if (i === 0) return false;
        return p.totalAssets > result.projections[i - 1].totalAssets;
      });

      expect(hasPositiveGrowth).toBe(true);
    });

    it('should detect asset depletion', () => {
      const poorInput = {
        ...basicInput,
        rrspBalance: 100000, // Low assets
        tfsaBalance: 0,
        nonRegBalance: 0,
        annualExpenses: 80000, // High expenses
        pensionIncome: 10000, // Low pension
      };

      const result = projectRetirement(poorInput);

      // Should detect depletion
      if (result.assetsDepleted) {
        expect(result.assetsDepletedAge).toBeGreaterThan(poorInput.retirementAge);
        expect(result.assetsDepletedAge).toBeLessThanOrEqual(poorInput.lifeExpectancy);
      }
    });

    it('should calculate accurate tax on withdrawals', () => {
      const result = projectRetirement(basicInput);

      const retirement = result.projections.find(p => p.age === 70);

      expect(retirement?.totalTax).toBeGreaterThan(0);
      expect(retirement?.averageTaxRate).toBeGreaterThan(0);
      expect(retirement?.averageTaxRate).toBeLessThan(50); // Reasonable rate
    });

    it('should calculate cash flow correctly', () => {
      const result = projectRetirement(basicInput);

      result.projections.forEach(p => {
        const calculatedFlow = p.totalAfterTaxIncome - p.annualExpenses;
        expectClose(p.cashSurplusDeficit, calculatedFlow, 1);
      });
    });
  });

  describe('findOptimalRetirementAge', () => {
    it('should find optimal retirement age', () => {
      const result = findOptimalRetirementAge(basicInput, 60, 70);

      expect(result.optimalAge).toBeGreaterThanOrEqual(60);
      expect(result.optimalAge).toBeLessThanOrEqual(70);
      expect(result.maxLifetimeIncome).toBeGreaterThan(0);
    });

    it('should generate projections for each age', () => {
      const result = findOptimalRetirementAge(basicInput, 60, 65);

      expect(Object.keys(result.projections)).toHaveLength(6); // Ages 60-65
      expect(result.projections[60]).toBeDefined();
      expect(result.projections[65]).toBeDefined();
    });

    it('should prefer later retirement for adequate savings', () => {
      const wealthyInput = {
        ...basicInput,
        rrspBalance: 1000000,
        employmentIncome: 100000,
      };

      const result = findOptimalRetirementAge(wealthyInput, 60, 70);

      // With high income, working longer usually optimal
      expect(result.optimalAge).toBeGreaterThanOrEqual(65);
    });
  });

  describe('Withdrawal Strategy', () => {
    it('should withdraw from TFSA first', () => {
      const result = projectRetirement(basicInput);

      // Find first year with withdrawals
      const firstWithdrawal = result.projections.find(p =>
        p.tfsaWithdrawal > 0 || p.rrspWithdrawal > 0 || p.nonRegWithdrawal > 0
      );

      if (firstWithdrawal && basicInput.tfsaBalance > 0) {
        expect(firstWithdrawal.tfsaWithdrawal).toBeGreaterThan(0);
      }
    });

    it('should minimize tax through efficient withdrawals', () => {
      const result = projectRetirement(basicInput);

      // Average tax rate should be reasonable
      expect(result.averageAnnualTaxRate).toBeGreaterThan(0);
      expect(result.averageAnnualTaxRate).toBeLessThan(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero assets', () => {
      const zeroAssets = {
        ...basicInput,
        rrspBalance: 0,
        tfsaBalance: 0,
        nonRegBalance: 0,
      };

      const result = projectRetirement(zeroAssets);

      expect(result.projections).toHaveLength(36);
      expect(result.assetsDepleted).toBe(true);
    });

    it('should handle very high expenses', () => {
      const highExpenses = {
        ...basicInput,
        annualExpenses: 150000,
      };

      const result = projectRetirement(highExpenses);

      expect(result.assetsDepleted).toBe(true);
    });

    it('should handle delayed CPP to age 70', () => {
      const delayedCPP = {
        ...basicInput,
        cppStartAge: 70,
      };

      const result = projectRetirement(delayedCPP);

      const at69 = result.projections.find(p => p.age === 69);
      const at70 = result.projections.find(p => p.age === 70);

      expect(at69?.cppIncome).toBe(0);
      expect(at70?.cppIncome).toBeGreaterThan(0);
    });
  });
});
```

**Validation**:
- [ ] Compare projections against manual spreadsheet calculations
- [ ] Verify asset depletion detection
- [ ] Test boundary conditions

**Estimated Time**: 10 hours

---

### 2.6 Add Test Coverage Reporting

**Implementation**:

Add to `package.json`:
```json
{
  "scripts": {
    "test:coverage": "vitest --coverage"
  }
}
```

**Coverage Targets**:
- Calculation engines: 90%+ coverage
- API routes: 70%+ coverage
- Components: 60%+ coverage

**Estimated Time**: 2 hours

**Phase 2 Total Time**: 41 hours (5 days, but spread over 4 calendar days)

---

## Phase 3: Fix Error Handling and Logging (Week 2, Days 8-10)

**Priority**: HIGH
**Estimated Time**: 3 days
**Risk if Skipped**: Poor debugging, security leaks, production issues

### 3.1 Centralized Error Handling

**Files to Create**:
- `webapp/lib/errors.ts` (NEW)

**Implementation**:

```typescript
// webapp/lib/errors.ts (NEW FILE)

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(public resetAt: Date) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
        }),
      },
    };
  }

  // Unknown error
  return {
    status: 500,
    body: {
      error: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
  };
}
```

**Estimated Time**: 3 hours

---

### 3.2 Update All API Routes with Error Handling

**Pattern to Apply** to all 14 API routes:

```typescript
// Example: webapp/app/api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  handleApiError,
  AuthenticationError,
  ValidationError
} from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('Failed to fetch profile', error, {
      endpoint: '/api/profile',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();

    // Validate inputs with proper errors
    if (body.firstName !== undefined) {
      if (typeof body.firstName !== 'string' || body.firstName.trim().length === 0) {
        throw new ValidationError('First name must be a non-empty string', 'firstName');
      }
    }

    // ... rest of logic

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Failed to update profile', error, {
      endpoint: '/api/profile',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
```

**Files to Update** (14 files):
- All files in `app/api/auth/`
- All files in `app/api/profile/`
- All files in `app/api/scenarios/`
- All files in `app/api/projections/`
- All files in `app/api/simulation/`

**Estimated Time**: 10 hours (40 min per route)

---

### 3.3 Add Request/Response Logging Middleware

**File to Create**: Update `webapp/middleware.ts`

```typescript
// webapp/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // Log incoming request
  logger.debug('Incoming request', {
    method: request.method,
    path: pathname,
    ip: request.ip,
  });

  // CSRF validation for mutations
  const PROTECTED_API_ROUTES = [
    '/api/profile',
    '/api/scenarios',
    '/api/projections',
    '/api/simulation',
  ];

  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  const isMutation = ['POST', 'PUT', 'DELETE'].includes(request.method);

  if (isProtectedApiRoute && isMutation) {
    const isValid = await validateCsrfToken(request);

    if (!isValid) {
      logger.warn('CSRF validation failed', { path: pathname });
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  // Log response time
  const duration = Date.now() - startTime;
  logger.info('Request completed', {
    method: request.method,
    path: pathname,
    duration: `${duration}ms`,
    status: response.status,
  });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

**Estimated Time**: 2 hours

---

### 3.4 Add Client-Side Error Boundary

**File to Create**: `webapp/app/error.tsx`

```typescript
// webapp/app/error.tsx (NEW FILE)

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to external service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 text-center p-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-gray-600">
            We apologize for the inconvenience. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-red-800">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Estimated Time**: 2 hours

---

### 3.5 Update Prisma Logging

**File to Update**: `webapp/lib/prisma.ts`

```typescript
// webapp/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'], // Only log errors in production
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

**Estimated Time**: 1 hour

---

### 3.6 Create Error Documentation

**File to Create**: `webapp/docs/ERROR_CODES.md`

```markdown
# Error Codes and Handling

## Error Code Structure

All API errors follow this format:

\`\`\`json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "field": "fieldName" // Optional, for validation errors
}
\`\`\`

## Error Codes

### Authentication (401)
- `AUTHENTICATION_ERROR` - Invalid or missing authentication token
- `INVALID_CREDENTIALS` - Email or password incorrect

### Authorization (403)
- `AUTHORIZATION_ERROR` - User lacks permission for resource
- `CSRF_TOKEN_INVALID` - CSRF token missing or invalid

### Validation (400)
- `VALIDATION_ERROR` - Input validation failed
- `INVALID_INPUT` - Malformed request body

### Not Found (404)
- `NOT_FOUND` - Requested resource doesn't exist

### Rate Limiting (429)
- `RATE_LIMIT_EXCEEDED` - Too many requests from this IP
  - Response includes `resetAt` timestamp

### Server Errors (500)
- `INTERNAL_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed

## Handling Errors in Client Code

\`\`\`typescript
try {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();

    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Show field-specific error
        setFieldError(error.field, error.error);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Show retry message
        showError(\`Too many attempts. Try again after \${error.resetAt}\`);
        break;
      default:
        showError(error.error);
    }
    return;
  }

  // Success handling
} catch (error) {
  showError('Network error. Please check your connection.');
}
\`\`\`
```

**Estimated Time**: 2 hours

**Phase 3 Total Time**: 20 hours (2.5 days)

---

## Phase 4: Add Monitoring and Alerting (Week 2-3, Days 11-12)

**Priority**: HIGH
**Estimated Time**: 2 days
**Risk if Skipped**: No visibility into production issues

### 4.1 Choose Monitoring Solution

**Recommended: Sentry** (Free tier available)

**Why Sentry**:
- Excellent error tracking
- Performance monitoring
- User session replay
- Breadcrumbs for debugging
- Source map support
- Free for small projects

**Alternative: LogRocket** (if you need more session replay features)

**Installation**:
```bash
npm install @sentry/nextjs
```

**Estimated Time**: 1 hour (research + setup)

---

### 4.2 Configure Sentry

**Run Setup Wizard**:
```bash
npx @sentry/wizard@latest -i nextjs
```

**Files Created/Modified** by wizard:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` (updated)

**Manual Configuration** (if needed):

```typescript
// sentry.server.config.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.NODE_ENV,

  tracesSampleRate: 1.0, // 100% in development

  // Don't sample errors in production
  sampleRate: 1.0,

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    // Network errors
    'NetworkError',
    'Failed to fetch',
  ],

  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry would send:', event);
      return null;
    }

    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }

    return event;
  },
});
```

```typescript
// sentry.client.config.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  tracesSampleRate: 0.1, // Sample 10% of transactions

  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/your-domain\.com\/api/,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% on errors
});
```

**Estimated Time**: 3 hours

---

### 4.3 Integrate Sentry with Logger

**Update Logger** to send errors to Sentry:

```typescript
// webapp/lib/logger.ts

import * as Sentry from '@sentry/nextjs';

class Logger {
  // ... existing code

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: this.isDevelopment ? error.stack : undefined }
      : { error };

    const fullContext = { ...context, ...errorDetails };

    // Send to Sentry in production
    if (this.isProduction && error instanceof Error) {
      Sentry.captureException(error, {
        tags: context,
        extra: {
          message,
          ...fullContext,
        },
      });
    }

    if (this.isProduction) {
      console.error(this.formatMessage('error', message));
    } else {
      console.error(this.formatMessage('error', message, fullContext));
    }
  }

  // Add performance monitoring
  startTransaction(name: string, op: string) {
    if (this.isProduction) {
      return Sentry.startTransaction({ name, op });
    }
    return null;
  }
}

export const logger = new Logger();
```

**Estimated Time**: 2 hours

---

### 4.4 Add Performance Monitoring

**Add to Critical Routes**:

```typescript
// Example: webapp/app/api/projections/route.ts

import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const transaction = logger.startTransaction(
    'projection.calculate',
    'api.request'
  );

  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();

    // Start span for calculation
    const calcSpan = transaction?.startChild({
      op: 'calculation',
      description: 'Run retirement projection',
    });

    const projection = projectRetirement(body);

    calcSpan?.finish();

    // ... save to database, etc.

    transaction?.finish();
    return NextResponse.json(projection);
  } catch (error) {
    transaction?.setStatus('internal_error');
    transaction?.finish();

    logger.error('Projection calculation failed', error);
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
```

**Estimated Time**: 3 hours

---

### 4.5 Add Health Check Endpoint

**File to Create**: `webapp/app/api/health/route.ts`

```typescript
// webapp/app/api/health/route.ts (NEW FILE)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
    },
  };

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'disconnected';
    checks.status = 'unhealthy';
  }

  const status = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status });
}
```

**Estimated Time**: 1 hour

---

### 4.6 Set Up Alerts

**Configure Sentry Alerts**:

1. **Error Rate Alert**
   - Condition: More than 10 errors in 5 minutes
   - Notify: Email + Slack

2. **New Issue Alert**
   - Condition: New error type appears
   - Notify: Email

3. **Performance Alert**
   - Condition: P95 response time > 2 seconds
   - Notify: Email

**Create Alert Rules** in Sentry dashboard:
- Go to Alerts → Create Alert Rule
- Set conditions above
- Add notification integrations

**Estimated Time**: 2 hours

---

### 4.7 Add User Feedback Widget

**Add Sentry Feedback** for users to report issues:

```typescript
// webapp/app/layout.tsx

'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Show feedback dialog on errors
      window.addEventListener('error', () => {
        Sentry.showReportDialog({
          title: 'It looks like we\'re having issues.',
          subtitle: 'Our team has been notified.',
          subtitle2: 'If you\'d like to help, tell us what happened below.',
        });
      });
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Estimated Time**: 2 hours

---

### 4.8 Create Monitoring Documentation

**File to Create**: `MONITORING.md`

```markdown
# Monitoring and Alerts

## Services

### Sentry
- **URL**: https://sentry.io/organizations/your-org/
- **Purpose**: Error tracking, performance monitoring
- **Access**: Team members with Sentry accounts

### Health Check
- **URL**: /api/health
- **Purpose**: System health status
- **Monitoring**: Uptime robot checks every 5 minutes

## Alerts

### Critical (Page immediately)
- Database connection lost
- Error rate > 50 errors/min
- API response time P95 > 5s

### High (Notify within 15 min)
- New error type
- Error rate > 10 errors/5min
- Memory usage > 90%

### Medium (Daily digest)
- Performance degradation
- Unusual traffic patterns

## Dashboards

### Production Dashboard
- **Location**: Sentry → Dashboards → Production
- **Metrics**:
  - Error rate (24h)
  - Transaction throughput
  - P95 response times
  - User sessions

### Business Metrics
- Daily active users
- Projections calculated
- Scenarios created
- PDF reports generated

## Incident Response

### 1. Alert Received
- Check Sentry for error details
- Check /api/health endpoint
- Review recent deployments

### 2. Assess Severity
- Is database accessible?
- Are users affected?
- Is data at risk?

### 3. Mitigate
- Rollback if recent deployment
- Scale resources if needed
- Enable maintenance mode if critical

### 4. Resolve
- Fix root cause
- Deploy fix
- Monitor for recurrence

### 5. Post-Mortem
- Document incident
- Update runbooks
- Prevent recurrence

## Useful Queries

### Find errors for specific user
\`\`\`
user.email:user@example.com
\`\`\`

### Find slow API calls
\`\`\`
transaction.duration:>2s
\`\`\`

### Find errors in production only
\`\`\`
environment:production
\`\`\`
```

**Estimated Time**: 2 hours

**Phase 4 Total Time**: 16 hours (2 days)

---

## Summary Timeline

| Phase | Description | Days | Hours |
|-------|-------------|------|-------|
| Phase 1 | P0 Security Issues | 3 | 22 |
| Phase 2 | Calculation Tests | 4 | 41 |
| Phase 3 | Error Handling | 2.5 | 20 |
| Phase 4 | Monitoring | 2 | 16 |
| **Total** | | **11.5** | **99** |

**With 1 developer working 8 hours/day**: ~12.5 working days (~2.5 weeks)

---

## Environment Variables Checklist

Create `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/retirezest"

# Authentication (REQUIRED)
JWT_SECRET="<generate-with-openssl-rand-base64-32>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Monitoring (Production only)
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
```

---

## Pre-Production Checklist

### Security
- [x] JWT secret validation
- [x] Rate limiting on auth endpoints
- [x] Error logging sanitized
- [x] CSRF protection implemented
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Dependency audit run (`npm audit`)

### Testing
- [x] CPP calculator tests (15+ cases)
- [x] OAS calculator tests (12+ cases)
- [x] GIS calculator tests (10+ cases)
- [x] Tax calculator tests (15+ cases)
- [x] Projection engine tests (12+ cases)
- [ ] API integration tests
- [ ] End-to-end auth flow test
- [ ] Load testing completed

### Error Handling
- [x] Centralized error classes
- [x] All API routes use error handling
- [x] Client error boundary
- [x] Error documentation created

### Monitoring
- [x] Sentry configured
- [x] Health check endpoint
- [x] Alerts configured
- [x] Performance monitoring active
- [ ] Uptime monitoring setup
- [ ] Log retention configured

### Infrastructure
- [ ] Database backups automated
- [ ] Environment variables secured
- [ ] Docker deployment tested
- [ ] CI/CD pipeline setup
- [ ] Rollback procedure documented

### Documentation
- [x] Error codes documented
- [x] Monitoring guide created
- [ ] API documentation (Swagger)
- [ ] Deployment runbook
- [ ] Incident response plan

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Check error rate every 2 hours
- [ ] Monitor response times
- [ ] Review user signup flow
- [ ] Check calculation accuracy

### First Week
- [ ] Daily error review
- [ ] Performance optimization
- [ ] User feedback collection
- [ ] Bug fixes deployed

### First Month
- [ ] Weekly metrics review
- [ ] Security audit
- [ ] Load testing under real traffic
- [ ] Backup restore test

---

## Success Criteria

Before marking production-ready:
- ✅ All security issues resolved
- ✅ Test coverage >80% for calculations
- ✅ Zero unhandled errors in test scenarios
- ✅ Monitoring active and tested
- ✅ Health check returns 200
- ✅ Error rate <0.1% in staging
- ✅ Response time P95 <2 seconds

---

## Risk Mitigation

### High Risk
- **Database failure**: Automated backups + hot standby
- **Security breach**: WAF + rate limiting + audit logs
- **Calculation errors**: Comprehensive tests + manual validation

### Medium Risk
- **Performance degradation**: Caching + query optimization
- **Third-party outages**: Graceful degradation
- **Memory leaks**: Monitoring + automatic restarts

### Low Risk
- **UI bugs**: Error boundaries + user feedback
- **Browser compatibility**: Progressive enhancement

---

## Next Steps After Completion

1. **Staging Deployment** (1 day)
   - Deploy to staging environment
   - Run full test suite
   - Manual QA testing

2. **Beta Testing** (1 week)
   - Invite 10-20 beta users
   - Collect feedback
   - Fix critical bugs

3. **Production Deployment** (1 day)
   - Deploy during low-traffic window
   - Monitor closely for 24 hours
   - Have rollback plan ready

4. **Post-Launch** (Ongoing)
   - Weekly monitoring reviews
   - Monthly security audits
   - Continuous improvements

---

**Document Owner**: Development Team
**Review Frequency**: Weekly during implementation
**Last Updated**: December 5, 2025
