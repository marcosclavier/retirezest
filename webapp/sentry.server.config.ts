/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for Node.js/server-side error tracking
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  // Sentry Data Source Name - unique identifier for your project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: ENVIRONMENT,

  // Adjust this value in production, or use tracesSampler for greater control
  // Sample rate for performance monitoring (0.0 to 1.0)
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: ENVIRONMENT === 'development',

  // You can configure additional options here
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(),
  ],

  // Before sending events to Sentry, filter out sensitive data
  beforeSend(event) {
    // Don't send events if Sentry is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Filter out sensitive information from request data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = [
          'authorization',
          'cookie',
          'set-cookie',
          'x-api-key',
          'x-auth-token',
        ];
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[REDACTED]';
          }
        });
      }

      // Remove sensitive data from request body
      if (event.request?.data && typeof event.request.data === 'object' && event.request.data !== null) {
        const sensitiveFields = [
          'password',
          'passwordHash',
          'token',
          'apiKey',
          'secret',
          'creditCard',
          'ssn',
        ];

        const data = event.request.data as Record<string, unknown>;
        sensitiveFields.forEach(field => {
          if (field in data) {
            data[field] = '[REDACTED]';
          }
        });
      }
    }

    // Remove sensitive user data
    if (event.user) {
      const allowedUserFields = ['id', 'email'];
      event.user = Object.keys(event.user)
        .filter(key => allowedUserFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = event.user![key];
          return obj;
        }, {} as any);
    }

    // Filter out sensitive data from extra context
    if (event.extra) {
      const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
      Object.keys(event.extra).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          event.extra![key] = '[REDACTED]';
        }
      });
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Database connection errors during shutdown
    'SequelizeConnectionError',
    'ECONNREFUSED',
    // Client-side errors that shouldn't be tracked server-side
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  // Configure trace sampling for specific routes
  tracesSampler(samplingContext) {
    // Don't trace health check endpoints
    if (samplingContext.transactionContext.name?.includes('/api/health')) {
      return 0;
    }

    // Higher sampling for important endpoints
    if (samplingContext.transactionContext.name?.includes('/api/simulation')) {
      return ENVIRONMENT === 'production' ? 0.5 : 1.0;
    }

    // Default sampling rate
    return ENVIRONMENT === 'production' ? 0.1 : 1.0;
  },
});
