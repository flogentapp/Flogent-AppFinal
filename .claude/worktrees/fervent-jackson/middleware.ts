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
    const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'

    if (isProtectedRoute || isOnboardingRoute) {
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
    ],
}
