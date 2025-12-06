/**
 * Rate Limiting Implementation
 * Protects against brute force attacks and API abuse
 */

import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every hour to prevent memory leaks
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

export interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<RateLimitResult> => {
    // Get client identifier (IP address or forwarded IP)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() :
               request.headers.get('x-real-ip') ||
               'unknown';

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

// Pre-configured rate limiters for different endpoints

/**
 * Rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5             // 5 attempts per 15 minutes
});

/**
 * Rate limiter for registration endpoint
 * 3 registrations per hour per IP
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3             // 3 registrations per hour per IP
});

/**
 * Rate limiter for general API endpoints
 * 60 requests per minute per IP
 */
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  maxRequests: 60            // 60 requests per minute
});

/**
 * Rate limiter for expensive operations (projections, simulations)
 * 10 requests per minute per IP
 */
export const expensiveOperationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  maxRequests: 10            // 10 requests per minute
});
