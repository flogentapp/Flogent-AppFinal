'use client'

import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <span className="text-4xl font-black tracking-tighter text-indigo-600 italic font-outfit">FLOGENT</span>
                    <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1"></div>
                </div>
                <h2 className="mt-8 text-center text-3xl font-bold text-gray-900 tracking-tight">
                    Welcome to Flogent
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Let's get your workspace ready in less than a minute.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-10 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-12 border border-gray-100">
                    <OnboardingForm />
                </div>
                <p className="mt-8 text-center text-xs text-gray-400">
                    &copy; 2026 Flogent. All rights reserved.
                </p>
            </div>
        </div>
    )
}
