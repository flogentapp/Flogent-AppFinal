import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://zwdlxuvwuulhmtsihepy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjcyOTksImV4cCI6MjA4MzI0MzI5OX0.N79eqtSaO2Xlsn8LBnDTTSBbC0tOhd638VHYnp73p20',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0',
    MAILJET_API_KEY: '5e3dbca3693aaf93f0445f729dff5d95',
    MAILJET_SECRET_KEY: 'e1e4cdce53c17f24504e4eba3045aef2',
  },
};

export default nextConfig;
