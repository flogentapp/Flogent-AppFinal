
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = Object.fromEntries(
        envContent.split('\n')
            .filter(line => line.includes('=') && !line.startsWith('#'))
            .map(line => {
                const parts = line.trim().split('=');
                return [parts[0], parts.slice(1).join('=')];
            })
    );

    // Initial client with Service Role to ensure user exists
    const adminSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const email = 'wilhelmkuun1@gmail.com';
    const password = 'TestPassword123!';

    console.log(`Authenticating as ${email}...`);

    // 1. Sign in to get a user session
    const { data: authData, error: authError } = await adminSupabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
        return;
    }

    const user = authData.user;
    const session = authData.session;
    console.log('Logged in! User ID:', user.id);

    // 1.5 Send Invite Email
    console.log('Sending Invite Email...');
    const authHeader = Buffer.from('5e3dbca3693aaf93f0445f729dff5d95:e1e4cdce53c17f24504e4eba3045aef2').toString('base64');
    await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeader}` },
        body: JSON.stringify({
            Messages: [{
                From: { Email: 'flogent.app@gmail.com', Name: 'Flogent App' },
                To: [{ Email: email }],
                Subject: `Your Flogent Test Account is Ready`,
                HTMLPart: `<h3>Welcome!</h3><p>Your test tenant has been created.</p><p>Email: ${email}<br>Password: ${password}</p>`
            }]
        })
    });

    // 2. Create a User-Scoped Client (this will have auth.uid() set!)
    const userSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        }
    });

    // 3. Complete Onboarding via RPC
    console.log('Calling onboard_new_tenant RPC...');
    const { data: onboardData, error: onboardError } = await userSupabase.rpc('onboard_new_tenant', {
        payload: {
            first_name: 'Wilhelm',
            last_name: 'Test',
            company_name: 'Wild Test Corp',
            organization_name: 'Wild Test Tenant',
            slug: 'wild-test-' + Math.floor(Math.random() * 1000)
        }
    });

    if (onboardError) {
        console.error('Onboarding Error:', onboardError);
        // If it fails with "Profile not found", we might need to create the profile with Service Role first
    } else {
        console.log('Onboarding Complete!', onboardData);
    }

    // Since we are "going crazy", let's create more data
    let tenantId = onboardData?.tenant_id || user.user_metadata.tenant_id;
    let companyId = onboardData?.company_id || user.user_metadata.current_company_id;

    if (!tenantId || !companyId) {
        console.log('Fetching profile to get IDs...');
        const { data: profile } = await adminSupabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            tenantId = profile.tenant_id;
            companyId = profile.current_company_id;
        }
    }

    console.log('Using Tenant ID:', tenantId);
    console.log('Using Company ID:', companyId);

    // 4. Test Timesheet Actions (THE REAL CRAZY PART)
    console.log('--- Testing Timesheet Flow ---');

    // 4. Test Timesheet Actions (THE REAL CRAZY PART)
    console.log('--- Testing Timesheet Flow ---');

    // Get a project first
    let { data: projects } = await userSupabase.from('projects').select('*').limit(1);

    if (!projects || projects.length === 0) {
        console.log('No projects found. Creating a test project...');
        // Get the default department first
        const { data: depts } = await userSupabase.from('departments').select('*').limit(1);

        const { data: newProject, error: projError } = await userSupabase.from('projects').insert({
            tenant_id: tenantId,
            company_id: companyId,
            department_id: depts?.[0]?.id,
            name: 'World Domination',
            code: 'WD-001',
            status: 'active'
        }).select().single();

        if (projError) {
            console.error('Project Creation Error:', projError);
            return;
        }
        console.log('Project created:', newProject.id);
        projects = [newProject];
    }

    const project = projects[0];
    console.log(`Logging time for Project: ${project.name}`);

    // A. Log Time
    const { data: entry, error: logError } = await userSupabase.from('time_entries').insert({
        tenant_id: tenantId,
        project_id: project.id,
        entry_date: new Date().toISOString().split('T')[0],
        hours: 4.5,
        description: 'Crazy Testing Start',
        status: 'draft'
    }).select().single();

    if (logError) console.error('Log Error:', logError);
    else {
        console.log('Log Success! Entry ID:', entry.id);

        // B. Update Time (Testing my fix)
        console.log('Updating Entry...');
        const { error: updateError } = await userSupabase.from('time_entries').update({
            hours: 5.0,
            description: 'Crazy Testing Updated'
        }).eq('id', entry.id);

        if (updateError) console.error('Update Error:', updateError);
        else console.log('Update Success!');

        // C. Log temporary entry for deletion
        const { data: tempEntry } = await userSupabase.from('time_entries').insert({
            tenant_id: tenantId,
            project_id: project.id,
            entry_date: new Date().toISOString().split('T')[0],
            hours: 1.0,
            description: 'To be deleted',
            status: 'draft'
        }).select().single();

        if (tempEntry) {
            console.log('Deleting Entry...');
            const { error: deleteError } = await userSupabase.from('time_entries').delete().eq('id', tempEntry.id);
            if (deleteError) console.error('Delete Error:', deleteError);
            else console.log('Delete Success!');
        }

        // D. Submit Week
        console.log('Submitting Week...');
        const { error: submitError } = await userSupabase.rpc('submit_week', {
            p_user_id: user.id,
            p_date: new Date().toISOString().split('T')[0]
        });
        if (submitError) console.error('Submit Error:', submitError);
        else console.log('Week Submitted!');
    }

    console.log('--- GO CRAZY TEST COMPLETE ---');
}

main();
