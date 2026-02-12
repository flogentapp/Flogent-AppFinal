import { createBrowserClient } from '@supabase/ssr'
import { logSupabaseCall } from './logger'

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
