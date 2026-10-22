import fs from 'node:fs';

const authPath = process.env.APPDATA + '\\com.vercel.cli\\Data\\auth.json';
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const token = auth.token;
const projectId = 'prj_Uar5ybpSgQG74ItO4hWvIjC7W1cQ';
const teamId = 'team_RPR5IxyzoNAxL4wAXjdmWzsU';

const requiredVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://kgtgqxppgptkvzcatbjb.supabase.co',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDYwNDAsImV4cCI6MjEwODEyMjA0MH0.q-jBGSysPV34m-k4ZwZy48sD4ywjmZZjL8vw1888JBg',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SUPABASE_SECRET_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjU0NjA0MCwiZXhwIjoyMTA4MTIyMDQwfQ.Ba0xWuBpA1XYISRH2wlZVDmGGb_ob22Q96W6kfiYN1A',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjU0NjA0MCwiZXhwIjoyMTA4MTIyMDQwfQ.Ba0xWuBpA1XYISRH2wlZVDmGGb_ob22Q96W6kfiYN1A',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'AUTH_SECRET',
    value: 'magic-carousels-production-auth-secret-super-key-2026',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'https://magic-carousels.vercel.app',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'APP_URL',
    value: 'https://magic-carousels.vercel.app',
    type: 'plain',
    target: ['production', 'preview', 'development']
  }
];

async function run() {
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const currentData = await listRes.json();
  const currentEnvs = currentData.envs || [];
  console.log(`Currently found ${currentEnvs.length} env vars.`);

  // Delete existing ones that match our keys so we can create clean, uniform ones
  for (const env of currentEnvs) {
    if (requiredVars.some(r => r.key === env.key)) {
      console.log(`Deleting existing env var ${env.key} (${env.id})...`);
      await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${env.id}?teamId=${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }

  // Create new env vars
  for (const req of requiredVars) {
    console.log(`Adding ${req.key}...`);
    const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req)
    });
    const result = await res.json();
    if (res.ok) {
      console.log(`✓ Added ${req.key}`);
    } else {
      console.error(`Error adding ${req.key}:`, result);
    }
  }

  console.log('All variables configured on Vercel!');
}

run().catch(console.error);
