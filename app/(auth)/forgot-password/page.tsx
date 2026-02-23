'use client'

import { forgotPassword } from '@/lib/actions/auth'
import { useActionState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [state, action, pending] = useActionState(forgotPassword, undefined)

    return (
        <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
                    Reset your password
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600'>
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10'>

                    {state?.success ? (
                        <div className='rounded-md bg-green-50 p-4 text-center'>
                            <p className='text-sm font-medium text-green-800'>
                                ✅ Check your email for a password reset link.
                            </p>
                            <p className='mt-1 text-xs text-green-600'>
                                If you don't see it, check your spam folder.
                            </p>
                        </div>
                    ) : (
                        <form action={action} className='space-y-6'>
                            <div>
                                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                                    Email address
                                </label>
                                <div className='mt-1'>
                                    <input
                                        id='email'
                                        name='email'
                                        type='email'
                                        autoComplete='email'
                                        required
                                        className='block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                                        placeholder='you@example.com'
                                    />
                                </div>
                            </div>

                            {state?.message && (
                                <div className='text-red-500 text-sm'>{state.message}</div>
                            )}

                            <div>
                                <button
                                    type='submit'
                                    disabled={pending}
                                    className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50'
                                >
                                    {pending ? 'Sending...' : 'Send reset link'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className='mt-6 text-center'>
                        <Link href='/login' className='text-sm text-indigo-600 hover:text-indigo-500'>
                            ← Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
