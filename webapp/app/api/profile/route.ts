import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * GET /api/profile
 * Get the current user's profile
 */
// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        maritalStatus: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('Error fetching profile', error, {
      endpoint: '/api/profile',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * PUT /api/profile
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }
    const userId = session.userId;

    const body = await request.json();

    // Validate inputs
    const updates: any = {};

    if (body.firstName !== undefined) {
      if (typeof body.firstName !== 'string' || body.firstName.trim().length === 0) {
        throw new ValidationError('First name must be a non-empty string', 'firstName');
      }
      updates.firstName = body.firstName.trim();
    }

    if (body.lastName !== undefined) {
      if (typeof body.lastName !== 'string' || body.lastName.trim().length === 0) {
        throw new ValidationError('Last name must be a non-empty string', 'lastName');
      }
      updates.lastName = body.lastName.trim();
    }

    if (body.dateOfBirth !== undefined) {
      const dob = new Date(body.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new ValidationError('Invalid date of birth', 'dateOfBirth');
      }
      // Check if date is reasonable (between 1900 and today)
      const minDate = new Date('1900-01-01');
      const maxDate = new Date();
      if (dob < minDate || dob > maxDate) {
        throw new ValidationError('Date of birth must be between 1900 and today', 'dateOfBirth');
      }
      updates.dateOfBirth = dob;
    }

    if (body.province !== undefined) {
      const validProvinces = ['ON', 'BC', 'AB', 'SK', 'MB', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];
      if (!validProvinces.includes(body.province)) {
        throw new ValidationError('Invalid province code', 'province');
      }
      updates.province = body.province;
    }

    if (body.maritalStatus !== undefined) {
      const validStatuses = ['single', 'married', 'divorced', 'widowed', 'common_law'];
      if (!validStatuses.includes(body.maritalStatus)) {
        throw new ValidationError('Invalid marital status', 'maritalStatus');
      }
      updates.maritalStatus = body.maritalStatus;
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        maritalStatus: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Error updating profile', error, {
      endpoint: '/api/profile',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
