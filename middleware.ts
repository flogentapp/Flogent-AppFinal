import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/app') ||
        request.nextUrl.pathname.startsWith('/timesheets') ||
        request.nextUrl.pathname.startsWith('/admin')

    const isOnboardingRoute = request.nextUrl.pathname === '/onboarding'
    const isSetPasswordRoute = request.nextUrl.pathname === '/set-password'
    const isAuthConfirmRoute = request.nextUrl.pathname === '/auth/confirm' || request.nextUrl.pathname === '/auth/accept-invite'
    const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'

    if (isProtectedRoute || isOnboardingRoute || isSetPasswordRoute) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check for tenant_id (using metadata first for efficiency)
        const tenantId = user.user_metadata?.tenant_id

        if (!tenantId && !isOnboardingRoute) {
            // Check DB as fallback if metadata is missing (e.g. first login)
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single()

            if (!profile?.tenant_id) {
                return NextResponse.redirect(new URL('/onboarding', request.url))
            }
        }

        if (tenantId && isOnboardingRoute) {
            return NextResponse.redirect(new URL('/app', request.url))
        }

        // --- SUB-APP ACCESS CONTROL (CRITICAL SECURITY) ---
        // Define sub-apps
        const path = request.nextUrl.pathname
        let subApp: string | null = null

        if (path.startsWith('/timesheets')) {
            subApp = 'timesheets'
        } else if (path.startsWith('/documents')) {
            subApp = 'documents'
        } else if (path.startsWith('/tasks')) {
            subApp = 'tasks'
        } else if (path.startsWith('/diary')) {
            subApp = 'diary'
        } else if (path.startsWith('/planner')) {
            subApp = 'planner'
        }

        // Only check if it is a sub-app (skip /app and /admin)
        if (subApp) {
            // We already have tenantId from metadata or DB above
            const { data: subscription } = await supabase
                .from('tenant_app_subscriptions')
                .select('enabled')
                .eq('tenant_id', tenantId) // Use the resolved tenantId
                .eq('app_name', subApp)
                .single()

            // If not actively enabled, block access
            if (!subscription?.enabled) {
                const url = new URL('/app', request.url)
                url.searchParams.set('error', 'app_not_enabled')
                return NextResponse.redirect(url)
            }
        }
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/app', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/app/:path*',
        '/timesheets/:path*',
        '/admin/:path*',
        '/onboarding',
        '/login',
        '/signup',
        '/set-password',
        '/auth/confirm',
        '/auth/accept-invite',
    ],
}
