'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
                    <Input name='firstName' required label='First Name' placeholder='e.g. John' />
                    <Input name='lastName' required label='Last Name' placeholder='e.g. Doe' />
                </div>
                <Input type='email' name='email' required label='Email Address' placeholder='john@example.com' />
                <div className='p-4 bg-amber-50 rounded-2xl border border-amber-100'>
                    <Input
                        type='password'
                        name='password'
                        required
                        minLength={6}
                        label='Setup Password'
                        placeholder='Min 6 characters'
                        className="bg-white"
                    />
                    <p className='text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-2 ml-1 flex items-center gap-1'>
                        <Lock className="w-3 h-3" /> User will receive this in their welcome email
                    </p>
                </div>
                <div className='flex justify-end gap-3 pt-2'>
                    <Button type='button' variant='ghost' onClick={onClose}>Cancel</Button>
                    <Button type='submit' disabled={pending} className="px-8 shadow-lg shadow-indigo-100">
                        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
