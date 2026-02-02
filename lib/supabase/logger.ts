
/**
 * Compact Supabase Logger
 * action_name, user_id, tenant_id, current_company_id, payload, error
 */
export async function logSupabaseCall(
    actionName: string,
    supabase: any,
    payload: any,
    error: any
) {
    if (process.env.NEXT_PUBLIC_DEBUG !== 'true') return

    try {
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id || 'anonymous'
        const tenantId = user?.user_metadata?.tenant_id || 'no-tenant'
        const companyId = user?.user_metadata?.current_company_id || 'no-company'

        const compactLog = [
            `[DEBUG] ${actionName}`,
            userId.slice(0, 8),
            tenantId.slice(0, 8),
            companyId.slice(0, 8),
            JSON.stringify(payload).slice(0, 100) + (JSON.stringify(payload).length > 100 ? '...' : ''),
            error ? `ERROR: ${error.message}` : 'SUCCESS'
        ].join(' | ')

        console.log(compactLog)
    } catch (e) {
        console.error('[DEBUG-LOGGER-ERROR]', e)
    }
}
