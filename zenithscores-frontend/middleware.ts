import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public routes - no auth required
const PUBLIC_ROUTES = [
    '/',
    '/news',
    '/privacy',
    '/terms',
]

// Auth routes - redirect to command-center if already logged in
const AUTH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/error',
]

// Protected routes - require auth
const PROTECTED_ROUTES = [
    '/command-center',
    '/trading',
    '/signals',
    '/academy',
    '/explore',
    '/profile',
    '/learning',
]

// Calibration route - special handling
const CALIBRATION_ROUTE = '/auth/calibration'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // Files with extensions
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

    // Check route types
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )
    const isCalibrationRoute = pathname === CALIBRATION_ROUTE

    // RULE 1: Public routes - always allow
    if (isPublicRoute && !isProtectedRoute) {
        return NextResponse.next()
    }

    // RULE 2: Auth routes - redirect to command-center if logged in
    if (isAuthRoute && !isCalibrationRoute) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/command-center', request.url))
        }
        return NextResponse.next()
    }

    // RULE 3: Calibration route
    if (isCalibrationRoute) {
        // Not logged in - redirect to login
        if (!isLoggedIn) {
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('callbackUrl', CALIBRATION_ROUTE)
            return NextResponse.redirect(loginUrl)
        }
        // Already calibrated - redirect to command-center
        if (isCalibrated) {
            return NextResponse.redirect(new URL('/command-center', request.url))
        }
        // Logged in but not calibrated - allow access
        return NextResponse.next()
    }

    // RULE 4: Protected routes
    if (isProtectedRoute) {
        // Not logged in - redirect to login with callback
        if (!isLoggedIn) {
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }

        // Logged in but not calibrated - force calibration
        if (!isCalibrated) {
            return NextResponse.redirect(new URL(CALIBRATION_ROUTE, request.url))
        }

        // Logged in and calibrated - allow access
        return NextResponse.next()
    }

    // Default: allow access
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
}
