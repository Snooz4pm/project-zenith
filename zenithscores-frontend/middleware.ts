import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🚨 NUCLEAR TEST - Middleware completely disabled
// If calibration works without this, middleware is the problem
export async function middleware(request: NextRequest) {
    console.log("[MIDDLEWARE DISABLED] Path:", request.nextUrl.pathname)
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'],
}
