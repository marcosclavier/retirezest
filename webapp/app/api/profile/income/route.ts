import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all income sources for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const incomeSources = await prisma.income.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(incomeSources);
  } catch (error) {
    console.error('Error fetching income sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income sources' },
      { status: 500 }
    );
  }
}

// POST - Create new income source
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, description, amount, frequency, isTaxable } = body;

    // Validation
    if (!type || !amount || !frequency) {
      return NextResponse.json(
        { error: 'Type, amount, and frequency are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const income = await prisma.income.create({
      data: {
        userId: session.userId,
        type,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        isTaxable: isTaxable !== undefined ? isTaxable : true,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating income source:', error);
    return NextResponse.json(
      { error: 'Failed to create income source' },
      { status: 500 }
    );
  }
}

// PUT - Update income source
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, description, amount, frequency, isTaxable } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Income ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingIncome) {
      return NextResponse.json(
        { error: 'Income source not found' },
        { status: 404 }
      );
    }

    const updatedIncome = await prisma.income.update({
      where: { id },
      data: {
        type,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        isTaxable: isTaxable !== undefined ? isTaxable : true,
      },
    });

    return NextResponse.json(updatedIncome);
  } catch (error) {
    console.error('Error updating income source:', error);
    return NextResponse.json(
      { error: 'Failed to update income source' },
      { status: 500 }
    );
  }
}

// DELETE - Delete income source
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Income ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingIncome) {
      return NextResponse.json(
        { error: 'Income source not found' },
        { status: 404 }
      );
    }

    await prisma.income.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Income source deleted successfully' });
  } catch (error) {
    console.error('Error deleting income source:', error);
    return NextResponse.json(
      { error: 'Failed to delete income source' },
      { status: 500 }
    );
  }
}
