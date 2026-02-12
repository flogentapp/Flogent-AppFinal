import { ArrowRight, AlertCircle } from 'lucide-react'

export function TimesheetTable({ entries }: { entries: any[] }) {
    if (!entries || entries.length === 0) {
        return <div className="p-8 text-center text-gray-500 text-sm">No entries found for the selected period.</div>
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Work Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 text-sm text-gray-900 font-mono">{entry.entry_date}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{entry.user_name || 'User'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                <div>{entry.project_name || entry.project_id}</div>
                                {entry.project_code && <div className="text-xs text-gray-400">{entry.project_code}</div>}
                            </td>
                            <td className="px-6 py-4">
                                {entry.is_additional_work ? (
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-xs font-bold text-amber-700 block">Additional Work</span>
                                            {entry.additional_work_description && (
                                                <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-tight">
                                                    {entry.additional_work_description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">Standard</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-indigo-600">{entry.hours}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wide
                                    ${entry.status === 'approved' ? 'bg-green-50 text-green-700' :
                                        entry.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                            entry.status === 'submitted' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {entry.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
