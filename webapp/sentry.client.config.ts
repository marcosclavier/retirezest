/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for browser/client-side error tracking
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  // Sentry Data Source Name - unique identifier for your project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: ENVIRONMENT,

  // Adjust this value in production, or use tracesSampler for greater control
  // Sample rate for performance monitoring (0.0 to 1.0)
  // 1.0 = 100% of transactions are sent to Sentry
  // In production, you may want to lower this to reduce costs
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: ENVIRONMENT === 'development',

  // Replay sample rate for session recording
  // This captures user sessions for debugging
  replaysOnErrorSampleRate: ENVIRONMENT === 'production' ? 1.0 : 0.0,
  replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0.0,

  // You can configure additional options here
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text and input fields
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Before sending events to Sentry, filter out sensitive data
  beforeSend(event) {
    // Don't send events if Sentry is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Filter out sensitive information
    if (event.request) {
      // Remove auth tokens from headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query parameters
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        const sensitiveParams = ['token', 'api_key', 'password', 'secret'];
        let queryString = event.request.query_string;
        sensitiveParams.forEach(param => {
          if (queryString.includes(param)) {
            queryString = queryString.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[REDACTED]`
            );
          }
        });
        event.request.query_string = queryString;
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

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'NetworkError',
    'Network request failed',
    // Random plugins/extensions
    'atomicFindClose',
    // Facebook
    'fb_xd_fragment',
    // Common bot/crawler errors
    'Non-Error promise rejection captured',
  ],
});
