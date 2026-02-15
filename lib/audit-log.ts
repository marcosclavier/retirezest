import { prisma } from './prisma';
import { NextRequest } from 'next/server';

/**
 * Audit Log Helper
 * Tracks important user actions for GDPR compliance and security
 */

export enum AuditAction {
  // Data actions
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // Account actions
  ACCOUNT_DELETE = 'ACCOUNT_DELETE',
  ACCOUNT_DELETE_CANCEL = 'ACCOUNT_DELETE_CANCEL',
  ACCOUNT_CREATE = 'ACCOUNT_CREATE',

  // Auth actions
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  EMAIL_VERIFY = 'EMAIL_VERIFY',

  // Profile actions
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PROFILE_VIEW = 'PROFILE_VIEW',

  // Simulation actions
  SIMULATION_RUN = 'SIMULATION_RUN',

  // Other
  OTHER = 'OTHER',
}

interface AuditLogParams {
  userId: string;
  action: AuditAction | string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Extract IP address from Next.js request
 */
export function getClientIp(req: NextRequest): string | null {
  // Try different headers in order of reliability
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // No direct IP available in Next.js 15 NextRequest
  return null;
}

/**
 * Extract user agent from Next.js request
 */
export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent');
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const {
      userId,
      action,
      description,
      metadata,
      ipAddress,
      userAgent,
      success = true,
      errorMessage,
    } = params;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
        success,
        errorMessage,
      },
    });

    // Also log to console for immediate visibility
    console.log(`[AUDIT] ${action} by user ${userId} - Success: ${success}`);
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[AUDIT LOG ERROR] Failed to create audit log:', error);
  }
}

/**
 * Create an audit log from a Next.js request
 * Convenience method that automatically extracts IP and user agent
 */
export async function createAuditLogFromRequest(
  req: NextRequest,
  userId: string,
  action: AuditAction | string,
  options?: {
    description?: string;
    metadata?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    description: options?.description,
    metadata: options?.metadata,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    success: options?.success,
    errorMessage: options?.errorMessage,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    action?: AuditAction | string;
  }
) {
  return await prisma.auditLog.findMany({
    where: {
      userId,
      ...(options?.action && { action: options.action }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit,
  });
}

/**
 * Get all data exports for a user
 */
export async function getUserDataExports(userId: string) {
  return await getUserAuditLogs(userId, {
    action: AuditAction.DATA_EXPORT,
  });
}

/**
 * Check if user recently exported data (within last N days)
 */
export async function hasRecentDataExport(
  userId: string,
  daysAgo: number = 30
): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const recentExport = await prisma.auditLog.findFirst({
    where: {
      userId,
      action: AuditAction.DATA_EXPORT,
      success: true,
      createdAt: {
        gte: cutoffDate,
      },
    },
  });

  return !!recentExport;
}
