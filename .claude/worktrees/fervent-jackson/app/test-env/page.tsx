export default function TestEnvPage() {
    return (
        <div className="p-10">
            <h1>Env Test</h1>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'}</p>
            <p>Key Length: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 'undefined'}</p>
        </div>
    )
}
