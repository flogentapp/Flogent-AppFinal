import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Clock, Shield, CheckCircle2 } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. If user is logged in, send them straight to the App
  if (user) {
    redirect('/app')
  }

  // 2. If not, show the Landing Page
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900 tracking-tight">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Clock className="w-5 h-5" />
            </div>
            Flogent
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Now Live
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Business Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">modern teams.</span>
          </h1>

          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            A complete platform for your organization. Start with timesheets and approvals today,
            and scale with powerful business apps designed to help you grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all hover:border-gray-300 flex items-center justify-center"
            >
              Log in
            </Link>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-indigo-600">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Operations</h3>
              <p className="text-sm text-gray-500">Streamline daily tasks like time tracking and resource planning.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-violet-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Workflows</h3>
              <p className="text-sm text-gray-500">Automate approvals and standardize your business processes.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-emerald-600">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Administration</h3>
              <p className="text-sm text-gray-500">Centralized control over users, departments, and access policies.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
