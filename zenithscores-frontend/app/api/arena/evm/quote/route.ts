import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fee configuration
const ZENITH_FEE_BPS = parseInt(process.env.ZENITH_FEE_BPS || '50'); // 0.5%

/**
 * Get 0x API base URL for chain (BSC ONLY)
 */
function get0xBaseUrl(chainId: number): string {
    // ONLY BSC is supported
    if (chainId === 56) {
        return 'https://bsc.api.0x.org';
    }
    throw new Error(`Unsupported chainId: ${chainId}. Only BSC (56) is supported.`);
}

/**
 * GET /api/arena/evm/quote
 * 
 * 0x Quote Proxy (SERVER-SIDE ONLY)
 */
export async function GET(req: NextRequest) {
    console.log('[EVM Quote] GET Request received');

    try {
        const { searchParams } = new URL(req.url);

        const sellToken = searchParams.get('sellToken');
        const buyToken = searchParams.get('buyToken');
        const sellAmount = searchParams.get('sellAmount');
        const chainIdStr = searchParams.get('chainId') || '1';
        const takerAddress = searchParams.get('takerAddress');
        const slippagePercentage = searchParams.get('slippagePercentage');

        if (!sellToken || !buyToken || !sellAmount) {
            return Response.json(
                { error: 'Missing required parameters: sellToken, buyToken, sellAmount' },
                { status: 400 }
            );
        }

        const chainId = parseInt(chainIdStr);
        const apiKey = process.env.ZEROX_API_KEY || process.env.OX_API_KEY;
        const feeRecipient = process.env.ZENITH_EVM_FEE_RECIPIENT || process.env.ZENITH_FEE_RECIPIENT;

        if (!apiKey) {
            console.error('[EVM Quote] 0x API key not configured');
            return Response.json({ error: '0x API key not configured' }, { status: 500 });
        }

        const baseUrl = get0xBaseUrl(chainId);
        const url = new URL(`${baseUrl}/swap/v1/quote`);

        url.searchParams.set('sellToken', sellToken);
        url.searchParams.set('buyToken', buyToken);
        url.searchParams.set('sellAmount', sellAmount);

        if (takerAddress) url.searchParams.set('takerAddress', takerAddress);
        if (slippagePercentage) url.searchParams.set('slippagePercentage', slippagePercentage);

        // Platform fee
        if (feeRecipient) {
            url.searchParams.set('feeRecipient', feeRecipient);
            url.searchParams.set('buyTokenPercentageFee', (ZENITH_FEE_BPS / 10000).toString());
        }

        console.log('[EVM Quote] Calling 0x:', url.toString().replace(apiKey, 'REDACTED'));

        const res = await fetch(url.toString(), {
            headers: {
                '0x-api-key': apiKey,
                'Accept': 'application/json',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
        });

        const text = await res.text();

        if (!res.ok) {
            console.error('[EVM Quote] 0x error:', text);
            return Response.json(
                { error: '0x quote failed', details: text },
                { status: res.status }
            );
        }

        const data = JSON.parse(text);
        console.log('[EVM Quote] Success');
        return Response.json(data);

    } catch (e: any) {
        console.error('[EVM Quote] Error:', e);
        return Response.json(
            { error: 'Internal server error', message: e.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/arena/evm/quote
 * 
 * Alternative POST handler for SwapDrawer
 */
export async function POST(req: Request) {
    console.log('[EVM Quote] POST Request received');

    try {
        const body = await req.json();
        const { chainId, sellToken, buyToken, sellAmount, taker } = body;

        if (!sellToken || !buyToken || !sellAmount) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const apiKey = process.env.ZEROX_API_KEY || process.env.OX_API_KEY;
        const feeRecipient = process.env.ZENITH_EVM_FEE_RECIPIENT || process.env.ZENITH_FEE_RECIPIENT;

        if (!apiKey) {
            return Response.json({ error: '0x API key not configured' }, { status: 500 });
        }

        // Default to BSC (56) if no chainId provided
        const baseUrl = get0xBaseUrl(chainId || 56);
        const url = new URL(`${baseUrl}/swap/v1/quote`);

        url.searchParams.set('sellToken', sellToken);
        url.searchParams.set('buyToken', buyToken);
        url.searchParams.set('sellAmount', sellAmount);

        if (taker) url.searchParams.set('takerAddress', taker);

        // Platform fee
        if (feeRecipient) {
            url.searchParams.set('feeRecipient', feeRecipient);
            url.searchParams.set('buyTokenPercentageFee', (ZENITH_FEE_BPS / 10000).toString());
        }

        console.log('[EVM Quote POST] Calling 0x');

        const res = await fetch(url.toString(), {
            headers: {
                '0x-api-key': apiKey,
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('[EVM Quote POST] 0x error:', data);
            return Response.json({ error: '0x quote failed', details: data }, { status: res.status });
        }

        console.log('[EVM Quote POST] Success');
        return Response.json({
            executable: true,
            quote: data,
            to: data.to,
            data: data.data,
            value: data.value,
            gas: data.gas,
            gasPrice: data.gasPrice,
            buyAmount: data.buyAmount,
            sellAmount: data.sellAmount,
        });

    } catch (e: any) {
        console.error('[EVM Quote POST] Error:', e);
        return Response.json(
            { error: 'Internal server error', message: e.message },
            { status: 500 }
        );
    }
}
