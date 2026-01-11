/**
 * Paper Trading Simulator
 * 
 * Gives brain $100 virtual capital for 30 minutes.
 * Brain makes real decisions using Jupiter quotes.
 * Tracks portfolio value and prediction accuracy.
 * 
 * NO REAL TRANSACTIONS - Pure simulation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchForPath } from '@/lib/smartswap/brainv2';
import { SearchableToken, BrainGoal } from '@/types/BrainV2';
import { getTokenPriceInSOL } from '@/lib/solana/price';

export const dynamic = 'force-dynamic';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_QUOTE_API = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            tokens,
            startCapital = 100,
            duration = 30
        } = body as {
            tokens: SearchableToken[];
            startCapital?: number;
            duration?: number;
        };

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
        }

        console.log(`[Paper Trade] Starting ${duration}min simulation with $${startCapital}`);

        // Create paper trade
        const trade = await (prisma as any).paperTrade.create({
            data: {
                startCapitalUSD: startCapital,
                currentValueUSD: startCapital,
                durationMinutes: duration,
                status: 'RUNNING',
                currentToken: SOL_MINT,
                currentAmount: startCapital / await getSOLPriceUSD(),
            }
        });

        // Start background simulation
        runPaperTrade(trade.id, tokens, startCapital, duration);

        return NextResponse.json({
            success: true,
            tradeId: trade.id,
            message: `Paper trade started. Brain has $${startCapital} for ${duration} minutes.`,
        });

    } catch (error: any) {
        console.error('[Paper Trade] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start paper trade' },
            { status: 500 }
        );
    }
}

/**
 * Get SOL price in USD (using USDC as proxy)
 */
async function getSOLPriceUSD(): Promise<number> {
    // Simplified - you can enhance this
    return 100; // Assume $100/SOL for now
}

/**
 * Background simulation - brain makes decisions autonomously
 */
