import { execSync } from 'node:child_process';

const envVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://kgtgqxppgptkvzcatbjb.supabase.co',
    type: 'config'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDYwNDAsImV4cCI6MjEwODEyMjA0MH0.q-jBGSysPV34m-k4ZwZy48sD4ywjmZZjL8vw1888JBg',
    type: 'config'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjU0NjA0MCwiZXhwIjoyMTA4MTIyMDQwfQ.Ba0xWuBpA1XYISRH2wlZVDmGGb_ob22Q96W6kfiYN1A',
    type: 'secret'
  },
  {
    name: 'SUPABASE_SECRET_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndGdxeHBwZ3B0a3Z6Y2F0YmpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjU0NjA0MCwiZXhwIjoyMTA4MTIyMDQwfQ.Ba0xWuBpA1XYISRH2wlZVDmGGb_ob22Q96W6kfiYN1A',
    type: 'secret'
  },
  {
    name: 'AUTH_SECRET',
    value: 'magic-carousels-production-auth-secret-super-key-2026',
    type: 'secret'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: 'https://magiccarousels.vercel.app',
    type: 'config'
  },
  {
    name: 'APP_URL',
    value: 'https://magiccarousels.vercel.app',
    type: 'config'
  }
];

for (const env of envVars) {
  try {
    console.log(`Setting ${env.name} for production...`);
    const typeFlag = env.type === 'secret' ? '--sensitive' : '--no-sensitive';
    execSync(`npx vercel env add ${env.name} --environment production --value "${env.value}" ${typeFlag} --yes --force`, {
      stdio: 'inherit'
    });
    console.log(`✓ Set ${env.name} for production`);
  } catch (e) {
    console.error(`Failed ${env.name}:`, e.message);
  }
}
console.log('All production variables configured successfully!');
