import { createAdminClient } from '@/lib/supabase/admin';

// Force dynamic rendering so it checks the DB every time you refresh
export const dynamic = 'force-dynamic';

export default async function DebugDBPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // 1. Check Env Vars
  const keyStatus = key ? ('Loaded (Length: ' + key.length + ')') : 'MISSING âŒ';
  const urlStatus = url ? 'Loaded âœ…' : 'MISSING âŒ';

  let dbResult = 'Pending...';
  let tenants = [];
  
  // 2. Test Connection
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('tenants').select('id, name');
    
    if (error) {
      dbResult = 'ERROR: ' + error.message + ' (Code: ' + error.code + ')';
    } else {
      dbResult = 'SUCCESS: Found ' + (data?.length || 0) + ' companies.';
      tenants = data || [];
    }
  } catch (e: any) {
    dbResult = 'CRASH: ' + e.message;
  }

  return (
    <div className="p-10 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Database Diagnostic</h1>
      
      <div className="mb-6 border p-4 bg-gray-50">
        <h2 className="font-bold">1. Environment Variables</h2>
        <p>URL: {urlStatus}</p>
        <p>Service Key: {keyStatus}</p>
        {(!url || !key) && (
            <p className="text-red-600 mt-2 font-bold">
                âš ï¸ Next.js cannot read .env.local! Restart the server.
            </p>
        )}
      </div>

      <div className="mb-6 border p-4 bg-gray-50">
        <h2 className="font-bold">2. Connection Test</h2>
        <p className={dbResult.includes('SUCCESS') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
          {dbResult}
        </p>
      </div>

      {tenants.length > 0 && (
        <div className="border p-4 bg-gray-50">
          <h2 className="font-bold mb-2">3. Available Companies (Copy ID from here)</h2>
          <ul className="space-y-2">
            {tenants.map((t: any) => (
              <li key={t.id} className="border-b pb-1">
                <span className="font-bold">{t.name}</span>
                <br />
                <span className="text-gray-500 select-all bg-gray-100 px-1">{t.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
