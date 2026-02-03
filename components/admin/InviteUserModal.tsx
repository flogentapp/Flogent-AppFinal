'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { inviteUser } from '@/lib/actions/users'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Mail, User, Loader2, Lock } from 'lucide-react'

type InviteUserModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    currentCompanyId?: string
}

export function InviteUserModal({ isOpen, onClose, onSuccess, currentCompanyId }: InviteUserModalProps) {
    const [pending, setPending] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    async function handleSubmit(formData: FormData) {
        if (!mounted) return
        setPending(true)
        try {
            const result = await inviteUser(formData)
            if (!mounted) return
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('User created and credentials sent!')
                if (onSuccess) onSuccess()
                else onClose()
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create user')
        } finally {
            if (mounted) setPending(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title='Create New User'>
            <form action={handleSubmit} className='space-y-4 pt-2'>
                {currentCompanyId && <input type="hidden" name="companyId" value={currentCompanyId} />}
                <div className='grid grid-cols-2 gap-3'>
                    <input name='firstName' required placeholder='First Name' className='border p-2 rounded w-full' />
                    <input name='lastName' required placeholder='Last Name' className='border p-2 rounded w-full' />
                </div>
                <input type='email' name='email' required placeholder='Email Address' className='border p-2 rounded w-full' />
                <div className='p-3 bg-yellow-50 rounded border border-yellow-200'>
                    <label className='block text-xs font-bold text-yellow-800 mb-1'>TEMPORARY PASSWORD</label>
                    <input type='text' name='password' required minLength={6} placeholder='Type password here...' className='border p-2 rounded w-full bg-white' />
                    <p className='text-xs text-gray-500 mt-1'>The user will receive this password via email.</p>
                </div>
                <div className='flex justify-end gap-2'>
                    <Button type='button' variant='outline' onClick={onClose}>Cancel</Button>
                    <Button type='submit' disabled={pending}>{pending ? 'Creating...' : 'Create & Send'}</Button>
                </div>
            </form>
        </Modal>
    )
}
