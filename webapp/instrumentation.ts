/**
 * Next.js Instrumentation File
 * Initializes monitoring and observability tools
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Initialize monitoring and observability tools

  // Skip initialization if no DSN is configured
  if (!process.env.SENTRY_DSN) {
    return;
  }

  // Initialize Sentry for server-side error tracking
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',

      // Adjust this value in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Capture Replay for Session Replay (adjust sample rate for production)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}
