import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all debts for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debts = await prisma.debt.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(debts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debts' },
      { status: 500 }
    );
  }
}

// POST - Create new debt
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, description, currentBalance, interestRate, monthlyPayment } = body;

    // Validation
    if (!type || currentBalance === undefined) {
      return NextResponse.json(
        { error: 'Type and current balance are required' },
        { status: 400 }
      );
    }

    if (currentBalance < 0) {
      return NextResponse.json(
        { error: 'Current balance cannot be negative' },
        { status: 400 }
      );
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
    console.error('Error creating debt:', error);
    return NextResponse.json(
      { error: 'Failed to create debt' },
      { status: 500 }
    );
  }
}

// PUT - Update debt
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, description, currentBalance, interestRate, monthlyPayment } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Debt ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingDebt = await prisma.debt.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingDebt) {
      return NextResponse.json(
        { error: 'Debt not found' },
        { status: 404 }
      );
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
    console.error('Error updating debt:', error);
    return NextResponse.json(
      { error: 'Failed to update debt' },
      { status: 500 }
    );
  }
}

// DELETE - Delete debt
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
        { error: 'Debt ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingDebt = await prisma.debt.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingDebt) {
      return NextResponse.json(
        { error: 'Debt not found' },
        { status: 404 }
      );
    }

    await prisma.debt.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json(
      { error: 'Failed to delete debt' },
      { status: 500 }
    );
  }
}
