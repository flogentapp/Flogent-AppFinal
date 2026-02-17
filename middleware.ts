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

    // PROTECTED ROUTES (AUTH ONLY)
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/app') ||
        request.nextUrl.pathname.startsWith('/timesheets') ||
        request.nextUrl.pathname.startsWith('/planner') ||
        request.nextUrl.pathname.startsWith('/admin')

    const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'

    // 1. If not logged in -> Login
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If logged in -> App (if on login/signup)
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/app', request.url))
    }

    // THAT IS IT. NO MORE ONBOARDING REDIRECTS.
    return response
}

export const config = {
    matcher: [
        '/app/:path*',
        '/timesheets/:path*',
        '/planner/:path*',
        '/admin/:path*',
        '/login',
        '/signup',
    ],
}
