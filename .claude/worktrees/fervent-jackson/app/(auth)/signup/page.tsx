'use client'

import { signup } from '@/lib/actions/auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const companyName = formData.get('company_name') as string

        const result = await signup(null, formData)

        if (result?.success) {
            localStorage.setItem('pending_company_name', companyName)
            router.push('/check-email')
        } else if (result?.message) {
            setError(result.message)
            setPending(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <span className="text-3xl font-black tracking-tight text-indigo-600 italic font-outfit">FLOGENT</span>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    Create your account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white px-4 py-8 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name</label>
                            <input
                                id="company_name"
                                name="company_name"
                                type="text"
                                required
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Acme Corp"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <button
                            type="submit"
                            disabled={pending}
                            className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all font-outfit"
                        >
                            {pending ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <Link
                                href="/login"
                                className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                            >
                                Sign in to existing account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
