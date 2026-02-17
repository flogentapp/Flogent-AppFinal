'use client'

import React, { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    allowEnterToSubmit?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className, allowEnterToSubmit = true, onKeyDown, ...props }, ref) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (allowEnterToSubmit && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
            }
            if (onKeyDown) onKeyDown(e)
        }

        return (
            <div className="space-y-1">
                {label && (
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-1">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        'block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium',
                        'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                        'bg-slate-50 border-transparent transition-all',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'
