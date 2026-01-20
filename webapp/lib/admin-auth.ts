/**
 * Admin Authentication and Authorization Utilities
 *
 * Handles admin role verification and session checking
 */

import { getSession } from './auth';
import { prisma } from './prisma';

/**
 * Check if the current user is an admin
 * Returns the user object if admin, null otherwise
 */
export async function requireAdmin() {
  const session = await getSession();

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}

/**
 * Check if the current user is an admin (returns boolean)
 */
export async function isAdmin(): Promise<boolean> {
  const admin = await requireAdmin();
  return admin !== null;
}

/**
 * Get admin user info if authenticated
 */
export async function getAdminUser() {
  return requireAdmin();
}
