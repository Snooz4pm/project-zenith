/**
 * Update Swap Status API
 * 
 * PATCH /api/swap/receipt/[txid] - Update swap status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { txid: string } }
) {
  try {
    const { txid } = params;
    const body = await request.json();
    const { status, errorMessage } = body;

    const receipt = await prisma.swapReceipt.update({
      where: { txid },
      data: {
        status,
        errorMessage,
        confirmedAt: status === 'confirmed' ? new Date() : undefined,
      }
    });

    return NextResponse.json({ success: true, receipt });

  } catch (error: any) {
    console.error('[SWAP_UPDATE] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update receipt' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { txid: string } }
) {
  try {
    const { txid } = params;

    const receipt = await prisma.swapReceipt.findUnique({
      where: { txid }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ receipt });

  } catch (error: any) {
    console.error('[SWAP_GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
