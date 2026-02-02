'use client'

import { updateUserRole } from '@/app/actions/update-role'

type Profile = {
  id: string
  role: string | null
  // add other fields if necessary
}

export default function TeamList({ member }: { member: Profile }) {
  // Force rebuild
  return (
    <form action={async (formData) => { await updateUserRole(formData) }}>
      <input type="hidden" name="userId" value={member.id} />

      <select
        name="role"
        defaultValue={member.role || 'User'}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="border rounded px-2 py-1 text-sm bg-white"
      >
        <option value="User">User</option>
        <option value="ProjectLeader">Project Leader</option>
        <option value="DepartmentHead">Department Head</option>
        <option value="CEO">CEO</option>
        <option value="TenantOwner">Tenant Owner</option>
      </select>
    </form>
  )
}