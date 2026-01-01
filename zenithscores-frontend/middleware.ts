import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public routes - no auth required at all
const PUBLIC_ROUTES = ['/', '/news', '/privacy', '/terms', '/crypto', '/stocks', '/forex']

// Auth routes - only for non-logged-in users
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/error', '/auth/calibration']

// Protected routes - require login only (calibration removed for now)
const PROTECTED_ROUTES = ['/command-center', '/dashboard', '/trading', '/signals', '/academy', '/explore', '/profile', '/learning', '/learn', '/notebook', '/charts']

// Routes that have mobile versions
const MOBILE_ROUTES = ['/command-center', '/markets', '/profile']

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

    // Mobile detection - redirect to /mobile subroutes
    const ua = request.headers.get('user-agent') || ''
    const isMobile = /iphone|ipad|ipod|android|mobile|blackberry|opera mini|iemobile/i.test(ua)

    if (isMobile && !pathname.endsWith('/mobile')) {
        const needsMobileRedirect = MOBILE_ROUTES.some(route => pathname === route)
        if (needsMobileRedirect) {
            const mobileUrl = new URL(`${pathname}/mobile`, request.url)
            mobileUrl.search = request.nextUrl.search
            return NextResponse.redirect(mobileUrl)
        }
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

    // RULE 1: Homepage - redirect logged-in users to command center
    if (pathname === '/') {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/command-center', request.url))
        }
        return NextResponse.next()
    }

    // RULE 2: Public routes - always allow access
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