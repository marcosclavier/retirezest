import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError, AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all real estate assets for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const realEstateAssets = await prisma.realEstateAsset.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ realEstateAssets });
  } catch (error) {
    logger.error('Error fetching real estate assets', error, {
      endpoint: '/api/profile/real-estate',
      method: 'GET'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST - Create new real estate asset
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const {
      propertyType,
      address,
      city,
      province,
      purchasePrice,
      purchaseDate,
      currentValue,
      mortgageBalance,
      monthlyRentalIncome,
      monthlyExpenses,
      owner,
      ownershipPercent,
      isPrincipalResidence,
      principalResidenceYears,
      planToSell,
      plannedSaleYear,
      plannedSalePrice,
      downsizeTo,
      notes
    } = body;

    // Validation
    if (!propertyType) {
      throw new ValidationError('Property type is required', 'propertyType');
    }

    if (!['principal_residence', 'rental', 'vacation', 'commercial'].includes(propertyType)) {
      throw new ValidationError('Invalid property type', 'propertyType');
    }

    if (!purchasePrice || purchasePrice < 0) {
      throw new ValidationError('Valid purchase price is required', 'purchasePrice');
    }

    if (!purchaseDate) {
      throw new ValidationError('Purchase date is required', 'purchaseDate');
    }

    if (!currentValue || currentValue < 0) {
      throw new ValidationError('Valid current value is required', 'currentValue');
    }

    // Validate ownership percent
    if (ownershipPercent !== undefined && (ownershipPercent < 0 || ownershipPercent > 100)) {
      throw new ValidationError('Ownership percent must be between 0 and 100', 'ownershipPercent');
    }

    const realEstateAsset = await prisma.realEstateAsset.create({
      data: {
        userId: session.userId,
        propertyType,
        address: address || null,
        city: city || null,
        province: province || null,
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate: new Date(purchaseDate),
        currentValue: parseFloat(currentValue),
        mortgageBalance: mortgageBalance ? parseFloat(mortgageBalance) : 0,
        monthlyRentalIncome: monthlyRentalIncome ? parseFloat(monthlyRentalIncome) : 0,
        monthlyExpenses: monthlyExpenses ? parseFloat(monthlyExpenses) : 0,
        owner: owner || 'person1',
        ownershipPercent: ownershipPercent !== undefined ? parseFloat(ownershipPercent) : 100,
        isPrincipalResidence: isPrincipalResidence || false,
        principalResidenceYears: principalResidenceYears ? parseFloat(principalResidenceYears) : 0,
        planToSell: planToSell || false,
        plannedSaleYear: plannedSaleYear ? parseInt(plannedSaleYear) : null,
        plannedSalePrice: plannedSalePrice ? parseFloat(plannedSalePrice) : null,
        downsizeTo: downsizeTo ? parseFloat(downsizeTo) : null,
        notes: notes || null,
      },
    });

    logger.info('Real estate asset created', {
      userId: session.userId,
      propertyType,
      currentValue
    });

    return NextResponse.json(realEstateAsset, { status: 201 });
  } catch (error) {
    logger.error('Error creating real estate asset', error, {
      endpoint: '/api/profile/real-estate',
      method: 'POST'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT - Update real estate asset
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const {
      id,
      propertyType,
      address,
      city,
      province,
      purchasePrice,
      purchaseDate,
      currentValue,
      mortgageBalance,
      monthlyRentalIncome,
      monthlyExpenses,
      owner,
      ownershipPercent,
      isPrincipalResidence,
      principalResidenceYears,
      planToSell,
      plannedSaleYear,
      plannedSalePrice,
      downsizeTo,
      notes
    } = body;

    if (!id) {
      throw new ValidationError('Real estate asset ID is required', 'id');
    }

    // Verify ownership
    const existingAsset = await prisma.realEstateAsset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingAsset) {
      throw new NotFoundError('Real estate asset');
    }

    // Validation for updates
    if (propertyType && !['principal_residence', 'rental', 'vacation', 'commercial'].includes(propertyType)) {
      throw new ValidationError('Invalid property type', 'propertyType');
    }

    if (purchasePrice !== undefined && purchasePrice < 0) {
      throw new ValidationError('Purchase price cannot be negative', 'purchasePrice');
    }

    if (currentValue !== undefined && currentValue < 0) {
      throw new ValidationError('Current value cannot be negative', 'currentValue');
    }

    if (ownershipPercent !== undefined && (ownershipPercent < 0 || ownershipPercent > 100)) {
      throw new ValidationError('Ownership percent must be between 0 and 100', 'ownershipPercent');
    }

    const updateData: any = {};
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (province !== undefined) updateData.province = province || null;
    if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice);
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue);
    if (mortgageBalance !== undefined) updateData.mortgageBalance = parseFloat(mortgageBalance);
    if (monthlyRentalIncome !== undefined) updateData.monthlyRentalIncome = parseFloat(monthlyRentalIncome);
    if (monthlyExpenses !== undefined) updateData.monthlyExpenses = parseFloat(monthlyExpenses);
    if (owner !== undefined) updateData.owner = owner;
    if (ownershipPercent !== undefined) updateData.ownershipPercent = parseFloat(ownershipPercent);
    if (isPrincipalResidence !== undefined) updateData.isPrincipalResidence = isPrincipalResidence;
    if (principalResidenceYears !== undefined) updateData.principalResidenceYears = parseFloat(principalResidenceYears);
    if (planToSell !== undefined) updateData.planToSell = planToSell;
    if (plannedSaleYear !== undefined) updateData.plannedSaleYear = plannedSaleYear ? parseInt(plannedSaleYear) : null;
    if (plannedSalePrice !== undefined) updateData.plannedSalePrice = plannedSalePrice ? parseFloat(plannedSalePrice) : null;
    if (downsizeTo !== undefined) updateData.downsizeTo = downsizeTo ? parseFloat(downsizeTo) : null;
    if (notes !== undefined) updateData.notes = notes || null;

    const updatedAsset = await prisma.realEstateAsset.update({
      where: { id },
      data: updateData,
    });

    logger.info('Real estate asset updated', {
      userId: session.userId,
      assetId: id
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    logger.error('Error updating real estate asset', error, {
      endpoint: '/api/profile/real-estate',
      method: 'PUT'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE - Delete real estate asset
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Real estate asset ID is required', 'id');
    }

    // Verify ownership
    const existingAsset = await prisma.realEstateAsset.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingAsset) {
      throw new NotFoundError('Real estate asset');
    }

    await prisma.realEstateAsset.delete({
      where: { id },
    });

    logger.info('Real estate asset deleted', {
      userId: session.userId,
      assetId: id
    });

    return NextResponse.json({ message: 'Real estate asset deleted successfully' });
  } catch (error) {
    logger.error('Error deleting real estate asset', error, {
      endpoint: '/api/profile/real-estate',
      method: 'DELETE'
    });

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
