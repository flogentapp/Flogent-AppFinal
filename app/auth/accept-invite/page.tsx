'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Suspense } from 'react'

function AcceptInviteContent() {
    const searchParams = useSearchParams()
    const targetUrl = searchParams.get('target')

    if (!targetUrl) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-bold text-red-600">Invalid Invitation Link</h2>
                <p className="text-gray-500 mt-2">The link is missing required information.</p>
            </div>
        )
    }

    const handleAccept = () => {
        if (targetUrl) {
            try {
                // Decode the Base64 URL
                const decodedUrl = atob(targetUrl)
                window.location.href = decodedUrl
            } catch (e) {
                console.error('Failed to decode target URL', e)
                alert('Invalid invitation link format.')
            }
        }
    }

    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center max-w-md w-full border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Security Check
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
                To protect your account from automated email scanners, please confirm you are human by clicking the button below.
            </p>

            <Button
                onClick={handleAccept}
                className="w-full py-6 text-base font-bold flex items-center justify-center gap-2"
            >
                Join Workspace <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="mt-4 text-xs text-gray-400">
                You will be redirected to secure login.
            </p>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <AcceptInviteContent />
            </Suspense>
        </div>
    )
}
