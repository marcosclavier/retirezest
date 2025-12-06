import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// GET - Fetch all debts for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const debts = await prisma.debt.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(debts);
  } catch (error) {
    logger.error('Error fetching debts', error, {
      endpoint: '/api/profile/debts',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST - Create new debt
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { type, description, currentBalance, interestRate, monthlyPayment } = body;

    // Validation
    if (!type || currentBalance === undefined) {
      throw new ValidationError('Type and current balance are required');
    }

    if (currentBalance < 0) {
      throw new ValidationError('Current balance cannot be negative', 'currentBalance');
    }

    const debt = await prisma.debt.create({
      data: {
        userId: session.userId,
        type,
        description: description || null,
        currentBalance: parseFloat(currentBalance),
        interestRate: parseFloat(interestRate),
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    logger.error('Error creating debt', error, {
      endpoint: '/api/profile/debts',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT - Update debt
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { id, type, description, currentBalance, interestRate, monthlyPayment } = body;

    if (!id) {
      throw new ValidationError('Debt ID is required', 'id');
    }

    // Verify ownership
    const existingDebt = await prisma.debt.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingDebt) {
      throw new NotFoundError('Debt');
    }

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        type,
        description: description || null,
        currentBalance: parseFloat(currentBalance),
        interestRate: parseFloat(interestRate),
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
      },
    });

    return NextResponse.json(updatedDebt);
  } catch (error) {
    logger.error('Error updating debt', error, {
      endpoint: '/api/profile/debts',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE - Delete debt
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Debt ID is required', 'id');
    }

    // Verify ownership
    const existingDebt = await prisma.debt.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingDebt) {
      throw new NotFoundError('Debt');
    }

    await prisma.debt.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    logger.error('Error deleting debt', error, {
      endpoint: '/api/profile/debts',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
