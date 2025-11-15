import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * GET /api/profile
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();

    // Validate inputs
    const updates: any = {};

    if (body.firstName !== undefined) {
      if (typeof body.firstName !== 'string' || body.firstName.trim().length === 0) {
        return NextResponse.json({ error: 'First name must be a non-empty string' }, { status: 400 });
      }
      updates.firstName = body.firstName.trim();
    }

    if (body.lastName !== undefined) {
      if (typeof body.lastName !== 'string' || body.lastName.trim().length === 0) {
        return NextResponse.json({ error: 'Last name must be a non-empty string' }, { status: 400 });
      }
      updates.lastName = body.lastName.trim();
    }

    if (body.dateOfBirth !== undefined) {
      const dob = new Date(body.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 });
      }
      // Check if date is reasonable (between 1900 and today)
      const minDate = new Date('1900-01-01');
      const maxDate = new Date();
      if (dob < minDate || dob > maxDate) {
        return NextResponse.json({ error: 'Date of birth must be between 1900 and today' }, { status: 400 });
      }
      updates.dateOfBirth = dob;
    }

    if (body.province !== undefined) {
      const validProvinces = ['ON', 'BC', 'AB', 'SK', 'MB', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];
      if (!validProvinces.includes(body.province)) {
        return NextResponse.json({ error: 'Invalid province code' }, { status: 400 });
      }
      updates.province = body.province;
    }

    if (body.maritalStatus !== undefined) {
      const validStatuses = ['single', 'married', 'divorced', 'widowed', 'common_law'];
      if (!validStatuses.includes(body.maritalStatus)) {
        return NextResponse.json({ error: 'Invalid marital status' }, { status: 400 });
      }
      updates.maritalStatus = body.maritalStatus;
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
