import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// This endpoint records the swap after user executes it on-chain
// Revenue tracking happens here (silent, backend-only)

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      txHash, // Transaction hash from wallet
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      chainId = 1,
      context, // 'decision_lab', 'portfolio', 'alert'
      contextId, // scenarioId, alertId, etc.
      estimatedFeeUsd = 0, // From quote response
    } = body;

    if (!txHash || !fromToken || !toToken || !fromAmount || !toAmount) {
      return NextResponse.json(
        { error: 'Missing required swap details' },
        { status: 400 }
      );
    }

    // Record swap in database (for revenue tracking)
    // This table will be used for your analytics dashboard
    const swap = await prisma.$executeRaw`
      INSERT INTO "SwapTransaction" (
        id, "userId", "fromToken", "toToken", "fromAmount", "toAmount",
        "chainId", network, "txHash", "estimatedFeeUsd", context, "contextId",
        status, "createdAt"
      ) VALUES (
        gen_random_uuid(),
        ${session.user.id},
        ${fromToken},
        ${toToken},
        ${fromAmount},
        ${toAmount},
        ${chainId},
        ${chainId === 1 ? 'ethereum' : chainId === 137 ? 'polygon' : 'base'},
        ${txHash},
        ${estimatedFeeUsd},
        ${context || 'manual'},
        ${contextId || null},
        'pending',
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;

    // Optionally: Update portfolio if this was a position execution
    // This makes the swap feel like "continuing what you were doing"
    if (context === 'decision_lab' && contextId) {
      // Create or update position in portfolio
      // This links the swap to the broader narrative
      // (Implementation depends on your portfolio logic)
    }

    return NextResponse.json({
      success: true,
      txHash,
      message: 'Swap executed successfully',
    });

  } catch (error: any) {
    console.error('[Swap Execute Error]', error);
    return NextResponse.json(
      { error: 'Failed to record swap', details: error.message },
      { status: 500 }
    );
  }
}
