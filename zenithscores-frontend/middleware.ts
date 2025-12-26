import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public routes - no auth required at all
const PUBLIC_ROUTES = ['/', '/news', '/privacy', '/terms', '/crypto', '/stocks', '/forex']

// Auth routes - only for non-logged-in users
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/error']

// Protected routes - require login AND calibration
const PROTECTED_ROUTES = ['/command-center', '/trading', '/signals', '/academy', '/explore', '/profile', '/learning', '/learn']

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl

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
    const isCalibrated = token?.calibrationCompleted === true

    // Check for bypass param (used right after calibration completion)
    const justCalibrated = searchParams.get('calibrated') === 'true'

    // Determine route type
    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
    const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    const isCalibrationRoute = pathname === '/auth/calibration'

    // RULE 1: Public routes - always allow
    if (isPublicRoute && !isProtectedRoute) {
        return NextResponse.next()
    }

    // RULE 2: Auth routes (login/register) - redirect logged-in users away
    if (isAuthRoute && !isCalibrationRoute) {
        if (isLoggedIn) {
            // If logged in but not calibrated, go to calibration
            if (!isCalibrated) {
                return NextResponse.redirect(new URL('/auth/calibration', request.url))
            }
            // If calibrated, go to command center
            return NextResponse.redirect(new URL('/command-center', request.url))
        }
        return NextResponse.next()
    }

    // RULE 3: Calibration route - special handling
    if (isCalibrationRoute) {
        if (!isLoggedIn) {
            // Not logged in - go to login first
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('callbackUrl', '/auth/calibration')
            return NextResponse.redirect(loginUrl)
        }
        if (isCalibrated) {
            // Already calibrated - go to command center
            return NextResponse.redirect(new URL('/command-center', request.url))
        }
        // Logged in and not calibrated - allow access to calibration
        return NextResponse.next()
    }

    // RULE 4: Protected routes - require login AND calibration
    if (isProtectedRoute) {
        if (!isLoggedIn) {
            // Not logged in - go to login
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }

        // Check calibration (with bypass for fresh completions)
        if (!isCalibrated && !justCalibrated) {
            return NextResponse.redirect(new URL('/auth/calibration', request.url))
        }

        // Clean up bypass param after use
        if (justCalibrated) {
            const cleanUrl = new URL(pathname, request.url)
            return NextResponse.redirect(cleanUrl)
        }

        return NextResponse.next()
    }

    // Default - allow
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'],
}
