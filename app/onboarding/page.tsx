'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinExistingTenant, completeOnboarding } from '@/lib/actions/onboarding'
import { Input } from '@/components/ui/Input'
import { slugify } from '@/lib/utils'

export default function OnboardingPage() {
    const [mode, setMode] = useState<'create' | 'join'>('create')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [slug, setSlug] = useState('')
    const router = useRouter()

    async function handleJoin(formData: FormData) {
        setLoading(true); setError('')
        const result = await joinExistingTenant(formData)
        if (result?.error) { setError(result.error); setLoading(false) }
        else { router.refresh(); window.location.href = '/app' }
    }

    async function handleCreate(formData: FormData) {
        setLoading(true); setError('')
        const result = await completeOnboarding(formData)
        if (result?.error) { setError(result.error); setLoading(false) }
        else { window.location.href = '/app' }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    {mode === 'create' ? 'Create Workspace' : 'Join Workspace'}
                </h2>
                <div className="mt-4 flex justify-center space-x-4">
                    <button onClick={() => setMode('create')} className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'}`}>Create New</button>
                    <button onClick={() => setMode('join')} className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'join' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'}`}>Have an ID?</button>
                </div>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-lg">
                {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-6">{error}</div>}
                
                {mode === 'join' ? (
                    <form action={handleJoin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Workspace ID</label>
                            <input name="workspaceId" required placeholder="e.g. a7f8..." className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Joining...' : 'Join'}</button>
                    </form>
                ) : (
                    <form action={handleCreate} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="first_name" required placeholder="First Name" />
                            <Input name="last_name" required placeholder="Last Name" />
                        </div>
                        <Input name="company_name" required placeholder="Company Name" onChange={(e) => {setCompanyName(e.target.value); setSlug(slugify(e.target.value))}} />
                        <input type="hidden" name="tenant_slug" value={slug} />
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Creating...' : 'Get Started'}</button>
                    </form>
                )}
            </div>
        </div>
    )
}