import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'API is working',
        env: {
            nextAuthUrl: process.env.NEXTAUTH_URL,
            nodeEnv: process.env.NODE_ENV
        }
    })
}
