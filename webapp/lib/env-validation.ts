/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  // Required
  DATABASE_URL: string;
  JWT_SECRET: string;
  NEXT_PUBLIC_API_URL: string;
  NODE_ENV: 'development' | 'staging' | 'production';

  // Optional
  SENTRY_DSN?: string;
  SENTRY_AUTH_TOKEN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  PYTHON_API_URL?: string;
  RATE_LIMIT_MAX?: string;
  RATE_LIMIT_WINDOW?: string;
}

interface ValidationError {
  variable: string;
  issue: string;
}

/**
 * Validates required environment variables
 * During build time, some runtime-only variables are optional
 */
export function validateEnv(): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                      process.env.npm_lifecycle_event === 'build';

  // Check required variables (but allow DATABASE_URL and JWT_SECRET to be missing during build)
  if (!process.env.DATABASE_URL) {
    if (!isBuildTime) {
      errors.push({
        variable: 'DATABASE_URL',
        issue: 'Required environment variable is missing',
      });
    }
  } else if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !isBuildTime) {
    errors.push({
      variable: 'DATABASE_URL',
      issue: 'Must be a valid PostgreSQL connection string starting with postgresql://',
    });
  }

  if (!process.env.JWT_SECRET) {
    if (!isBuildTime) {
      errors.push({
        variable: 'JWT_SECRET',
        issue: 'Required environment variable is missing',
      });
    }
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push({
      variable: 'JWT_SECRET',
      issue: 'Must be at least 32 characters long for security',
    });
  }

  if (!process.env.NEXT_PUBLIC_API_URL) {
    if (!isBuildTime) {
      errors.push({
        variable: 'NEXT_PUBLIC_API_URL',
        issue: 'Required environment variable is missing',
      });
    }
  } else if (
    !process.env.NEXT_PUBLIC_API_URL.startsWith('http://') &&
    !process.env.NEXT_PUBLIC_API_URL.startsWith('https://')
  ) {
    errors.push({
      variable: 'NEXT_PUBLIC_API_URL',
      issue: 'Must be a valid URL starting with http:// or https://',
    });
  }

  // Check production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_API_URL?.startsWith('http://')) {
      errors.push({
        variable: 'NEXT_PUBLIC_API_URL',
        issue: 'Must use HTTPS in production',
      });
    }

    if (!process.env.DATABASE_URL?.includes('sslmode=require')) {
      errors.push({
        variable: 'DATABASE_URL',
        issue: 'Should include sslmode=require in production',
      });
    }
  }

  // Validate optional but important variables
  if (process.env.SENTRY_DSN) {
    if (!process.env.SENTRY_DSN.startsWith('https://')) {
      errors.push({
        variable: 'SENTRY_DSN',
        issue: 'Must be a valid Sentry DSN URL',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnv();
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                      process.env.npm_lifecycle_event === 'build';

  if (!validation.valid) {
    console.error('Environment validation failed:');
    validation.errors.forEach((error) => {
      console.error(`  - ${error.variable}: ${error.issue}`);
    });

    if (process.env.NODE_ENV === 'production' && !isBuildTime) {
      throw new Error(
        'Invalid environment configuration. Check the errors above.'
      );
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL || (isBuildTime ? 'postgresql://build:build@localhost:5432/build' : ''),
    JWT_SECRET: process.env.JWT_SECRET || (isBuildTime ? 'build-time-secret-not-used-at-runtime-only-for-build' : ''),
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (isBuildTime ? 'http://localhost:3000' : ''),
    NODE_ENV: process.env.NODE_ENV as 'development' | 'staging' | 'production',
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    PYTHON_API_URL: process.env.PYTHON_API_URL,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
  };
}

/**
 * Prints environment configuration (safely, without secrets)
 */
export function printEnvConfig(): void {
  const config = getEnvConfig();

  console.log('Environment Configuration:');
  console.log('  NODE_ENV:', config.NODE_ENV);
  console.log(
    '  DATABASE_URL:',
    config.DATABASE_URL ? '[configured]' : '[missing]'
  );
  console.log('  JWT_SECRET:', config.JWT_SECRET ? '[configured]' : '[missing]');
  console.log('  NEXT_PUBLIC_API_URL:', config.NEXT_PUBLIC_API_URL);
  console.log('  SENTRY_DSN:', config.SENTRY_DSN ? '[configured]' : '[not set]');
  console.log(
    '  PYTHON_API_URL:',
    config.PYTHON_API_URL || '[not set]'
  );
  console.log(
    '  RATE_LIMIT_MAX:',
    config.RATE_LIMIT_MAX || '[using default]'
  );
}

// Run validation on import in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
