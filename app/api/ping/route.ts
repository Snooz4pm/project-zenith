export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({
        ok: true,
        timestamp: new Date().toISOString(),
        env_check: !!process.env.HELIUS_API_KEY
    });
}
