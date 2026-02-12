import { createClient } from '@/lib/supabase/server'
import { Clock, Shield, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HubPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hub</h1>
                    <p className="text-slate-500 font-medium mt-1">Select an app to get started.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Apps Section */}
                <div className="lg:col-span-8 space-y-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Applications</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Timesheets (Now Includes Reports & Approvals) */}
                        <Link href="/timesheets/my" className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock className="w-24 h-24 text-indigo-600" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Timesheets</h3>
                                    {/* Updated Description */}
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Manage time entries, approvals, and view reporting dashboards.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm gap-2 group-hover:translate-x-1 transition-transform">
                                    Launch App <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        {/* Admin */}
                        <Link href="/admin/companies" className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield className="w-24 h-24 text-indigo-600" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Admin</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Manage companies, departments, users, and approval policies.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm gap-2 group-hover:translate-x-1 transition-transform">
                                    Manage Settings <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        {/* Planner (Inactive) */}
                        <div className="group relative overflow-hidden bg-slate-50 p-6 rounded-2xl border border-transparent opacity-75 grayscale cursor-not-allowed">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-500">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Planner</h3>
                                <span className="inline-block mt-4 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-1 rounded">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Context Section */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Shield className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need help?</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Contact your Tenant Administrator to request access to more applications.
                            </p>
                            <button className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors">
                                View Documentation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}