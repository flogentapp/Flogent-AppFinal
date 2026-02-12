
# Flogent Development Guide

Welcome to the Flogent development environment! This guide explains the project structure and how to test features locally.

## 🚀 Quick Start
1. **Run Dev Server**: `npm run dev` (defaults to [localhost:3000](http://localhost:3000))
2. **Setup Test Tenant**: If you need a fresh start, run `node scripts/create_new_tenant_test.js`.
   - Test Email: `wilhelmkuun1@gmail.com`
   - Password: `TestPassword123!`

## 📁 Project Structure

### `app/` (The Core App)
- `(shell)/`: Layout and app wrapper.
- `(timesheets)/`: All timesheet entry, approval, and reporting pages.
- `admin/`: Tenant administration (companies, departments, projects, users).
- `auth/`: Login, logout, and invite flows.
- `onboarding/`: The first-time setup flow for new tenants.

### `components/` (UI Components)
- `ui/`: Shared base components (Buttons, Inputs, Dialogs).
- `timesheets/`: Feature-specific components like `WeekView`, `AddEntryModal`, and `DayDetailModal`.
- `layout/`: Global components like `Navbar`.

### `lib/` (The Engine)
- `actions/`: Server Actions for database mutations (logging time, submitting weeks, etc.).
- `supabase/`: Connection configurations for local and admin clients.

### `scripts/` (Utility Toolbox)
- `create_new_tenant_test.js`: Sets up a fresh tenant for testing.
- `invite_wilhelm.ts`: Utility to invite a user to an existing tenant.
- `sync_to_live.bat`: Deploys current changes to the live site repository.

## 🛠️ Testing Workflow

### 1. Logging and Modifying Time
- Use the **Week View** to see your hours.
- Click on a day to see details or **Edit/Delete** entries (only works for Draft/Rejected entries).
- Use the **Log Time** button to add new entries.

### 2. Approval Flow
- After logging time, click **Submit Week**.
- Toggle your role to **Manager** or **CEO** (via Admin) to see the **Approvals** tab.
- From there, you can Approve or Reject submitted entries.

### 3. Reporting
- Navigate to the **Reports** tab to see aggregated data across projects and departments.

## 🔄 Syncing to Live
When you are happy with your changes:
1. Run `.\sync_to_live.bat` from the root folder.
2. (Optional) Run `git push` in the `Flogent-Live` folder to deploy to Vercel.
