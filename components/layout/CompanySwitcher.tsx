import { useRef } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'
import { switchContext } from '@/lib/actions/context'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useUI } from '@/components/providers/UIProvider'

interface CompanySwitcherProps {
    companies: any[]
    currentCompanyId: string
}

export function CompanySwitcher({
    companies,
    currentCompanyId,
}: CompanySwitcherProps) {
    const { activeDropdown, setActiveDropdown } = useUI()
    const isOpen = activeDropdown === 'header-company'
    const containerRef = useRef<HTMLDivElement>(null)

    useClickOutside(containerRef, () => {
        if (isOpen) setActiveDropdown(null)
    })

    const currentCompany = companies.find(c => c.id === currentCompanyId) || companies[0]

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'header-company')}
                className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Company</div>
                        <div className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                            {currentCompany?.name || 'Select Company'}
                        </div>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-[240px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Switch Company</div>
                    <div className="space-y-1">
                        {companies.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    switchContext('company', c.id)
                                    setActiveDropdown(null)
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${c.id === currentCompanyId
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                    }`}
                            >
                                <span className="truncate">{c.name}</span>
                                {c.id === currentCompanyId && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
