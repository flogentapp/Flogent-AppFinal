
'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, XCircle, Clock, Search, Filter, ArrowUpRight, User, TrendingUp, Zap, ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

export function ComplianceDashboard({ compliance, selectedDate }: any) {
    const [search, setSearch] = useState('')
    const completedCount = compliance.filter((c: any) => !!c.entry).length
    const totalCount = compliance.length
    const complianceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const filteredCompliance = compliance.filter((c: any) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-10">
            {/* TOP STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="p-8 rounded-[48px] bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md text-emerald-400">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20">
                                    Operational Health
                                </div>
                            </div>
                            <div className="text-6xl font-black tracking-tighter text-white mb-2">{complianceRate}%</div>
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Aggregate Compliance</div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${complianceRate}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                />
                            </div>
                        </div>
                        {/* DECOR */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="p-8 rounded-[48px] bg-white border-2 border-slate-50 shadow-xl shadow-slate-100 flex flex-col justify-between group hover:border-indigo-100 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-emerald-50 rounded-3xl text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <TrendingUp className="w-6 h-6 text-slate-200 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div className="mt-8">
                            <div className="text-5xl font-black tracking-tighter text-slate-900 mb-1">{completedCount}</div>
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Force Verified</div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-8 rounded-[48px] bg-white border-2 border-slate-50 shadow-xl shadow-slate-100 flex flex-col justify-between group hover:border-rose-100 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-rose-50 rounded-3xl text-rose-600 transition-colors group-hover:bg-rose-500 group-hover:text-white">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <TrendingUp className="w-6 h-6 text-slate-200 rotate-180 group-hover:text-rose-400 transition-colors" />
                        </div>
                        <div className="mt-8">
                            <div className="text-5xl font-black tracking-tighter text-slate-900 mb-1">{totalCount - completedCount}</div>
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Awaiting Action</div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* TEAM MATRIX */}
            <div className="bg-white rounded-[48px] border-2 border-slate-50 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Zap className="w-6 h-6 fill-indigo-500 text-indigo-500" />
                            Command Matrix
                        </h3>
                        <p className="text-slate-400 text-sm font-semibold italic mt-1">Real-time surveillance of professional standards adherence.</p>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Locate staff member..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-50 border-none rounded-[24px] pl-16 pr-8 h-16 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all w-full shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operative</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Insight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCompliance.map((item: any, idx: number) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={item.id}
                                    className="group hover:bg-slate-50/80 transition-all cursor-default"
                                >
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                {item.first_name[0]}{item.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-black text-lg text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{item.first_name} {item.last_name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{item.role || 'Team Member'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        {item.entry ? (
                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                                <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Sign-off Complete</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="text-base font-bold text-slate-500 font-mono">
                                            {item.entry ? format(new Date(item.entry.created_at), 'p') : '--:--:--'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button className="w-12 h-12 inline-flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm">
                                            <ArrowUpRight className="w-6 h-6" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredCompliance.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center">
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No personnel matched your search criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
