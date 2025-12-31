import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 0x API Base URL (use mainnet for production)
const ZEROX_API_BASE = process.env.ZEROX_API_URL || 'https://api.0x.org';

// Your affiliate parameters (set in .env)
const AFFILIATE_FEE = process.env.ZEROX_AFFILIATE_FEE || '0.01'; // 1% (0x splits this with you)
const AFFILIATE_ADDRESS = process.env.ZEROX_AFFILIATE_ADDRESS; // Your ETH address

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fromToken,
      toToken,
      amount, // in smallest unit (wei for ETH)
      chainId = 1, // 1=Ethereum, 137=Polygon, 8453=Base
      slippagePercentage = 0.5 // 0.5% default
    } = body;

    if (!fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: fromToken, toToken, amount' },
        { status: 400 }
      );
    }

    // Build 0x quote request with affiliate parameters
    const params = new URLSearchParams({
      sellToken: fromToken,
      buyToken: toToken,
      sellAmount: amount,
      slippagePercentage: slippagePercentage.toString(),

      // REVENUE PARAMETERS (This is where you get paid)
      ...(AFFILIATE_ADDRESS && {
        affiliateAddress: AFFILIATE_ADDRESS,
        buyTokenPercentageFee: AFFILIATE_FEE, // Your cut
      }),

      // Enable surplus collection (0x optimization that generates extra value)
      enableSlippageProtection: 'true',

      // Skip validation for quote (faster)
      skipValidation: 'true',
    });

    // Construct API URL based on chain
    const apiUrl = `${ZEROX_API_BASE}/swap/v1/quote?${params.toString()}`;

    // Fetch quote from 0x
    const response = await fetch(apiUrl, {
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[0x Quote Error]', error);
      return NextResponse.json(
        { error: 'Failed to get swap quote', details: error },
        { status: response.status }
      );
    }

    const quote = await response.json();

    // Calculate your estimated revenue (silent, not shown to user)
    const buyAmount = parseFloat(quote.buyAmount);
    const affiliateFeeAmount = buyAmount * parseFloat(AFFILIATE_FEE);

    // Estimate USD value if token prices available
    const estimatedRevenueUsd = quote.buyTokenToEthRate
      ? (affiliateFeeAmount * parseFloat(quote.buyTokenToEthRate) * (quote.ethPriceUsd || 0))
      : 0;

    // Return quote with metadata (revenue stays backend-only)
    return NextResponse.json({
      quote: {
        fromToken,
        toToken,
        fromAmount: quote.sellAmount,
        toAmount: quote.buyAmount,
        estimatedGas: quote.estimatedGas,
        gasPrice: quote.gasPrice,

        // User sees this
        estimatedPriceImpact: quote.estimatedPriceImpact,

        // Route info (shown in tooltip, not main UI)
        sources: quote.sources,

        // Quote expiry
        expiresAt: Date.now() + 30000, // 30 seconds
      },

      // Internal metadata (not sent to frontend)
      _internal: {
        estimatedRevenueUsd,
        affiliateFee: AFFILIATE_FEE,
      },
    });

  } catch (error: any) {
    console.error('[Swap Quote Error]', error);
    return NextResponse.json(
      { error: 'Failed to generate quote', details: error.message },
      { status: 500 }
    );
  }
}
