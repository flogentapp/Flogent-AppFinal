'use client'
import { useEffect, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

function AuthConfirmContent() {
    const [status, setStatus] = useState('Initializing...')
    const router = useRouter()
    const searchParams = useSearchParams()
    const next = searchParams.get('next') || '/app'
    const code = searchParams.get('code')

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        const handleAuth = async () => {
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) setStatus('Code Exchange Failed')
                else {
                    setStatus('Success! Redirecting...')
                    router.replace(next)
                }
                return
            }
        }
        handleAuth()
    }, [router, next, code])

    return (
        <div className='min-h-screen bg-gray-50 flex flex-col justify-center items-center'>
            <div className='bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center'>
                <h2 className='text-xl font-bold mb-2'>{status}</h2>
            </div>
        </div>
    )
}

export default function AuthConfirmPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthConfirmContent />
        </Suspense>
    )
}
