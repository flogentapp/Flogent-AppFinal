'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { approveTimeEntry, rejectTimeEntry } from '@/lib/actions/timesheets'
import { AddEntryModal } from './AddEntryModal' // Reusing the modal for "View Details"

export function ApprovalsTable({ entries, projects, companies }: any) {
    const [selectedEntry, setSelectedEntry] = useState<any>(null)

    return (
        <>
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Project</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {entries.map((entry: any) => (
                        <tr
                            key={entry.id}
                            // Clicking the row opens the View/Edit modal
                            className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                            onClick={(e) => {
                                // Prevent modal from opening if they clicked the Approve/Reject buttons
                                if ((e.target as HTMLElement).closest('button')) return;
                                setSelectedEntry(entry)
                            }}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                        {entry.profiles?.first_name?.[0] || 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">
                                            {entry.profiles?.first_name} {entry.profiles?.last_name}
                                        </span>
                                        <span className="text-[10px] text-gray-500">{entry.profiles?.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(entry.entry_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {entry.projects?.code || entry.projects?.name}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {entry.hours}h
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                                {entry.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <form action={async () => { await rejectTimeEntry(entry.id, 'Standard rejection') }}>
                                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Reject">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </form>
                                    <form action={async () => { await approveTimeEntry(entry.id) }}>
                                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100" title="Approve">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* View Details Modal */}
            <AddEntryModal
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                entryToEdit={selectedEntry} // Passing this makes it viewable/editable
                date={null}
            />
        </>
    )
}