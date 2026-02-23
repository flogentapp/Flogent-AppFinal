'use client'

import { resetPassword } from '@/lib/actions/auth'
import { useActionState } from 'react'

export default function ResetPasswordPage() {
    const [state, action, pending] = useActionState(resetPassword, undefined)

    return (
        <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
                    Set a new password
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600'>
                    Choose a strong password for your account.
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10'>
                    <form action={action} className='space-y-6'>
                        <div>
                            <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                                New password
                            </label>
                            <div className='mt-1'>
                                <input
                                    id='password'
                                    name='password'
                                    type='password'
                                    autoComplete='new-password'
                                    required
                                    minLength={8}
                                    className='block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                                    placeholder='At least 8 characters'
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor='confirm' className='block text-sm font-medium text-gray-700'>
                                Confirm new password
                            </label>
                            <div className='mt-1'>
                                <input
                                    id='confirm'
                                    name='confirm'
                                    type='password'
                                    autoComplete='new-password'
                                    required
                                    minLength={8}
                                    className='block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                                    placeholder='Re-enter new password'
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
                                {pending ? 'Updating...' : 'Update password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
