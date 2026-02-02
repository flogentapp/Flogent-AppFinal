'use client'

import { updateLicensingSettings } from '@/app/actions/update-licensing'
import { useState } from 'react'

// You can fetch these from your DB or define them as constants
const AVAILABLE_ROLES = ['Owner', 'Admin', 'Manager', 'Member', 'Viewer']

type Props = {
  currentSettings: Record<string, boolean>
}

export default function LicensingConfig({ currentSettings }: Props) {
  const [isSaving, setIsSaving] = useState(false)

  return (
    <div className="bg-white border rounded-lg shadow-sm max-w-4xl mx-auto mt-8">
      {/* Header Section */}
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Licensing Rights</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define which roles can purchase additional seats and manage billing.
          </p>
        </div>
        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-semibold uppercase">
          Finance Control
        </div>
      </div>

      {/* Form Section */}
      <form action={async (formData) => {
        setIsSaving(true)
        await updateLicensingSettings(formData)
        setIsSaving(false)
      }}>
        <div className="p-6">
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Can Add Licenses
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {AVAILABLE_ROLES.map((role) => {
                  const isOwner = role === 'Owner'
                  const isChecked = currentSettings?.[role] || isOwner // Default Owner to true

                  return (
                    <tr key={role}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${isOwner ? 'text-purple-600' : 'text-gray-900'}`}>
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isOwner ? 'Full workspace access' : `Users assigned to the ${role} role`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name={`role_${role}`} 
                            defaultChecked={isChecked}
                            disabled={isOwner} // Owner cannot be unchecked
                            className="sr-only peer"
                          />
                          <div className={`
                            relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                            after:bg-white after:border-gray-300 after:border after:rounded-full 
                            after:h-5 after:w-5 after:transition-all 
                            ${isOwner ? 'peer-checked:bg-gray-400 cursor-not-allowed' : 'peer-checked:bg-blue-600'}
                          `}></div>
                        </label>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer / Save Button */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}