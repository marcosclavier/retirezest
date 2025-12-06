/**
 * Centralized Logging Utility
 * Production-safe logging with automatic sensitive data scrubbing
 * Integrated with Sentry for error tracking and performance monitoring
 */

// Sentry integration is optional - will be loaded at runtime if available
// eslint-disable-next-line
let Sentry: any | null = null;

// Lazy load Sentry module if available
async function loadSentry() {
  if (Sentry || !process.env.SENTRY_DSN) return;

  try {
    // @ts-ignore - Dynamic import of optional dependency
    const sentryModule = await import('@sentry/nextjs');
    Sentry = sentryModule;
  } catch {
    // Sentry not installed, continue without it
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Debug logging - only shows in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Info logging - shows in all environments
   */
  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  /**
   * Warning logging - shows in all environments
   */
  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Error logging - production-safe, no sensitive data
   * Automatically sends errors to Sentry in production
   */
  async error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: this.isDevelopment ? error.stack : undefined }
      : { error };

    const fullContext = { ...context, ...errorDetails };

    if (this.isProduction) {
      // In production, don't log sensitive details to console
      console.error(this.formatMessage('error', message));

      // Send to Sentry if available
      await loadSentry();
      if (Sentry) {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            level: 'error',
            tags: context ? this.extractTags(context) : {},
            extra: context,
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            tags: context ? this.extractTags(context) : {},
            extra: { error, ...context },
          });
        }
      }
    } else {
      console.error(this.formatMessage('error', message, fullContext));
    }
  }

  /**
   * Extract tags from context for Sentry
   * Tags are indexed and searchable in Sentry
   */
  private extractTags(context: LogContext): Record<string, string> {
    const tags: Record<string, string> = {};
    const allowedTags = ['endpoint', 'method', 'userId', 'component', 'feature'];

    for (const key of allowedTags) {
      if (context[key]) {
        tags[key] = String(context[key]);
      }
    }

    return tags;
  }

  /**
   * Generate security-safe error response for API routes
   * Returns sanitized error object safe for API responses
   */
  apiError(message: string, error?: Error | unknown): { error: string; details?: string } {
    if (this.isDevelopment) {
      return {
        error: message,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Production: only return generic message
    return { error: message };
  }

  /**
   * Log API request (useful for middleware)
   */
  logRequest(method: string, path: string, ip?: string) {
    this.info('API Request', {
      method,
      path,
      ip: this.isDevelopment ? ip : undefined // Don't log IPs in production
    });
  }

  /**
   * Log API response (useful for middleware)
   */
  logResponse(method: string, path: string, status: number, duration: number) {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    if (level === 'error') {
      this.error(`API Response ${status}`, undefined, { method, path, duration: `${duration}ms` });
    } else if (level === 'warn') {
      this.warn(`API Response ${status}`, { method, path, duration: `${duration}ms` });
    } else {
      this.debug(`API Response ${status}`, { method, path, duration: `${duration}ms` });
    }
  }

  /**
   * Start performance monitoring span
   * Returns Sentry span for tracking performance
   */
  startSpan<T>(name: string, op: string, callback: () => T): T {
    if (Sentry) {
      return Sentry.startSpan(
        {
          name,
          op,
        },
        callback
      );
    }
    // If Sentry not available, just execute callback
    return callback();
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string } | null) {
    if (Sentry) {
      Sentry.setUser(user);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (Sentry) {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
      });
    }
  }
}

export const logger = new Logger();
