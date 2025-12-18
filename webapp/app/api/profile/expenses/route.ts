import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all expenses for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    logger.error('Error fetching expenses', error, {
      endpoint: '/api/profile/expenses',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { category, description, amount, frequency, essential, isEssential, notes } = body;

    // Validation
    if (!category || !amount || !frequency) {
      throw new ValidationError('Category, amount, and frequency are required');
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0', 'amount');
    }

    const essentialValue = essential !== undefined ? essential : (isEssential !== undefined ? isEssential : true);

    const expense = await prisma.expense.create({
      data: {
        userId: session.userId,
        category,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        essential: essentialValue,
        isEssential: essentialValue, // Keep for backwards compatibility
        notes: notes || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    logger.error('Error creating expense', error, {
      endpoint: '/api/profile/expenses',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT - Update expense
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { id, category, description, amount, frequency, essential, isEssential, notes } = body;

    if (!id) {
      throw new ValidationError('Expense ID is required', 'id');
    }

    // Verify ownership
    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingExpense) {
      throw new NotFoundError('Expense');
    }

    const essentialValue = essential !== undefined ? essential : (isEssential !== undefined ? isEssential : true);

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        category,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        essential: essentialValue,
        isEssential: essentialValue, // Keep for backwards compatibility
        notes: notes || null,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    logger.error('Error updating expense', error, {
      endpoint: '/api/profile/expenses',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Expense ID is required', 'id');
    }

    // Verify ownership
    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingExpense) {
      throw new NotFoundError('Expense');
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Error deleting expense', error, {
      endpoint: '/api/profile/expenses',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
