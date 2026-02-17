
'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, XCircle, Clock, Search, Filter, ArrowUpRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function ComplianceDashboard({ compliance, selectedDate }: any) {
    const completedCount = compliance.filter((c: any) => !!c.entry).length
    const totalCount = compliance.length
    const complianceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl shadow-indigo-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-400 text-emerald-900 px-3 py-1 rounded-full">Live Stats</span>
                    </div>
                    <div className="text-4xl font-black tracking-tighter mb-1">{complianceRate}%</div>
                    <div className="text-sm font-black uppercase tracking-widest opacity-80">Compliance Rate</div>
                    <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${complianceRate}%` }} />
                    </div>
                </Card>

                <Card className="p-8 rounded-[40px] bg-white border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tighter text-slate-900 mb-1">{completedCount}</div>
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400">Signed Off Today</div>
                </Card>

                <Card className="p-8 rounded-[40px] bg-white border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <XCircle className="w-6 h-6 text-rose-600" />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tighter text-slate-900 mb-1">{totalCount - completedCount}</div>
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400">Remaining Entries</div>
                </Card>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Staff Compliance Matrix</h3>
                        <p className="text-slate-400 text-sm font-semibold italic">Real-time oversight of daily operational duties.</p>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter staff members..."
                            className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Team Member</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Sign-off Time</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {compliance.map((item: any) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                {item.first_name[0]}{item.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 leading-none">{item.first_name} {item.last_name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {item.id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {item.entry ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Complete</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-xs font-bold text-slate-500">
                                            {item.entry ? format(new Date(item.entry.created_at), 'p') : '--:--'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
