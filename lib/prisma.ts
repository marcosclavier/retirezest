/**
 * Prisma Client Configuration
 * Optimized for performance and connection pooling
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection pool configuration
// For serverless environments (Vercel, etc.), use connection pooling URL
// During build time, return a mock client to prevent any database operations
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.npm_lifecycle_event === 'build';

const DATABASE_URL = process.env.DATABASE_URL ||
  (isBuildTime ? 'postgresql://build:build@localhost:5432/build' : undefined);

// Create a mock Prisma client during build time that returns empty results
const createMockPrismaClient = () => {
  // Create a deeply nested proxy that can handle any property access or method call
  const createDeepProxy: any = (): any => {
    return new Proxy(() => Promise.resolve(null), {
      get: (_target, prop) => {
        // Handle special Prisma methods
        if (prop === '$disconnect' || prop === '$connect') {
          return () => Promise.resolve();
        }
        if (prop === '$on') {
          return () => {};
        }
        if (prop === 'then') {
          return undefined; // Prevent proxy from being treated as a Promise
        }
        // Return another proxy for chaining
        return createDeepProxy();
      },
      apply: (_target, _thisArg, _args) => {
        // Return a promise that resolves to null
        return Promise.resolve(null);
      },
    });
  };

  return createDeepProxy() as PrismaClient;
};

export const prisma =
  isBuildTime
    ? createMockPrismaClient()
    : (globalForPrisma.prisma ??
      new PrismaClient({
        datasources: {
          db: {
            url: DATABASE_URL,
          },
        },
        log: process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
        // Connection pool configuration for Neon serverless
        // Prevents "terminating connection due to administrator command" errors
        // These settings help maintain stable connections with serverless databases
        errorFormat: 'minimal',
        transactionOptions: {
          timeout: 10000, // 10 seconds
          maxWait: 5000,  // 5 seconds
          isolationLevel: 'Serializable', // SQLite only supports Serializable
        },
      }));

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 1000) {
      console.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
