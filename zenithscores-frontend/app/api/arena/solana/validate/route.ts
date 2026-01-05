/**
 * POST /api/arena/solana/validate
 * 
 * Trigger validation job manually or check status
 */

import { NextResponse } from 'next/server';
import { runValidationJob, getValidationJobStatus } from '@/lib/solana/validation-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Check job status
export async function GET() {
  const status = getValidationJobStatus();
  return NextResponse.json({ success: true, ...status });
}

// POST - Trigger validation
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;
    const maxTokens = body.maxTokens ?? 500;

    // Simple auth check (use your own auth)
    const authHeader = req.headers.get('authorization');
    const expectedKey = process.env.CRON_SECRET || process.env.ADMIN_API_KEY;
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Validation API] Starting validation job...');
    const result = await runValidationJob({ force, maxTokens });

    return NextResponse.json({
      success: result.success,
      validated: result.validated,
      total: result.total,
    });
  } catch (err: any) {
    console.error('[Validation API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
