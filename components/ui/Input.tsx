import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-1 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition-all',
                        'focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10',
                        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                        'bg-slate-50 border-transparent',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-sm text-red-600 font-bold ml-1">{error}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'
