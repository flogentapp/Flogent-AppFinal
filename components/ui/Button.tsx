import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'black'
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'xl'
}

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95'

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40',
        secondary: 'bg-slate-50 text-slate-900 hover:bg-slate-100',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-500/20',
        ghost: 'bg-transparent text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50',
        outline: 'border-2 border-slate-100 bg-white text-slate-600 hover:border-indigo-100 hover:text-indigo-600',
        black: 'bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/20'
    }

    const sizes = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-3 text-xs',
        lg: 'px-8 py-4 text-sm',
        xl: 'px-10 py-5 text-base',
        icon: 'p-3'
    }

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    )
}
