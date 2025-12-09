import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// GET - Fetch all income sources for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const incomeSources = await prisma.income.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ income: incomeSources });
  } catch (error) {
    logger.error('Error fetching income sources', error, {
      endpoint: '/api/profile/income',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST - Create new income source
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { type, description, amount, frequency, startAge, owner, notes, isTaxable } = body;

    // Validation
    if (!type || !amount || !frequency) {
      throw new ValidationError('Type, amount, and frequency are required');
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0', 'amount');
    }

    const income = await prisma.income.create({
      data: {
        userId: session.userId,
        type,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        startAge: startAge ? parseInt(startAge) : null,
        owner: owner || 'person1',
        notes: notes || null,
        isTaxable: isTaxable !== undefined ? isTaxable : true,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    logger.error('Error creating income source', error, {
      endpoint: '/api/profile/income',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT - Update income source
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { id, type, description, amount, frequency, startAge, owner, notes, isTaxable } = body;

    if (!id) {
      throw new ValidationError('Income ID is required', 'id');
    }

    // Verify ownership
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingIncome) {
      throw new NotFoundError('Income source');
    }

    const updatedIncome = await prisma.income.update({
      where: { id },
      data: {
        type,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        startAge: startAge ? parseInt(startAge) : null,
        owner: owner || 'person1',
        notes: notes || null,
        isTaxable: isTaxable !== undefined ? isTaxable : true,
      },
    });

    return NextResponse.json(updatedIncome);
  } catch (error) {
    logger.error('Error updating income source', error, {
      endpoint: '/api/profile/income',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE - Delete income source
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Income ID is required', 'id');
    }

    // Verify ownership
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingIncome) {
      throw new NotFoundError('Income source');
    }

    await prisma.income.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Income source deleted successfully' });
  } catch (error) {
    logger.error('Error deleting income source', error, {
      endpoint: '/api/profile/income',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
