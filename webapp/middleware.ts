/**
 * Next.js Middleware
 * Handles CSRF validation, security headers, and request logging for API routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateCsrfTokenEdge } from '@/lib/csrf-edge';

/**
 * Security headers for all responses
 */
function getSecurityHeaders() {
  const headers = new Headers();

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // XSS Protection
  headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (disable unnecessary features)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval/inline
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.sentry.io", // Add your API domains
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  return headers;
}

// API routes that require CSRF protection (all state-changing operations)
const PROTECTED_API_ROUTES = [
  '/api/profile',
  '/api/scenarios',
  '/api/projections',
  '/api/simulation',
];

// Routes that should be excluded from CSRF (auth routes handle their own security)
const CSRF_EXEMPT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/csrf',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get security headers
  const securityHeaders = getSecurityHeaders();

  // Only process API routes for CSRF validation
  if (!pathname.startsWith('/api/')) {
    // Apply security headers to all routes
    const response = NextResponse.next();
    securityHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Check if this is a protected API route with a mutation method
  const isProtectedRoute = PROTECTED_API_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  const isExemptRoute = CSRF_EXEMPT_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);

  // Apply CSRF validation for protected mutations
  if (isProtectedRoute && isMutation && !isExemptRoute) {
    const isValid = await validateCsrfTokenEdge(request);

    if (!isValid) {
      const response = NextResponse.json(
        {
          error: 'Invalid or missing CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        },
        { status: 403 }
      );

      // Add security headers to error response
      securityHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });

      return response;
    }
  }

  // Continue to the route handler with security headers
  const response = NextResponse.next();
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
