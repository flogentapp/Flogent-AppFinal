import { createClient } from '@/lib/supabase/server'
import { ApprovalMatrix } from '@/components/admin/ApprovalMatrix'
// 1. Import the new component
import LicensingConfig from '@/components/admin/LicensingConfig'

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    // Fetch tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    const tenantId = profile?.tenant_id

    if (!tenantId) return <div>Tenant not found</div>

    // 2. Run both fetches in parallel for better performance
    const [policyResponse, tenantResponse] = await Promise.all([
        // Fetch Approval Policy
        supabase
            .from('approval_policies')
            .select('*')
            .eq('tenant_id', tenantId)
            .single(),
        
        // Fetch License Settings (NEW)
        supabase
            .from('tenants')
            .select('license_settings')
            .eq('id', tenantId)
            .single()
    ])

    const policy = policyResponse.data
    const tenant = tenantResponse.data

    // Default matrix if none exists
    const rules = policy?.rules || {
        "User": ["ProjectLeader", "DepartmentHead", "CEO", "TenantOwner"],
        "ProjectLeader": ["DepartmentHead", "CEO", "TenantOwner"],
        "DepartmentHead": ["CEO", "TenantOwner"],
        "CEO": ["TenantOwner"]
    }

    const isEnabled = policy?.approvals_enabled ?? true

    // Default license settings if none exists
    const licenseSettings = tenant?.license_settings || {}

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workspace Configuration</h1>
                    <p className="text-gray-500 text-sm">Manage permissions and workflows for your team.</p>
                </div>
            </div>

            {/* Existing Approvals Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Timesheet Approvals</h2>
                <ApprovalMatrix initialRules={rules} initialEnabled={isEnabled} />
            </div>

            {/* 3. New Licensing Section */}
            <div className="border-t pt-10">
                <LicensingConfig currentSettings={licenseSettings} />
            </div>
        </div>
    )
}