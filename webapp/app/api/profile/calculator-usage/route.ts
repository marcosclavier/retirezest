import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors';

// POST - Record calculator usage
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { calculator } = body;

    // Validation
    if (!calculator || !['cpp', 'oas'].includes(calculator)) {
      throw new ValidationError('calculator must be either "cpp" or "oas"');
    }

    // Update the appropriate timestamp
    const updateData: any = {};
    if (calculator === 'cpp') {
      updateData.cppCalculatorUsedAt = new Date();
    } else if (calculator === 'oas') {
      updateData.oasCalculatorUsedAt = new Date();
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        cppCalculatorUsedAt: true,
        oasCalculatorUsedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      ...updatedUser
    });
  } catch (error) {
    logger.error('Error recording calculator usage', error, {
      endpoint: '/api/profile/calculator-usage',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
