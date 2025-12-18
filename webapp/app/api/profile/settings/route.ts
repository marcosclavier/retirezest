import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        targetRetirementAge: true,
        lifeExpectancy: true,
      },
    });

    if (!user) {
      throw new AuthenticationError();
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('Error fetching user settings', error, {
      endpoint: '/api/profile/settings',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { includePartner, partnerFirstName, partnerLastName, partnerDateOfBirth, targetRetirementAge, lifeExpectancy } = body;

    // Validation
    if (typeof includePartner !== 'boolean') {
      throw new ValidationError('includePartner must be a boolean');
    }

    // If includePartner is true, validate partner information
    if (includePartner) {
      if (partnerFirstName && typeof partnerFirstName !== 'string') {
        throw new ValidationError('partnerFirstName must be a string');
      }
      if (partnerLastName && typeof partnerLastName !== 'string') {
        throw new ValidationError('partnerLastName must be a string');
      }
      if (partnerDateOfBirth && isNaN(Date.parse(partnerDateOfBirth))) {
        throw new ValidationError('partnerDateOfBirth must be a valid date');
      }
    }

    // Validate retirement planning fields
    if (targetRetirementAge !== null && targetRetirementAge !== undefined) {
      if (typeof targetRetirementAge !== 'number' || targetRetirementAge < 50 || targetRetirementAge > 75) {
        throw new ValidationError('targetRetirementAge must be a number between 50 and 75');
      }
    }
    if (lifeExpectancy !== null && lifeExpectancy !== undefined) {
      if (typeof lifeExpectancy !== 'number' || lifeExpectancy < 70 || lifeExpectancy > 110) {
        throw new ValidationError('lifeExpectancy must be a number between 70 and 110');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        includePartner,
        partnerFirstName: includePartner ? (partnerFirstName || null) : null,
        partnerLastName: includePartner ? (partnerLastName || null) : null,
        partnerDateOfBirth: includePartner && partnerDateOfBirth
          ? new Date(partnerDateOfBirth)
          : null,
        targetRetirementAge: targetRetirementAge !== undefined ? targetRetirementAge : undefined,
        lifeExpectancy: lifeExpectancy !== undefined ? lifeExpectancy : undefined,
      },
      select: {
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        targetRetirementAge: true,
        lifeExpectancy: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Error updating user settings', error, {
      endpoint: '/api/profile/settings',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
