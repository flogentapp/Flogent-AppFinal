// Inside your table row...
<td className="px-4 py-3">
  {/* If I am the Owner, I can see this form */}
  <form action={updateUserRole}>
    <input type="hidden" name="userId" value={member.id} />
    
    <select 
      name="role" 
      defaultValue={member.role || 'User'} // Default to 'User' if null
      onChange={(e) => e.target.form?.requestSubmit()} // Auto-save on change
      className="border rounded px-2 py-1 text-sm bg-white"
    >
      {/* These values MUST match your Approval Matrix keys exactly */}
      <option value="User">User</option>
      <option value="ProjectLeader">Project Leader</option>
      <option value="DepartmentHead">Department Head</option>
      <option value="CEO">CEO</option>
      <option value="TenantOwner">Tenant Owner</option>
    </select>
  </form>
</td>