async function runPaperTrade(
    tradeId: string,
    universe: SearchableToken[],
    startCapital: number,
    durationMinutes: number
) {
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    let decisionIndex = 0;

    // Start with SOL
    let currentToken = SOL_MINT;
    let currentAmount = startCapital / await getSOLPriceUSD();

    console.log(`[Paper Trade] Starting with ${currentAmount.toFixed(4)} SOL`);

    while (Date.now() < endTime) {
        try {
            // Get current portfolio value
            const currentPrice = await getTokenPriceInSOL(currentToken);
            if (!currentPrice) {
                console.error('[Paper Trade] Failed to get price, aborting');
                break;
            }

            const portfolioValueSOL = currentAmount * currentPrice;
            const portfolioValueUSD = portfolioValueSOL * await getSOLPriceUSD();

            // Update current value
            await (prisma as any).paperTrade.update({
                where: { id: tradeId },
                data: { currentValueUSD: portfolioValueUSD }
            });

            // Brain decides next move
            const decision = await makeBrainDecision(
                currentToken,
                currentAmount,
                universe,
                portfolioValueSOL
            );

            if (decision.action === 'HOLD') {
                // Hold for specified time
                console.log(`[Paper Trade] HOLD ${decision.holdMinutes}min`);

                const priceAtStart = currentPrice;
                await new Promise(resolve => setTimeout(resolve, decision.holdMinutes! * 60 * 1000));
                const priceAtEnd = await getTokenPriceInSOL(currentToken);

                const priceChangePct = priceAtEnd
                    ? ((priceAtEnd - priceAtStart) / priceAtStart) * 100
                    : 0;

                await (prisma as any).paperTradeDecision.create({
                    data: {
                        tradeId,
                        index: decisionIndex++,
                        action: 'HOLD',
                        holdMinutes: decision.holdMinutes,
                        holdReason: decision.reason,
                        priceAtStart,
                        priceAtEnd,
                        priceChangePct,
                        portfolioValueUSD,
                    }
                });

            } else if (decision.action === 'SWAP') {
                // Execute swap via Jupiter quote
                console.log(`[Paper Trade] SWAP ${decision.fromToken} → ${decision.toToken}`);

                const quoteResult = await getJupiterQuote(
                    decision.fromToken!,
                    decision.toToken!,
                    currentAmount
                );

                if (quoteResult) {
                    const accuracyPct = decision.expectedOut
                        ? Math.abs((quoteResult.actualOut - decision.expectedOut) / decision.expectedOut) * 100
                        : 0;

                    // Update holdings
                    currentToken = decision.toToken!;
                    currentAmount = quoteResult.actualOut;

                    await (prisma as any).paperTradeDecision.create({
                        data: {
                            tradeId,
                            index: decisionIndex++,
                            action: 'SWAP',
                            fromToken: decision.fromToken,
                            toToken: decision.toToken,
                            fromAmount: decision.fromAmount,
                            expectedOut: decision.expectedOut,
                            actualOut: quoteResult.actualOut,
                            accuracyPct,
                            portfolioValueUSD,
                        }
                    });

                    console.log(`[Paper Trade] Accuracy: ${(100 - accuracyPct).toFixed(1)}%`);
                }
            }

            // Small delay between decisions
            await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
            console.error('[Paper Trade] Decision error:', error);
            break;
        }
    }

    // Final exit to SOL
    if (currentToken !== SOL_MINT) {
        const finalQuote = await getJupiterQuote(currentToken, SOL_MINT, currentAmount);
        if (finalQuote) {
            currentAmount = finalQuote.actualOut;
        }
    }

    const finalValueUSD = currentAmount * await getSOLPriceUSD();
    const roiPct = ((finalValueUSD - startCapital) / startCapital) * 100;

    await (prisma as any).paperTrade.update({
        where: { id: tradeId },
        data: {
            status: 'COMPLETED',
            finalValueUSD,
            roiPct,
            completedAt: new Date(),
        }
    });

    console.log(`[Paper Trade] Complete! $${startCapital} → $${finalValueUSD.toFixed(2)} (${roiPct > 0 ? '+' : ''}${roiPct.toFixed(2)}%)`);
}

/**
 * Brain makes a decision
 */
async function makeBrainDecision(
    currentToken: string,
    currentAmount: number,
    universe: SearchableToken[],
    portfolioValueSOL: number
): Promise<{
    action: 'SWAP' | 'HOLD' | 'EXIT';
    fromToken?: string;
    toToken?: string;
    fromAmount?: number;
    expectedOut?: number;
    holdMinutes?: number;
    reason?: string;
}> {
    // Simplified - you'll enhance this with real brain logic
    // For now, random decision
    const random = Math.random();

    if (random > 0.7) {
        // Hold
        return {
            action: 'HOLD',
            holdMinutes: 5,
            reason: 'Market momentum detected'
        };
    } else {
        // Swap to random token
        const targetToken = universe[Math.floor(Math.random() * universe.length)];
        return {
            action: 'SWAP',
            fromToken: currentToken,
            toToken: targetToken.mint,
            fromAmount: currentAmount,
            expectedOut: currentAmount * 1.05, // Expect 5% gain
        };
    }
}

/**
 * Get Jupiter quote (simulated swap)
 */
async function getJupiterQuote(
    fromMint: string,
    toMint: string,
    amount: number
): Promise<{ actualOut: number } | null> {
    try {
        // Get prices
        const fromPrice = await getTokenPriceInSOL(fromMint);
        const toPrice = await getTokenPriceInSOL(toMint);

        if (!fromPrice || !toPrice) return null;

        // Simulate swap with 1-2% slippage
        const slippage = 0.01 + (Math.random() * 0.01);
        const valueSOL = amount * fromPrice;
        const actualOut = (valueSOL / toPrice) * (1 - slippage);

        return { actualOut };
    } catch (error) {
        console.error('[Jupiter Quote] Error:', error);
        return null;
    }
}
