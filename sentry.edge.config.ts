/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for Edge Runtime (Middleware, Edge API Routes)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  // Sentry Data Source Name - unique identifier for your project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: ENVIRONMENT,

  // Sample rate for performance monitoring
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Debug mode
  debug: ENVIRONMENT === 'development',

  // Before sending events to Sentry, filter out sensitive data
  beforeSend(event) {
    // Don't send events if Sentry is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    'NetworkError',
    'Network request failed',
  ],
});
