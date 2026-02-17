'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Search,
    Loader2,
    ArrowRight,
    Sparkles,
    Navigation,
    Command,
    User,
    Building2,
    Briefcase,
    Layers,
    Database,
    Clock
} from 'lucide-react'
import { smartSearch, SearchResult } from '@/lib/actions/search'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useUI } from '@/components/providers/UIProvider'

export function SmartSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { activeDropdown, setActiveDropdown } = useUI()
    const isOpen = activeDropdown === 'smart-search'
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useClickOutside(dropdownRef, () => {
        if (isOpen) setActiveDropdown(null)
    })

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true)
                setActiveDropdown('smart-search')
                const res = await smartSearch(query)
                setResults(res)
                if (res.length === 1 && res[0].label === 'AI Offline') {
                    toast.error('Search AI is offline. Check API key.')
                }
                setIsLoading(false)
            } else {
                setResults([])
                setActiveDropdown(null)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (href?: string) => {
        if (href) {
            router.push(href)
            setActiveDropdown(null)
            setQuery('')
        }
    }

    return (
        <div className="flex-1 max-w-md relative group" ref={dropdownRef}>
            <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setActiveDropdown('smart-search')}
                    placeholder="Ask Gemini to find anything..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                />
                {isLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                ) : (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-indigo-100/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Smart Suggestions</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-lg text-indigo-600 text-[9px] font-black uppercase">
                            <Sparkles className="w-2.5 h-2.5" /> Powered by Gemini
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {results.length > 0 ? (
                            <div className="p-1">
                                {results.map((result, idx) => {
                                    const getIcon = () => {
                                        if (result.type === 'nav') return <Navigation className="w-4 h-4" />
                                        if (result.type === 'action') return <Command className="w-4 h-4" />
                                        if (result.type === 'record') {
                                            const table = result.metadata?.table
                                            if (table === 'profiles') return <User className="w-4 h-4" />
                                            if (table === 'companies') return <Building2 className="w-4 h-4" />
                                            if (table === 'projects') return <Briefcase className="w-4 h-4" />
                                            if (table === 'departments') return <Layers className="w-4 h-4" />
                                            if (table === 'time_entries') return <Clock className="w-4 h-4" />
                                            return <Database className="w-4 h-4" />
                                        }
                                        return <Search className="w-4 h-4" />
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(result.href)}
                                            className="w-full flex items-start gap-3 p-3 hover:bg-indigo-50/50 rounded-xl transition-all text-left group/item"
                                        >
                                            <div className="mt-0.5 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-600 group-hover/item:border-indigo-100 transition-colors">
                                                {getIcon()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors">
                                                    {result.label}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium truncate">
                                                    {result.description}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all mt-2" />
                                        </button>
                                    )
                                })}
                            </div>
                        ) : !isLoading ? (
                            <div className="p-8 text-center">
                                <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <div className="text-sm font-bold text-slate-400">No matches found for "{query}"</div>
                                <div className="text-xs text-slate-300 mt-1">Try searching for "timesheets" or "manage users"</div>
                            </div>
                        ) : null}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-mono shadow-sm">↑↓</kbd> to navigate
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-mono shadow-sm">↵</kbd> to select
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
