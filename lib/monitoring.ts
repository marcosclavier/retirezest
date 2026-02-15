/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for tracking application performance and custom metrics
 */

import { logger } from './logger';

/**
 * Track API endpoint performance
 */
export function trackApiPerformance<T>(
  endpoint: string,
  method: string,
  callback: () => Promise<T>
): Promise<T> {
  return logger.startSpan(`API ${method} ${endpoint}`, 'http.server', async () => {
    const startTime = Date.now();

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      // Log slow requests (>2 seconds)
      if (duration > 2000) {
        logger.warn('Slow API request', {
          endpoint,
          method,
          duration: `${duration}ms`,
        });

        // Add breadcrumb for Sentry
        logger.addBreadcrumb(
          `Slow API request: ${method} ${endpoint} took ${duration}ms`,
          'performance',
          'warning'
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API request failed', error, {
        endpoint,
        method,
        duration: `${duration}ms`,
      });
      throw error;
    }
  });
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery<T>(
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  return logger.startSpan(`DB ${operation}`, 'db.query', async () => {
    const startTime = Date.now();

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      // Log slow queries (>1 second)
      if (duration > 1000) {
        logger.warn('Slow database query', {
          operation,
          duration: `${duration}ms`,
        });

        logger.addBreadcrumb(
          `Slow DB query: ${operation} took ${duration}ms`,
          'database',
          'warning'
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Database query failed', error, {
        operation,
        duration: `${duration}ms`,
      });
      throw error;
    }
  });
}

/**
 * Track external API calls (e.g., Python API)
 */
export function trackExternalApi<T>(
  service: string,
  endpoint: string,
  callback: () => Promise<T>
): Promise<T> {
  return logger.startSpan(`External ${service} ${endpoint}`, 'http.client', async () => {
    const startTime = Date.now();

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      // Log slow external API calls (>5 seconds)
      if (duration > 5000) {
        logger.warn('Slow external API call', {
          service,
          endpoint,
          duration: `${duration}ms`,
        });

        logger.addBreadcrumb(
          `Slow external API: ${service}${endpoint} took ${duration}ms`,
          'http',
          'warning'
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('External API call failed', error, {
        service,
        endpoint,
        duration: `${duration}ms`,
      });
      throw error;
    }
  });
}

/**
 * Record custom metric
 */
export function recordMetric(name: string, value: number, unit: string = 'count') {
  // In development, just log it
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Metric: ${name}`, { value, unit });
    return;
  }

  // In production, send to Sentry
  // Note: Sentry metrics API may vary by version
  // This is a placeholder for custom metrics
  logger.info(`Metric: ${name}`, { value, unit });

  // Add breadcrumb
  logger.addBreadcrumb(
    `Metric recorded: ${name} = ${value} ${unit}`,
    'metric',
    'info'
  );
}

/**
 * Performance budget checker
 * Warns if operation exceeds expected duration
 */
export async function checkPerformanceBudget<T>(
  operation: string,
  budgetMs: number,
  callback: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await callback();
    const duration = Date.now() - startTime;

    if (duration > budgetMs) {
      logger.warn(`Performance budget exceeded: ${operation}`, {
        budget: `${budgetMs}ms`,
        actual: `${duration}ms`,
        exceeded: `${duration - budgetMs}ms`,
      });

      // Record metric
      recordMetric('performance.budget.exceeded', 1);
    }

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Memory usage tracker
 */
export function trackMemoryUsage() {
  const usage = process.memoryUsage();

  const metrics = {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
  };

  logger.debug('Memory usage', metrics);

  // Warn if heap usage is high (>500MB)
  if (metrics.heapUsed > 500) {
    logger.warn('High memory usage detected', metrics);
    recordMetric('memory.high_usage', 1);
  }

  return metrics;
}

/**
 * Request counter for rate limiting insights
 */
const requestCounts = new Map<string, number>();

export function trackRequestCount(endpoint: string) {
  const current = requestCounts.get(endpoint) || 0;
  requestCounts.set(endpoint, current + 1);

  // Log every 100 requests
  if ((current + 1) % 100 === 0) {
    logger.info(`Request milestone: ${endpoint}`, {
      count: current + 1,
    });
  }
}

export function getRequestCounts() {
  return Object.fromEntries(requestCounts);
}

export function resetRequestCounts() {
  requestCounts.clear();
}
