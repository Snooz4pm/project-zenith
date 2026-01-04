import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get 0x API base URL for chain (CRITICAL - different endpoints per chain)
 */
function get0xBaseUrl(chainId: number): string {
    switch (chainId) {
        case 1: return 'https://api.0x.org';
        case 137: return 'https://polygon.api.0x.org';
        case 42161: return 'https://arbitrum.api.0x.org';
        case 8453: return 'https://base.api.0x.org';
        case 56: return 'https://bsc.api.0x.org';
        default: throw new Error(`Unsupported chainId: ${chainId}`);
    }
}

/**
 * GET /api/arena/evm/quote
 * 
 * 0x Quote Proxy (SERVER-SIDE ONLY)
 * Prevents CORS issues and handles API key authentication
 */
export async function GET(req: NextRequest) {
    console.log('[EVM Quote] Request received');

    try {
        const { searchParams } = new URL(req.url);

        const sellToken = searchParams.get('sellToken');
        const buyToken = searchParams.get('buyToken');
        const sellAmount = searchParams.get('sellAmount');
        const chainIdStr = searchParams.get('chainId') || '1';
        const slippagePercentage = searchParams.get('slippagePercentage');
        const affiliateAddress = searchParams.get('affiliateAddress');
        const buyTokenPercentageFee = searchParams.get('buyTokenPercentageFee');

        // Validation
        if (!sellToken || !buyToken || !sellAmount) {
            console.error('[EVM Quote] Missing params:', { sellToken, buyToken, sellAmount });
            return Response.json(
                { error: 'Missing required parameters: sellToken, buyToken, sellAmount' },
                { status: 400 }
            );
        }

        const chainId = parseInt(chainIdStr);

        // Validate sellAmount is integer string (no floats, no scientific notation)
        if (!/^\d+$/.test(sellAmount)) {
            console.error('[EVM Quote] Invalid sellAmount format:', sellAmount);
            return Response.json(
                { error: 'sellAmount must be a stringified integer (wei)' },
                { status: 400 }
            );
        }

        // Check API key
        const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
        if (!apiKey) {
            console.error('[EVM Quote] 0x API key not configured');
            return Response.json(
                { error: '0x API key not configured' },
                { status: 500 }
            );
        }

        // Get chain-specific base URL
        const baseUrl = get0xBaseUrl(chainId);

        // Build 0x URL
        const zeroXParams = new URLSearchParams({
            sellToken,
            buyToken,
            sellAmount,
        });

        if (slippagePercentage) zeroXParams.append('slippagePercentage', slippagePercentage);
        if (affiliateAddress) {
            zeroXParams.append('affiliateAddress', affiliateAddress);
            zeroXParams.append('feeRecipient', affiliateAddress);
        }
        if (buyTokenPercentageFee) zeroXParams.append('buyTokenPercentageFee', buyTokenPercentageFee);

        const fullUrl = `${baseUrl}/swap/v1/quote?${zeroXParams.toString()}`;
        console.log('[EVM Quote] Calling 0x:', fullUrl.replace(apiKey, 'REDACTED'));

        const res = await fetch(fullUrl, {
            headers: {
                '0x-api-key': apiKey,
                'Accept': 'application/json',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(15000), // 15s timeout
        });

        console.log('[EVM Quote] 0x response status:', res.status);

        // Log raw response for debugging
        const text = await res.text();

        if (!res.ok) {
            console.error('[EVM Quote] 0x error response:', text);
            return Response.json(
                { error: '0x quote failed', details: text, status: res.status },
                { status: res.status }
            );
        }

        // Parse and return
        try {
            const data = JSON.parse(text);
            console.log('[EVM Quote] Success - route found');
            return Response.json(data);
        } catch (e) {
            console.error('[EVM Quote] Failed to parse 0x response:', text);
            return Response.json(
                { error: 'Invalid JSON response from 0x' },
                { status: 500 }
            );
        }

    } catch (e: any) {
        console.error('[EVM Quote] Error:', e);
        return Response.json(
            { error: 'Internal server error', message: e.message },
            { status: 500 }
        );
    }
}
