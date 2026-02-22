import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// Schema for updating an income item
const updateIncomeSchema = z.object({
  type: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  frequency: z.string().optional(),
  isTaxable: z.boolean().optional(),
  owner: z.string().optional(),
  inflationIndexed: z.boolean().optional(),
  startMonth: z.number().min(1).max(12).nullable().optional(),
  startYear: z.number().min(1900).max(2100).nullable().optional(),
  endMonth: z.number().min(1).max(12).nullable().optional(),
  endYear: z.number().min(1900).max(2100).nullable().optional(),
  notes: z.string().nullable().optional(),
  // Quebec-specific fields
  qppContributions: z.number().nullable().optional(),
  qppYearsContributed: z.number().nullable().optional(),
  qppPensionableEarnings: z.number().nullable().optional(),
  qppEstimatedBenefit: z.number().nullable().optional(),
});

// GET /api/profile/income/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    if (!session) {
      throw new AuthenticationError();
    }

    const income = await prisma.income.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!income) {
      return NextResponse.json(
        { error: 'Income item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(income);
  } catch (error) {
    logger.error('Error fetching income', error, {
      endpoint: '/api/profile/income/[id]',
      method: 'GET'
    });
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// PUT /api/profile/income/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    if (!session) {
      throw new AuthenticationError();
    }

    // Verify ownership
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!existingIncome) {
      return NextResponse.json(
        { error: 'Income item not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateIncomeSchema.parse(body);

    // Update the income item
    const updatedIncome = await prisma.income.update({
      where: { id: id },
      data: validatedData,
    });

    return NextResponse.json(updatedIncome);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input data');
    }
    logger.error('Error updating income', error, {
      endpoint: '/api/profile/income/[id]',
      method: 'PUT'
    });
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// DELETE /api/profile/income/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    if (!session) {
      throw new AuthenticationError();
    }

    // Verify ownership
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!existingIncome) {
      return NextResponse.json(
        { error: 'Income item not found' },
        { status: 404 }
      );
    }

    // Delete the income item
    await prisma.income.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting income', error, {
      endpoint: '/api/profile/income/[id]',
      method: 'DELETE'
    });
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}