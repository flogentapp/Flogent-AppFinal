export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    owner_user_id: string | null
                    status: 'active' | 'deactivated'
                    created_at: string
                    created_by: string | null
                    updated_at: string
                    updated_by: string | null
                    deactivated_at: string | null
                    deactivated_by: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    owner_user_id?: string | null
                    status?: 'active' | 'deactivated'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    owner_user_id?: string | null
                    status?: 'active' | 'deactivated'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    tenant_id: string
                    email: string
                    first_name: string
                    last_name: string
                    display_name: string | null
                    avatar_url: string | null
                    status: 'active' | 'deactivated'
                    current_company_id: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string
                    updated_by: string | null
                    deactivated_at: string | null
                    deactivated_by: string | null
                }
                Insert: {
                    id: string
                    tenant_id: string
                    email: string
                    first_name: string
                    last_name: string
                    display_name?: string | null
                    avatar_url?: string | null
                    status?: 'active' | 'deactivated'
                    current_company_id?: string | null
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    email?: string
                    first_name?: string
                    last_name?: string
                    display_name?: string | null
                    avatar_url?: string | null
                    status?: 'active' | 'deactivated'
                    current_company_id?: string | null
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
            }
            companies: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    code: string | null
                    status: 'active' | 'deactivated'
                    created_at: string
                    created_by: string | null
                    updated_at: string
                    updated_by: string | null
                    deactivated_at: string | null
                    deactivated_by: string | null
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    code?: string | null
                    status?: 'active' | 'deactivated'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    code?: string | null
                    status?: 'active' | 'deactivated'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
            }
            projects: {
                Row: {
                    id: string
                    tenant_id: string
                    company_id: string
                    name: string
                    code: string | null
                    description: string | null
                    requires_timesheet_approval: boolean
                    status: 'active' | 'deactivated'
                    created_at: string
                    created_by: string | null
                    updated_at: string
                    updated_by: string | null
                    deactivated_at: string | null
                    deactivated_by: string | null
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    company_id: string
                    name: string
                    code?: string | null
                    description?: string | null
                    requires_timesheet_approval?: boolean
                    status?: 'active' | 'deactivated'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    company_id?: string
                    name?: string
                    code?: string | null
                    description?: string | null
                    requires_timesheet_approval?: boolean
                    status?: 'active' | 'deactivated'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                }
            }
            user_role_assignments: {
                Row: {
                    id: string
                    user_id: string
                    role: string
                    scope_type: 'system' | 'tenant' | 'company' | 'department'
                    scope_id: string | null
                    tenant_id: string
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    role: string
                    scope_type: 'system' | 'tenant' | 'company' | 'department'
                    scope_id?: string | null
                    tenant_id: string
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    role?: string
                    scope_type?: 'system' | 'tenant' | 'company' | 'department'
                    scope_id?: string | null
                    tenant_id?: string
                    created_at?: string
                    created_by?: string | null
                }
            }
            tenant_app_subscriptions: {
                Row: {
                    tenant_id: string
                    app_name: string
                    enabled: boolean
                    created_at: string
                    created_by: string | null
                    updated_at: string
                    updated_by: string | null
                }
                Insert: {
                    tenant_id: string
                    app_name: string
                    enabled?: boolean
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                }
                Update: {
                    tenant_id?: string
                    app_name?: string
                    enabled?: boolean
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                }
            }
            time_entries: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string
                    project_id: string
                    entry_date: string
                    hours: number
                    minutes: number
                    description: string
                    is_additional_work: boolean
                    additional_work_description: string | null
                    status: 'draft' | 'submitted' | 'approved' | 'rejected'
                    created_at: string
                    created_by: string | null
                    updated_at: string
                    updated_by: string | null
                    submitted_at: string | null
                    submitted_by: string | null
                    approved_at: string | null
                    approved_by: string | null
                    rejected_at: string | null
                    rejected_by: string | null
                    rejection_reason: string | null
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id: string
                    project_id: string
                    entry_date: string
                    hours?: number
                    minutes?: number
                    description: string
                    is_additional_work?: boolean
                    additional_work_description?: string | null
                    status?: 'draft' | 'submitted' | 'approved' | 'rejected'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    submitted_at?: string | null
                    submitted_by?: string | null
                    approved_at?: string | null
                    approved_by?: string | null
                    rejected_at?: string | null
                    rejected_by?: string | null
                    rejection_reason?: string | null
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string
                    project_id?: string
                    entry_date?: string
                    hours?: number
                    minutes?: number
                    description?: string
                    is_additional_work?: boolean
                    additional_work_description?: string | null
                    status?: 'draft' | 'submitted' | 'approved' | 'rejected'
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string
                    updated_by?: string | null
                    submitted_at?: string | null
                    submitted_by?: string | null
                    approved_at?: string | null
                    approved_by?: string | null
                    rejected_at?: string | null
                    rejected_by?: string | null
                    rejection_reason?: string | null
                }
            }
        }
    }
}
