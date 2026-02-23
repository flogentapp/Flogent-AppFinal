import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logSupabaseCall } from './logger'

export async function createClient() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Middleware can't set cookies
                    }
                },
            },
        }
    )

    // Wrap RPC for debug logging
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        const originalRpc = supabase.rpc.bind(supabase)
        supabase.rpc = (async (name: string, args?: any, options?: any) => {
            const result = await originalRpc(name, args, options)
            await logSupabaseCall(`RPC:${name}`, supabase, args, result.error)
            return result
        }) as any
    }

    return supabase
}

export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
