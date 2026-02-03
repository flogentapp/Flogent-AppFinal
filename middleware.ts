import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
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

        // --- 1. RESOLVE TENANT ID (Strict Source of Truth: Database via Admin Client) ---
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        const activeTenantId = profile?.tenant_id

        // --- 2. FORCED REDIRECTS ---
        if (!activeTenantId && !isOnboardingRoute) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
        if (activeTenantId && isOnboardingRoute && !request.nextUrl.searchParams.has('mode')) {
            return NextResponse.redirect(new URL('/app', request.url))
        }

        // --- 3. SUB-APP ACCESS CONTROL (SUBSCRIPTIONS) ---
        const path = request.nextUrl.pathname
        let subApp: string | null = null

        if (path.startsWith('/timesheets')) subApp = 'timesheets'
        else if (path.startsWith('/documents')) subApp = 'documents'
        else if (path.startsWith('/tasks')) subApp = 'tasks'
        else if (path.startsWith('/diary')) subApp = 'diary'
        else if (path.startsWith('/planner')) subApp = 'planner'

        if (subApp && activeTenantId) {
            // Use adminClient to bypass RLS and ensure we see the enable status
            const { data: subscription } = await adminClient
                .from('tenant_app_subscriptions')
                .select('enabled')
                .eq('tenant_id', activeTenantId)
                .eq('app_name', subApp)
                .maybeSingle()

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
