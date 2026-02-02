'use client'

import { useState } from 'react'
import { Building2, ArrowRight, Loader2, Users, KeyRound } from 'lucide-react'
import { completeOnboarding, joinExistingTenant } from '@/lib/actions/onboarding'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { slugify } from '@/lib/utils'

export function OnboardingForm() {
    const [mode, setMode] = useState<'create' | 'join'>('create')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Create Mode State
    const [companyName, setCompanyName] = useState('')
    const [slug, setSlug] = useState('')

    // --- HANDLE CREATE ---
    async function handleCreate(formData: FormData) {
        setLoading(true); setError(null)
        const result = await completeOnboarding(formData)
        
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            window.location.href = '/app'
        }
    }

    // --- HANDLE JOIN ---
    async function handleJoin(formData: FormData) {
        setLoading(true); setError(null)
        const result = await joinExistingTenant(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            window.location.href = '/app'
        }
    }

    return (
        <div className="space-y-6">
            {/* TABS */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button
                    onClick={() => setMode('create')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Create New
                </button>
                <button
                    onClick={() => setMode('join')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'join' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Join Existing
                </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Setup your Workspace' : 'Join using Invite ID'}
            </h2>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    ⚠️ {error}
                </div>
            )}

            {mode === 'create' ? (
                <form action={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="first_name" required placeholder="First Name" />
                        <Input name="last_name" required placeholder="Last Name" />
                    </div>
                    <Input 
                        name="company_name" 
                        required 
                        placeholder="Company Name" 
                        onChange={(e) => {
                            setCompanyName(e.target.value)
                            setSlug(slugify(e.target.value))
                        }}
                    />
                    <input type="hidden" name="tenant_slug" value={slug} />
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Get Started'}
                    </Button>
                </form>
            ) : (
                <form action={handleJoin} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-3">
                            <KeyRound className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-blue-900">Have a Workspace ID?</h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    Check the invitation email sent by your admin. It contains a code like <code>a7f8...</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Workspace ID</label>
                        <input 
                            name="workspaceId" 
                            required 
                            placeholder="Paste ID here..." 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Join Workspace'}
                    </Button>
                </form>
            )}
        </div>
    )
}