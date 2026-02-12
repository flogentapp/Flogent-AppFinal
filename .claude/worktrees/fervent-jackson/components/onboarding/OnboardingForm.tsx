import { useState, useEffect } from 'react'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { slugify } from '@/lib/utils'

export function OnboardingForm() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [companyName, setCompanyName] = useState('')
    const [slug, setSlug] = useState('')
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
    const [organizationName, setOrganizationName] = useState('')

    useEffect(() => {
        const pending = localStorage.getItem('pending_company_name')
        if (pending) {
            setCompanyName(pending)
            setSlug(slugify(pending))
        }
    }, [])

    const handleCompanyNameChange = (val: string) => {
        setCompanyName(val)
        if (!isSlugManuallyEdited) {
            setSlug(slugify(val))
        }
    }

    const handleOrganizationNameChange = (val: string) => {
        setOrganizationName(val)
        if (!isSlugManuallyEdited && !companyName) {
            setSlug(slugify(val))
        }
    }

    const handleSlugChange = (val: string) => {
        setSlug(slugify(val))
        setIsSlugManuallyEdited(true)
    }

    async function handleSubmit(formData: FormData) {
        if (!slug || !slug.trim()) {
            setError('Please enter a workspace name')
            return
        }

        setLoading(true)
        setError(null)

        const result = await completeOnboarding(formData)

        if (result?.error) {
            console.error('Onboarding Failed:', result.details || result.error)
            setError(result.error)
            setLoading(false)
        } else if (result?.success) {
            // Success - clear storage and force a fresh page load to update all contexts
            localStorage.removeItem('pending_company_name')
            window.location.href = '/app'
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                    <p className="font-bold underline mb-1">Onboarding Error:</p>
                    <p>{error}</p>
                    <p className="mt-2 text-[10px] opacity-70 font-mono">
                        Check browser console for full technical details.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="First Name"
                    name="first_name"
                    required
                    placeholder="John"
                />
                <Input
                    label="Last Name"
                    name="last_name"
                    required
                    placeholder="Doe"
                />
            </div>

            <Input
                label="Company Name"
                name="company_name"
                required
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
            />

            <div>
                <label htmlFor="tenant_name" className="block text-sm font-bold text-gray-700 mb-1">
                    Organization Name (Optional)
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="tenant_name"
                        id="tenant_name"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3"
                        placeholder="Acme Global"
                        value={organizationName}
                        onChange={(e) => handleOrganizationNameChange(e.target.value)}
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    Defaults to Company Name if left blank.
                </p>
            </div>

            <div>
                <label htmlFor="tenant_slug" className="block text-sm font-bold text-gray-700 mb-1">
                    Workspace URL
                </label>
                <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-400 sm:text-sm">
                        flogent.app/
                    </span>
                    <input
                        type="text"
                        name="tenant_slug"
                        id="tenant_slug"
                        required
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                        placeholder="acme-corp"
                    />
                </div>
                {slug && (
                    <p className="mt-2 text-xs text-gray-400">
                        Your workspace will be at <span className="font-semibold text-gray-600 font-mono">flogent.app/{slug}</span>
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="w-full py-6 text-base font-bold rounded-xl"
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                    <>
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </form>
    )
}
