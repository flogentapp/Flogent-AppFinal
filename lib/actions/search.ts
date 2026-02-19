'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type SearchResult = {
    type: 'nav' | 'action' | 'info' | 'record'
    label: string
    description: string
    href?: string
    confidence: number
    metadata?: {
        table?: string
        id?: string
    }
}

const STATIC_PAGES: SearchResult[] = [
    { type: 'nav', label: 'Dashboard', description: 'Go to home overview', href: '/app', confidence: 1 },
    { type: 'nav', label: 'My Timesheets', description: 'Log your working hours', href: '/timesheets/my', confidence: 1 },
    { type: 'nav', label: 'Timesheet Approvals', description: 'Approve team time entries', href: '/timesheets/approvals', confidence: 1 },
    { type: 'nav', label: 'Reports', description: 'View organization productivity reports', href: '/timesheets/reports', confidence: 1 },
    { type: 'nav', label: 'Company Management', description: 'Manage companies, departments and projects', href: '/admin/companies', confidence: 1 },
    { type: 'nav', label: 'Team Settings', description: 'Manage users and platform access', href: '/admin/users', confidence: 1 },
    { type: 'nav', label: 'Billing & Apps', description: 'Manage subscriptions and billing', href: '/admin/apps', confidence: 1 },
]

const APP_STRUCTURE = `
Flogent App Map:
1. Home: /app - Dashboard, overview of week, app launcher.
2. Timesheets (Track): /timesheets/my - User tracks their own hours here.
3. Approvals: /timesheets/approvals - Managers approve team time here.
4. Reports: /timesheets/reports - Deep dive into time data.
5. Company Management: /admin/companies - Creating/Editing Companies, Departments, and Projects.
6. Team Management: /admin/users - Inviting users, changing roles.
7. Billing & Apps: /admin/apps - Manage SaaS subscriptions.
`

export async function smartSearch(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.GEMINI_API_KEY
    const normalizedQuery = query.toLowerCase().trim()
    const supabase = await createClient()

    if (!query || query.length < 2) return []

    // 1. Database Search (Parallel)
    const dbResults: SearchResult[] = []

    try {
        const { data: profile } = await supabase.from('profiles').select('current_company_id').single()
        const activeCompanyId = profile?.current_company_id

        let companiesQuery = supabase.from('companies').select('id, name, code').ilike('name', `%${query}%`)
        let projectsQuery = supabase.from('projects').select('id, name, code').ilike('name', `%${query}%`)
        let deptsQuery = supabase.from('departments').select('id, name').ilike('name', `%${query}%`)
        let entriesQuery = supabase.from('time_entries').select('id, description, entry_date, hours, minutes, projects!inner(name, company_id)').ilike('description', `%${query}%`)

        if (activeCompanyId) {
            companiesQuery = companiesQuery.eq('id', activeCompanyId)
            projectsQuery = projectsQuery.eq('company_id', activeCompanyId)
            deptsQuery = deptsQuery.eq('company_id', activeCompanyId)
        }

        const [
            { data: companies },
            { data: projects },
            { data: users },
            { data: departments },
            { data: timeEntries }
        ] = await Promise.all([
            companiesQuery.limit(3),
            projectsQuery.limit(3),
            supabase.from('profiles').select('id, first_name, last_name, email, current_company_id').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`).limit(3),
            deptsQuery.limit(3),
            entriesQuery.limit(5)
        ])

        const filteredUsers = activeCompanyId
            ? users?.filter(u => u.current_company_id === activeCompanyId) || []
            : users || []

        if (companies) {
            companies.forEach(c => dbResults.push({
                type: 'record',
                label: c.name,
                description: `Company • ${c.code || 'No Code'}`,
                href: `/admin/companies`,
                confidence: 0.9,
                metadata: { table: 'companies', id: c.id }
            }))
        }
        if (projects) {
            projects.forEach(p => dbResults.push({
                type: 'record',
                label: p.name,
                description: `Project • ${p.code || 'Project'}`,
                href: `/admin/companies`,
                confidence: 0.9,
                metadata: { table: 'projects', id: p.id }
            }))
        }
        if (filteredUsers) {
            filteredUsers.forEach(u => dbResults.push({
                type: 'record',
                label: `${u.first_name} ${u.last_name}`,
                description: `Team Member • ${u.email}`,
                href: `/admin/users`,
                confidence: 0.8,
                metadata: { table: 'profiles', id: u.id }
            }))
        }
        if (departments) {
            departments.forEach(d => dbResults.push({
                type: 'record',
                label: d.name,
                description: `Department`,
                href: `/admin/companies`,
                confidence: 0.85,
                metadata: { table: 'departments', id: d.id }
            }))
        }
        if (timeEntries) {
            timeEntries.forEach((te: any) => dbResults.push({
                type: 'record',
                label: te.description || 'Unnamed Entry',
                description: `Time Entry • ${te.entry_date} • ${te.hours}h ${te.minutes}m • ${te.projects?.name || 'No Project'}`,
                href: `/timesheets/my`,
                confidence: 0.75,
                metadata: { table: 'time_entries', id: te.id }
            }))
        }
    } catch (dbError) {
        console.error('[SmartSearch] Database search error:', dbError)
    }

    // 2. Local Static Match
    const localMatches = STATIC_PAGES.filter(page =>
        page.label.toLowerCase().includes(normalizedQuery) ||
        page.description.toLowerCase().includes(normalizedQuery)
    ).map(m => ({ ...m, confidence: 0.95 }))

    // 3. Smart Match via Gemini
    let aiResults: SearchResult[] = []
    if (apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: { responseMimeType: "application/json" }
            })

            const prompt = `
            You are the global search AI for "Flogent", a SaaS business platform.
            User Query: "${query}"
            
            Application Overview:
            ${APP_STRUCTURE}
            
            Current Database Matches (prioritize these if they match intent):
            ${JSON.stringify(dbResults.map(r => ({ label: r.label, type: r.description })))}
            
            Goal: Identify if the user is looking for a specific page, a record (company/project/time entry), or an action.
            
            Rules:
            - If they type something that looks like a task or time entry description, prioritize time entry records.
            - If they ask for settings/billing, point them to /admin/apps or /admin/companies.
            - Provide a JSON array of up to 5 SearchResult objects.
            
            Format:
            [{ "type": "nav" | "record" | "action", "label": "Name", "description": "Short context", "href": "/link", "confidence": 0.9 }]
            `

            const result = await model.generateContent(prompt)
            const text = result.response.text()
            aiResults = JSON.parse(text)
        } catch (aiError) {
            console.error('[SmartSearch] Gemini Error:', aiError)
        }
    }

    // Final Merge & Deduplicate
    const combined = [...dbResults, ...localMatches, ...aiResults]
    const seen = new Set()
    const final = combined.filter(item => {
        const key = `${item.label}-${item.href}-${item.description}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8)

    return final
}
