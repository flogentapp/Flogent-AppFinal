import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function CheckEmailPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <span className="text-3xl font-black tracking-tight text-indigo-600 italic font-outfit">FLOGENT</span>
                </div>

                <div className="mt-8 bg-white py-8 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] sm:rounded-2xl sm:px-10 border border-gray-100 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
                        <Mail className="h-8 w-8 text-indigo-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-600 mb-8">
                        We've sent a verification link to your email address. Please click the link to activate your account.
                    </p>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Already verified? <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500">Log in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
