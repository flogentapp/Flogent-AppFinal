'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { message: error.message }
    }

    redirect('/app')
}

export async function signup(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name,
                last_name,
            }
        }
    })

    if (authError) {
        return { message: authError.message }
    }

    if (!authData.user) {
        return { message: 'Failed to create user' }
    }

    return { success: true }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function forgotPassword(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const supabase = await createClient()

    // Build base URL: prefer explicit SITE_URL, then Vercel auto-URL, then localhost
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { message: error.message }
    }

    return { success: true }
}

export async function resetPassword(prevState: any, formData: FormData) {
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
        return { message: 'Passwords do not match' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { message: error.message }
    }

    redirect('/app')
}
