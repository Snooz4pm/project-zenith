import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Record Solana Jupiter Swap for Analytics
 *
 * This tracks swaps for revenue analytics only.
 * Swaps are non-custodial - funds go directly from user to DEX.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      walletAddress,
      sellToken,
      sellTokenAddress,
      buyToken,
      buyTokenAddress,
      sellAmount,
      buyAmount,
      sellAmountUSD,
      txHash,
      tokenAge,
      liquidityUSD,
      volumeAccel,
    } = body;

    if (!walletAddress || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, txHash' },
        { status: 400 }
      );
    }

    // Check if swap already recorded
    const existing = await prisma.arenaSwap.findUnique({
      where: { txHash },
    });

    if (existing) {
      return NextResponse.json({ swap: existing });
    }

    // Calculate affiliate fee (1% platform fee)
    const affiliateFeeBps = 100; // 1%
    const affiliateFee = sellAmountUSD ? sellAmountUSD * 0.01 : null;

    // Create swap record
    const swap = await prisma.arenaSwap.create({
      data: {
        walletAddress,
        chainId: 0, // Solana doesn't use EVM chainId
        chainName: 'Solana',
        sellToken,
        sellTokenAddress,
        buyToken,
        buyTokenAddress,
        sellAmount: sellAmount?.toString() || '0',
        buyAmount: buyAmount?.toString() || '0',
        sellAmountUSD: sellAmountUSD || null,
        buyAmountUSD: null,
        affiliateFee,
        affiliateFeeBps,
        txHash,
        txStatus: 'pending',

        // Token metadata for discovery tracking
        tokenAge: tokenAge || null,
        liquidityUSD: liquidityUSD || null,
        volumeAccel: volumeAccel || null,

        createdAt: new Date(),
      },
    });

    console.log(`💰 Solana swap recorded: $${sellAmountUSD?.toFixed(2)} → ${affiliateFee?.toFixed(4)} fee`);

    return NextResponse.json({ swap });
  } catch (error: any) {
    console.error('[Record Solana Swap] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record swap' },
      { status: 500 }
    );
  }
}
