/**
 * Swap Receipts API
 * 
 * POST /api/swap/receipt - Save swap receipt
 * GET /api/swap/history - Get swap history for wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Save swap receipt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      wallet,
      inputMint,
      outputMint,
      inputSymbol,
      outputSymbol,
      inAmount,
      outAmount,
      inAmountUi,
      outAmountUi,
      inAmountUsd,
      outAmountUsd,
      txid,
      routeType,
      routeHops,
      slippageBps,
      priceImpactPct,
      feeAmount,
      status,
      jitoBundle,
      jitoBundleId,
    } = body;

    if (!wallet || !inputMint || !outputMint || !txid) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, inputMint, outputMint, txid' },
        { status: 400 }
      );
    }

    // Upsert to handle retries
    const receipt = await prisma.swapReceipt.upsert({
      where: { txid },
      create: {
        wallet,
        inputMint,
        outputMint,
        inputSymbol,
        outputSymbol,
        inAmount: inAmount?.toString() || '0',
        outAmount: outAmount?.toString() || '0',
        inAmountUi,
        outAmountUi,
        inAmountUsd,
        outAmountUsd,
        txid,
        routeType,
        routeHops,
        slippageBps,
        priceImpactPct,
        feeAmount,
        status: status || 'pending',
        jitoBundle: jitoBundle || false,
        jitoBundleId,
      },
      update: {
        status,
        confirmedAt: status === 'confirmed' ? new Date() : undefined,
      }
    });

    return NextResponse.json({ success: true, receipt });

  } catch (error: any) {
    console.error('[SWAP_RECEIPT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save receipt' },
      { status: 500 }
    );
  }
}

// GET - Get swap history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing wallet parameter' },
        { status: 400 }
      );
    }

    const [receipts, total] = await Promise.all([
      prisma.swapReceipt.findMany({
        where: { wallet },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.swapReceipt.count({ where: { wallet } })
    ]);

    return NextResponse.json({
      receipts,
      total,
      limit,
      offset,
      hasMore: offset + receipts.length < total
    });

  } catch (error: any) {
    console.error('[SWAP_HISTORY] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
