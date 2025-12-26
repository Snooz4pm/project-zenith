import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public routes - no auth required at all
const PUBLIC_ROUTES = ['/', '/news', '/privacy', '/terms', '/crypto', '/stocks', '/forex']

// Auth routes - only for non-logged-in users
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/error', '/auth/calibration']

// Protected routes - require login only (calibration removed for now)
const PROTECTED_ROUTES = ['/command-center', '/trading', '/signals', '/academy', '/explore', '/profile', '/learning', '/learn']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for static files, API routes, and files with extensions
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    // Get JWT token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const isLoggedIn = !!token

    // Determine route type
    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
    const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

    // RULE 1: Public routes - always allow
    if (isPublicRoute && !isProtectedRoute) {
        return NextResponse.next()
    }

    // RULE 2: Auth routes (login/register) - redirect logged-in users to command center
    if (isAuthRoute) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/command-center', request.url))
        }
        return NextResponse.next()
    }

    // RULE 3: Protected routes - require login only
    if (isProtectedRoute) {
        if (!isLoggedIn) {
            // Not logged in - go to login
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }
        // Logged in - allow access (no calibration check)
        return NextResponse.next()
    }

    // Default - allow
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'],
}
