import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getChainConfig } from '@/lib/arena/chains';

/**
 * POST /api/arena/swap/record
 *
 * Records a swap transaction to the database (analytics only)
 * Called AFTER the on-chain transaction is submitted
 *
 * Body:
 * {
 *   walletAddress: string
 *   chainId: number
 *   sellToken: string (symbol)
 *   sellTokenAddress: string
 *   buyToken: string (symbol)
 *   buyTokenAddress: string
 *   sellAmount: string (wei)
 *   buyAmount: string (wei)
 *   sellAmountUSD?: number
 *   buyAmountUSD?: number
 *   txHash: string
 *   affiliateFeeBps?: number
 *   tokenAge?: number
 *   liquidityUSD?: number
 *   volumeAccel?: number
 * }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    const body = await req.json();

    const {
      walletAddress,
      chainId,
      sellToken,
      sellTokenAddress,
      buyToken,
      buyTokenAddress,
      sellAmount,
      buyAmount,
      sellAmountUSD,
      buyAmountUSD,
      txHash,
      affiliateFeeBps,
      tokenAge,
      liquidityUSD,
      volumeAccel,
    } = body;

    // Validate required fields
    if (
      !walletAddress ||
      !chainId ||
      !sellToken ||
      !sellTokenAddress ||
      !buyToken ||
      !buyTokenAddress ||
      !sellAmount ||
      !buyAmount ||
      !txHash
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get chain config
    const chain = getChainConfig(chainId);
    if (!chain) {
      return NextResponse.json(
        { error: `Unsupported chain: ${chainId}` },
        { status: 400 }
      );
    }

    // Calculate affiliate fee in USD (if amounts provided)
    const affiliateFee = sellAmountUSD && affiliateFeeBps
      ? (sellAmountUSD * affiliateFeeBps) / 10000
      : null;

    // Create swap record
    const swap = await prisma.arenaSwap.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        userId: session?.user?.id || null,

        chainId,
        chainName: chain.name,

        sellToken,
        sellTokenAddress: sellTokenAddress.toLowerCase(),
        buyToken,
        buyTokenAddress: buyTokenAddress.toLowerCase(),

        sellAmount,
        buyAmount,
        sellAmountUSD,
        buyAmountUSD,

        affiliateFee,
        affiliateFeeBps,
        feeToken: buyToken, // Fee taken in buy token

        txHash: txHash.toLowerCase(),
        txStatus: 'pending',

        // Discovery metadata (if provided)
        tokenAge,
        liquidityUSD,
        volumeAccel,

        createdAt: new Date(),
      },
    });

    console.log(`✅ Swap recorded: ${swap.id}`);
    console.log(`💰 Estimated fee: $${affiliateFee?.toFixed(2) || '0.00'}`);

    return NextResponse.json({
      success: true,
      swap: {
        id: swap.id,
        txHash: swap.txHash,
        chainId: swap.chainId,
        estimatedFee: affiliateFee,
      },
    });
  } catch (error: any) {
    console.error('[Record Swap API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record swap' },
      { status: 500 }
    );
  }
}
